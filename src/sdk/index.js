/**
 * SolQueue SDK — TypeScript/JavaScript client for the SolQueue on-chain program
 * 
 * Provides high-level functions for interacting with queues, jobs, and workers
 * on the Solana blockchain via the Anchor framework.
 */

import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN, utils } from '@coral-xyz/anchor';
import IDL from './idl.json';

// ═══════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════

export const PROGRAM_ID = new PublicKey('GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64');

export const DEVNET_RPC = 'https://api.devnet.solana.com';

export const SEEDS = {
  QUEUE: 'queue',
  JOB: 'job',
  WORKER: 'worker',
};

export const JOB_STATUS = {
  0: 'Pending',
  1: 'Processing',
  2: 'Completed',
  3: 'Failed',
  4: 'Expired',
};

export const PRIORITY = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
};

export const WORKER_STATUS = {
  0: 'Online',
  1: 'Offline',
  2: 'Suspended',
};

// ═══════════════════════════════════════════════
//  PDA DERIVATION HELPERS
// ═══════════════════════════════════════════════

/**
 * Derive the PDA for a QueueConfig account
 */
export function getQueuePDA(authority, queueName) {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEEDS.QUEUE),
      authority.toBuffer(),
      Buffer.from(queueName),
    ],
    PROGRAM_ID
  );
  return pda;
}

/**
 * Derive the PDA for a JobAccount
 */
export function getJobPDA(queuePDA, jobId) {
  const jobIdBN = new BN(jobId);
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEEDS.JOB),
      queuePDA.toBuffer(),
      jobIdBN.toArrayLike(Buffer, 'le', 8),
    ],
    PROGRAM_ID
  );
  return pda;
}

/**
 * Derive the PDA for a WorkerAccount
 */
export function getWorkerPDA(queuePDA, workerAuthority) {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEEDS.WORKER),
      queuePDA.toBuffer(),
      workerAuthority.toBuffer(),
    ],
    PROGRAM_ID
  );
  return pda;
}

// ═══════════════════════════════════════════════
//  SOLQUEUE CLIENT CLASS
// ═══════════════════════════════════════════════

export class SolQueueClient {
  constructor(connection, wallet, opts = {}) {
    this.connection = connection || new Connection(DEVNET_RPC, 'confirmed');
    this.wallet = wallet;
    this.program = null;
    this._listeners = new Map();
    
    if (wallet) {
      const provider = new AnchorProvider(this.connection, wallet, {
        commitment: 'confirmed',
        ...opts,
      });
      this.program = new Program(IDL, provider);
    }
  }

  // ─── Connection Management ───────────────────

  /**
   * Check if a wallet is connected
   */
  get isConnected() {
    return !!this.wallet?.publicKey;
  }

  /**
   * Get the connected wallet's public key
   */
  get walletAddress() {
    return this.wallet?.publicKey || null;
  }

  /**
   * Update the wallet (e.g., when user connects Phantom)
   */
  setWallet(wallet) {
    this.wallet = wallet;
    if (wallet) {
      const provider = new AnchorProvider(this.connection, wallet, {
        commitment: 'confirmed',
      });
      this.program = new Program(IDL, provider);
    }
  }

  // ─── Queue Instructions ──────────────────────

