use anchor_lang::prelude::*;

// ============================================
// Queue Configuration Account
// PDA Seeds: ["queue", authority, queue_name]
// ============================================
#[account]
#[derive(InitSpace)]
pub struct QueueConfig {
    /// The authority (owner) of this queue
    pub authority: Pubkey,

    /// Human-readable queue name
    #[max_len(32)]
    pub name: String,

    /// Maximum number of concurrent workers
    pub max_workers: u8,

    /// Maximum retry attempts per job
    pub max_retries: u8,

    /// Default priority for new jobs
    pub default_priority: Priority,

    /// Job time-to-live in seconds
    pub job_ttl: i64,

    /// Whether the queue is paused
    pub is_paused: bool,

    /// Total jobs ever submitted
    pub total_jobs: u64,

    /// Total completed jobs
    pub completed_jobs: u64,

    /// Total failed jobs (after all retries exhausted)
    pub failed_jobs: u64,

    /// Currently pending jobs count
    pub pending_jobs: u64,

    /// Currently processing jobs count
    pub processing_jobs: u64,

    /// Number of registered workers
    pub worker_count: u8,

    /// Creation timestamp
    pub created_at: i64,

    /// Last activity timestamp
    pub updated_at: i64,

    /// PDA bump seed
    pub bump: u8,
}

// ============================================
// Job Account
// PDA Seeds: ["job", queue_pubkey, job_id.to_le_bytes()]
// ============================================
#[account]
#[derive(InitSpace)]
pub struct JobAccount {
    /// The queue this job belongs to
    pub queue: Pubkey,

    /// The wallet that submitted this job
    pub creator: Pubkey,

    /// The worker currently processing (None if pending)
    pub worker: Option<Pubkey>,

    /// Unique job ID within the queue
    pub job_id: u64,

    /// Job payload data
    #[max_len(512)]
    pub payload: Vec<u8>,

    /// Current job status
    pub status: JobStatus,

    /// Job priority level
    pub priority: Priority,

    /// Number of processing attempts
    pub attempts: u8,

    /// Max retries for this specific job
    pub max_retries: u8,

    /// Result data (on completion)
    #[max_len(256)]
    pub result: Vec<u8>,

    /// Error message (on failure)
    #[max_len(128)]
    pub error_message: String,

    /// When the job was created
    pub created_at: i64,

    /// When a worker claimed the job
    pub claimed_at: i64,

    /// When the job completed/failed
    pub completed_at: i64,

    /// When the job expires (created_at + ttl)
    pub expires_at: i64,

    /// PDA bump seed
    pub bump: u8,
}

// ============================================
// Worker Account
// PDA Seeds: ["worker", queue_pubkey, authority]
// ============================================
#[account]
#[derive(InitSpace)]
pub struct WorkerAccount {
    /// The worker's wallet address
    pub authority: Pubkey,

    /// The queue this worker is registered to
    pub queue: Pubkey,

    /// Human-readable worker name/ID
    #[max_len(32)]
    pub worker_id: String,

    /// Worker status
    pub status: WorkerStatus,

    /// Total jobs completed by this worker
    pub jobs_completed: u64,

    /// Total jobs failed by this worker
    pub jobs_failed: u64,

    /// Last heartbeat/activity timestamp
    pub last_heartbeat: i64,

    /// Registration timestamp
    pub registered_at: i64,

    /// PDA bump seed
    pub bump: u8,
}

// ============================================
// Enums
// ============================================

/// Job status representing the lifecycle state
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum JobStatus {
    /// Job is waiting to be claimed by a worker
    Pending,
    /// Job is currently being processed
    Processing,
    /// Job completed successfully
    Completed,
    /// Job failed (may be retried)
    Failed,
    /// Job expired before processing
    Expired,
}

/// Priority level for jobs
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Priority {
    /// Low priority — processed last
    Low,
    /// Medium priority — default
    Medium,
    /// High priority — processed first
    High,
}

/// Worker status
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum WorkerStatus {
    /// Worker is active and can claim jobs
    Online,
    /// Worker is inactive
    Offline,
    /// Worker has been suspended by the queue authority
    Suspended,
}

impl Default for JobStatus {
    fn default() -> Self {
        JobStatus::Pending
    }
}

impl Default for Priority {
    fn default() -> Self {
        Priority::Medium
    }
}

impl Default for WorkerStatus {
    fn default() -> Self {
        WorkerStatus::Online
    }
}

impl std::fmt::Display for JobStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            JobStatus::Pending => write!(f, "Pending"),
            JobStatus::Processing => write!(f, "Processing"),
            JobStatus::Completed => write!(f, "Completed"),
            JobStatus::Failed => write!(f, "Failed"),
            JobStatus::Expired => write!(f, "Expired"),
        }
    }
}

impl std::fmt::Display for Priority {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Priority::Low => write!(f, "Low"),
            Priority::Medium => write!(f, "Medium"),
            Priority::High => write!(f, "High"),
        }
    }
}
