import { MOCK_QUEUES, MOCK_JOBS, MOCK_WORKERS, MOCK_ACTIVITIES, MOCK_CHART_DATA } from '../utils/mock-data.js';
import { PipelineAnimation, BarChartAnimation, LineChartAnimation } from '../animations/pipeline.js';
import { PublicKey } from '@solana/web3.js';
import { getWalletState, connectWallet, disconnectWallet, showToast, sendWithFeedback, getClient } from '../utils/wallet-adapter.js';
import { getData, getDataMode, setDataMode, onDataUpdate, refreshData, createDemoQueue, submitDemoJob } from '../utils/data-service.js';

let pipelineAnim = null;
let barChartAnim = null;
let lineChartAnim = null;
let dataUpdateUnsubscribe = null;
const DEVNET_PROGRAM_ID = 'GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64';
const QUICK_TX_LINKS = {
  createQueue: 'https://solscan.io/tx/3b4DP3eUeZUrY9wDR4zcXEkin6JSTUEkFsEBDWTpuadg1hXso2BGz18qcHMznyAZFgWXCSqKZdcT3FiStrz5QcNT?cluster=devnet',
  registerWorker: 'https://solscan.io/tx/arPQ9waDUT2iyASnJT2kXiSYWds4KFGgubKiPsYV7DZJ46jdW9YaSkkgmJ4rGAA59DGJyuKvn3jKnSPNDgfGCDq?cluster=devnet',
  submitJob: 'https://solscan.io/tx/3J2bgv51RrG81MA6avdLt3rJ1W2C6VYh8sBu9Pb4ZY5NNqrQZmfVHtVAmxEsiBx6Tx5m2eyNih2Nm5g6jchuu4GP?cluster=devnet',
  claimJob: 'https://solscan.io/tx/3nfpLmxZRRwA8x8uEYaLteqjztuYzN7LAkHbnMXCFHVKgAGSKm8gaedB1uJMxPM3MscEAeg35t722PCr5tcowjd7?cluster=devnet',
  completeJob: 'https://solscan.io/tx/5VLoYaZBzQEtmKU19H4KMeeUCqsTRcbpK2bNVVqT72kG68yFsrPHHuy9JyJ9NxDiYHmL46mRtz48WRT2K4E2Hjth?cluster=devnet',
};

const svgIcon = (paths, cls = 'dash-icon') => `
<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
  ${paths}
</svg>`;

const ICONS = {
  dashboard: svgIcon('<path d="M4 4h6v8H4z"></path><path d="M14 4h6v5h-6z"></path><path d="M14 11h6v9h-6z"></path><path d="M4 14h6v6H4z"></path>'),
  queues: svgIcon('<rect x="5" y="5" width="14" height="14" rx="2"></rect><path d="M8 9h8M8 13h8M8 17h5"></path>'),
  jobs: svgIcon('<path d="M7 3h8l4 4v14H7z"></path><path d="M15 3v4h4"></path><path d="M9 13h6"></path><path d="M9 17h6"></path>'),
  workers: svgIcon('<circle cx="9" cy="9" r="3"></circle><circle cx="16.5" cy="9.5" r="2.5"></circle><path d="M3 20c1.8-3.2 3.9-4.7 6-4.7s4.2 1.5 6 4.7"></path><path d="M13.5 20c.9-2 2.1-3 3.9-3s3 1 3.9 3"></path>'),
  analytics: svgIcon('<path d="M4 20h16"></path><path d="M7 16v-5"></path><path d="M12 16V8"></path><path d="M17 16v-3"></path><path d="m6 10 4-4 3 2 5-5"></path>'),
  plus: svgIcon('<path d="M12 5v14M5 12h14"></path>'),
  send: svgIcon('<path d="M22 2 11 13"></path><path d="M22 2 15 22l-4-9-9-4 20-7z"></path>'),
  settings: svgIcon('<path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"></path><circle cx="12" cy="12" r="3.2"></circle>'),
  menu: svgIcon('<path d="M4 7h16M4 12h16M4 17h16"></path>'),
  search: svgIcon('<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path>'),
  bell: svgIcon('<path d="M6 8a6 6 0 0 1 12 0v6l2 2H4l2-2z"></path><path d="M10 19a2 2 0 0 0 4 0"></path>'),
  flag: svgIcon('<path d="M6 3v18"></path><path d="M6 4h11l-2 4 2 4H6"></path>'),
  file: svgIcon('<path d="M7 3h8l4 4v14H7z"></path><path d="M15 3v4h4"></path>'),
  check: svgIcon('<circle cx="12" cy="12" r="9"></circle><path d="m8.5 12.5 2.3 2.3 4.7-5.1"></path>'),
  bolt: svgIcon('<path d="M13 2 4 14h6l-1 8 9-12h-6z"></path>'),
  users: svgIcon('<circle cx="12" cy="8" r="3"></circle><path d="M5 20c1.8-3.1 4.1-4.5 7-4.5s5.2 1.4 7 4.5"></path>'),
  chart: svgIcon('<path d="M4 20h16"></path><path d="M7 16v-5"></path><path d="M12 16V7"></path><path d="M17 16v-3"></path>'),
  trend: svgIcon('<path d="M4 19h16"></path><path d="m5 14 4-4 3 2 6-6"></path><path d="m15 6h3v3"></path>'),
  timer: svgIcon('<circle cx="12" cy="13" r="8"></circle><path d="M12 13V9"></path><path d="M12 2v3"></path><path d="M9 2h6"></path>'),
  retry: svgIcon('<path d="M21 4v6h-6"></path><path d="M3 20v-6h6"></path><path d="M20 10a8 8 0 0 0-14-3l-3 3"></path><path d="M4 14a8 8 0 0 0 14 3l3-3"></path>'),
  save: svgIcon('<path d="M5 3h12l2 2v16H5z"></path><path d="M8 3v5h8V3"></path><path d="M8 14h8"></path>'),
  link: svgIcon('<path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13"></path><path d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 0 1-7-7L7 11"></path>'),
  inbox: svgIcon('<path d="M3 6h18v12H3z"></path><path d="M3 13h5l2 3h4l2-3h5"></path>'),
};

function getSidebarCollapsedPreference() {
  try {
    return localStorage.getItem('solqueue_sidebar_collapsed') === '1';
  } catch {
    return false;
  }
}

function setSidebarCollapsedPreference(collapsed) {
  try {
    localStorage.setItem('solqueue_sidebar_collapsed', collapsed ? '1' : '0');
  } catch { }
}