  /**
   * Create a new job queue
   * @param {string} name - Queue name (max 32 chars)
   * @param {number} maxWorkers - Maximum worker count
   * @param {number} maxRetries - Default max retries per job
   * @param {number} defaultPriority - 0=Low, 1=Medium, 2=High
   * @param {number} jobTtl - Job TTL in seconds
   * @returns {Promise<{tx: string, queuePDA: PublicKey}>}
   */
  async createQueue(name, maxWorkers = 10, maxRetries = 3, defaultPriority = 1, jobTtl = 3600) {
    if (!this.program) throw new Error('Wallet not connected');
    
    const authority = this.wallet.publicKey;
    const queuePDA = getQueuePDA(authority, name);

    const tx = await this.program.methods
      .createQueue(name, maxWorkers, maxRetries, defaultPriority, new BN(jobTtl))
      .accounts({
        authority,
        queueConfig: queuePDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { tx, queuePDA };
  }

  /**
   * Pause or resume a queue
   * @param {PublicKey} queuePDA - Queue config PDA
   * @param {boolean} paused - true to pause, false to resume
   * @returns {Promise<string>} Transaction signature
   */
  async pauseQueue(queuePDA, paused) {
    if (!this.program) throw new Error('Wallet not connected');

    const tx = await this.program.methods
      .pauseQueue(paused)
      .accounts({
        authority: this.wallet.publicKey,
        queueConfig: queuePDA,
      })
      .rpc();

    return tx;
  }

  // ─── Job Instructions ────────────────────────

  /**
   * Submit a new job to a queue
   * @param {PublicKey} queuePDA - Queue config PDA
   * @param {Uint8Array|string} payload - Job payload (max 512 bytes)
   * @param {number} priority - 0=Low, 1=Medium, 2=High
   * @returns {Promise<{tx: string, jobPDA: PublicKey, jobId: number}>}
   */
  async submitJob(queuePDA, payload, priority = 1) {
    if (!this.program) throw new Error('Wallet not connected');

    const queue = await this.program.account.queueConfig.fetch(queuePDA);
    const jobId = queue.totalJobs.toNumber();
    const jobPDA = getJobPDA(queuePDA, jobId);
    
    const payloadBytes = typeof payload === 'string' 
      ? new TextEncoder().encode(payload) 
      : payload;

    const tx = await this.program.methods
      .submitJob(Buffer.from(payloadBytes), priority)
      .accounts({
        creator: this.wallet.publicKey,
        queueConfig: queuePDA,
        jobAccount: jobPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { tx, jobPDA, jobId };
  }

  /**
   * Claim a pending job as a worker
   * @param {PublicKey} queuePDA - Queue config PDA
   * @param {PublicKey} jobPDA - Job account PDA
   * @returns {Promise<string>} Transaction signature
   */
  async claimJob(queuePDA, jobPDA) {
    if (!this.program) throw new Error('Wallet not connected');

    const workerPDA = getWorkerPDA(queuePDA, this.wallet.publicKey);

    const tx = await this.program.methods
      .claimJob()
      .accounts({
        workerAuthority: this.wallet.publicKey,
        workerAccount: workerPDA,
        queueConfig: queuePDA,
        jobAccount: jobPDA,
      })
      .rpc();

    return tx;
  }

  /**
   * Mark a job as completed
   * @param {PublicKey} queuePDA - Queue config PDA
   * @param {PublicKey} jobPDA - Job account PDA
   * @param {Uint8Array|string} result - Result data (max 256 bytes)
   * @returns {Promise<string>} Transaction signature
   */
  async completeJob(queuePDA, jobPDA, result = new Uint8Array()) {
    if (!this.program) throw new Error('Wallet not connected');

    const workerPDA = getWorkerPDA(queuePDA, this.wallet.publicKey);
    const resultBytes = typeof result === 'string'
      ? new TextEncoder().encode(result)
      : result;

    const tx = await this.program.methods
      .completeJob(Buffer.from(resultBytes))
      .accounts({
        workerAuthority: this.wallet.publicKey,
        workerAccount: workerPDA,
        queueConfig: queuePDA,
        jobAccount: jobPDA,
      })
      .rpc();

    return tx;
  }

  /**
   * Mark a job as failed
   * @param {PublicKey} queuePDA - Queue config PDA
   * @param {PublicKey} jobPDA - Job account PDA
   * @param {string} errorMessage - Error description (max 128 chars)
   * @returns {Promise<string>} Transaction signature
   */
  async failJob(queuePDA, jobPDA, errorMessage) {
    if (!this.program) throw new Error('Wallet not connected');

    const workerPDA = getWorkerPDA(queuePDA, this.wallet.publicKey);

    const tx = await this.program.methods
      .failJob(errorMessage)
      .accounts({
        workerAuthority: this.wallet.publicKey,
        workerAccount: workerPDA,
        queueConfig: queuePDA,
        jobAccount: jobPDA,
      })
      .rpc();

    return tx;
  }

  /**
   * Retry a failed job
   * @param {PublicKey} queuePDA - Queue config PDA
   * @param {PublicKey} jobPDA - Job account PDA
   * @returns {Promise<string>} Transaction signature
   */
  async retryJob(queuePDA, jobPDA) {
    if (!this.program) throw new Error('Wallet not connected');

    const tx = await this.program.methods
      .retryJob()
      .accounts({
        authority: this.wallet.publicKey,
        queueConfig: queuePDA,
        jobAccount: jobPDA,
      })
      .rpc();

    return tx;
  }

  // ─── Worker Instructions ─────────────────────

  /**
   * Register a worker for a queue
   * @param {PublicKey} queuePDA - Queue config PDA
   * @param {string} workerId - Worker identifier (max 32 chars)
   * @returns {Promise<{tx: string, workerPDA: PublicKey}>}
   */
  async registerWorker(queuePDA, workerId) {
    if (!this.program) throw new Error('Wallet not connected');

    const workerPDA = getWorkerPDA(queuePDA, this.wallet.publicKey);

    const tx = await this.program.methods
      .registerWorker(workerId)
      .accounts({
        authority: this.wallet.publicKey,
        workerAccount: workerPDA,
        queueConfig: queuePDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { tx, workerPDA };
  }

  /**
   * Deregister a worker from a queue
   * @param {PublicKey} queuePDA - Queue config PDA
   * @returns {Promise<string>} Transaction signature
   */
  async deregisterWorker(queuePDA) {
    if (!this.program) throw new Error('Wallet not connected');

    const workerPDA = getWorkerPDA(queuePDA, this.wallet.publicKey);

    const tx = await this.program.methods
      .deregisterWorker()
      .accounts({
        authority: this.wallet.publicKey,
        workerAccount: workerPDA,
        queueConfig: queuePDA,
      })
      .rpc();

    return tx;
  }

  // ─── Account Fetchers ────────────────────────

  /**
   * Fetch a queue config by PDA
   * @param {PublicKey} queuePDA
   * @returns {Promise<Object>} Parsed queue data
   */
  async fetchQueue(queuePDA) {
    const raw = await this.program.account.queueConfig.fetch(queuePDA);
    return this._formatQueue(raw, queuePDA);
  }

  /**
   * Fetch all queues owned by a specific authority
   * @param {PublicKey} authority
   * @returns {Promise<Object[]>}
   */
  async fetchQueuesByAuthority(authority) {
    const accounts = await this.program.account.queueConfig.all([
      { memcmp: { offset: 8, bytes: authority.toBase58() } },
    ]);
    return accounts.map(a => this._formatQueue(a.account, a.publicKey));
  }

  /**
   * Fetch all queues on the program
   * @returns {Promise<Object[]>}
   */
  async fetchAllQueues() {
    const accounts = await this.program.account.queueConfig.all();
    return accounts.map(a => this._formatQueue(a.account, a.publicKey));
  }

  /**
   * Fetch a job by PDA
   * @param {PublicKey} jobPDA
   * @returns {Promise<Object>} Parsed job data
   */
  async fetchJob(jobPDA) {
    const raw = await this.program.account.jobAccount.fetch(jobPDA);
    return this._formatJob(raw, jobPDA);
  }

  /**
   * Fetch all jobs for a specific queue
   * @param {PublicKey} queuePDA
   * @returns {Promise<Object[]>}
   */
  async fetchJobsByQueue(queuePDA) {
    const accounts = await this.program.account.jobAccount.all([
      { memcmp: { offset: 8, bytes: queuePDA.toBase58() } },
    ]);
    return accounts.map(a => this._formatJob(a.account, a.publicKey));
  }

  /**
   * Fetch a worker by PDA
   * @param {PublicKey} workerPDA
   * @returns {Promise<Object>} Parsed worker data
   */
  async fetchWorker(workerPDA) {
    const raw = await this.program.account.workerAccount.fetch(workerPDA);
    return this._formatWorker(raw, workerPDA);
  }

  /**
   * Fetch all workers for a specific queue
   * @param {PublicKey} queuePDA
   * @returns {Promise<Object[]>}
   */
  async fetchWorkersByQueue(queuePDA) {
    const accounts = await this.program.account.workerAccount.all([
      { memcmp: { offset: 8 + 32, bytes: queuePDA.toBase58() } },
    ]);
    return accounts.map(a => this._formatWorker(a.account, a.publicKey));
  }

  // ─── Real-time Subscriptions (WebSocket) ─────

  /**
   * Subscribe to changes on a queue account
   * @param {PublicKey} queuePDA
   * @param {Function} callback - Called with updated queue data
   * @returns {number} Subscription ID
   */
  subscribeToQueue(queuePDA, callback) {
    const subId = this.connection.onAccountChange(
      queuePDA,
      async (accountInfo) => {
        try {
          const decoded = this.program.coder.accounts.decode('QueueConfig', accountInfo.data);
          callback(this._formatQueue(decoded, queuePDA));
        } catch (e) {
          console.error('Failed to decode queue update:', e);
        }
      },
      'confirmed'
    );
    this._listeners.set(`queue-${queuePDA.toString()}`, subId);
    return subId;
  }

  /**
   * Subscribe to changes on a job account
   * @param {PublicKey} jobPDA
   * @param {Function} callback
   * @returns {number} Subscription ID
   */
  subscribeToJob(jobPDA, callback) {
    const subId = this.connection.onAccountChange(
      jobPDA,
      async (accountInfo) => {
        try {
          const decoded = this.program.coder.accounts.decode('JobAccount', accountInfo.data);
          callback(this._formatJob(decoded, jobPDA));
        } catch (e) {
          console.error('Failed to decode job update:', e);
        }
      },
      'confirmed'
    );
    this._listeners.set(`job-${jobPDA.toString()}`, subId);
    return subId;
  }

  /**
   * Unsubscribe from all subscriptions
   */
  async unsubscribeAll() {
    for (const [key, subId] of this._listeners) {
      await this.connection.removeAccountChangeListener(subId);
    }
    this._listeners.clear();
  }

  // ─── Formatting Helpers ──────────────────────

  _formatQueue(raw, pubkey) {
    return {
      publicKey: pubkey.toString(),
      authority: raw.authority.toString(),
      name: raw.name,
      maxWorkers: raw.maxWorkers,
      maxRetries: raw.maxRetries,
      defaultPriority: PRIORITY[raw.defaultPriority?.low ? 0 : raw.defaultPriority?.medium ? 1 : 2] || 'Medium',
      jobTtl: raw.jobTtl?.toNumber?.() || raw.jobTtl,
      isPaused: raw.isPaused,
      totalJobs: raw.totalJobs?.toNumber?.() || 0,
      completedJobs: raw.completedJobs?.toNumber?.() || 0,
      failedJobs: raw.failedJobs?.toNumber?.() || 0,
      pendingJobs: raw.pendingJobs?.toNumber?.() || 0,
      processingJobs: raw.processingJobs?.toNumber?.() || 0,
      activeWorkers: raw.activeWorkers || 0,
      createdAt: raw.createdAt?.toNumber?.() || 0,
      status: raw.isPaused ? 'paused' : 'active',
      successRate: raw.totalJobs?.toNumber?.() > 0 
        ? ((raw.completedJobs?.toNumber?.() / raw.totalJobs?.toNumber?.()) * 100).toFixed(1)
        : '0.0',
    };
  }

  _formatJob(raw, pubkey) {
    const statusMap = { pending: 'Pending', processing: 'Processing', completed: 'Completed', failed: 'Failed', expired: 'Expired' };
    const priorityMap = { low: 'Low', medium: 'Medium', high: 'High' };
    
    const statusKey = Object.keys(raw.status || {})[0] || 'pending';
    const priorityKey = Object.keys(raw.priority || {})[0] || 'medium';

    return {
      publicKey: pubkey.toString(),
      queue: raw.queue.toString(),
      creator: raw.creator.toString(),
      worker: raw.worker ? raw.worker.toString() : null,
      jobId: raw.jobId?.toNumber?.() || 0,
      payload: raw.payload ? new TextDecoder().decode(new Uint8Array(raw.payload)) : '',
      status: statusMap[statusKey] || statusKey,
      priority: priorityMap[priorityKey] || priorityKey,
      attempts: raw.attempts,
      maxRetries: raw.maxRetries,
      result: raw.result ? new TextDecoder().decode(new Uint8Array(raw.result)) : null,
      errorMessage: raw.errorMessage || null,
      createdAt: raw.createdAt?.toNumber?.() || 0,
      claimedAt: raw.claimedAt?.toNumber?.() || null,
      completedAt: raw.completedAt?.toNumber?.() || null,
      expiresAt: raw.expiresAt?.toNumber?.() || 0,
    };
  }

  _formatWorker(raw, pubkey) {
    const statusKey = Object.keys(raw.status || {})[0] || 'online';
    
    return {
      publicKey: pubkey.toString(),
      authority: raw.authority.toString(),
      queue: raw.queue.toString(),
      workerId: raw.workerId,
      status: statusKey.charAt(0).toUpperCase() + statusKey.slice(1),
      jobsCompleted: raw.jobsCompleted?.toNumber?.() || 0,
      jobsFailed: raw.jobsFailed?.toNumber?.() || 0,
      lastHeartbeat: raw.lastHeartbeat?.toNumber?.() || 0,
      registeredAt: raw.registeredAt?.toNumber?.() || 0,
    };
  }
}

// ═══════════════════════════════════════════════
//  WALLET ADAPTER HELPER
// ═══════════════════════════════════════════════

/**
 * Connect to Phantom wallet
 * @returns {Promise<{wallet: Object, publicKey: PublicKey}>}
 */
export async function connectPhantomWallet() {
  const { solana } = window;
  
  if (!solana?.isPhantom) {
    window.open('https://phantom.app/', '_blank');
    throw new Error('Phantom wallet not found. Please install it.');
  }

  const response = await solana.connect();
  
  return {
    wallet: {
      publicKey: response.publicKey,
      signTransaction: (tx) => solana.signTransaction(tx),
      signAllTransactions: (txs) => solana.signAllTransactions(txs),
    },
    publicKey: response.publicKey,
  };
}

/**
 * Disconnect from Phantom wallet
 */
export async function disconnectPhantomWallet() {
  const { solana } = window;
  if (solana?.isPhantom) {
    await solana.disconnect();
  }
}

/**
 * Create a SolQueueClient connected to Phantom
 * @param {string} cluster - 'devnet' | 'mainnet-beta'
 * @returns {Promise<SolQueueClient>}
 */
export async function createConnectedClient(cluster = 'devnet') {
  const rpc = cluster === 'devnet' ? DEVNET_RPC : 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpc, 'confirmed');
  const { wallet } = await connectPhantomWallet();
  return new SolQueueClient(connection, wallet);
}

// ═══════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════════

/**
 * Format a Unix timestamp to human-readable relative time
 */
export function timeAgo(timestamp) {
  if (!timestamp) return 'N/A';
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Get a Solscan explorer link for a transaction
 */
export function getSolscanTxLink(signature, cluster = 'devnet') {
  return `https://solscan.io/tx/${signature}?cluster=${cluster}`;
}

/**
 * Get a Solscan explorer link for an account
 */
export function getSolscanAccountLink(address, cluster = 'devnet') {
  return `https://solscan.io/account/${address}?cluster=${cluster}`;
}

/**
 * Shorten a public key for display
 */
export function shortenAddress(address, chars = 4) {
  const str = typeof address === 'string' ? address : address.toString();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}
