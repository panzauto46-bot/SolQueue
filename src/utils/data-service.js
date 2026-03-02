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
    dataListeners.forEach(cb => cb({ mode: dataMode, data: cachedData }));
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
    dataMode = mode;
    if (mode === 'live') {
        startLiveRefresh();
    } else {
        stopLiveRefresh();
        loadMockData();
    }
}

// ═══════════════════════════════════════════════
//  MOCK DATA PROVIDER
// ═══════════════════════════════════════════════

function loadMockData() {
    cachedData = {
        queues: MOCK_QUEUES,
        jobs: MOCK_JOBS,
        workers: MOCK_WORKERS,
        stats: MOCK_STATS,
        activities: MOCK_ACTIVITIES,
        chartData: MOCK_CHART_DATA,
    };
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
                workers: q.activeWorkers || q.maxWorkers,
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

        notifyDataListeners();
    } catch (error) {
        console.error('Failed to fetch live data:', error);
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

    // Watch for wallet changes
    onWalletChange((state) => {
        if (state.connected && dataMode === 'mock') {
            // Auto-switch to live when wallet connects (if program deployed)
            // For now, keep mock until user explicitly switches
            console.log('Wallet connected — switch to live data via Settings');
        }
        if (!state.connected && dataMode === 'live') {
            setDataMode('mock');
        }
    });
}

/**
 * Get current cached data
 */
export function getData() {
    return { mode: dataMode, data: cachedData };
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

export { timeAgo, getSolscanTxLink, shortenAddress };
