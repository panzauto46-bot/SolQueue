use anchor_lang::prelude::*;

use crate::state::{QueueConfig, JobAccount, WorkerAccount, JobStatus, WorkerStatus};
use crate::errors::SolQueueError;

/// Worker atomically claims a pending job for processing.
///
/// # Web2 Equivalent
/// In Redis: `BRPOPLPUSH source destination` with SETNX-based distributed lock.
///
/// # On-Chain Advantage
/// Solana's runtime provides **atomic state transitions** — no distributed locks needed!
/// If two workers try to claim the same job, only one transaction succeeds.
/// This eliminates an entire class of race condition bugs common in Web2 queues.
pub fn handle_claim_job(ctx: Context<ClaimJob>) -> Result<()> {
    let queue = &mut ctx.accounts.queue_config;
    let job = &mut ctx.accounts.job_account;
    let worker = &mut ctx.accounts.worker_account;

    // Validate states
    require!(!queue.is_paused, SolQueueError::QueuePaused);
    require!(job.status == JobStatus::Pending, SolQueueError::InvalidJobStatus);
    require!(worker.status == WorkerStatus::Online, SolQueueError::WorkerNotOnline);

    let clock = Clock::get()?;

    // Check if job has expired
    if clock.unix_timestamp > job.expires_at {
        job.status = JobStatus::Expired;
        queue.pending_jobs = queue.pending_jobs.saturating_sub(1);
        msg!("Job #{} has expired", job.job_id);
        return Err(SolQueueError::JobExpired.into());
    }

    // Atomically claim the job
    job.status = JobStatus::Processing;
    job.worker = Some(worker.authority);
    job.attempts = job.attempts.checked_add(1)
        .ok_or(SolQueueError::ArithmeticOverflow)?;
    job.claimed_at = clock.unix_timestamp;

    // Update queue counters
    queue.pending_jobs = queue.pending_jobs.saturating_sub(1);
    queue.processing_jobs = queue.processing_jobs.checked_add(1)
        .ok_or(SolQueueError::ArithmeticOverflow)?;
    queue.updated_at = clock.unix_timestamp;

    // Update worker heartbeat
    worker.last_heartbeat = clock.unix_timestamp;

    msg!(
        "Job #{} claimed by worker '{}' | Attempt {}/{}",
        job.job_id, worker.worker_id, job.attempts, job.max_retries
    );

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimJob<'info> {
    /// The worker's authority (signer)
    #[account(mut)]
    pub worker_authority: Signer<'info>,

    /// The worker account — must be registered and online
    #[account(
        mut,
        seeds = [b"worker", queue_config.key().as_ref(), worker_authority.key().as_ref()],
        bump = worker_account.bump,
        constraint = worker_account.authority == worker_authority.key() @ SolQueueError::WorkerNotRegistered,
        constraint = worker_account.queue == queue_config.key() @ SolQueueError::WorkerNotRegistered,
    )]
    pub worker_account: Account<'info, WorkerAccount>,

    /// The queue configuration
    #[account(
        mut,
        seeds = [b"queue", queue_config.authority.as_ref(), queue_config.name.as_bytes()],
        bump = queue_config.bump,
    )]
    pub queue_config: Account<'info, QueueConfig>,

    /// The job to claim — must be in Pending status
    #[account(
        mut,
        seeds = [b"job", queue_config.key().as_ref(), &job_account.job_id.to_le_bytes()],
        bump = job_account.bump,
        constraint = job_account.queue == queue_config.key() @ SolQueueError::InvalidJobStatus,
    )]
    pub job_account: Account<'info, JobAccount>,
}
