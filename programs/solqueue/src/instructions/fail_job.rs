use anchor_lang::prelude::*;

use crate::state::{QueueConfig, JobAccount, WorkerAccount, JobStatus};
use crate::errors::SolQueueError;

/// Marks a job as failed with an error message.
///
/// # Web2 Equivalent
/// In BullMQ: `done(new Error('something failed'))` or throwing in the process function.
///
/// # On-Chain
/// The assigned worker reports a failure. The job transitions to `Failed` status.
/// If retries remain, the job can be re-queued via the `retry_job` instruction.
pub fn handle_fail_job(
    ctx: Context<FailJob>,
    error_message: String,
) -> Result<()> {
    require!(error_message.len() <= 128, SolQueueError::ErrorMessageTooLong);

    let queue = &mut ctx.accounts.queue_config;
    let job = &mut ctx.accounts.job_account;
    let worker = &mut ctx.accounts.worker_account;

    // Job must be in Processing status
    require!(job.status == JobStatus::Processing, SolQueueError::InvalidJobStatus);

    // Only the assigned worker can fail the job
    require!(
        job.worker == Some(ctx.accounts.worker_authority.key()),
        SolQueueError::WorkerNotAssigned
    );

    let clock = Clock::get()?;

    // Transition job to Failed
    job.status = JobStatus::Failed;
    job.error_message = error_message;
    job.completed_at = clock.unix_timestamp;

    // Update queue counters
    queue.processing_jobs = queue.processing_jobs.saturating_sub(1);
    queue.failed_jobs = queue.failed_jobs.checked_add(1)
        .ok_or(SolQueueError::ArithmeticOverflow)?;
    queue.updated_at = clock.unix_timestamp;

    // Update worker stats
    worker.jobs_failed = worker.jobs_failed.checked_add(1)
        .ok_or(SolQueueError::ArithmeticOverflow)?;
    worker.last_heartbeat = clock.unix_timestamp;

    msg!(
        "Job #{} failed | Worker: '{}' | Attempt {}/{} | Error: {}",
        job.job_id, worker.worker_id, job.attempts, job.max_retries, job.error_message
    );

    Ok(())
}

#[derive(Accounts)]
pub struct FailJob<'info> {
    /// The worker's authority (signer)
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

    /// The job to fail
    #[account(
        mut,
        seeds = [b"job", queue_config.key().as_ref(), &job_account.job_id.to_le_bytes()],
        bump = job_account.bump,
        constraint = job_account.queue == queue_config.key() @ SolQueueError::InvalidJobStatus,
    )]
    pub job_account: Account<'info, JobAccount>,
}
