# SolQueue Program API Reference

Program ID:

`GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64`

## 1. Accounts

### QueueConfig

PDA seeds:

- `["queue", authority, queue_name]`

Main fields:

- authority, name, max_workers, max_retries, default_priority, job_ttl
- is_paused
- total_jobs, pending_jobs, processing_jobs, completed_jobs, failed_jobs
- worker_count
- created_at, updated_at, bump

### JobAccount

PDA seeds:

- `["job", queue_pubkey, job_id_le_bytes]`

Main fields:

- queue, creator, worker, job_id
- payload, status, priority
- attempts, max_retries
- result, error_message
- created_at, claimed_at, completed_at, expires_at, bump

### WorkerAccount

PDA seeds:

- `["worker", queue_pubkey, worker_authority]`

Main fields:

- authority, queue, worker_id, status
- jobs_completed, jobs_failed
- last_heartbeat, registered_at, bump

## 2. Instructions

### create_queue(name, max_workers, max_retries, default_priority, job_ttl)

Signers:

- `authority`

Accounts:

- `authority` (mut)
- `queue_config` (init PDA)
- `system_program`

Behavior:

- creates queue config
- initializes counters and flags

### pause_queue(paused)

Signers:

- `authority` (must equal `queue_config.authority`)

Accounts:

- `authority` (mut)
- `queue_config` (mut)

Behavior:

- sets queue pause state

### submit_job(payload, priority)

Signers:

- `creator`

Accounts:

- `creator` (mut)
- `queue_config` (mut)
- `job_account` (init PDA from queue + total_jobs)
- `system_program`

Behavior:

- creates pending job
- increments queue `total_jobs` and `pending_jobs`

### claim_job()

Signers:

- `worker_authority`

Accounts:

- `worker_authority` (mut)
- `worker_account` (mut)
- `queue_config` (mut)
- `job_account` (mut)

Behavior:

- validates queue not paused, worker online, job pending
- expires job if TTL passed
- transitions to processing and assigns worker

### complete_job(result)

Signers:

- `worker_authority` (must be assigned worker)

Accounts:

- `worker_authority` (mut)
- `worker_account` (mut)
- `queue_config` (mut)
- `job_account` (mut)

Behavior:

- transitions `Processing -> Completed`
- stores result
- updates queue and worker counters

### fail_job(error_message)

Signers:

- `worker_authority` (must be assigned worker)

Accounts:

- `worker_authority` (mut)
- `worker_account` (mut)
- `queue_config` (mut)
- `job_account` (mut)

Behavior:

- transitions `Processing -> Failed`
- stores error text
- updates queue and worker counters

### retry_job()

Signers:

- `authority` (queue authority or job creator)

Accounts:

- `authority` (mut)
- `queue_config` (mut)
- `job_account` (mut)

Behavior:

- validates failed status and retry budget
- transitions `Failed -> Pending`
- clears worker/error and extends expiry

### register_worker(worker_id)

Signers:

- `authority` (worker wallet)

Accounts:

- `authority` (mut)
- `worker_account` (init PDA)
- `queue_config` (mut)
- `system_program`

Behavior:

- registers worker and increments `worker_count`

### deregister_worker()

Signers:

- `authority` (worker owner or queue authority)

Accounts:

- `authority` (mut)
- `worker_account` (mut, close to authority)
- `queue_config` (mut)

Behavior:

- decrements `worker_count`
- closes worker account

## 3. Enums

### JobStatus

- Pending
- Processing
- Completed
- Failed
- Expired

### Priority

- Low
- Medium
- High

### WorkerStatus

- Online
- Offline
- Suspended

## 4. Error Codes (`SolQueueError`)

- QueueNameTooLong
- QueuePaused
- MaxWorkersReached
- UnauthorizedQueueAction
- PayloadTooLarge
- InvalidJobStatus
- JobExpired
- MaxRetriesExceeded
- ResultTooLarge
- ErrorMessageTooLong
- WorkerNotRegistered
- WorkerNotOnline
- WorkerNotAssigned
- WorkerIdTooLong
- WorkerAlreadyRegistered
- ArithmeticOverflow
- InvalidPriority
