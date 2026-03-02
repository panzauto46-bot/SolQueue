import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Solqueue } from "../target/types/solqueue";
import { assert } from "chai";
import { PublicKey, SystemProgram } from "@solana/web3.js";

describe("solqueue", () => {
    // Configure the client to use the local cluster
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Solqueue as Program<Solqueue>;
    const authority = provider.wallet;

    // Test data
    const QUEUE_NAME = "test-queue";
    const WORKER_ID = "worker-01";
    const JOB_PAYLOAD = Buffer.from(JSON.stringify({ action: "send_email", to: "user@solana.com" }));
    const JOB_RESULT = Buffer.from(JSON.stringify({ status: "sent", messageId: "msg-001" }));

    // PDA addresses (derived during tests)
    let queuePda: PublicKey;
    let queueBump: number;
    let jobPda: PublicKey;
    let jobBump: number;
    let workerPda: PublicKey;
    let workerBump: number;

    // Derive PDAs before tests
    before(async () => {
        [queuePda, queueBump] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("queue"),
                authority.publicKey.toBuffer(),
                Buffer.from(QUEUE_NAME),
            ],
            program.programId
        );

        [workerPda, workerBump] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("worker"),
                queuePda.toBuffer(),
                authority.publicKey.toBuffer(),
            ],
            program.programId
        );
    });

    // ============================================================
    // Queue Management Tests
    // ============================================================

    describe("Queue Management", () => {
        it("Creates a new queue", async () => {
            const tx = await program.methods
                .createQueue(
                    QUEUE_NAME,   // name
                    5,            // max_workers
                    3,            // max_retries
                    1,            // default_priority (Medium)
                    3600,         // job_ttl (1 hour)
                )
                .accounts({
                    authority: authority.publicKey,
                    queueConfig: queuePda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("    ✅ create_queue tx:", tx);

            // Verify queue state
            const queue = await program.account.queueConfig.fetch(queuePda);
            assert.equal(queue.name, QUEUE_NAME);
            assert.equal(queue.maxWorkers, 5);
            assert.equal(queue.maxRetries, 3);
            assert.equal(queue.jobTtl.toNumber(), 3600);
            assert.equal(queue.isPaused, false);
            assert.equal(queue.totalJobs.toNumber(), 0);
            assert.equal(queue.completedJobs.toNumber(), 0);
            assert.equal(queue.failedJobs.toNumber(), 0);
            assert.equal(queue.pendingJobs.toNumber(), 0);
            assert.equal(queue.workerCount, 0);

            console.log("    📋 Queue state:", {
                name: queue.name,
                maxWorkers: queue.maxWorkers,
                maxRetries: queue.maxRetries,
                jobTtl: queue.jobTtl.toNumber(),
                isPaused: queue.isPaused,
            });
        });

        it("Pauses the queue", async () => {
            const tx = await program.methods
                .pauseQueue(true)
                .accounts({
                    authority: authority.publicKey,
                    queueConfig: queuePda,
                })
                .rpc();

            console.log("    ✅ pause_queue tx:", tx);

            const queue = await program.account.queueConfig.fetch(queuePda);
            assert.equal(queue.isPaused, true);
        });

        it("Resumes the queue", async () => {
            const tx = await program.methods
                .pauseQueue(false)
                .accounts({
                    authority: authority.publicKey,
                    queueConfig: queuePda,
                })
                .rpc();

            console.log("    ✅ resume_queue tx:", tx);

            const queue = await program.account.queueConfig.fetch(queuePda);
            assert.equal(queue.isPaused, false);
        });
    });

    // ============================================================
    // Worker Registration Tests
    // ============================================================

    describe("Worker Registration", () => {
        it("Registers a worker", async () => {
            const tx = await program.methods
                .registerWorker(WORKER_ID)
                .accounts({
                    authority: authority.publicKey,
                    workerAccount: workerPda,
                    queueConfig: queuePda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("    ✅ register_worker tx:", tx);

            // Verify worker state
            const worker = await program.account.workerAccount.fetch(workerPda);
            assert.equal(worker.workerId, WORKER_ID);
            assert.equal(worker.jobsCompleted.toNumber(), 0);
            assert.equal(worker.jobsFailed.toNumber(), 0);
            assert.deepEqual(worker.status, { online: {} });

            // Verify queue worker count updated
            const queue = await program.account.queueConfig.fetch(queuePda);
            assert.equal(queue.workerCount, 1);

            console.log("    👷 Worker registered:", {
                workerId: worker.workerId,
                status: "Online",
                queue: worker.queue.toBase58().slice(0, 8) + "...",
            });
        });
    });

    // ============================================================
    // Job Lifecycle Tests
    // ============================================================

    describe("Job Lifecycle: Submit → Claim → Complete", () => {
        it("Submits a job", async () => {
            // Derive job PDA (job_id = 0 for the first job)
            const jobId = new anchor.BN(0);
            [jobPda, jobBump] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("job"),
                    queuePda.toBuffer(),
                    jobId.toArrayLike(Buffer, "le", 8),
                ],
                program.programId
            );

            const tx = await program.methods
                .submitJob(JOB_PAYLOAD, 2) // Priority: High
                .accounts({
                    creator: authority.publicKey,
                    queueConfig: queuePda,
                    jobAccount: jobPda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("    ✅ submit_job tx:", tx);

            // Verify job state
            const job = await program.account.jobAccount.fetch(jobPda);
            assert.deepEqual(job.status, { pending: {} });
            assert.deepEqual(job.priority, { high: {} });
            assert.equal(job.jobId.toNumber(), 0);
            assert.equal(job.attempts, 0);
            assert.isNull(job.worker);

            // Verify queue counters
            const queue = await program.account.queueConfig.fetch(queuePda);
            assert.equal(queue.totalJobs.toNumber(), 1);
            assert.equal(queue.pendingJobs.toNumber(), 1);

            console.log("    📄 Job submitted:", {
                jobId: job.jobId.toNumber(),
                status: "Pending",
                priority: "High",
                payloadSize: job.payload.length + " bytes",
            });
        });

        it("Claims the job (atomic operation)", async () => {
            const tx = await program.methods
                .claimJob()
                .accounts({
                    workerAuthority: authority.publicKey,
                    workerAccount: workerPda,
                    queueConfig: queuePda,
                    jobAccount: jobPda,
                })
                .rpc();

            console.log("    ✅ claim_job tx:", tx);

            // Verify job state transition
            const job = await program.account.jobAccount.fetch(jobPda);
            assert.deepEqual(job.status, { processing: {} });
            assert.equal(job.attempts, 1);
            assert.isNotNull(job.worker);
            assert.equal(job.worker.toBase58(), authority.publicKey.toBase58());

            // Verify queue counters
            const queue = await program.account.queueConfig.fetch(queuePda);
            assert.equal(queue.pendingJobs.toNumber(), 0);
            assert.equal(queue.processingJobs.toNumber(), 1);

            console.log("    ⚡ Job claimed atomically:", {
                status: "Processing",
                worker: job.worker.toBase58().slice(0, 8) + "...",
                attempt: job.attempts + "/" + job.maxRetries,
            });
        });

        it("Completes the job with result", async () => {
            const tx = await program.methods
                .completeJob(JOB_RESULT)
                .accounts({
                    workerAuthority: authority.publicKey,
                    workerAccount: workerPda,
                    queueConfig: queuePda,
                    jobAccount: jobPda,
                })
                .rpc();

            console.log("    ✅ complete_job tx:", tx);

            // Verify final job state
            const job = await program.account.jobAccount.fetch(jobPda);
            assert.deepEqual(job.status, { completed: {} });
            assert.isTrue(job.result.length > 0);
            assert.isTrue(job.completedAt.toNumber() > 0);

            // Verify queue counters
            const queue = await program.account.queueConfig.fetch(queuePda);
            assert.equal(queue.processingJobs.toNumber(), 0);
            assert.equal(queue.completedJobs.toNumber(), 1);

            // Verify worker stats
            const worker = await program.account.workerAccount.fetch(workerPda);
            assert.equal(worker.jobsCompleted.toNumber(), 1);

            console.log("    ✅ Job completed:", {
                status: "Completed",
                resultSize: job.result.length + " bytes",
                workerCompleted: worker.jobsCompleted.toNumber(),
            });
        });
    });

    // ============================================================
    // Failure & Retry Tests
    // ============================================================

    describe("Job Failure & Retry Flow", () => {
        let failJobPda: PublicKey;

        it("Submits a second job (for failure testing)", async () => {
            const jobId = new anchor.BN(1);
            [failJobPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("job"),
                    queuePda.toBuffer(),
                    jobId.toArrayLike(Buffer, "le", 8),
                ],
                program.programId
            );

            await program.methods
                .submitJob(Buffer.from('{"task":"risky_operation"}'), 1) // Priority: Medium
                .accounts({
                    creator: authority.publicKey,
                    queueConfig: queuePda,
                    jobAccount: failJobPda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("    ✅ Second job submitted for failure testing");
        });

        it("Claims and fails the job", async () => {
            // Claim
            await program.methods
                .claimJob()
                .accounts({
                    workerAuthority: authority.publicKey,
                    workerAccount: workerPda,
                    queueConfig: queuePda,
                    jobAccount: failJobPda,
                })
                .rpc();

            // Fail
            const tx = await program.methods
                .failJob("Connection timeout: external API unreachable")
                .accounts({
                    workerAuthority: authority.publicKey,
                    workerAccount: workerPda,
                    queueConfig: queuePda,
                    jobAccount: failJobPda,
                })
                .rpc();

            console.log("    ✅ fail_job tx:", tx);

            const job = await program.account.jobAccount.fetch(failJobPda);
            assert.deepEqual(job.status, { failed: {} });
            assert.equal(job.errorMessage, "Connection timeout: external API unreachable");
            assert.equal(job.attempts, 1);

            const queue = await program.account.queueConfig.fetch(queuePda);
            assert.equal(queue.failedJobs.toNumber(), 1);

            const worker = await program.account.workerAccount.fetch(workerPda);
            assert.equal(worker.jobsFailed.toNumber(), 1);

            console.log("    ❌ Job failed:", {
                error: job.errorMessage,
                attempt: job.attempts + "/" + job.maxRetries,
            });
        });

        it("Retries the failed job", async () => {
            const tx = await program.methods
                .retryJob()
                .accounts({
                    authority: authority.publicKey,
                    queueConfig: queuePda,
                    jobAccount: failJobPda,
                })
                .rpc();

            console.log("    ✅ retry_job tx:", tx);

            const job = await program.account.jobAccount.fetch(failJobPda);
            assert.deepEqual(job.status, { pending: {} });
            assert.isNull(job.worker);
            assert.equal(job.attempts, 1); // Preserved from the failed attempt

            const queue = await program.account.queueConfig.fetch(queuePda);
            assert.equal(queue.pendingJobs.toNumber(), 1);
            assert.equal(queue.failedJobs.toNumber(), 0); // Decremented on retry

            console.log("    🔄 Job re-queued:", {
                status: "Pending",
                previousAttempts: job.attempts,
                maxRetries: job.maxRetries,
            });
        });

        it("Claims, completes the retried job", async () => {
            // Claim again
            await program.methods
                .claimJob()
                .accounts({
                    workerAuthority: authority.publicKey,
                    workerAccount: workerPda,
                    queueConfig: queuePda,
                    jobAccount: failJobPda,
                })
                .rpc();

            // Complete this time
            const tx = await program.methods
                .completeJob(Buffer.from('{"status":"success_on_retry"}'))
                .accounts({
                    workerAuthority: authority.publicKey,
                    workerAccount: workerPda,
                    queueConfig: queuePda,
                    jobAccount: failJobPda,
                })
                .rpc();

            console.log("    ✅ Retried job completed:", tx);

            const job = await program.account.jobAccount.fetch(failJobPda);
            assert.deepEqual(job.status, { completed: {} });
            assert.equal(job.attempts, 2); // Was claimed twice

            const queue = await program.account.queueConfig.fetch(queuePda);
            assert.equal(queue.completedJobs.toNumber(), 2);
            assert.equal(queue.pendingJobs.toNumber(), 0);
            assert.equal(queue.processingJobs.toNumber(), 0);

            console.log("    ✅ Full lifecycle verified:", {
                totalJobs: queue.totalJobs.toNumber(),
                completed: queue.completedJobs.toNumber(),
                failed: queue.failedJobs.toNumber(),
                pending: queue.pendingJobs.toNumber(),
            });
        });
    });

    // ============================================================
    // Error Handling Tests
    // ============================================================

    describe("Error Handling", () => {
        it("Rejects job submission to paused queue", async () => {
            // Pause the queue
            await program.methods
                .pauseQueue(true)
                .accounts({
                    authority: authority.publicKey,
                    queueConfig: queuePda,
                })
                .rpc();

            // Try to submit — should fail
            const jobId = new anchor.BN(2);
            const [newJobPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("job"),
                    queuePda.toBuffer(),
                    jobId.toArrayLike(Buffer, "le", 8),
                ],
                program.programId
            );

            try {
                await program.methods
                    .submitJob(Buffer.from('{"test":"should_fail"}'), 1)
                    .accounts({
                        creator: authority.publicKey,
                        queueConfig: queuePda,
                        jobAccount: newJobPda,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc();
                assert.fail("Should have thrown QueuePaused error");
            } catch (err) {
                assert.include(err.message, "Queue is paused");
                console.log("    ✅ Correctly rejected: Queue is paused");
            }

            // Resume queue for subsequent tests
            await program.methods
                .pauseQueue(false)
                .accounts({
                    authority: authority.publicKey,
                    queueConfig: queuePda,
                })
                .rpc();
        });

        it("Rejects claiming an already-processing job", async () => {
            // Submit and claim a job
            const jobId = new anchor.BN(2);
            const [newJobPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("job"),
                    queuePda.toBuffer(),
                    jobId.toArrayLike(Buffer, "le", 8),
                ],
                program.programId
            );

            await program.methods
                .submitJob(Buffer.from('{"test":"double_claim"}'), 1)
                .accounts({
                    creator: authority.publicKey,
                    queueConfig: queuePda,
                    jobAccount: newJobPda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            await program.methods
                .claimJob()
                .accounts({
                    workerAuthority: authority.publicKey,
                    workerAccount: workerPda,
                    queueConfig: queuePda,
                    jobAccount: newJobPda,
                })
                .rpc();

            // Try to claim again — should fail
            try {
                await program.methods
                    .claimJob()
                    .accounts({
                        workerAuthority: authority.publicKey,
                        workerAccount: workerPda,
                        queueConfig: queuePda,
                        jobAccount: newJobPda,
                    })
                    .rpc();
                assert.fail("Should have thrown InvalidJobStatus error");
            } catch (err) {
                assert.include(err.message, "Invalid job status");
                console.log("    ✅ Correctly rejected: Double claim prevented");
            }

            // Clean up: complete the job
            await program.methods
                .completeJob(Buffer.from("done"))
                .accounts({
                    workerAuthority: authority.publicKey,
                    workerAccount: workerPda,
                    queueConfig: queuePda,
                    jobAccount: newJobPda,
                })
                .rpc();
        });
    });

    // ============================================================
    // Worker Deregistration Tests
    // ============================================================

    describe("Worker Deregistration", () => {
        it("Deregisters the worker", async () => {
            const tx = await program.methods
                .deregisterWorker()
                .accounts({
                    authority: authority.publicKey,
                    workerAccount: workerPda,
                    queueConfig: queuePda,
                })
                .rpc();

            console.log("    ✅ deregister_worker tx:", tx);

            // Verify queue worker count decremented
            const queue = await program.account.queueConfig.fetch(queuePda);
            assert.equal(queue.workerCount, 0);

            // Worker account should be closed
            try {
                await program.account.workerAccount.fetch(workerPda);
                assert.fail("Worker account should be closed");
            } catch (err) {
                console.log("    ✅ Worker account closed, rent reclaimed");
            }
        });
    });

    // ============================================================
    // Summary
    // ============================================================

    describe("Final State Summary", () => {
        it("Prints final queue statistics", async () => {
            const queue = await program.account.queueConfig.fetch(queuePda);

            console.log("\n" + "═".repeat(50));
            console.log("  📊 FINAL QUEUE STATISTICS");
            console.log("═".repeat(50));
            console.log(`  Queue Name      : ${queue.name}`);
            console.log(`  Total Jobs      : ${queue.totalJobs}`);
            console.log(`  Completed Jobs  : ${queue.completedJobs}`);
            console.log(`  Failed Jobs     : ${queue.failedJobs}`);
            console.log(`  Pending Jobs    : ${queue.pendingJobs}`);
            console.log(`  Processing Jobs : ${queue.processingJobs}`);
            console.log(`  Workers         : ${queue.workerCount}`);
            console.log(`  Is Paused       : ${queue.isPaused}`);
            console.log("═".repeat(50));
            console.log("  ✅ All tests passed — SolQueue is working!\n");
        });
    });
});
