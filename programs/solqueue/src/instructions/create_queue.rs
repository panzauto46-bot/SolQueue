use anchor_lang::prelude::*;

use crate::state::{QueueConfig, Priority};
use crate::errors::SolQueueError;

/// Creates a new job queue with the specified configuration.
///
/// # Web2 Equivalent
/// In Redis/BullMQ, this is like creating a new Queue instance:
/// ```js
/// const queue = new Queue('email-notifications', { ... });
/// ```
///
/// # On-Chain
/// Creates a QueueConfig PDA that stores queue state and counters.
pub fn handle_create_queue(
    ctx: Context<CreateQueue>,
    name: String,
    max_workers: u8,
    max_retries: u8,
    default_priority: u8,
    job_ttl: i64,
) -> Result<()> {
    require!(name.len() <= 32, SolQueueError::QueueNameTooLong);
    require!(max_workers > 0, SolQueueError::MaxWorkersReached);
    require!(job_ttl > 0, SolQueueError::InvalidJobTtl);

    let priority = match default_priority {
        0 => Priority::Low,
        1 => Priority::Medium,
        2 => Priority::High,
        _ => return Err(SolQueueError::InvalidPriority.into()),
    };

    let clock = Clock::get()?;
    let queue = &mut ctx.accounts.queue_config;

    queue.authority = ctx.accounts.authority.key();
    queue.name = name;
    queue.max_workers = max_workers;
    queue.max_retries = max_retries;
    queue.default_priority = priority;
    queue.job_ttl = job_ttl;
    queue.is_paused = false;
    queue.total_jobs = 0;
    queue.completed_jobs = 0;
    queue.failed_jobs = 0;
    queue.pending_jobs = 0;
    queue.processing_jobs = 0;
    queue.worker_count = 0;
    queue.created_at = clock.unix_timestamp;
    queue.updated_at = clock.unix_timestamp;
    queue.bump = ctx.bumps.queue_config;

    msg!("Queue '{}' created successfully", queue.name);
    msg!("Max workers: {}, Max retries: {}, TTL: {}s", max_workers, max_retries, job_ttl);

    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateQueue<'info> {
    /// The queue authority (creator and owner)
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The queue configuration PDA
    #[account(
        init,
        payer = authority,
        space = 8 + QueueConfig::INIT_SPACE,
        seeds = [b"queue", authority.key().as_ref(), name.as_bytes()],
        bump,
    )]
    pub queue_config: Account<'info, QueueConfig>,

    /// System program for account creation
    pub system_program: Program<'info, System>,
}
