# SolQueue SDK Usage Guide

SDK source:

- `src/sdk/index.js`

IDL source:

- `src/sdk/idl.json`

## 1. Initialize Client

```js
import { Connection } from "@solana/web3.js";
import { SolQueueClient } from "./src/sdk/index.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const client = new SolQueueClient(connection, walletAdapter);
```

If `walletAdapter` is missing, write instructions will throw `Wallet not connected`.

## 2. PDA Helpers

Available helper functions:

- `getQueuePDA(authority, queueName)`
- `getJobPDA(queuePDA, jobId)`
- `getWorkerPDA(queuePDA, workerAuthority)`

## 3. Queue Methods

- `createQueue(name, maxWorkers, maxRetries, defaultPriority, jobTtl)`
- `pauseQueue(queuePDA, paused)`

Returns transaction signature and PDA where applicable.

## 4. Job Methods

- `submitJob(queuePDA, payload, priority)`
- `claimJob(queuePDA, jobPDA)`
- `completeJob(queuePDA, jobPDA, result)`
- `failJob(queuePDA, jobPDA, errorMessage)`
- `retryJob(queuePDA, jobPDA)`

## 5. Worker Methods

- `registerWorker(queuePDA, workerId)`
- `deregisterWorker(queuePDA)`

## 6. Read Methods

- `fetchQueue(queuePDA)`
- `fetchQueuesByAuthority(authority)`
- `fetchAllQueues()`
- `fetchJob(jobPDA)`
- `fetchJobsByQueue(queuePDA)`
- `fetchWorker(workerPDA)`
- `fetchWorkersByQueue(queuePDA)`

## 7. Realtime Subscriptions

- `subscribeToQueue(queuePDA, callback)`
- `subscribeToJob(jobPDA, callback)`
- `unsubscribeAll()`

Subscriptions use `connection.onAccountChange`.

## 8. Wallet Helpers

- `connectPhantomWallet()`
- `disconnectPhantomWallet()`
- `createConnectedClient(cluster)`

## 9. Utility Helpers

- `timeAgo(timestamp)`
- `getSolscanTxLink(signature, cluster)`
- `getSolscanAccountLink(address, cluster)`
- `shortenAddress(address, chars)`

## 10. Example Flow

```js
const { tx: createTx, queuePDA } = await client.createQueue("emails", 10, 3, 1, 3600);
const { tx: submitTx, jobPDA } = await client.submitJob(queuePDA, JSON.stringify({ to: "user@x.com" }), 2);
await client.registerWorker(queuePDA, "worker-1");
await client.claimJob(queuePDA, jobPDA);
await client.completeJob(queuePDA, jobPDA, JSON.stringify({ ok: true }));
```
