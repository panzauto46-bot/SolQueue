/**
 * SolQueue Data Service — Bridge between on-chain SDK and Dashboard UI
 * 
 * Provides a unified data layer that works with both:
 * - Live on-chain data (when wallet is connected + program is deployed)
 * - Mock data (for demo/preview mode)
 */

import { getWalletState, getClient, onWalletChange } from './wallet-adapter.js';
import { MOCK_STATS, MOCK_QUEUES, MOCK_JOBS, MOCK_WORKERS, MOCK_ACTIVITIES, MOCK_CHART_DATA } from './mock-data.js';
import { timeAgo, getSolscanTxLink, shortenAddress } from '../sdk/index.js';

// ═══════════════════════════════════════════════
//  DATA SERVICE STATE
// ═══════════════════════════════════════════════

let dataMode = 'mock'; // 'mock' | 'live'
let cachedData = {
    queues: [],
    jobs: [],
    workers: [],
    stats: {},
    activities: [],
};
let refreshInterval = null;
let dataListeners = [];
let dataMeta = {
    lastUpdated: null,
    lastError: null,
    source: 'mock',
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

/**
 * Subscribe to data updates
 */
export function onDataUpdate(callback) {
    dataListeners.push(callback);
    return () => {
        dataListeners = dataListeners.filter(l => l !== callback);
    };
}

function notifyDataListeners() {
    dataListeners.forEach(cb => cb({
        mode: dataMode,
        data: cachedData,
        meta: { ...dataMeta },
    }));
}

/**
 * Get current data mode
 */
export function getDataMode() {
    return dataMode;
}

/**
 * Switch between mock and live data
 */
export function setDataMode(mode) {
    if (mode !== 'mock' && mode !== 'live') {
        return { ok: false, reason: 'invalid_mode', mode: dataMode };
    }

    try { localStorage.setItem('solqueue_data_mode', mode); } catch { }

    if (mode === 'live') {
        const ws = getWalletState();
        const client = getClient();
        if (!ws.connected || !client?.isConnected) {
            dataMode = 'mock';
            stopLiveRefresh();
            loadMockData();
            dataMeta.lastError = 'Wallet not connected. Live mode requires active wallet.';
            notifyDataListeners();
            return { ok: false, reason: 'wallet_not_connected', mode: dataMode };
        }
    }

    dataMode = mode;
    if (mode === 'live') {
        startLiveRefresh();
    } else {
        stopLiveRefresh();
        loadMockData();
    }

    return { ok: true, mode: dataMode };
}

// ═══════════════════════════════════════════════
//  MOCK DATA PROVIDER
// ═══════════════════════════════════════════════

function loadMockData() {
    cachedData = {
        queues: clone(MOCK_QUEUES),
        jobs: clone(MOCK_JOBS),
        workers: clone(MOCK_WORKERS),
        stats: clone(MOCK_STATS),
        activities: clone(MOCK_ACTIVITIES),
        chartData: clone(MOCK_CHART_DATA),
    };
    dataMeta.lastUpdated = Date.now();
    dataMeta.lastError = null;
    dataMeta.source = 'mock';
    notifyDataListeners();
}

// ═══════════════════════════════════════════════
//  LIVE DATA PROVIDER
// ═══════════════════════════════════════════════

async function fetchLiveData() {
    const client = getClient();
    if (!client || !client.isConnected) {
        console.warn('No client connected, falling back to mock data');
        setDataMode('mock');
        dataMeta.lastError = 'Wallet disconnected. Switched back to demo mode.';
        notifyDataListeners();
        return;
    }

    try {
        // Fetch all queues
        const queues = await client.fetchAllQueues();

        // Fetch jobs for each queue (limited to first 5 queues for performance)
        let allJobs = [];
        for (const queue of queues.slice(0, 5)) {
            try {
                const jobs = await client.fetchJobsByQueue(
                    new (await import('@solana/web3.js')).PublicKey(queue.publicKey)
                );
                allJobs = allJobs.concat(jobs);
            } catch (e) {
                // Queue might not have jobs yet
            }
        }

        // Fetch workers for each queue
        let allWorkers = [];
        for (const queue of queues.slice(0, 5)) {
            try {
                const workers = await client.fetchWorkersByQueue(
                    new (await import('@solana/web3.js')).PublicKey(queue.publicKey)
                );
                allWorkers = allWorkers.concat(workers);
            } catch (e) {
                // Queue might not have workers yet
            }
        }

        // Compute stats
        const totalJobs = queues.reduce((sum, q) => sum + q.totalJobs, 0);
        const completedJobs = queues.reduce((sum, q) => sum + q.completedJobs, 0);
        const failedJobs = queues.reduce((sum, q) => sum + q.failedJobs, 0);
        const pendingJobs = queues.reduce((sum, q) => sum + q.pendingJobs, 0);
        const onlineWorkers = allWorkers.filter(w => w.status === 'Online').length;

        const stats = {
            totalJobs,
            activeQueues: queues.filter(q => q.status === 'active').length,
            onlineWorkers,
            successRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : '0.0',
            avgProcessingTime: '~0.4s',
            throughput: `${Math.round(completedJobs / Math.max(1, queues.length))}/hr`,
            pendingJobs,
            failedJobs,
        };

        // Format for dashboard
        cachedData = {
            queues: queues.map(q => ({
                id: q.publicKey,
                name: q.name,
                status: q.status,
                pending: q.pendingJobs,
                processing: q.processingJobs,
                completed: q.completedJobs,
                failed: q.failedJobs,
                workers: q.workerCount ?? q.activeWorkers ?? 0,
                maxRetries: q.maxRetries,
                priority: q.defaultPriority,
                createdAt: new Date(q.createdAt * 1000).toISOString(),
                throughput: `${q.completedJobs}/hr`,
                publicKey: q.publicKey,
                authority: q.authority,
            })),
            jobs: allJobs.map(j => ({
                id: shortenAddress(j.publicKey, 6),
                queue: j.queue,
                name: `job-${j.jobId}`,
                status: j.status.toLowerCase(),
                priority: j.priority.toLowerCase(),
                payload: j.payload,
                result: j.result,
                attempts: j.attempts,
                createdAt: timeAgo(j.createdAt),
                processedAt: j.completedAt ? timeAgo(j.completedAt) : null,
                worker: j.worker ? shortenAddress(j.worker) : null,
                publicKey: j.publicKey,
            })),
            workers: allWorkers.map(w => ({
                id: shortenAddress(w.publicKey, 4),
                name: w.workerId,
                status: w.status.toLowerCase(),
                queue: w.queue,
                jobsCompleted: w.jobsCompleted,
                jobsFailed: w.jobsFailed,
                lastHeartbeat: timeAgo(w.lastHeartbeat),
                uptime: timeAgo(w.registeredAt).replace(' ago', ''),
                address: shortenAddress(w.authority),
                publicKey: w.publicKey,
            })),
            stats,
            activities: generateActivities(allJobs),
            chartData: MOCK_CHART_DATA, // Use mock charts until more data accumulates
        };

        dataMeta.lastUpdated = Date.now();
        dataMeta.lastError = null;
        dataMeta.source = 'live';
        notifyDataListeners();
    } catch (error) {
        console.error('Failed to fetch live data:', error);
        dataMeta.lastError = error?.message || 'Failed to sync live data';
        notifyDataListeners();
        // Keep showing last known data
    }
}

function generateActivities(jobs) {
    return jobs
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 10)
        .map(job => {
            const statusMap = {
                Completed: { type: 'completed', icon: '✓', text: `<strong>job-${job.jobId}</strong> completed successfully` },
                Processing: { type: 'claimed', icon: '→', text: `<strong>${job.worker ? shortenAddress(job.worker) : 'Worker'}</strong> claimed <strong>job-${job.jobId}</strong>` },
                Failed: { type: 'failed', icon: '✗', text: `<strong>job-${job.jobId}</strong> failed after ${job.attempts} attempts` },
                Pending: { type: 'created', icon: '+', text: `<strong>job-${job.jobId}</strong> added to queue` },
            };
            const info = statusMap[job.status] || statusMap.Pending;
            return { ...info, time: timeAgo(job.createdAt) };
        });
}

