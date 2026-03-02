# SolQueue CLI Reference

CLI entry:

- `cli/index.js`

## 1. Prerequisites

1. Program artifacts built (`target/idl/solqueue.json` exists)
2. Solana keypair available (`~/.config/solana/id.json` by default)
3. Devnet connectivity

Optional keypair override:

```bash
SOLANA_KEYPAIR=/path/to/id.json
```

## 2. Command Summary

```bash
solqueue init <name>
solqueue submit <queue> [payload]
solqueue status <queue>
solqueue jobs <queue>
solqueue workers <queue>
solqueue worker start <queue> [worker_id]
solqueue worker stop <queue>
solqueue stats
solqueue config
```

## 3. Commands

### init

Create a queue PDA with default options from CLI.

Example:

```bash
solqueue init email-queue
```

### submit

Submit one job to queue.

Example:

```bash
solqueue submit email-queue "{\"to\":\"user@solana.com\"}"
```

### status

Display queue metrics table (jobs, workers, pause state).

Example:

```bash
solqueue status email-queue
```

### jobs

List all jobs under queue with status and attempt count.

Example:

```bash
solqueue jobs email-queue
```

### workers

List registered workers for queue.

Example:

```bash
solqueue workers email-queue
```

### worker start

Register current wallet as worker.

Example:

```bash
solqueue worker start email-queue worker-1
```

### worker stop

Deregister current worker account from queue.

Example:

```bash
solqueue worker stop email-queue
```

### stats

Show aggregate queue stats across program accounts.

Example:

```bash
solqueue stats
```

### config

Show runtime config: program ID, RPC, keypair path.

Example:

```bash
solqueue config
```

## 4. Notes

1. CLI uses Program ID hardcoded in `cli/index.js`.
2. CLI expects devnet RPC (`https://api.devnet.solana.com`).
3. If IDL missing, run `anchor build` first.
