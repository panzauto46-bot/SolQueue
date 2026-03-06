use anchor_lang::prelude::*;

use crate::state::{QueueConfig, WorkerAccount};
use crate::errors::SolQueueError;

/// Deregisters a worker from a queue.
///
/// The worker or queue authority can deregister a worker.
/// The worker account is closed and rent is returned to the authority.
pub fn handle_deregister_worker(ctx: Context<DeregisterWorker>) -> Result<()> {
    let queue = &mut ctx.accounts.queue_config;
    let worker = &ctx.accounts.worker_account;

    // Guard against orphaned processing jobs.
    require!(
        queue.processing_jobs == 0,
        SolQueueError::QueueHasProcessingJobs
    );

    let clock = Clock::get()?;

    // Decrement worker count
    queue.worker_count = queue.worker_count.saturating_sub(1);
    queue.updated_at = clock.unix_timestamp;

    msg!(
        "Worker '{}' deregistered from queue '{}' | Workers remaining: {}",
        worker.worker_id, queue.name, queue.worker_count
    );

    Ok(())
}

#[derive(Accounts)]
pub struct DeregisterWorker<'info> {
    /// The authority — must be the worker owner or queue authority
    #[account(
        mut,
        constraint = authority.key() == worker_account.authority || authority.key() == queue_config.authority
            @ SolQueueError::UnauthorizedQueueAction
    )]
    pub authority: Signer<'info>,

    /// The worker account to close
    #[account(
        mut,
        seeds = [b"worker", queue_config.key().as_ref(), worker_account.authority.as_ref()],
        bump = worker_account.bump,
        close = authority,
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
}