// ═══════════════════════════════════════════════
//  REFRESH CONTROL
// ═══════════════════════════════════════════════

function startLiveRefresh(intervalMs = 10000) {
    stopLiveRefresh();
    fetchLiveData();
    refreshInterval = setInterval(fetchLiveData, intervalMs);
}

function stopLiveRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// ═══════════════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════════════

/**
 * Initialize the data service
 */
export function initDataService() {
    // Load mock data initially
    loadMockData();

    try {
        const preferredMode = localStorage.getItem('solqueue_data_mode');
        if (preferredMode === 'live') {
            setDataMode('live');
        }
    } catch { }

    // Watch for wallet changes
    onWalletChange((state) => {
        if (state.connected && dataMode === 'mock') {
            // Auto-switch to live when wallet connects (if program deployed)
            // For now, keep mock until user explicitly switches
            console.log('Wallet connected — switch to live data via Settings');
        }
        if (!state.connected && dataMode === 'live') {
            setDataMode('mock');
            dataMeta.lastError = 'Wallet disconnected. Switched to demo mode.';
            notifyDataListeners();
        }
    });
}

/**
 * Get current cached data
 */
export function getData() {
    return { mode: dataMode, data: cachedData, meta: { ...dataMeta } };
}

/**
 * Force refresh data
 */
