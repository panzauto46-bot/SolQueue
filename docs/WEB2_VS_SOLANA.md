# Web2 vs Solana Queue Design

## 1. Problem Statement

Traditional queues (Redis/RabbitMQ/BullMQ) are fast but require separate infra:

- queue server
- worker orchestration
- lock strategy
- monitoring and persistence setup

SolQueue re-implements queue state transitions directly on-chain.

## 2. Concept Mapping

| Web2 Pattern | SolQueue Pattern |
|---|---|
| Queue instance | `QueueConfig` PDA |
| Enqueued message | `JobAccount` PDA |
| Worker identity | `WorkerAccount` PDA |
| Distributed lock (claim) | Atomic `claim_job` transaction |
| Retry config | `max_retries` + `retry_job` |
| Pause queue | `pause_queue` |

## 3. Reliability Model

### Web2

- Usually fast (<ms) in memory
- Reliability depends on deployment choices (AOF/RDB, replicas)
- Requires lock correctness for multi-worker claims

### SolQueue

- Slower per operation (block confirmation latency)
- Persistent state by default (ledger-backed accounts)
- Claim logic is race-safe through transaction atomicity

## 4. Concurrency Semantics

In Web2, two workers can race to claim one job unless lock handling is perfect.

In SolQueue:

- both workers may submit claim transactions
- only one transaction can validly transition `Pending -> Processing`
- other transaction fails due status mismatch

This shifts correctness from custom lock code to runtime guarantees.

## 5. Cost Model

Web2:

- fixed infra cost (servers, ops, monitoring)

SolQueue:

- variable per-operation fees
- higher transaction overhead
- low Devnet cost for development

## 6. Observability

Web2 observability is usually external (logs + metrics stack).

SolQueue keeps queue and job counters on-chain:

- `total_jobs`
- `pending_jobs`
- `processing_jobs`
- `completed_jobs`
- `failed_jobs`

Clients can read these directly with SDK/CLI without a separate metrics database.

## 7. Tradeoff Summary

Strengths of SolQueue:

1. Verifiable state transitions
2. Transparent counters and history
3. Atomic claim without custom lock infra

Limitations of SolQueue:

1. Higher latency than Redis-like queues
2. Account size limits for payload/result
3. On-chain operation cost per write
4. Requires wallet + RPC operational setup

## 8. When to Use Which

Choose Web2 queue when:

- ultra-low latency is primary
- private infra is acceptable
- throughput requirements are very high and cost-sensitive

Choose SolQueue when:

- verifiability and transparency matter
- trust minimization is important
- queue state must be publicly auditable
