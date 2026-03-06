use anchor_lang::prelude::*;

use crate::state::QueueConfig;
use crate::errors::SolQueueError;

/// Pauses a queue, preventing new job submissions and claims.
///
/// # Web2 Equivalent
/// In BullMQ: `queue.pause()` / `queue.resume()`
///
/// # On-Chain
/// Only the queue authority can pause or resume, acting as a circuit breaker.
pub fn handle_pause_queue(ctx: Context<PauseQueue>, paused: bool) -> Result<()> {
    let queue = &mut ctx.accounts.queue_config;
    let clock = Clock::get()?;

    queue.is_paused = paused;
    queue.updated_at = clock.unix_timestamp;

    if paused {
        msg!("Queue '{}' paused by authority", queue.name);
    } else {
        msg!("Queue '{}' resumed by authority", queue.name);
    }

    Ok(())
}

#[derive(Accounts)]
pub struct PauseQueue<'info> {
    /// The queue authority (only they can pause/resume)
    #[account(
        mut,
        constraint = authority.key() == queue_config.authority @ SolQueueError::UnauthorizedQueueAction
    )]
    pub authority: Signer<'info>,

    /// The queue configuration
    #[account(
        mut,
        seeds = [b"queue", queue_config.authority.as_ref(), queue_config.name.as_bytes()],
        bump = queue_config.bump,
    )]
    pub queue_config: Account<'info, QueueConfig>,
}
