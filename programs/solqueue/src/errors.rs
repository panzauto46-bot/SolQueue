use anchor_lang::prelude::*;

/// Custom error codes for the SolQueue program
#[error_code]
pub enum SolQueueError {
    // ---- Queue Errors ----
    /// Queue name exceeds maximum length of 32 characters
    #[msg("Queue name too long (max 32 characters)")]
    QueueNameTooLong,

    /// Queue is currently paused and not accepting new jobs or claims
    #[msg("Queue is paused")]
    QueuePaused,

    /// Queue has reached maximum number of registered workers
    #[msg("Queue has reached maximum worker capacity")]
    MaxWorkersReached,

    /// Only the queue authority can perform this action
    #[msg("Unauthorized: only queue authority can perform this action")]
    UnauthorizedQueueAction,

    /// Queue still has processing jobs, unsafe to perform this action
    #[msg("Queue has processing jobs in flight")]
    QueueHasProcessingJobs,

    // ---- Job Errors ----
    /// Job payload exceeds maximum size of 512 bytes
    #[msg("Job payload too large (max 512 bytes)")]
    PayloadTooLarge,

    /// Job is not in the expected status for this operation
    #[msg("Invalid job status for this operation")]
    InvalidJobStatus,

    /// Job has expired (past its TTL)
    #[msg("Job has expired")]
    JobExpired,

    /// Job has reached maximum retry attempts
    #[msg("Job has exhausted all retry attempts")]
    MaxRetriesExceeded,

    /// Result data exceeds maximum size of 256 bytes
    #[msg("Result data too large (max 256 bytes)")]
    ResultTooLarge,

    /// Error message exceeds maximum length of 128 characters
    #[msg("Error message too long (max 128 characters)")]
    ErrorMessageTooLong,

    // ---- Worker Errors ----
    /// Worker is not registered for this queue
    #[msg("Worker is not registered for this queue")]
    WorkerNotRegistered,

    /// Worker is not online
    #[msg("Worker is not online")]
    WorkerNotOnline,

    /// Worker is not the assigned worker for this job
    #[msg("Worker is not assigned to this job")]
    WorkerNotAssigned,

    /// Worker ID exceeds maximum length of 32 characters
    #[msg("Worker ID too long (max 32 characters)")]
    WorkerIdTooLong,

    /// Worker is already registered for this queue
    #[msg("Worker is already registered")]
    WorkerAlreadyRegistered,

    // ---- General Errors ----
    /// Arithmetic overflow occurred
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    /// Invalid priority value provided
    #[msg("Invalid priority value")]
    InvalidPriority,

    /// Invalid job TTL value
    #[msg("Invalid job TTL (must be > 0)")]
    InvalidJobTtl,
}
