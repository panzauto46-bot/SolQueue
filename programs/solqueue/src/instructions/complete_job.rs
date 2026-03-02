use anchor_lang::prelude::*;

use crate::state::{QueueConfig, JobAccount, WorkerAccount, JobStatus};
use crate::errors::SolQueueError;

/// Marks a job as successfully completed with an optional result payload.
///
/// # Web2 Equivalent
/// In BullMQ: `done(null, result)` callback in the process function.
///
/// # On-Chain
/// The assigned worker calls this to transition the job to `Completed` status.
/// Result data is stored on-chain for transparency and auditing.
pub fn handle_complete_job(
    ctx: Context<CompleteJob>,
    result: Vec<u8>,
) -> Result<()> {
    require!(result.len() <= 256, SolQueueError::ResultTooLarge);

    let queue = &mut ctx.accounts.queue_config;
    let job = &mut ctx.accounts.job_account;
    let worker = &mut ctx.accounts.worker_account;

    // Job must be in Processing status
    require!(job.status == JobStatus::Processing, SolQueueError::InvalidJobStatus);

    // Only the assigned worker can complete the job
    require!(
        job.worker == Some(ctx.accounts.worker_authority.key()),
        SolQueueError::WorkerNotAssigned
    );

    let clock = Clock::get()?;

    // Transition job to Completed
    job.status = JobStatus::Completed;
    job.result = result;
    job.completed_at = clock.unix_timestamp;

    // Update queue counters
    queue.processing_jobs = queue.processing_jobs.saturating_sub(1);
    queue.completed_jobs = queue.completed_jobs.checked_add(1)
        .ok_or(SolQueueError::ArithmeticOverflow)?;
    queue.updated_at = clock.unix_timestamp;

    // Update worker stats
    worker.jobs_completed = worker.jobs_completed.checked_add(1)
        .ok_or(SolQueueError::ArithmeticOverflow)?;
    worker.last_heartbeat = clock.unix_timestamp;

    msg!(
        "Job #{} completed by worker '{}' | Queue: '{}'",
        job.job_id, worker.worker_id, queue.name
    );

    Ok(())
}

#[derive(Accounts)]
pub struct CompleteJob<'info> {
    /// The worker's authority (signer) — must be the assigned worker
    #[account(mut)]
    pub worker_authority: Signer<'info>,

    /// The worker account
    #[account(
        mut,
        seeds = [b"worker", queue_config.key().as_ref(), worker_authority.key().as_ref()],
        bump = worker_account.bump,
        constraint = worker_account.authority == worker_authority.key() @ SolQueueError::WorkerNotAssigned,
    )]
    pub worker_account: Account<'info, WorkerAccount>,

    /// The queue configuration
    #[account(
        mut,
        seeds = [b"queue", queue_config.authority.as_ref(), queue_config.name.as_bytes()],
        bump = queue_config.bump,
    )]
    pub queue_config: Account<'info, QueueConfig>,

    /// The job to complete
    #[account(
        mut,
        seeds = [b"job", queue_config.key().as_ref(), &job_account.job_id.to_le_bytes()],
        bump = job_account.bump,
        constraint = job_account.queue == queue_config.key() @ SolQueueError::InvalidJobStatus,
    )]
    pub job_account: Account<'info, JobAccount>,
}