export async function refreshData() {
    if (dataMode === 'live') {
        await fetchLiveData();
    } else {
        loadMockData();
    }
}

/**
 * Create a queue directly in demo mode data.
 */
export function createDemoQueue({
    name,
    priority = 'medium',
    maxRetries = 3,
    maxWorkers = 5,
    ttl = 3600,
    description = '',
}) {
    if (dataMode !== 'mock') {
        return null;
    }

    const queue = {
        id: `demo-queue-${Date.now()}`,
        name,
        status: 'active',
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        workers: 0,
        maxRetries,
        maxWorkers,
        ttl,
        priority,
        throughput: '0/hr',
        description,
    };

    cachedData.queues = [queue, ...(cachedData.queues || [])];
    cachedData.stats = {
        ...(cachedData.stats || {}),
        activeQueues: (cachedData.stats?.activeQueues || 0) + 1,
    };
    cachedData.activities = [
        {
            type: 'created',
            icon: '+',
            text: `<strong>${name}</strong> queue created in demo mode`,
            time: 'just now',
        },
        ...(cachedData.activities || []),
    ].slice(0, 20);

    dataMeta.lastUpdated = Date.now();
    dataMeta.lastError = null;
    dataMeta.source = 'mock';
    notifyDataListeners();

    return queue;
}

/**
 * Submit a job directly in demo mode data.
 */
export function submitDemoJob({
    queueId,
    queueName,
    name,
    priority = 'medium',
    payload = {},
}) {
    if (dataMode !== 'mock') {
        return null;
    }

    const nextIndex = (cachedData.jobs?.length || 0) + 1;
    const jobId = `job-${String(nextIndex).padStart(3, '0')}`;
    const payloadText = typeof payload === 'string' ? payload : JSON.stringify(payload);

    const job = {
        id: jobId,
        queue: queueName,
        name,
        status: 'pending',
        priority,
        payload: payloadText,
        result: '',
        attempts: 0,
        createdAt: 'just now',
        processedAt: null,
        worker: null,
    };

    cachedData.jobs = [job, ...(cachedData.jobs || [])];

    const queue = (cachedData.queues || []).find((q) => String(q.id) === String(queueId) || q.name === queueName);
    if (queue) {
        queue.pending = (queue.pending || 0) + 1;
    }

    cachedData.stats = {
        ...(cachedData.stats || {}),
        totalJobs: (cachedData.stats?.totalJobs || 0) + 1,
        pendingJobs: (cachedData.stats?.pendingJobs || 0) + 1,
    };

    cachedData.activities = [
        {
            type: 'created',
            icon: '+',
            text: `<strong>${name}</strong> added to queue`,
            time: 'just now',
        },
        ...(cachedData.activities || []),
    ].slice(0, 20);

    dataMeta.lastUpdated = Date.now();
    dataMeta.lastError = null;
    dataMeta.source = 'mock';
    notifyDataListeners();

    return job;
}

export { timeAgo, getSolscanTxLink, shortenAddress };
