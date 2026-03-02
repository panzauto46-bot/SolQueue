# SolQueue Architecture Deep Dive

## 1. System Overview

SolQueue is an on-chain job queue built as a Solana program with Anchor.
It translates common queue concepts from Redis/BullMQ into PDA-based state.

Main layers:

1. Solana Program (`programs/solqueue/src`)
2. SDK Client (`src/sdk/index.js`)
3. CLI Client (`cli/index.js`)
4. Frontend Dashboard (`src/pages`, `src/utils`)

## 2. Core Account Model

### QueueConfig PDA

- Seeds: `["queue", authority, queue_name]`
- Purpose: queue-level config, counters, control flags
- Key fields:
  - `authority`
  - `name`
  - `max_workers`
  - `max_retries`
  - `default_priority`
  - `job_ttl`
  - `is_paused`
  - `total_jobs`, `pending_jobs`, `processing_jobs`, `completed_jobs`, `failed_jobs`
  - `worker_count`

### JobAccount PDA

- Seeds: `["job", queue_pubkey, job_id_le_bytes]`
- Purpose: one on-chain record per submitted job
- Key fields:
  - `queue`, `creator`, `worker`
  - `job_id`
  - `payload`
  - `status`, `priority`
  - `attempts`, `max_retries`
  - `result`, `error_message`
  - `created_at`, `claimed_at`, `completed_at`, `expires_at`

### WorkerAccount PDA

- Seeds: `["worker", queue_pubkey, worker_authority]`
- Purpose: worker identity, status, and performance counters
- Key fields:
  - `authority`, `queue`, `worker_id`
  - `status`
  - `jobs_completed`, `jobs_failed`
  - `last_heartbeat`

## 3. Lifecycle and State Machine

Job status flow:

1. `Pending` after `submit_job`
2. `Processing` after `claim_job`
3. `Completed` after `complete_job`
4. `Failed` after `fail_job`
5. `Expired` if TTL is exceeded before claim

Retry flow:

- `retry_job` moves `Failed -> Pending` if `attempts < max_retries`.

## 4. Instruction Surface

Queue instructions:

- `create_queue`
- `pause_queue` (also resume via `paused=false`)

Job instructions:

- `submit_job`
- `claim_job`
- `complete_job`
- `fail_job`
- `retry_job`

Worker instructions:

- `register_worker`
- `deregister_worker`

## 5. Consistency and Safety

The program enforces queue safety with:

1. PDA constraints on each account relation
2. Signer checks for queue authority and worker authority
3. Status transition checks (`Pending`, `Processing`, `Failed`, etc.)
4. Bounded payload and message sizes
5. Counter updates using checked math
6. Queue pause gate for submit/claim paths

## 6. Web2 Queue Mapping

Mapping examples:

- `queue.add(...)` -> `submit_job`
- worker lock/claim loop -> `claim_job` atomic transaction
- `done(null, result)` -> `complete_job`
- `done(err)` -> `fail_job`
- retry policy -> `retry_job` with `attempts/max_retries`

## 7. Performance Model

Compared to in-memory queues:

- Higher latency per operation (transaction confirmation)
- Stronger transparency and auditability (ledger history)
- No custom lock server needed for claim safety

## 8. Operational Notes

- Program ID: `GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64`
- Devnet deploy requires enough SOL for program write + fees
- Current deployment blocker is faucet rate-limit (see `docs/DEPLOY_GUIDE.md`)
