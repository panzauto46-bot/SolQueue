use anchor_lang::prelude::*;

use crate::state::{QueueConfig, WorkerAccount, WorkerStatus};
use crate::errors::SolQueueError;

/// Registers a new worker for a specific queue.
///
/// # Web2 Equivalent
/// In BullMQ: `const worker = new Worker('queue-name', processorFn, { concurrency: 1 })`
///
/// # On-Chain
/// Creates a WorkerAccount PDA tied to both the queue and the worker's wallet.
/// The worker can then claim and process pending jobs from the queue.
pub fn handle_register_worker(
    ctx: Context<RegisterWorker>,
    worker_id: String,
) -> Result<()> {
    require!(worker_id.len() <= 32, SolQueueError::WorkerIdTooLong);

    let queue = &mut ctx.accounts.queue_config;
    require!(
        queue.worker_count < queue.max_workers,
        SolQueueError::MaxWorkersReached
    );

    let clock = Clock::get()?;
    let worker = &mut ctx.accounts.worker_account;

    worker.authority = ctx.accounts.authority.key();
    worker.queue = queue.key();
    worker.worker_id = worker_id;
    worker.status = WorkerStatus::Online;
    worker.jobs_completed = 0;
    worker.jobs_failed = 0;
    worker.last_heartbeat = clock.unix_timestamp;
    worker.registered_at = clock.unix_timestamp;
    worker.bump = ctx.bumps.worker_account;

    // Update queue worker count
    queue.worker_count = queue.worker_count.checked_add(1)
        .ok_or(SolQueueError::ArithmeticOverflow)?;
    queue.updated_at = clock.unix_timestamp;

    msg!(
        "Worker '{}' registered for queue '{}' | Workers: {}/{}",
        worker.worker_id, queue.name, queue.worker_count, queue.max_workers
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(worker_id: String)]
pub struct RegisterWorker<'info> {
    /// The worker's wallet (signer and payer)
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The worker account PDA
    #[account(
        init,
        payer = authority,
        space = 8 + WorkerAccount::INIT_SPACE,
        seeds = [b"worker", queue_config.key().as_ref(), authority.key().as_ref()],
        bump,
    )]
    pub worker_account: Account<'info, WorkerAccount>,

    /// The queue to register for
    #[account(
        mut,
        seeds = [b"queue", queue_config.authority.as_ref(), queue_config.name.as_bytes()],
        bump = queue_config.bump,
    )]
    pub queue_config: Account<'info, QueueConfig>,

    /// System program for account creation
    pub system_program: Program<'info, System>,
}
