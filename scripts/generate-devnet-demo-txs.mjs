import * as anchor from "@coral-xyz/anchor";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import BN from "bn.js";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const IDL_PATH = path.join(ROOT, "target", "idl", "solqueue.json");
const DEFAULT_WALLET = path.join(
  process.env.HOME || "",
  ".config",
  "solana",
  "id.json",
);
const WALLET_PATH = process.env.ANCHOR_WALLET || DEFAULT_WALLET;
const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";

function loadKeypair(keypairPath) {
  const secret = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function main() {
  const idl = JSON.parse(fs.readFileSync(IDL_PATH, "utf8"));
  const signer = loadKeypair(WALLET_PATH);
  const wallet = new anchor.Wallet(signer);
  const connection = new anchor.web3.Connection(RPC_URL, "confirmed");
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  anchor.setProvider(provider);
  const program = new anchor.Program(idl, provider);

  const queueName = `demo-${Date.now().toString().slice(-8)}`;
  const [queuePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("queue"),
      signer.publicKey.toBuffer(),
      Buffer.from(queueName),
    ],
    program.programId,
  );

  const [workerPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("worker"), queuePda.toBuffer(), signer.publicKey.toBuffer()],
    program.programId,
  );

  const jobIdLe = Buffer.alloc(8);
  jobIdLe.writeBigUInt64LE(0n);
  const [jobPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("job"),
      queuePda.toBuffer(),
      jobIdLe,
    ],
    program.programId,
  );

  const txCreateQueue = await program.methods
    .createQueue(
      queueName, // name
      5, // max_workers
      3, // max_retries
      1, // default_priority (Medium)
      new BN(3600), // ttl
    )
    .accounts({
      authority: signer.publicKey,
      queueConfig: queuePda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const txRegisterWorker = await program.methods
    .registerWorker("demo-worker")
    .accounts({
      authority: signer.publicKey,
      workerAccount: workerPda,
      queueConfig: queuePda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const txSubmitJob = await program.methods
    .submitJob(
      Buffer.from(JSON.stringify({ action: "demo_task", ts: Date.now() })),
      2, // High
    )
    .accounts({
      creator: signer.publicKey,
      queueConfig: queuePda,
      jobAccount: jobPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const txClaimJob = await program.methods
    .claimJob()
    .accounts({
      workerAuthority: signer.publicKey,
      workerAccount: workerPda,
      queueConfig: queuePda,
      jobAccount: jobPda,
    })
    .rpc();

  const txCompleteJob = await program.methods
    .completeJob(Buffer.from(JSON.stringify({ status: "ok", demo: true })))
    .accounts({
      workerAuthority: signer.publicKey,
      workerAccount: workerPda,
      queueConfig: queuePda,
      jobAccount: jobPda,
    })
    .rpc();

  const result = {
    rpc: RPC_URL,
    wallet: signer.publicKey.toBase58(),
    programId: program.programId.toBase58(),
    queueName,
    queuePda: queuePda.toBase58(),
    workerPda: workerPda.toBase58(),
    jobPda: jobPda.toBase58(),
    signatures: {
      create_queue: txCreateQueue,
      register_worker: txRegisterWorker,
      submit_job: txSubmitJob,
      claim_job: txClaimJob,
      complete_job: txCompleteJob,
    },
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
