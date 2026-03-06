use anchor_lang::prelude::*;

pub mod state;
pub mod errors;
pub mod instructions;

use instructions::*;

// Program ID — will be updated after first build
declare_id!("GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64");

/// # SolQueue — On-Chain Job Queue System
///
/// SolQueue rebuilds the traditional backend job queue pattern
/// (Redis Queue, RabbitMQ, BullMQ) as a Solana on-chain program.
///
/// ## Key Design Decisions
///
/// 1. **PDA-based State**: Each queue, job, and worker is a PDA,
///    enabling deterministic addressing and efficient lookups.
///
/// 2. **Atomic Claims**: Solana's runtime provides atomicity —
///    no distributed locks are needed for job claiming.
///
/// 3. **State Machine**: Jobs follow a strict lifecycle:
///    `Pending → Processing → Completed/Failed`
///
/// 4. **Counter-based Metrics**: Queue counters are updated atomically
///    with each operation for real-time analytics.
///
/// ## Web2 → Solana Pattern Mapping
///
/// | Web2 (Redis/BullMQ)       | Solana (SolQueue)           |
/// |---------------------------|-----------------------------|
/// | Queue instance            | QueueConfig PDA             |
/// | Job data (JSON)           | JobAccount PDA              |
/// | Worker process            | WorkerAccount PDA           |
/// | BRPOPLPUSH + SETNX lock   | Atomic `claim_job` tx       |
/// | done(null, result)        | `complete_job` instruction  |
/// | done(error)               | `fail_job` instruction      |
/// | queue.add(data, opts)     | `submit_job` instruction    |
/// | new Worker(fn)            | `register_worker` instr.    |
/// | queue.pause()             | `pause_queue` instruction   |
///
#[program]
pub mod solqueue {
    use super::*;

    // ================================================
    // Queue Management
    // ================================================

    /// Create a new job queue with specified configuration.
    ///
    /// # Arguments
    /// * `name` - Queue name (max 32 chars), used in PDA derivation
    /// * `max_workers` - Maximum concurrent workers allowed
    /// * `max_retries` - Default max retry attempts per job
    /// * `default_priority` - Default priority (0=Low, 1=Medium, 2=High)
    /// * `job_ttl` - Time-to-live for jobs in seconds
    pub fn create_queue(
        ctx: Context<CreateQueue>,
        name: String,
        max_workers: u8,
        max_retries: u8,
        default_priority: u8,
        job_ttl: i64,
    ) -> Result<()> {
        instructions::create_queue::handle_create_queue(
            ctx, name, max_workers, max_retries, default_priority, job_ttl,
        )
    }

    /// Pause or resume a queue. Only the queue authority can do this.
    ///
    /// # Arguments
    /// * `paused` - true to pause, false to resume
    pub fn pause_queue(ctx: Context<PauseQueue>, paused: bool) -> Result<()> {
        instructions::pause_queue::handle_pause_queue(ctx, paused)
    }

    // ================================================
    // Job Operations
    // ================================================

    /// Submit a new job to a queue.
    ///
    /// # Arguments
    /// * `payload` - Job data as bytes (max 512 bytes)
    /// * `priority` - Priority level (0=Low, 1=Medium, 2=High)
    pub fn submit_job(
        ctx: Context<SubmitJob>,
        payload: Vec<u8>,
        priority: u8,
    ) -> Result<()> {
        instructions::submit_job::handle_submit_job(ctx, payload, priority)
    }

    /// Worker claims a pending job for processing (atomic operation).
    ///
    /// This is the core differentiator from Web2 queues — Solana's runtime
    /// provides atomic state transitions, eliminating the need for
    /// distributed locks (Redis SETNX, Redlock, etc.).
    pub fn claim_job(ctx: Context<ClaimJob>) -> Result<()> {
        instructions::claim_job::handle_claim_job(ctx)
    }

    /// Mark a job as successfully completed with optional result data.
    ///
    /// # Arguments
    /// * `result` - Result data as bytes (max 256 bytes)
    pub fn complete_job(
        ctx: Context<CompleteJob>,
        result: Vec<u8>,
    ) -> Result<()> {
        instructions::complete_job::handle_complete_job(ctx, result)
    }

    /// Mark a job as failed with an error message.
    ///
    /// # Arguments
    /// * `error_message` - Human-readable error description (max 128 chars)
    pub fn fail_job(
        ctx: Context<FailJob>,
        error_message: String,
    ) -> Result<()> {
        instructions::fail_job::handle_fail_job(ctx, error_message)
    }

    /// Re-queue a failed job for retry (if retries remain).
    pub fn retry_job(ctx: Context<RetryJob>) -> Result<()> {
        instructions::retry_job::handle_retry_job(ctx)
    }

    // ================================================
    // Worker Management
    // ================================================

    /// Register a new worker for a queue.
    ///
    /// # Arguments
    /// * `worker_id` - Human-readable worker identifier (max 32 chars)
    pub fn register_worker(
        ctx: Context<RegisterWorker>,
        worker_id: String,
    ) -> Result<()> {
        instructions::register_worker::handle_register_worker(ctx, worker_id)
    }

    /// Deregister a worker from a queue (closes account, returns rent).
    pub fn deregister_worker(ctx: Context<DeregisterWorker>) -> Result<()> {
        instructions::deregister_worker::handle_deregister_worker(ctx)
    }
}
