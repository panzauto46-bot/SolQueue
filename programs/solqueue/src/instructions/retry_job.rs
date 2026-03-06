use anchor_lang::prelude::*;

use crate::state::{QueueConfig, JobAccount, JobStatus};
use crate::errors::SolQueueError;

/// Re-queues a failed job for retry.
///
/// # Web2 Equivalent
/// In BullMQ: Automatic retry with exponential backoff configurated via `attempts` and `backoff`.
///
/// # On-Chain
/// The queue authority (or job creator) can manually retry a failed job.
/// The job transitions back to `Pending` status with its attempt counter preserved.
/// Only jobs that haven't exceeded max_retries can be retried.
pub fn handle_retry_job(ctx: Context<RetryJob>) -> Result<()> {
    let queue = &mut ctx.accounts.queue_config;
    let job = &mut ctx.accounts.job_account;

    // Job must be in Failed status
    require!(job.status == JobStatus::Failed, SolQueueError::InvalidJobStatus);

    // Check if retries are exhausted
    require!(
        job.attempts < job.max_retries,
        SolQueueError::MaxRetriesExceeded
    );

    let clock = Clock::get()?;

    // Reset job for retry
    job.status = JobStatus::Pending;
    job.worker = None;
    job.error_message = String::new();
    job.claimed_at = 0;
    job.completed_at = 0;
    // Extend expiration for the retry
    job.expires_at = clock.unix_timestamp + queue.job_ttl;

    // Update queue counters  
    // Note: failed_jobs was already incremented in fail_job, we decrement it
    queue.failed_jobs = queue.failed_jobs.saturating_sub(1);
    queue.pending_jobs = queue.pending_jobs.checked_add(1)
        .ok_or(SolQueueError::ArithmeticOverflow)?;
    queue.updated_at = clock.unix_timestamp;

    msg!(
        "Job #{} re-queued for retry | Attempt {}/{} | Queue: '{}'",
        job.job_id, job.attempts + 1, job.max_retries, queue.name
    );

    Ok(())
}

#[derive(Accounts)]
pub struct RetryJob<'info> {
    /// The authority — must be the queue authority or job creator
    #[account(
        mut,
        constraint = authority.key() == queue_config.authority || authority.key() == job_account.creator
            @ SolQueueError::UnauthorizedQueueAction
    )]
    pub authority: Signer<'info>,

    /// The queue configuration
    #[account(
        mut,
        seeds = [b"queue", queue_config.authority.as_ref(), queue_config.name.as_bytes()],
        bump = queue_config.bump,
    )]
    pub queue_config: Account<'info, QueueConfig>,

    /// The job to retry
    #[account(
        mut,
        seeds = [b"job", queue_config.key().as_ref(), &job_account.job_id.to_le_bytes()],
        bump = job_account.bump,
        constraint = job_account.queue == queue_config.key() @ SolQueueError::InvalidJobStatus,
    )]
    pub job_account: Account<'info, JobAccount>,
}
