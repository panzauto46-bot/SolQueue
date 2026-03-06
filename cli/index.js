#!/usr/bin/env node

/**
 * SolQueue CLI — Command-line interface for the SolQueue on-chain program
 * 
 * Usage:
 *   solqueue init <name>           Create a new queue
 *   solqueue submit <queue> <data> Submit a job
 *   solqueue status <queue>        View queue status
 *   solqueue jobs <queue>          List jobs in a queue
 *   solqueue workers <queue>       List workers for a queue
 *   solqueue worker start <queue>  Register as a worker
 *   solqueue worker stop <queue>   Deregister from a queue
 *   solqueue stats                 View global statistics
 *   solqueue config                View/set configuration
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════

const PROGRAM_ID = new PublicKey('GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64');
const DEVNET_RPC = 'https://api.devnet.solana.com';
const SEEDS = { QUEUE: 'queue', JOB: 'job', WORKER: 'worker' };

// Pretty colors for terminal
const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    purple: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};

// ═══════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════

function log(msg, color = C.white) {
    console.log(`${color}${msg}${C.reset}`);
}

function banner() {
    console.log(`
${C.purple}${C.bold}  ◈ SolQueue CLI${C.reset}
${C.dim}  On-Chain Job Queue System for Solana${C.reset}
${C.dim}  ────────────────────────────────────${C.reset}
`);
}

function success(msg) { log(`  ✓ ${msg}`, C.green); }
function error(msg) { log(`  ✗ ${msg}`, C.red); }
function info(msg) { log(`  ℹ ${msg}`, C.cyan); }
function warn(msg) { log(`  ⚠ ${msg}`, C.yellow); }

function table(headers, rows) {
    const colWidths = headers.map((h, i) =>
        Math.max(h.length, ...rows.map(r => String(r[i] || '').length)) + 2
    );

    const line = colWidths.map(w => '─'.repeat(w)).join('┬');
    const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join('│');

    console.log(`  ${C.dim}┌${line}┐${C.reset}`);
    console.log(`  ${C.bold}│${headerLine}│${C.reset}`);
    console.log(`  ${C.dim}├${colWidths.map(w => '─'.repeat(w)).join('┼')}┤${C.reset}`);

    rows.forEach(row => {
        const rowLine = row.map((cell, i) => {
            const str = String(cell || '');
            // Color specific columns
            let colored = str;
            if (headers[i] === 'Status') {
                if (str === 'Active' || str === 'Completed' || str === 'Online') colored = `${C.green}${str}${C.reset}`;
                else if (str === 'Paused' || str === 'Pending') colored = `${C.yellow}${str}${C.reset}`;
                else if (str === 'Failed' || str === 'Offline') colored = `${C.red}${str}${C.reset}`;
                else if (str === 'Processing') colored = `${C.blue}${str}${C.reset}`;
            }
            return colored.padEnd(colWidths[i] + (colored.length - str.length));
        }).join('│');
        console.log(`  │${rowLine}│`);
    });

    console.log(`  ${C.dim}└${colWidths.map(w => '─'.repeat(w)).join('┴')}┘${C.reset}`);
}

function shortAddr(addr) {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function loadKeypair() {
    const keypairPath = process.env.SOLANA_KEYPAIR ||
        path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'solana', 'id.json');

    if (!fs.existsSync(keypairPath)) {
        error(`Keypair not found at ${keypairPath}`);
        info('Set SOLANA_KEYPAIR env variable or run: solana-keygen new');
        process.exit(1);
    }

    const secret = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
    return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function getQueuePDA(authority, name) {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.QUEUE), authority.toBuffer(), Buffer.from(name)],
        PROGRAM_ID
    );
    return pda;
}

function getJobPDA(queuePDA, jobId) {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.JOB), queuePDA.toBuffer(), new BN(jobId).toArrayLike(Buffer, 'le', 8)],
        PROGRAM_ID
    );
    return pda;
}

function getWorkerPDA(queuePDA, authority) {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.WORKER), queuePDA.toBuffer(), authority.toBuffer()],
        PROGRAM_ID
    );
    return pda;
}

async function getProgram() {
    const keypair = loadKeypair();
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    const wallet = new Wallet(keypair);
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

    const idlPath = path.join(__dirname, '..', 'target', 'idl', 'solqueue.json');
    if (!fs.existsSync(idlPath)) {
        error('IDL not found. Run anchor build first.');
        process.exit(1);
    }
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    const program = new Program(idl, provider);

    return { program, keypair, connection, provider };
}

// ═══════════════════════════════════════════════
//  COMMANDS
// ═══════════════════════════════════════════════

async function cmdInit(name, opts = {}) {
    banner();
    info(`Creating queue: ${C.bold}${name}${C.reset}`);

    const { program, keypair } = await getProgram();
    const queuePDA = getQueuePDA(keypair.publicKey, name);

    const maxWorkers = opts.maxWorkers || 10;
    const maxRetries = opts.maxRetries || 3;
    const priority = opts.priority || 1;
    const ttl = opts.ttl || 3600;

    const tx = await program.methods
        .createQueue(name, maxWorkers, maxRetries, priority, new BN(ttl))
        .accounts({
            authority: keypair.publicKey,
            queueConfig: queuePDA,
        })
        .rpc();

    success(`Queue created!`);
    info(`Queue PDA: ${C.purple}${queuePDA.toString()}${C.reset}`);
    info(`Transaction: ${C.blue}${tx}${C.reset}`);
    info(`Explorer: https://solscan.io/tx/${tx}?cluster=devnet`);
}

async function cmdSubmit(queueName, jsonPayload) {
    banner();
    const { program, keypair } = await getProgram();
    const queuePDA = getQueuePDA(keypair.publicKey, queueName);

    info(`Submitting job to: ${C.bold}${queueName}${C.reset}`);

    const queue = await program.account.queueConfig.fetch(queuePDA);
    const jobId = queue.totalJobs.toNumber();
    const jobPDA = getJobPDA(queuePDA, jobId);
    const payload = Buffer.from(jsonPayload || '{}');

    const tx = await program.methods
        .submitJob(payload, 1) // Medium priority
        .accounts({
            creator: keypair.publicKey,
            queueConfig: queuePDA,
            jobAccount: jobPDA,
        })
        .rpc();

    success(`Job submitted! ID: ${C.bold}${jobId}${C.reset}`);
    info(`Job PDA: ${C.purple}${jobPDA.toString()}${C.reset}`);
    info(`Transaction: ${C.blue}${tx}${C.reset}`);
}

async function cmdStatus(queueName) {
    banner();
    const { program, keypair } = await getProgram();
    const queuePDA = getQueuePDA(keypair.publicKey, queueName);

    const queue = await program.account.queueConfig.fetch(queuePDA);

    log(`\n  ${C.bold}Queue: ${C.purple}${queue.name}${C.reset}`);
    log(`  ${C.dim}PDA: ${queuePDA.toString()}${C.reset}\n`);

    table(
        ['Metric', 'Value'],
        [
            ['Status', queue.isPaused ? 'Paused' : 'Active'],
            ['Total Jobs', queue.totalJobs.toString()],
            ['Completed', queue.completedJobs.toString()],
            ['Failed', queue.failedJobs.toString()],
            ['Pending', queue.pendingJobs.toString()],
            ['Processing', queue.processingJobs.toString()],
            ['Max Workers', queue.maxWorkers.toString()],
            ['Max Retries', queue.maxRetries.toString()],
            ['Job TTL', `${queue.jobTtl.toString()}s`],
            ['Authority', shortAddr(queue.authority.toString())],
        ]
    );
}

async function cmdJobs(queueName) {
    banner();
    const { program, keypair } = await getProgram();
    const queuePDA = getQueuePDA(keypair.publicKey, queueName);

    info(`Fetching jobs for: ${C.bold}${queueName}${C.reset}\n`);

    const accounts = await program.account.jobAccount.all([
        { memcmp: { offset: 8, bytes: queuePDA.toBase58() } },
    ]);

    if (accounts.length === 0) {
        warn('No jobs found.');
        return;
    }

    const rows = accounts.map(a => {
        const j = a.account;
        const statusKey = Object.keys(j.status || {})[0] || 'pending';
        return [
            j.jobId.toString(),
            statusKey.charAt(0).toUpperCase() + statusKey.slice(1),
            Object.keys(j.priority || {})[0] || 'medium',
            j.attempts.toString(),
            j.worker ? shortAddr(j.worker.toString()) : '—',
            shortAddr(a.publicKey.toString()),
        ];
    });

    table(['ID', 'Status', 'Priority', 'Attempts', 'Worker', 'PDA'], rows);
    log(`\n  ${C.dim}Total: ${accounts.length} jobs${C.reset}`);
}

async function cmdWorkers(queueName) {
    banner();
    const { program, keypair } = await getProgram();
    const queuePDA = getQueuePDA(keypair.publicKey, queueName);

    info(`Fetching workers for: ${C.bold}${queueName}${C.reset}\n`);

    const accounts = await program.account.workerAccount.all([
        { memcmp: { offset: 8 + 32, bytes: queuePDA.toBase58() } },
    ]);

    if (accounts.length === 0) {
        warn('No workers registered.');
        return;
    }

    const rows = accounts.map(a => {
        const w = a.account;
        const statusKey = Object.keys(w.status || {})[0] || 'online';
        return [
            w.workerId,
            statusKey.charAt(0).toUpperCase() + statusKey.slice(1),
            w.jobsCompleted.toString(),
            w.jobsFailed.toString(),
            shortAddr(w.authority.toString()),
        ];
    });

    table(['Worker ID', 'Status', 'Completed', 'Failed', 'Authority'], rows);
}

async function cmdWorkerStart(queueName, workerId) {
    banner();
    const { program, keypair } = await getProgram();
    const queuePDA = getQueuePDA(keypair.publicKey, queueName);
    const workerPDA = getWorkerPDA(queuePDA, keypair.publicKey);

    info(`Registering worker for: ${C.bold}${queueName}${C.reset}`);

    const tx = await program.methods
        .registerWorker(workerId || `worker-${Date.now()}`)
        .accounts({
            authority: keypair.publicKey,
            workerAccount: workerPDA,
            queueConfig: queuePDA,
        })
        .rpc();

    success(`Worker registered!`);
    info(`Worker PDA: ${C.purple}${workerPDA.toString()}${C.reset}`);
    info(`Transaction: ${C.blue}${tx}${C.reset}`);
}

async function cmdWorkerStop(queueName) {
    banner();
    const { program, keypair } = await getProgram();
    const queuePDA = getQueuePDA(keypair.publicKey, queueName);
    const workerPDA = getWorkerPDA(queuePDA, keypair.publicKey);

    const tx = await program.methods
        .deregisterWorker()
        .accounts({
            authority: keypair.publicKey,
            workerAccount: workerPDA,
            queueConfig: queuePDA,
        })
        .rpc();

    success(`Worker deregistered.`);
    info(`Transaction: ${C.blue}${tx}${C.reset}`);
}

async function cmdStats() {
    banner();
    const { program } = await getProgram();

    info('Fetching global statistics...\n');

    const queues = await program.account.queueConfig.all();

    let totalJobs = 0, completed = 0, failed = 0, pending = 0;
    queues.forEach(q => {
        totalJobs += q.account.totalJobs.toNumber();
        completed += q.account.completedJobs.toNumber();
        failed += q.account.failedJobs.toNumber();
        pending += q.account.pendingJobs.toNumber();
    });

    const rate = totalJobs > 0 ? ((completed / totalJobs) * 100).toFixed(1) : '0.0';

    table(
        ['Metric', 'Value'],
        [
            ['Total Queues', queues.length.toString()],
            ['Active Queues', queues.filter(q => !q.account.isPaused).length.toString()],
            ['Total Jobs', totalJobs.toString()],
            ['Completed', completed.toString()],
            ['Failed', failed.toString()],
            ['Pending', pending.toString()],
            ['Success Rate', `${rate}%`],
        ]
    );
}

async function cmdConfig() {
    banner();
    table(
        ['Setting', 'Value'],
        [
            ['Program ID', PROGRAM_ID.toString()],
            ['Network', 'Devnet'],
            ['RPC Endpoint', DEVNET_RPC],
            ['Keypair', process.env.SOLANA_KEYPAIR || '~/.config/solana/id.json'],
        ]
    );
}

// ═══════════════════════════════════════════════
//  CLI ENTRY POINT
// ═══════════════════════════════════════════════

async function main() {
    const args = process.argv.slice(2);
    const cmd = args[0];

    try {
        switch (cmd) {
            case 'init':
                if (!args[1]) { error('Usage: solqueue init <name>'); process.exit(1); }
                await cmdInit(args[1]);
                break;
            case 'submit':
                if (!args[1]) { error('Usage: solqueue submit <queue> [payload]'); process.exit(1); }
                await cmdSubmit(args[1], args[2]);
                break;
            case 'status':
                if (!args[1]) { error('Usage: solqueue status <queue>'); process.exit(1); }
                await cmdStatus(args[1]);
                break;
            case 'jobs':
                if (!args[1]) { error('Usage: solqueue jobs <queue>'); process.exit(1); }
                await cmdJobs(args[1]);
                break;
            case 'workers':
                if (!args[1]) { error('Usage: solqueue workers <queue>'); process.exit(1); }
                await cmdWorkers(args[1]);
                break;
            case 'worker':
                if (args[1] === 'start') await cmdWorkerStart(args[2], args[3]);
                else if (args[1] === 'stop') await cmdWorkerStop(args[2]);
                else { error('Usage: solqueue worker start|stop <queue>'); }
                break;
            case 'stats':
                await cmdStats();
                break;
            case 'config':
                await cmdConfig();
                break;
            default:
                banner();
                log('  Usage: solqueue <command> [options]\n');
                table(
                    ['Command', 'Description'],
                    [
                        ['init <name>', 'Create a new queue'],
                        ['submit <queue> [payload]', 'Submit a job to a queue'],
                        ['status <queue>', 'View queue status and metrics'],
                        ['jobs <queue>', 'List all jobs in a queue'],
                        ['workers <queue>', 'List workers for a queue'],
                        ['worker start <queue>', 'Register as a worker'],
                        ['worker stop <queue>', 'Deregister from a queue'],
                        ['stats', 'View global statistics'],
                        ['config', 'View configuration'],
                    ]
                );
                break;
        }
    } catch (err) {
        error(err.message);
        if (process.env.DEBUG) console.error(err);
        process.exit(1);
    }
}

main();
