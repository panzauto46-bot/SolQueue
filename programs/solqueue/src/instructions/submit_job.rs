use anchor_lang::prelude::*;

use crate::state::{QueueConfig, JobAccount, JobStatus, Priority};
use crate::errors::SolQueueError;

/// Submits a new job to the queue.
///
/// # Web2 Equivalent
/// In BullMQ/Redis: `queue.add('jobName', { data }, { priority: 1 })`
///
/// # On-Chain
/// Creates a JobAccount PDA with the payload and configuration.
/// The job starts in `Pending` status, ready to be claimed by a worker.
pub fn handle_submit_job(
    ctx: Context<SubmitJob>,
    payload: Vec<u8>,
    priority: u8,
) -> Result<()> {
    let queue = &mut ctx.accounts.queue_config;

    require!(!queue.is_paused, SolQueueError::QueuePaused);
    require!(payload.len() <= 512, SolQueueError::PayloadTooLarge);

    let job_priority = match priority {
        0 => Priority::Low,
        1 => Priority::Medium,
        2 => Priority::High,
        _ => queue.default_priority,
    };

    let clock = Clock::get()?;
    let job_id = queue.total_jobs;

    let job = &mut ctx.accounts.job_account;
    job.queue = queue.key();
    job.creator = ctx.accounts.creator.key();
    job.worker = None;
    job.job_id = job_id;
    job.payload = payload;
    job.status = JobStatus::Pending;
    job.priority = job_priority;
    job.attempts = 0;
    job.max_retries = queue.max_retries;
    job.result = vec![];
    job.error_message = String::new();
    job.created_at = clock.unix_timestamp;
    job.claimed_at = 0;
    job.completed_at = 0;
    job.expires_at = clock.unix_timestamp + queue.job_ttl;
    job.bump = ctx.bumps.job_account;

    // Update queue counters
    queue.total_jobs = queue.total_jobs.checked_add(1)
        .ok_or(SolQueueError::ArithmeticOverflow)?;
    queue.pending_jobs = queue.pending_jobs.checked_add(1)
        .ok_or(SolQueueError::ArithmeticOverflow)?;
    queue.updated_at = clock.unix_timestamp;

    msg!("Job #{} submitted to queue '{}' | Priority: {}", job_id, queue.name, job_priority);

    Ok(())
}

#[derive(Accounts)]
pub struct SubmitJob<'info> {
    /// The job creator (pays for the account)
    #[account(mut)]
    pub creator: Signer<'info>,

    /// The queue to submit the job to
    #[account(
        mut,
        seeds = [b"queue", queue_config.authority.as_ref(), queue_config.name.as_bytes()],
        bump = queue_config.bump,
    )]
    pub queue_config: Account<'info, QueueConfig>,

    /// The job account PDA
    #[account(
        init,
        payer = creator,
        space = 8 + JobAccount::INIT_SPACE,
        seeds = [b"job", queue_config.key().as_ref(), &queue_config.total_jobs.to_le_bytes()],
        bump,
    )]
    pub job_account: Account<'info, JobAccount>,

    /// System program for account creation
    pub system_program: Program<'info, System>,
}