function formatSyncTime(timestamp) {
  if (!timestamp) return 'not synced yet';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function computeStats(queues, jobs, workers) {
  const completedFromQueues = queues.reduce((sum, q) => sum + (Number(q.completed) || 0), 0);
  const totalFromQueues = queues.reduce((sum, q) => {
    const pending = Number(q.pending) || 0;
    const processing = Number(q.processing) || 0;
    const completed = Number(q.completed) || 0;
    const failed = Number(q.failed) || 0;
    return sum + pending + processing + completed + failed;
  }, 0);

  const totalJobs = totalFromQueues || jobs.length || 0;
  const completedJobs = completedFromQueues || jobs.filter(j => j.status === 'completed').length;
  const pendingJobs = jobs.filter(j => j.status === 'pending').length || queues.reduce((sum, q) => sum + (Number(q.pending) || 0), 0);
  const failedJobs = jobs.filter(j => j.status === 'failed').length || queues.reduce((sum, q) => sum + (Number(q.failed) || 0), 0);
  const onlineWorkers = workers.filter(w => w.status === 'online').length;
  const successRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : '0.0';

  return {
    totalJobs,
    activeQueues: queues.filter(q => q.status === 'active').length,
    onlineWorkers,
    successRate,
    avgProcessingTime: '1.2s',
    throughput: `${Math.max(1, Math.round(completedJobs / Math.max(1, queues.length)))} /hr`,
    pendingJobs,
    failedJobs,
  };
}

function getDashboardDataSnapshot() {
  const snapshot = getData();
  const mode = snapshot.mode || getDataMode();
  const liveMode = mode === 'live';
  const payload = snapshot.data || {};

  const queues = liveMode
    ? (payload.queues || [])
    : ((payload.queues && payload.queues.length > 0) ? payload.queues : MOCK_QUEUES);

  const jobs = liveMode
    ? (payload.jobs || [])
    : ((payload.jobs && payload.jobs.length > 0) ? payload.jobs : MOCK_JOBS);

  const workers = liveMode
    ? (payload.workers || [])
    : ((payload.workers && payload.workers.length > 0) ? payload.workers : MOCK_WORKERS);

  const activities = liveMode
    ? (payload.activities || [])
    : ((payload.activities && payload.activities.length > 0) ? payload.activities : MOCK_ACTIVITIES);

  const chartData = (payload.chartData && (payload.chartData.throughput || payload.chartData.lineData))
    ? payload.chartData
    : MOCK_CHART_DATA;

  const stats = payload.stats && Object.keys(payload.stats).length > 0
    ? payload.stats
    : computeStats(queues, jobs, workers);

  return {
    mode,
    liveMode,
    meta: snapshot.meta || {},
    queues,
    jobs,
    workers,
    activities,
    chartData,
    stats,
  };
}

export function renderDashboard(activePage = 'overview') {
  const collapsedClass = getSidebarCollapsedPreference() ? 'sidebar-collapsed' : '';
  return `
    <div class="app-layout ${collapsedClass}">
      ${renderSidebar(activePage)}
      <div class="main-content">
        ${renderTopHeader(activePage)}
        <div class="page-content">
          ${renderDataStatusStrip()}
          ${renderPageContent(activePage)}
        </div>
      </div>
    </div>
    ${renderModal()}
  `;
}

function renderSidebar(activePage) {
  const snapshot = getDashboardDataSnapshot();

  const navItems = [
    { id: 'overview', icon: ICONS.dashboard, label: 'Dashboard', badge: null },
    { id: 'queues', icon: ICONS.queues, label: 'Queues', badge: snapshot.queues.length },
    { id: 'jobs', icon: ICONS.jobs, label: 'Jobs', badge: snapshot.stats.pendingJobs || 0 },
    { id: 'workers', icon: ICONS.workers, label: 'Workers', badge: snapshot.stats.onlineWorkers || 0 },
    { id: 'analytics', icon: ICONS.analytics, label: 'Analytics', badge: null },
  ];

  const toolItems = [
    { id: 'create-queue', icon: ICONS.plus, label: 'Create Queue', badge: null },
    { id: 'submit-job', icon: ICONS.send, label: 'Submit Job', badge: null },
    { id: 'settings', icon: ICONS.settings, label: 'Settings', badge: null },
  ];

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <a href="#/" class="sidebar-logo">
          <div class="logo-dot">◈</div>
          <span class="sidebar-logo-text"><span class="text-gradient">Sol</span>Queue</span>
        </a>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Main</div>
          ${navItems.map(item => `
            <div class="nav-item ${activePage === item.id ? 'active' : ''}" data-page="${item.id}" id="nav-${item.id}">
              <span class="nav-icon">${item.icon}</span>
              <span>${item.label}</span>
              ${item.badge !== null && item.badge !== undefined ? `<span class="nav-badge">${item.badge}</span>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="nav-section">
          <div class="nav-section-title">Tools</div>
          ${toolItems.map(item => `
            <div class="nav-item ${activePage === item.id ? 'active' : ''}" data-page="${item.id}" id="nav-${item.id}">
              <span class="nav-icon">${item.icon}</span>
              <span>${item.label}</span>
            </div>
          `).join('')}
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-wallet" id="sidebar-wallet-area">
          ${(() => {
      const ws = getWalletState();
      if (ws.connected) {
        const addr = ws.publicKey;
        return `
                <div class="wallet-avatar" style="color:#14F195;">◉</div>
                <div class="wallet-info">
                  <div class="wallet-label" style="color:#14F195;">Connected</div>
                  <div class="wallet-address">${addr.slice(0, 4)}...${addr.slice(-4)}</div>
                </div>
                <div class="wallet-status" style="background:#14F195;"></div>
              `;
      }
      return `
              <div class="wallet-avatar">◎</div>
              <div class="wallet-info">
                <div class="wallet-label">Not Connected</div>
                <div class="wallet-address" style="color:var(--text-tertiary);">Click to connect</div>
              </div>
              <div class="wallet-status" style="background:var(--text-muted);"></div>
            `;
    })()}
        </div>
      </div>
    </aside>
  `;
}

function renderTopHeader(activePage) {
  const snapshot = getDashboardDataSnapshot();
  const ws = getWalletState();
  const sidebarCollapsed = getSidebarCollapsedPreference();
  const walletLabel = ws.connected
    ? `${ws.publicKey.slice(0, 4)}...${ws.publicKey.slice(-4)}`
    : 'Connect Wallet';
  const modeText = snapshot.mode === 'live' ? 'LIVE DATA' : 'DEMO DATA';
  const modeClass = snapshot.mode === 'live' ? 'live' : 'mock';

  const titles = {
    overview: 'Dashboard',
    queues: 'Queue Management',
    jobs: 'Job Monitor',
    workers: 'Worker Registry',
    analytics: 'Analytics',
    'create-queue': 'Create Queue',
    'submit-job': 'Submit Job',
    settings: 'Settings',
  };

  return `
    <header class="top-header">
      <div class="header-left">
        <button class="mobile-menu-btn btn-icon" id="mobile-menu-toggle">${ICONS.menu}</button>
        <button
          class="sidebar-toggle-btn btn btn-icon btn-ghost"
          id="sidebar-collapse-toggle"
          title="${sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}"
          aria-label="${sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}"
        >
          ${ICONS.menu}
        </button>
        <div>
          <h1 class="header-title">${titles[activePage] || 'Dashboard'}</h1>
          <div class="header-breadcrumb">
            SolQueue / <span>${titles[activePage] || 'Dashboard'}</span>
          </div>
          <div class="header-sync-meta">
            ${snapshot.mode === 'live'
      ? `On-chain sync · updated ${formatSyncTime(snapshot.meta.lastUpdated)}`
      : 'Demo dataset mode'}
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="header-search">
          <span class="search-icon">${ICONS.search}</span>
          <input type="text" placeholder="Search jobs, queues..." id="global-search">
        </div>
        <div class="network-badge devnet">
          <span class="network-dot"></span>
          Devnet
        </div>
        <button class="data-mode-pill ${modeClass}" id="data-mode-toggle-btn" title="Toggle data mode">
          ${modeText}
        </button>
        <button class="wallet-btn" id="header-wallet-btn" title="${ws.connected ? 'Wallet Connected' : 'Connect Wallet'}">
          <span class="wallet-icon">WL</span>
          <span>${walletLabel}</span>
        </button>
        <button class="btn btn-icon btn-ghost notification-btn" id="notifications-btn">
          ${ICONS.bell}
          <span class="notif-dot"></span>
        </button>
      </div>
    </header>
  `;
}

function renderDataStatusStrip() {
  const snapshot = getDashboardDataSnapshot();
  const ws = getWalletState();

  if (snapshot.mode === 'live') {
    const syncStatus = snapshot.meta.lastError
      ? `<span class="data-status-error">${escapeHtml(snapshot.meta.lastError)}</span>`
      : `On-chain mode active · Last sync ${formatSyncTime(snapshot.meta.lastUpdated)}`;

    const errorHint = snapshot.meta.lastError
      ? (() => {
        const attempts = Number(snapshot.meta?.retryAttempts || 0);
        if (snapshot.meta?.errorType === 'rate_limit') {
          return `<span class="data-status-hint">Tip: reduce open tabs or use a dedicated RPC in Settings. Current cycle attempts: ${Math.max(1, attempts)}.</span>`;
        }
        if (snapshot.meta?.errorType === 'network') {
          return `<span class="data-status-hint">Network is unstable. Keep this tab open, sync retries automatically.</span>`;
        }
        return `<span class="data-status-hint">Sync retries automatically every refresh cycle.</span>`;
      })()
      : '';

    return `
      <div class="data-status-strip live">
        <div class="data-status-title">● LIVE ON-CHAIN</div>
        <div class="data-status-text">${syncStatus}</div>
        ${errorHint ? `<div class="data-status-text">${errorHint}</div>` : ''}
        <div class="data-status-actions">
          <button class="btn btn-ghost btn-sm" id="switch-to-demo-btn">Switch to Demo</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="data-status-strip mock">
      <div class="data-status-title">● DEMO DATASET</div>
      <div class="data-status-text">
        Using curated sample data for walkthrough.
        ${ws.connected ? 'Wallet connected — click LIVE DATA to switch to on-chain.' : 'Connect wallet to enable live on-chain mode.'}
      </div>
    </div>
  `;
}

function renderJudgeQuickPanel() {
  const snapshot = getDashboardDataSnapshot();
  const liveHint = snapshot.mode === 'live'
    ? 'You are currently in LIVE mode. Submit one transaction to produce fresh proof.'
    : 'You are in DEMO mode. Connect wallet and toggle LIVE DATA to show real on-chain state.';

  return `
    <div class="glass-card-static judge-quick-panel">
      <div class="judge-quick-head">
        <div>
          <div class="judge-quick-title">${ICONS.flag} Judge Quick Test (60s)</div>
          <div class="judge-quick-subtitle">${liveHint}</div>
        </div>
        <a class="btn btn-secondary btn-sm" href="https://solscan.io/account/${DEVNET_PROGRAM_ID}?cluster=devnet" target="_blank" rel="noopener noreferrer">View Program</a>
      </div>

      <div class="judge-steps">
        <div class="judge-step"><span>1</span>Connect wallet from top-right button.</div>
        <div class="judge-step"><span>2</span>Toggle <strong>LIVE DATA</strong> from header or Settings.</div>
        <div class="judge-step"><span>3</span>Create queue in <a href="#/dashboard/create-queue">Create Queue</a>.</div>
        <div class="judge-step"><span>4</span>Submit job in <a href="#/dashboard/submit-job">Submit Job</a>.</div>
        <div class="judge-step"><span>5</span>Observe status transition in Jobs and Analytics.</div>
      </div>

      <div class="judge-links">
        <a href="${QUICK_TX_LINKS.createQueue}" target="_blank" rel="noopener noreferrer">create_queue tx</a>
        <a href="${QUICK_TX_LINKS.registerWorker}" target="_blank" rel="noopener noreferrer">register_worker tx</a>
        <a href="${QUICK_TX_LINKS.submitJob}" target="_blank" rel="noopener noreferrer">submit_job tx</a>
        <a href="${QUICK_TX_LINKS.claimJob}" target="_blank" rel="noopener noreferrer">claim_job tx</a>
        <a href="${QUICK_TX_LINKS.completeJob}" target="_blank" rel="noopener noreferrer">complete_job tx</a>
      </div>
    </div>
  `;
}

function renderPageContent(page) {
  switch (page) {
    case 'overview': return renderOverview();
    case 'queues': return renderQueues();
    case 'jobs': return renderJobs();
    case 'workers': return renderWorkers();
    case 'analytics': return renderAnalytics();
    case 'create-queue': return renderCreateQueue();
    case 'submit-job': return renderSubmitJob();
    case 'settings': return renderSettings();
    default: return renderOverview();
  }
}

function renderOverview() {
  const snapshot = getDashboardDataSnapshot();
  const stats = snapshot.stats;
  const jobs = snapshot.jobs;
  const activities = snapshot.activities;

  return `
    ${renderJudgeQuickPanel()}

    <!-- Stats -->
    <div class="stats-grid">
      <div class="glass-card stat-card purple" data-animate="fadeInUp">
        <div class="stat-icon">${ICONS.file}</div>
        <div class="stat-label">Total Jobs</div>
        <div class="stat-value" data-count-up="${stats.totalJobs || 0}">0</div>
        <div class="stat-change positive">↑ 12.5% vs last week</div>
      </div>
      <div class="glass-card stat-card green" data-animate="fadeInUp">
        <div class="stat-icon">${ICONS.check}</div>
        <div class="stat-label">Success Rate</div>
        <div class="stat-value" data-count-up="${Number(stats.successRate || 0)}" data-suffix="%">0</div>
        <div class="stat-change positive">↑ 1.2% vs last week</div>
      </div>
      <div class="glass-card stat-card cyan" data-animate="fadeInUp">
        <div class="stat-icon">${ICONS.bolt}</div>
        <div class="stat-label">Throughput</div>
        <div class="stat-value">${stats.throughput || '0/hr'}</div>
        <div class="stat-change positive">↑ 8.3% vs last week</div>
      </div>
      <div class="glass-card stat-card blue" data-animate="fadeInUp">
        <div class="stat-icon">${ICONS.users}</div>
        <div class="stat-label">Online Workers</div>
        <div class="stat-value" data-count-up="${stats.onlineWorkers || 0}">0</div>
        <div class="stat-change positive">↑ 2 new this week</div>
      </div>
    </div>

    <!-- Pipeline Visualization -->
    <div class="glass-card-static pipeline-viz">
      <div class="viz-header">
        <div class="viz-title">${ICONS.bolt} ${snapshot.mode === 'live' ? 'Live' : 'Demo'} Pipeline</div>
        <div class="badge ${snapshot.mode === 'live' ? 'badge-success' : 'badge-info'}"><span class="pulse-dot"></span> ${snapshot.mode === 'live' ? 'Live' : 'Demo'}</div>
      </div>
      <div class="pipeline-canvas-wrapper">
        <canvas id="pipeline-canvas"></canvas>
      </div>
    </div>

    <!-- Dashboard Grid -->
    <div class="dashboard-grid">
      <!-- Recent Jobs -->
      <div class="glass-card-static jobs-section">
        <div class="jobs-header">
          <h3 class="heading-sm">Recent Jobs</h3>
          <a href="#/dashboard/jobs" class="btn btn-ghost btn-sm">View All →</a>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Name</th>
                <th>Queue</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              ${jobs.length > 0 ? jobs.slice(0, 6).map(job => `
                <tr class="job-row" data-job-id="${job.id}">
                  <td><span class="mono" style="color: var(--sol-purple-light); font-size: 0.8rem;">${job.id}</span></td>
                  <td><span class="mono" style="font-size: 0.85rem;">${job.name}</span></td>
                  <td style="font-size: 0.85rem; color: var(--text-secondary);">${job.queue}</td>
                  <td>${getStatusBadge(job.status)}</td>
                  <td style="font-size: 0.8rem; color: var(--text-tertiary);">${job.createdAt}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="5" class="table-empty">No jobs yet. Submit your first job to start the pipeline.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Activity Feed -->
      <div class="glass-card-static activity-feed">
        <div class="feed-header">
          <h3 class="feed-title">Activity Feed</h3>
          <div class="badge badge-info"><span class="pulse-dot"></span> Realtime</div>
        </div>
        <div class="activity-list">
          ${activities.length > 0 ? activities.map(act => `
            <div class="activity-item">
              <div class="activity-icon ${act.type}">${act.icon}</div>
              <div class="activity-content">
                <div class="activity-text">${act.text}</div>
                <div class="activity-time">${act.time}</div>
              </div>
            </div>
          `).join('') : `
            <div class="empty-state" style="padding: var(--space-lg);">
              <div class="empty-desc">No activity yet. Transactions will appear here.</div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderQueues() {
  const snapshot = getDashboardDataSnapshot();
  const queues = snapshot.queues;

  return `
    <div class="jobs-header" style="margin-bottom: var(--space-lg);">
      <div class="flex items-center gap-md">
        <h3 class="heading-sm">All Queues</h3>
        <span class="badge badge-info">${queues.length} queues</span>
      </div>
      <a href="#/dashboard/create-queue" class="btn btn-primary btn-sm">${ICONS.plus}<span>Create Queue</span></a>
    </div>
    <div class="queues-grid">
      ${queues.length > 0 ? queues.map(queue => `
        <div class="glass-card queue-card ${queue.status}">
          <div class="queue-card-header">
            <div>
              <div class="queue-name">${queue.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">
                Priority: ${queue.priority} · Workers: ${queue.workers}
              </div>
            </div>
            ${getStatusBadge(queue.status)}
          </div>
          <div class="progress-bar" style="margin-top: var(--space-md);">
            <div class="progress-fill green" style="width: ${Math.round((queue.completed / Math.max(1, (queue.completed + queue.pending + queue.processing + (queue.failed || 0)))) * 100)}%"></div>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 6px;">
            Throughput: ${queue.throughput}
          </div>
          <div class="queue-stats">
            <div class="queue-stat">
              <div class="queue-stat-value" style="color: var(--sol-purple-light);">${queue.pending}</div>
              <div class="queue-stat-label">Pending</div>
            </div>
            <div class="queue-stat">
              <div class="queue-stat-value" style="color: var(--sol-blue);">${queue.processing}</div>
              <div class="queue-stat-label">Processing</div>
            </div>
            <div class="queue-stat">
              <div class="queue-stat-value" style="color: var(--sol-green);">${queue.completed.toLocaleString()}</div>
              <div class="queue-stat-label">Completed</div>
            </div>
          </div>
        </div>
      `).join('') : `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.inbox}</div>
          <div class="empty-title">No Queues Found</div>
          <div class="empty-desc">
            ${snapshot.mode === 'live'
      ? 'No queue accounts found for this wallet/program yet. Create one on-chain or switch to demo mode for guided preview.'
      : 'Create your first demo queue to simulate an end-to-end processing flow.'}
          </div>
          <a href="#/dashboard/create-queue" class="btn btn-primary btn-sm">${ICONS.plus}<span>Create Queue</span></a>
        </div>
      `}
    </div>
  `;
}

function renderJobs() {
  const snapshot = getDashboardDataSnapshot();
  const jobs = snapshot.jobs;

  return `
    <div class="jobs-header">
      <div class="flex items-center gap-md">
        <h3 class="heading-sm">All Jobs</h3>
        <span class="badge badge-info">${jobs.length} jobs</span>
      </div>
      <div class="flex items-center gap-md">
        <div class="jobs-filters">
          <button class="filter-chip active" data-filter="all">All</button>
          <button class="filter-chip" data-filter="pending">Pending</button>
          <button class="filter-chip" data-filter="processing">Processing</button>
          <button class="filter-chip" data-filter="completed">Completed</button>
          <button class="filter-chip" data-filter="failed">Failed</button>
        </div>
        <a href="#/dashboard/submit-job" class="btn btn-primary btn-sm">${ICONS.send}<span>Submit Job</span></a>
      </div>
    </div>

    <!-- Conveyor Belt Animation -->
    <div class="conveyor-container">
      <div class="conveyor-belt"></div>
      <div class="conveyor-item pending" style="animation-delay: 0s;">send_email</div>
      <div class="conveyor-item processing" style="animation-delay: 1.5s;">process_data</div>
      <div class="conveyor-item completed" style="animation-delay: 3s;">gen_report</div>
      <div class="conveyor-item pending" style="animation-delay: 4.5s;">sync_db</div>
    </div>

    <div class="glass-card-static" style="overflow-x: auto;">
      <table class="data-table">
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Name</th>
            <th>Queue</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Worker</th>
            <th>Attempts</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody id="jobs-table-body">
          ${jobs.length > 0 ? jobs.map(job => `
            <tr class="job-row" data-job-id="${job.id}" data-status="${job.status}">
              <td><span class="mono" style="color: var(--sol-purple-light); font-size: 0.8rem; cursor: pointer;" data-show-detail="${job.id}">${job.id}</span></td>
              <td><span class="mono" style="font-size: 0.85rem;">${job.name}</span></td>
              <td style="font-size: 0.85rem; color: var(--text-secondary);">${job.queue}</td>
              <td>${getStatusBadge(job.status)}</td>
              <td>${getPriorityBadge(job.priority)}</td>
              <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-tertiary);">${job.worker || '—'}</td>
              <td style="text-align: center;">${job.attempts}</td>
              <td style="font-size: 0.8rem; color: var(--text-tertiary);">${job.createdAt}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="8" class="table-empty">
                ${snapshot.mode === 'live'
      ? 'No on-chain jobs detected yet. Submit one from Submit Job, then refresh.'
      : 'No demo jobs yet. Use Submit Job to generate pipeline activity instantly.'}
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  `;
}

function renderWorkers() {
  const snapshot = getDashboardDataSnapshot();
  const workers = snapshot.workers;
  const online = workers.filter(w => w.status === 'online').length;

  return `
    <div class="jobs-header" style="margin-bottom: var(--space-lg);">
      <div class="flex items-center gap-md">
        <h3 class="heading-sm">Worker Registry</h3>
        <span class="badge badge-success"><span class="pulse-dot"></span> ${online} Online</span>
      </div>
      <button class="btn btn-primary btn-sm">${ICONS.workers}<span>Register Worker</span></button>
    </div>
    <div class="workers-grid">
      ${workers.length > 0 ? workers.map(worker => `
        <div class="glass-card worker-card">
          <div class="worker-header">
            <div class="worker-avatar">${worker.id}</div>
            <div>
              <div class="worker-name">${worker.name}</div>
              <div class="worker-status flex items-center gap-xs">
                ${worker.status === 'online'
      ? '<span style="color: var(--sol-green);">● Online</span>'
      : '<span style="color: var(--color-error);">● Offline</span>'
    }
                <span>· ${worker.lastHeartbeat}</span>
              </div>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: var(--space-sm);">
            Queue: <span style="color: var(--text-secondary);">${worker.queue}</span>
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); margin-bottom: var(--space-md);">
            ${worker.address}
          </div>
          <div class="worker-metrics">
            <div class="worker-metric">
              <div class="worker-metric-value" style="color: var(--sol-green);">${worker.jobsCompleted.toLocaleString()}</div>
              <div class="worker-metric-label">Completed</div>
            </div>
            <div class="worker-metric">
              <div class="worker-metric-value" style="color: var(--color-error);">${worker.jobsFailed}</div>
              <div class="worker-metric-label">Failed</div>
            </div>
            <div class="worker-metric">
              <div class="worker-metric-value" style="color: var(--sol-cyan);">${worker.avgProcessTime}</div>
              <div class="worker-metric-label">Avg Time</div>
            </div>
            <div class="worker-metric">
              <div class="worker-metric-value" style="color: var(--sol-purple-light);">${worker.uptime}</div>
              <div class="worker-metric-label">Uptime</div>
            </div>
          </div>
        </div>
      `).join('') : `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.workers}</div>
          <div class="empty-title">No Workers Registered</div>
          <div class="empty-desc">
            ${snapshot.mode === 'live'
      ? 'No on-chain workers found. Register a worker account to claim jobs.'
      : 'Demo mode can run without explicit workers, but registering workers improves realism.'}
          </div>
        </div>
      `}
    </div>
  `;
}

function renderAnalytics() {
  const snapshot = getDashboardDataSnapshot();
  const stats = snapshot.stats;
  const success = Number(stats.successRate || 0);
  const failed = Number(stats.totalJobs || 0) > 0
    ? Math.round((Number(stats.failedJobs || 0) / Number(stats.totalJobs || 1)) * 100)
    : 0;
  const pending = Number(stats.totalJobs || 0) > 0
    ? Math.max(0, Math.round((Number(stats.pendingJobs || 0) / Number(stats.totalJobs || 1)) * 100))
    : 0;
  const processing = Math.max(0, 100 - Math.round(success) - failed - pending);

  return `
    <div class="charts-grid">
      <!-- Throughput Chart -->
      <div class="glass-card-static chart-card">
        <div class="chart-header">
          <div class="chart-title">${ICONS.chart} Weekly Throughput</div>
          <select class="select-field" style="min-width: 120px;">
            <option>This Week</option>
            <option>Last Week</option>
            <option>Last Month</option>
          </select>
        </div>
        <div class="chart-canvas">
          <canvas id="bar-chart"></canvas>
        </div>
      </div>

      <!-- Success Distribution -->
      <div class="glass-card-static chart-card">
        <div class="chart-header">
          <div class="chart-title">${ICONS.analytics} Job Status</div>
        </div>
        <div class="donut-chart" id="donut-chart">
          <svg viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="24"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="#14F195" stroke-width="24"
              stroke-dasharray="${(success / 100) * 502} ${502}" stroke-dashoffset="0"
              style="transition: stroke-dasharray 1.5s ease;"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="#3b82f6" stroke-width="24"
              stroke-dasharray="${(processing / 100) * 502} ${502}" stroke-dashoffset="${-(success / 100) * 502}"
              style="transition: stroke-dasharray 1.5s ease;"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="#9945FF" stroke-width="24"
              stroke-dasharray="${(pending / 100) * 502} ${502}" stroke-dashoffset="${-((success + processing) / 100) * 502}"
              style="transition: stroke-dasharray 1.5s ease;"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="#ff4545" stroke-width="24"
              stroke-dasharray="${(failed / 100) * 502} ${502}" stroke-dashoffset="${-((success + processing + pending) / 100) * 502}"
              style="transition: stroke-dasharray 1.5s ease;"/>
          </svg>
          <div class="donut-center">
            <div class="donut-value text-gradient">${success.toFixed(1)}%</div>
            <div class="donut-label">Success</div>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-dot" style="background: var(--sol-green);"></div>
            <span>Completed</span>
            <span class="legend-value">${Math.round(success)}%</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: var(--sol-blue);"></div>
            <span>Processing</span>
            <span class="legend-value">${processing}%</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: var(--sol-purple);"></div>
            <span>Pending</span>
            <span class="legend-value">${pending}%</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: var(--color-error);"></div>
            <span>Failed</span>
            <span class="legend-value">${failed}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Line Chart -->
    <div class="glass-card-static chart-card" style="margin-bottom: var(--space-lg);">
      <div class="chart-header">
        <div class="chart-title">${ICONS.trend} 24h Job Completion Trend</div>
        <div class="flex items-center gap-md">
          <div class="legend-item" style="margin: 0;">
            <div class="legend-dot" style="background: var(--sol-green);"></div>
            <span style="font-size: 0.8rem;">Completed</span>
          </div>
          <div class="legend-item" style="margin: 0;">
            <div class="legend-dot" style="background: var(--color-error);"></div>
            <span style="font-size: 0.8rem;">Failed</span>
          </div>
        </div>
      </div>
      <div class="chart-canvas">
        <canvas id="line-chart"></canvas>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="glass-card stat-card cyan">
        <div class="stat-icon">${ICONS.timer}</div>
        <div class="stat-label">Avg Processing Time</div>
        <div class="stat-value">${stats.avgProcessingTime || 'N/A'}</div>
        <div class="stat-change positive">↓ 0.3s faster</div>
      </div>
      <div class="glass-card stat-card purple">
        <div class="stat-icon">${ICONS.retry}</div>
        <div class="stat-label">Retry Rate</div>
        <div class="stat-value">2.7%</div>
        <div class="stat-change positive">↓ 0.5% improvement</div>
      </div>
      <div class="glass-card stat-card green">
        <div class="stat-icon">${ICONS.chart}</div>
        <div class="stat-label">Queue Utilization</div>
        <div class="stat-value">${Math.min(100, Math.max(0, Math.round(((stats.pendingJobs || 0) + (stats.failedJobs || 0)) > 0 ? 100 - (failed || 0) : 78)))}%</div>
        <div class="stat-change positive">↑ 5% vs last week</div>
      </div>
    </div>
  `;
}

function renderCreateQueue() {
  const mode = getDataMode();
  return `
    <div class="glass-card-static" style="padding: var(--space-xl); max-width: 700px;">
      <h3 class="heading-sm" style="margin-bottom: var(--space-xl);">Create New Queue</h3>
      <div class="form-mode-hint ${mode === 'live' ? 'live' : 'mock'}">
        ${mode === 'live'
      ? 'Live mode: this action will send an on-chain transaction.'
      : 'Demo mode: this action updates local demo data instantly.'}
      </div>
      <div class="create-form">
        <div class="form-group">
          <label>Queue Name</label>
          <input type="text" class="input-field" placeholder="e.g., email-notifications" id="queue-name-input">
          <div class="field-help">Use lowercase letters, numbers, hyphen, or underscore (3-32 chars).</div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Priority</label>
            <select class="select-field" id="queue-priority">
              <option value="high">High</option>
              <option value="medium" selected>Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div class="form-group">
            <label>Max Retries</label>
            <input type="number" class="input-field" value="3" min="0" max="10" id="queue-max-retries">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Max Workers</label>
            <input type="number" class="input-field" value="5" min="1" max="50" id="queue-max-workers">
          </div>
          <div class="form-group">
            <label>Job TTL (seconds)</label>
            <input type="number" class="input-field" value="3600" min="60" id="queue-ttl">
          </div>
        </div>
        <div class="form-group">
          <label>Description (optional)</label>
          <textarea class="input-field" rows="3" placeholder="What does this queue process?" id="queue-description" style="resize: vertical;"></textarea>
        </div>
        <div class="form-group">
          <label class="flex items-center gap-md">
            <label class="toggle">
              <input type="checkbox" checked>
              <span class="toggle-slider"></span>
            </label>
            Auto-start queue after creation
          </label>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" id="create-queue-btn">
            ${ICONS.plus}<span>Create Queue</span>
          </button>
          <a href="#/dashboard" class="btn btn-secondary">Cancel</a>
        </div>
      </div>
    </div>
  `;
}

function renderSubmitJob() {
  const snapshot = getDashboardDataSnapshot();
  const queues = snapshot.queues.filter(q => q.status === 'active');
  const mode = snapshot.mode;

  return `
    <div class="glass-card-static" style="padding: var(--space-xl); max-width: 700px;">
      <h3 class="heading-sm" style="margin-bottom: var(--space-xl);">Submit New Job</h3>
      <div class="form-mode-hint ${mode === 'live' ? 'live' : 'mock'}">
        ${mode === 'live'
      ? 'Live mode: payload will be submitted on-chain.'
      : 'Demo mode: payload is validated and added to demo queue only.'}
      </div>
      <div class="create-form">
        <div class="form-group">
          <label>Queue</label>
          <select class="select-field" id="job-queue-select">
            ${queues.map(q => `
              <option value="${q.publicKey || q.id}">${q.name}</option>
            `).join('')}
          </select>
          ${queues.length === 0 ? '<div class="field-help error">No active queues available in current mode.</div>' : ''}
        </div>
        <div class="form-group">
          <label>Job Name</label>
          <input type="text" class="input-field" placeholder="e.g., send_welcome_email" id="job-name-input">
        </div>
        <div class="form-group">
          <label>Priority</label>
          <select class="select-field" id="job-priority">
            <option value="high">High</option>
            <option value="medium" selected>Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div class="form-group">
          <label>Payload (JSON)</label>
          <textarea class="input-field mono" rows="6" placeholder='{"to": "user@example.com", "template": "welcome"}' id="job-payload" style="resize: vertical; font-size: 0.85rem;"></textarea>
          <div class="field-help">Maximum payload size for on-chain submit: 512 bytes.</div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" id="submit-job-btn" ${queues.length === 0 ? 'disabled' : ''}>
            ${ICONS.send}<span>Submit Job</span>
          </button>
          <a href="#/dashboard/jobs" class="btn btn-secondary">Cancel</a>
        </div>
      </div>
    </div>
  `;
}

function renderSettings() {
  const ws = getWalletState();
  const snapshot = getDashboardDataSnapshot();
  const mode = snapshot.mode;
  return `
    <div class="glass-card-static" style="padding: var(--space-xl); max-width: 700px;">
      <h3 class="heading-sm" style="margin-bottom: var(--space-xl);">Settings</h3>
      <div class="create-form">
        <div class="form-group">
          <label>Network</label>
          <select class="select-field" id="settings-network">
            <option selected>Devnet</option>
            <option>Testnet</option>
            <option>Mainnet-Beta</option>
          </select>
        </div>
        <div class="form-group">
          <label>RPC Endpoint</label>
          <input type="text" class="input-field mono" value="https://api.devnet.solana.com" style="font-size: 0.85rem;" id="settings-rpc">
        </div>
        <div class="form-group">
          <label>Program ID</label>
          <input type="text" class="input-field mono" value="GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64" readonly style="font-size: 0.85rem; color: var(--sol-purple-light);">
        </div>
        <div class="form-group">
          <label>Wallet Status</label>
          <div style="padding: 12px; background: rgba(5,5,16,0.5); border-radius: var(--radius-md); font-family: var(--font-mono); font-size: 0.85rem;">
            ${ws.connected
      ? `<span style="color:#14F195;">● Connected</span> — ${ws.publicKey.slice(0, 8)}...${ws.publicKey.slice(-8)} <span style="color:var(--text-tertiary);">(${ws.balance.toFixed(4)} SOL)</span>`
      : '<span style="color:var(--text-tertiary);">● Not connected</span>'}
          </div>
          <div class="field-help ${mode === 'live' ? 'success' : ''}">
            Current data mode: <strong>${mode === 'live' ? 'Live On-Chain' : 'Demo Dataset'}</strong>
            ${snapshot.meta?.lastUpdated ? ` · Last sync ${formatSyncTime(snapshot.meta.lastUpdated)}` : ''}
          </div>
        </div>
        <div class="form-group">
          <label class="flex items-center gap-md">
            <label class="toggle">
              <input type="checkbox" ${mode === 'live' ? 'checked' : ''} id="settings-live-data">
              <span class="toggle-slider"></span>
            </label>
            Use live on-chain data (requires wallet + deployed program)
          </label>
          ${!ws.connected ? '<div class="field-help">Tip: connect wallet first to enable live mode.</div>' : ''}
        </div>
        <div class="form-group">
          <label class="flex items-center gap-md">
            <label class="toggle">
              <input type="checkbox" checked id="settings-realtime">
              <span class="toggle-slider"></span>
            </label>
            Enable real-time updates
          </label>
        </div>
        <div class="form-group">
          <label class="flex items-center gap-md">
            <label class="toggle">
              <input type="checkbox" checked id="settings-tx-confirm">
              <span class="toggle-slider"></span>
            </label>
            Show transaction confirmations
          </label>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" id="save-settings-btn">${ICONS.save}<span>Save Settings</span></button>
        </div>
      </div>
    </div>
  `;
}

function renderModal() {
  return `
    <div class="modal-overlay" id="job-detail-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="heading-sm">Job Details</h3>
          <button class="btn btn-icon btn-ghost" id="close-modal">✕</button>
        </div>
        <div class="modal-body" id="modal-body-content">
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost btn-sm" id="close-modal-2">Close</button>
          <button class="btn btn-secondary btn-sm">${ICONS.retry}<span>Retry Job</span></button>
          <a href="#" class="btn btn-primary btn-sm" target="_blank">${ICONS.link}<span>View on Explorer</span></a>
        </div>
      </div>
    </div>
  `;
}

// Helper functions
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getStatusBadge(status) {
  const badges = {
    active: '<span class="badge badge-success"><span class="pulse-dot"></span> Active</span>',
    paused: '<span class="badge badge-warning"><span class="pulse-dot"></span> Paused</span>',
    stopped: '<span class="badge badge-error"><span class="pulse-dot"></span> Stopped</span>',
    completed: '<span class="badge badge-success">✓ Completed</span>',
    processing: '<span class="badge badge-processing"><span class="pulse-dot"></span> Processing</span>',
    pending: '<span class="badge badge-pending">◌ Pending</span>',
    failed: '<span class="badge badge-error">✗ Failed</span>',
  };
  return badges[status] || `<span class="badge">${escapeHtml(status)}</span>`;
}

function getPriorityBadge(priority) {
  const badges = {
    high: '<span style="color: var(--color-error); font-size: 0.8rem; font-weight: 600; display:inline-flex; align-items:center; gap:6px;"><span style="width:7px;height:7px;border-radius:50%;background:var(--color-error);display:inline-block;"></span>High</span>',
    medium: '<span style="color: var(--color-warning); font-size: 0.8rem; font-weight: 600; display:inline-flex; align-items:center; gap:6px;"><span style="width:7px;height:7px;border-radius:50%;background:var(--color-warning);display:inline-block;"></span>Medium</span>',
    low: '<span style="color: var(--sol-green); font-size: 0.8rem; font-weight: 600; display:inline-flex; align-items:center; gap:6px;"><span style="width:7px;height:7px;border-radius:50%;background:var(--sol-green);display:inline-block;"></span>Low</span>',
  };
  return badges[priority] || escapeHtml(priority);
}

export function initDashboard(page) {
  // Cleanup previous animations
  destroyAnimations();

  if (dataUpdateUnsubscribe) {
    dataUpdateUnsubscribe();
    dataUpdateUnsubscribe = null;
  }

  dataUpdateUnsubscribe = onDataUpdate(() => {
    if (!window.location.hash.startsWith('#/dashboard')) return;
    if (getDataMode() !== 'live') return;
    const page = (window.location.hash.split('/')[2] || 'overview').trim();
    if (!['overview', 'queues', 'jobs', 'workers', 'analytics'].includes(page)) return;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

  // Initialize sidebar navigation
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      const nextPage = item.getAttribute('data-page');
      if (window.matchMedia('(max-width: 768px)').matches) {
        document.getElementById('sidebar')?.classList.remove('open');
      }
      window.location.hash = `/dashboard/${nextPage}`;
    });
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const collapseToggle = document.getElementById('sidebar-collapse-toggle');
  const sidebar = document.getElementById('sidebar');
  const appLayout = document.querySelector('.app-layout');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  if (collapseToggle && appLayout && sidebar) {
    collapseToggle.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 768px)').matches) {
        sidebar.classList.toggle('open');
        return;
      }

      appLayout.classList.toggle('sidebar-collapsed');
      const collapsed = appLayout.classList.contains('sidebar-collapsed');
      setSidebarCollapsedPreference(collapsed);
      collapseToggle.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
      collapseToggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    });
  }

  // Sidebar wallet click
  const sidebarWallet = document.getElementById('sidebar-wallet-area');
  if (sidebarWallet) {
    sidebarWallet.addEventListener('click', async () => {
      const ws = getWalletState();
      if (ws.connected) {
        await disconnectWallet();
        showToast('Wallet disconnected', 'info');
      } else {
        try {
          await connectWallet();
          showToast('Wallet connected!', 'success');
        } catch (e) { /* handled in adapter */ }
      }
      // Re-render to update UI
      window.location.hash = window.location.hash;
    });
  }

  // Header wallet button
  const headerWalletBtn = document.getElementById('header-wallet-btn');
  if (headerWalletBtn) {
    headerWalletBtn.addEventListener('click', async () => {
      const ws = getWalletState();
      if (ws.connected) {
        await disconnectWallet();
        showToast('Wallet disconnected', 'info');
      } else {
        try {
          await connectWallet();
          showToast('Wallet connected!', 'success');
        } catch (e) { /* handled in adapter */ }
      }
      window.location.hash = window.location.hash;
    });
  }

  const dataModeToggleBtn = document.getElementById('data-mode-toggle-btn');
  if (dataModeToggleBtn) {
    dataModeToggleBtn.addEventListener('click', async () => {
      await toggleDataModeWithFeedback();
    });
  }

  const switchToDemoBtn = document.getElementById('switch-to-demo-btn');
  if (switchToDemoBtn) {
    switchToDemoBtn.addEventListener('click', () => {
      setDataMode('mock');
      showToast('Switched to demo dataset mode', 'info');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
  }

  // Job row click
  document.querySelectorAll('.job-row').forEach(row => {
    row.addEventListener('click', () => {
      const jobId = row.getAttribute('data-job-id');
      showJobDetail(jobId);
    });
  });

  // Modal close
  const modal = document.getElementById('job-detail-modal');
  if (modal) {
    document.getElementById('close-modal')?.addEventListener('click', () => modal.classList.remove('active'));
    document.getElementById('close-modal-2')?.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.getAttribute('data-filter');
      filterJobs(filter);
    });
  });

  // Count-up animations
  document.querySelectorAll('[data-count-up]').forEach(el => {
    const target = parseFloat(el.getAttribute('data-count-up'));
    const suffix = el.getAttribute('data-suffix') || '';
    animateValue(el, 0, target, 1500, suffix);
  });

  // Initialize canvas animations based on page
  if (page === 'overview') {
    const pipelineCanvas = document.getElementById('pipeline-canvas');
    if (pipelineCanvas) {
      pipelineAnim = new PipelineAnimation(pipelineCanvas);
    }
  }

  if (page === 'analytics') {
    const snapshot = getDashboardDataSnapshot();
    const barCanvas = document.getElementById('bar-chart');
    if (barCanvas) {
      barChartAnim = new BarChartAnimation(barCanvas, snapshot.chartData.throughput || MOCK_CHART_DATA.throughput, '#9945FF');
    }

    const lineCanvas = document.getElementById('line-chart');
    if (lineCanvas) {
      lineChartAnim = new LineChartAnimation(lineCanvas, [
        { data: snapshot.chartData?.lineData?.completed || MOCK_CHART_DATA.lineData.completed, color: '#14F195' },
        { data: snapshot.chartData?.lineData?.failed || MOCK_CHART_DATA.lineData.failed, color: '#ff4545' },
      ]);
    }
  }

  if (page === 'create-queue') {
    wireCreateQueueForm();
  }

  if (page === 'submit-job') {
    wireSubmitJobForm();
  }

  if (page === 'settings') {
    wireSettingsForm();
  }

  // Scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        const animType = entry.target.getAttribute('data-animate');
        if (animType) entry.target.classList.add(`animate-${animType}`);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
}

async function toggleDataModeWithFeedback() {
  const current = getDataMode();

  if (current === 'mock') {
    if (!getWalletState().connected) {
      showToast('Connect wallet first to enable live on-chain mode', 'info');
      try {
        await connectWallet();
      } catch { }
      if (!getWalletState().connected) {
        return;
      }
    }

    const switchResult = setDataMode('live');
    if (!switchResult?.ok) {
      showToast('Unable to switch to live mode. Please reconnect wallet.', 'error');
      return;
    }
    await refreshData();
    showToast('Switched to live on-chain data', 'success');
  } else {
    setDataMode('mock');
    showToast('Switched to demo dataset mode', 'info');
  }

  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function clearFieldError(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.classList.remove('input-invalid');
  const error = document.getElementById(`${inputId}-error`);
  if (error) error.remove();
}

function setFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  clearFieldError(inputId);
  input.classList.add('input-invalid');
  const error = document.createElement('div');
  error.className = 'field-help error';
  error.id = `${inputId}-error`;
  error.textContent = message;
  input.insertAdjacentElement('afterend', error);
}

function wireCreateQueueForm() {
  const createBtn = document.getElementById('create-queue-btn');
  if (!createBtn) return;

  const watched = ['queue-name-input', 'queue-max-retries', 'queue-max-workers', 'queue-ttl'];
  watched.forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => clearFieldError(id));
  });

  createBtn.addEventListener('click', async () => {
    const name = document.getElementById('queue-name-input')?.value?.trim() || '';
    const priority = document.getElementById('queue-priority')?.value || 'medium';
    const maxRetries = Number(document.getElementById('queue-max-retries')?.value || 0);
    const maxWorkers = Number(document.getElementById('queue-max-workers')?.value || 0);
    const ttl = Number(document.getElementById('queue-ttl')?.value || 0);
    const description = document.getElementById('queue-description')?.value?.trim() || '';

    let hasError = false;
    if (!/^[a-z0-9_-]{3,32}$/.test(name)) {
      setFieldError('queue-name-input', 'Queue name must be 3-32 chars (lowercase, number, hyphen, underscore).');
      hasError = true;
    }
    if (!Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > 10) {
      setFieldError('queue-max-retries', 'Max retries must be between 0 and 10.');
      hasError = true;
    }
    if (!Number.isInteger(maxWorkers) || maxWorkers < 1 || maxWorkers > 50) {
      setFieldError('queue-max-workers', 'Max workers must be between 1 and 50.');
      hasError = true;
    }
    if (!Number.isInteger(ttl) || ttl < 60 || ttl > 604800) {
      setFieldError('queue-ttl', 'TTL must be between 60 and 604800 seconds.');
      hasError = true;
    }
    if (hasError) {
      showToast('Please fix form validation errors first', 'error');
      return;
    }

    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';

    try {
      if (getDataMode() === 'live') {
        const client = getClient();
        if (!client?.isConnected) {
          throw new Error('Wallet not connected');
        }
        const priorityMap = { low: 0, medium: 1, high: 2 };
        await sendWithFeedback(
          () => client.createQueue(name, maxWorkers, maxRetries, priorityMap[priority] ?? 1, ttl),
          'Create queue'
        );
        await refreshData();
      } else {
        createDemoQueue({
          name,
          priority,
          maxRetries,
          maxWorkers,
          ttl,
          description,
        });
        showToast(`Queue "${name}" created in demo mode`, 'success');
      }

      window.location.hash = '/dashboard/queues';
    } catch (error) {
      if (!error?.__toastShown) {
        showToast(error?.message || 'Failed to create queue', 'error');
      }
    } finally {
      createBtn.disabled = false;
      createBtn.textContent = 'Create Queue';
    }
  });
}

function wireSubmitJobForm() {
  const submitBtn = document.getElementById('submit-job-btn');
  if (!submitBtn) return;

  const watched = ['job-name-input', 'job-payload'];
  watched.forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => clearFieldError(id));
  });

  submitBtn.addEventListener('click', async () => {
    const queueValue = document.getElementById('job-queue-select')?.value;
    const jobName = document.getElementById('job-name-input')?.value?.trim() || '';
    const priority = document.getElementById('job-priority')?.value || 'medium';
    const payloadRaw = document.getElementById('job-payload')?.value?.trim() || '';

    const snapshot = getDashboardDataSnapshot();
    const queue = snapshot.queues.find((q) => String(q.publicKey || q.id) === String(queueValue));

    let hasError = false;
    if (!queueValue || !queue) {
      showToast('Please select an active queue', 'error');
      return;
    }
    if (!/^[a-z0-9_-]{3,48}$/.test(jobName)) {
      setFieldError('job-name-input', 'Job name must be 3-48 chars (lowercase, number, hyphen, underscore).');
      hasError = true;
    }

    let payloadObject = null;
    try {
      payloadObject = JSON.parse(payloadRaw || '{}');
    } catch {
      setFieldError('job-payload', 'Payload must be valid JSON.');
      hasError = true;
    }

    const payloadText = payloadObject ? JSON.stringify(payloadObject) : '';
    if (payloadText && new TextEncoder().encode(payloadText).length > 512) {
      setFieldError('job-payload', 'Payload exceeds 512 bytes for on-chain submit.');
      hasError = true;
    }

    if (hasError) {
      showToast('Please fix form validation errors first', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      if (getDataMode() === 'live') {
        const client = getClient();
        if (!client?.isConnected) {
          throw new Error('Wallet not connected');
        }
        const priorityMap = { low: 0, medium: 1, high: 2 };
        const queuePda = new PublicKey(queue.publicKey || queue.id);
        await sendWithFeedback(
          () => client.submitJob(queuePda, payloadText, priorityMap[priority] ?? 1),
          'Submit job'
        );
        await refreshData();
      } else {
        submitDemoJob({
          queueId: queueValue,
          queueName: queue.name,
          name: jobName,
          priority,
          payload: payloadObject,
        });
        showToast(`Job "${jobName}" submitted in demo mode`, 'success');
      }

      window.location.hash = '/dashboard/jobs';
    } catch (error) {
      if (!error?.__toastShown) {
        showToast(error?.message || 'Failed to submit job', 'error');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Job';
    }
  });
}

function wireSettingsForm() {
  const saveBtn = document.getElementById('save-settings-btn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async () => {
    const useLive = document.getElementById('settings-live-data')?.checked;

    if (useLive) {
      if (!getWalletState().connected) {
        showToast('Connect wallet first before enabling live mode', 'info');
        return;
      }
      const result = setDataMode('live');
      if (!result?.ok) {
        showToast('Unable to enable live mode. Please reconnect wallet.', 'error');
        return;
      }
      await refreshData();
      showToast('Settings saved: Live on-chain data enabled', 'success');
    } else {
      setDataMode('mock');
      showToast('Settings saved: Demo dataset mode enabled', 'success');
    }

    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

function showJobDetail(jobId) {
  const snapshot = getDashboardDataSnapshot();
  const job = snapshot.jobs.find(j => j.id === jobId);
  if (!job) return;

  const safeJob = {
    id: escapeHtml(job.id),
    status: job.status,
    name: escapeHtml(job.name),
    queue: escapeHtml(job.queue),
    priority: job.priority,
    worker: job.worker ? escapeHtml(job.worker) : null,
    attempts: Number(job.attempts) || 0,
    payload: escapeHtml(job.payload || ''),
    result: job.result ? escapeHtml(job.result) : null,
    createdAt: escapeHtml(job.createdAt || ''),
    processedAt: job.processedAt ? escapeHtml(job.processedAt) : null,
  };

  const modal = document.getElementById('job-detail-modal');
  const modalBody = document.getElementById('modal-body-content');

  if (modalBody) {
    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-md);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="mono" style="color: var(--sol-purple-light); font-size: 0.9rem;">${safeJob.id}</span>
          ${getStatusBadge(safeJob.status)}
        </div>
        <div style="padding: var(--space-md); background: rgba(5,5,16,0.5); border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">JOB NAME</div>
          <div class="mono">${safeJob.name}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
          <div style="padding: var(--space-md); background: rgba(5,5,16,0.5); border-radius: var(--radius-md);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">QUEUE</div>
            <div style="font-size: 0.9rem;">${safeJob.queue}</div>
          </div>
          <div style="padding: var(--space-md); background: rgba(5,5,16,0.5); border-radius: var(--radius-md);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">PRIORITY</div>
            <div>${getPriorityBadge(safeJob.priority)}</div>
          </div>
          <div style="padding: var(--space-md); background: rgba(5,5,16,0.5); border-radius: var(--radius-md);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">WORKER</div>
            <div class="mono" style="font-size: 0.9rem;">${safeJob.worker || 'Not assigned'}</div>
          </div>
          <div style="padding: var(--space-md); background: rgba(5,5,16,0.5); border-radius: var(--radius-md);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">ATTEMPTS</div>
            <div style="font-size: 0.9rem;">${safeJob.attempts}</div>
          </div>
        </div>
        <div style="padding: var(--space-md); background: rgba(5,5,16,0.5); border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">PAYLOAD</div>
          <pre class="mono" style="font-size: 0.8rem; color: var(--sol-green); white-space: pre-wrap; word-break: break-all;">${safeJob.payload}</pre>
        </div>
        ${safeJob.result ? `
          <div style="padding: var(--space-md); background: rgba(5,5,16,0.5); border-radius: var(--radius-md);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">RESULT</div>
            <div class="mono" style="font-size: 0.85rem; color: ${safeJob.status === 'failed' ? 'var(--color-error)' : 'var(--sol-green)'};">${safeJob.result}</div>
          </div>
        ` : ''}
        <div style="display: flex; gap: var(--space-md); font-size: 0.8rem; color: var(--text-tertiary);">
          <span>Created: ${safeJob.createdAt}</span>
          ${safeJob.processedAt ? `<span>Processed: ${safeJob.processedAt}</span>` : ''}
        </div>
      </div>
    `;
  }

  if (modal) modal.classList.add('active');
}

function filterJobs(filter) {
  const rows = document.querySelectorAll('#jobs-table-body tr');
  rows.forEach(row => {
    if (filter === 'all') {
      row.style.display = '';
    } else {
      const status = row.getAttribute('data-status');
      row.style.display = status === filter ? '' : 'none';
    }
  });
}

function animateValue(el, start, end, duration, suffix) {
  const startTime = performance.now();
  const isFloat = !Number.isInteger(end);

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * eased;

    el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString()) + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function destroyAnimations() {
  if (pipelineAnim) { pipelineAnim.destroy(); pipelineAnim = null; }
  if (barChartAnim) { barChartAnim.destroy(); barChartAnim = null; }
  if (lineChartAnim) { lineChartAnim.destroy(); lineChartAnim = null; }
}
