import { MOCK_STATS, MOCK_QUEUES, MOCK_JOBS, MOCK_WORKERS, MOCK_ACTIVITIES, MOCK_CHART_DATA } from '../utils/mock-data.js';
import { PipelineAnimation, BarChartAnimation, LineChartAnimation } from '../animations/pipeline.js';
import { getWalletState, connectWallet, disconnectWallet, showToast, sendWithFeedback, onWalletChange } from '../utils/wallet-adapter.js';
import { getData, getDataMode, setDataMode, onDataUpdate, initDataService } from '../utils/data-service.js';

let pipelineAnim = null;
let barChartAnim = null;
let lineChartAnim = null;

export function renderDashboard(activePage = 'overview') {
  return `
    <div class="app-layout">
      ${renderSidebar(activePage)}
      <div class="main-content">
        ${renderTopHeader(activePage)}
        <div class="page-content">
          ${renderPageContent(activePage)}
        </div>
      </div>
    </div>
    ${renderModal()}
  `;
}

function renderSidebar(activePage) {
  const navItems = [
    { id: 'overview', icon: '📊', label: 'Dashboard', badge: null },
    { id: 'queues', icon: '📋', label: 'Queues', badge: MOCK_QUEUES.length },
    { id: 'jobs', icon: '📄', label: 'Jobs', badge: MOCK_STATS.pendingJobs },
    { id: 'workers', icon: '👷', label: 'Workers', badge: MOCK_STATS.onlineWorkers },
    { id: 'analytics', icon: '📈', label: 'Analytics', badge: null },
  ];

  const toolItems = [
    { id: 'create-queue', icon: '➕', label: 'Create Queue', badge: null },
    { id: 'submit-job', icon: '📨', label: 'Submit Job', badge: null },
    { id: 'settings', icon: '⚙️', label: 'Settings', badge: null },
  ];

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <a href="#/" class="sidebar-logo">
          <div class="logo-dot">◈</div>
          <span class="text-gradient">Sol</span>Queue
        </a>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Main</div>
          ${navItems.map(item => `
            <div class="nav-item ${activePage === item.id ? 'active' : ''}" data-page="${item.id}" id="nav-${item.id}">
              <span class="nav-icon">${item.icon}</span>
              <span>${item.label}</span>
              ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
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
        <button class="mobile-menu-btn btn-icon" id="mobile-menu-toggle">☰</button>
        <div>
          <h1 class="header-title">${titles[activePage] || 'Dashboard'}</h1>
          <div class="header-breadcrumb">
            SolQueue / <span>${titles[activePage] || 'Dashboard'}</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="header-search">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Search jobs, queues..." id="global-search">
        </div>
        <div class="network-badge devnet">
          <span class="network-dot"></span>
          Devnet
        </div>
        <button class="wallet-btn" id="header-wallet-btn" title="${getWalletState().connected ? 'Wallet Connected' : 'Connect Wallet'}">
          <span class="wallet-icon">👻</span>
          <span>${getWalletState().connected ? getWalletState().publicKey.slice(0, 4) + '...' + getWalletState().publicKey.slice(-4) : 'Connect'}</span>
        </button>
        <button class="btn btn-icon btn-ghost notification-btn" id="notifications-btn">
          🔔
          <span class="notif-dot"></span>
        </button>
      </div>
    </header>
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
  return `
    <!-- Stats -->
    <div class="stats-grid">
      <div class="glass-card stat-card purple" data-animate="fadeInUp">
        <div class="stat-icon">📄</div>
        <div class="stat-label">Total Jobs</div>
        <div class="stat-value" data-count-up="${MOCK_STATS.totalJobs}">0</div>
        <div class="stat-change positive">↑ 12.5% vs last week</div>
      </div>
      <div class="glass-card stat-card green" data-animate="fadeInUp">
        <div class="stat-icon">✅</div>
        <div class="stat-label">Success Rate</div>
        <div class="stat-value" data-count-up="${MOCK_STATS.successRate}" data-suffix="%">0</div>
        <div class="stat-change positive">↑ 1.2% vs last week</div>
      </div>
      <div class="glass-card stat-card cyan" data-animate="fadeInUp">
        <div class="stat-icon">⚡</div>
        <div class="stat-label">Throughput</div>
        <div class="stat-value">${MOCK_STATS.throughput}</div>
        <div class="stat-change positive">↑ 8.3% vs last week</div>
      </div>
      <div class="glass-card stat-card blue" data-animate="fadeInUp">
        <div class="stat-icon">👷</div>
        <div class="stat-label">Online Workers</div>
        <div class="stat-value" data-count-up="${MOCK_STATS.onlineWorkers}">0</div>
        <div class="stat-change positive">↑ 2 new this week</div>
      </div>
    </div>

    <!-- Pipeline Visualization -->
    <div class="glass-card-static pipeline-viz">
      <div class="viz-header">
        <div class="viz-title">⚡ Live Pipeline</div>
        <div class="badge badge-success"><span class="pulse-dot"></span> Live</div>
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
              ${MOCK_JOBS.slice(0, 6).map(job => `
                <tr class="job-row" data-job-id="${job.id}">
                  <td><span class="mono" style="color: var(--sol-purple-light); font-size: 0.8rem;">${job.id}</span></td>
                  <td><span class="mono" style="font-size: 0.85rem;">${job.name}</span></td>
                  <td style="font-size: 0.85rem; color: var(--text-secondary);">${job.queue}</td>
                  <td>${getStatusBadge(job.status)}</td>
                  <td style="font-size: 0.8rem; color: var(--text-tertiary);">${job.createdAt}</td>
                </tr>
              `).join('')}
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
          ${MOCK_ACTIVITIES.map(act => `
            <div class="activity-item">
              <div class="activity-icon ${act.type}">${act.icon}</div>
              <div class="activity-content">
                <div class="activity-text">${act.text}</div>
                <div class="activity-time">${act.time}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderQueues() {
  return `
    <div class="jobs-header" style="margin-bottom: var(--space-lg);">
      <div class="flex items-center gap-md">
        <h3 class="heading-sm">All Queues</h3>
        <span class="badge badge-info">${MOCK_QUEUES.length} queues</span>
      </div>
      <a href="#/dashboard/create-queue" class="btn btn-primary btn-sm">➕ Create Queue</a>
    </div>
    <div class="queues-grid">
      ${MOCK_QUEUES.map(queue => `
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
            <div class="progress-fill green" style="width: ${(queue.completed / (queue.completed + queue.pending + queue.processing + queue.failed)) * 100}%"></div>
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
      `).join('')}
    </div>
  `;
}

function renderJobs() {
  return `
    <div class="jobs-header">
      <div class="flex items-center gap-md">
        <h3 class="heading-sm">All Jobs</h3>
        <span class="badge badge-info">${MOCK_JOBS.length} jobs</span>
      </div>
      <div class="flex items-center gap-md">
        <div class="jobs-filters">
          <button class="filter-chip active" data-filter="all">All</button>
          <button class="filter-chip" data-filter="pending">Pending</button>
          <button class="filter-chip" data-filter="processing">Processing</button>
          <button class="filter-chip" data-filter="completed">Completed</button>
          <button class="filter-chip" data-filter="failed">Failed</button>
        </div>
        <a href="#/dashboard/submit-job" class="btn btn-primary btn-sm">📨 Submit Job</a>
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
          ${MOCK_JOBS.map(job => `
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
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderWorkers() {
  return `
    <div class="jobs-header" style="margin-bottom: var(--space-lg);">
      <div class="flex items-center gap-md">
        <h3 class="heading-sm">Worker Registry</h3>
        <span class="badge badge-success"><span class="pulse-dot"></span> ${MOCK_WORKERS.filter(w => w.status === 'online').length} Online</span>
      </div>
      <button class="btn btn-primary btn-sm">👷 Register Worker</button>
    </div>
    <div class="workers-grid">
      ${MOCK_WORKERS.map(worker => `
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
      `).join('')}
    </div>
  `;
}

function renderAnalytics() {
  return `
    <div class="charts-grid">
      <!-- Throughput Chart -->
      <div class="glass-card-static chart-card">
        <div class="chart-header">
          <div class="chart-title">📊 Weekly Throughput</div>
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
          <div class="chart-title">🎯 Job Status</div>
        </div>
        <div class="donut-chart" id="donut-chart">
          <svg viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="24"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="#14F195" stroke-width="24"
              stroke-dasharray="${0.85 * 502} ${502}" stroke-dashoffset="0"
              style="transition: stroke-dasharray 1.5s ease;"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="#3b82f6" stroke-width="24"
              stroke-dasharray="${0.08 * 502} ${502}" stroke-dashoffset="${-0.85 * 502}"
              style="transition: stroke-dasharray 1.5s ease;"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="#9945FF" stroke-width="24"
              stroke-dasharray="${0.04 * 502} ${502}" stroke-dashoffset="${-(0.85 + 0.08) * 502}"
              style="transition: stroke-dasharray 1.5s ease;"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="#ff4545" stroke-width="24"
              stroke-dasharray="${0.03 * 502} ${502}" stroke-dashoffset="${-(0.85 + 0.08 + 0.04) * 502}"
              style="transition: stroke-dasharray 1.5s ease;"/>
          </svg>
          <div class="donut-center">
            <div class="donut-value text-gradient">97.3%</div>
            <div class="donut-label">Success</div>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-dot" style="background: var(--sol-green);"></div>
            <span>Completed</span>
            <span class="legend-value">85%</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: var(--sol-blue);"></div>
            <span>Processing</span>
            <span class="legend-value">8%</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: var(--sol-purple);"></div>
            <span>Pending</span>
            <span class="legend-value">4%</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: var(--color-error);"></div>
            <span>Failed</span>
            <span class="legend-value">3%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Line Chart -->
    <div class="glass-card-static chart-card" style="margin-bottom: var(--space-lg);">
      <div class="chart-header">
        <div class="chart-title">📈 24h Job Completion Trend</div>
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
        <div class="stat-icon">⏱️</div>
        <div class="stat-label">Avg Processing Time</div>
        <div class="stat-value">${MOCK_STATS.avgProcessingTime}</div>
        <div class="stat-change positive">↓ 0.3s faster</div>
      </div>
      <div class="glass-card stat-card purple">
        <div class="stat-icon">🔄</div>
        <div class="stat-label">Retry Rate</div>
        <div class="stat-value">2.7%</div>
        <div class="stat-change positive">↓ 0.5% improvement</div>
      </div>
      <div class="glass-card stat-card green">
        <div class="stat-icon">📊</div>
        <div class="stat-label">Queue Utilization</div>
        <div class="stat-value">78%</div>
        <div class="stat-change positive">↑ 5% vs last week</div>
      </div>
    </div>
  `;
}

function renderCreateQueue() {
  return `
    <div class="glass-card-static" style="padding: var(--space-xl); max-width: 700px;">
      <h3 class="heading-sm" style="margin-bottom: var(--space-xl);">Create New Queue</h3>
      <div class="create-form">
        <div class="form-group">
          <label>Queue Name</label>
          <input type="text" class="input-field" placeholder="e.g., email-notifications" id="queue-name-input">
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
            ➕ Create Queue
          </button>
          <a href="#/dashboard" class="btn btn-secondary">Cancel</a>
        </div>
      </div>
    </div>
  `;
}

function renderSubmitJob() {
  return `
    <div class="glass-card-static" style="padding: var(--space-xl); max-width: 700px;">
      <h3 class="heading-sm" style="margin-bottom: var(--space-xl);">Submit New Job</h3>
      <div class="create-form">
        <div class="form-group">
          <label>Queue</label>
          <select class="select-field" id="job-queue-select">
            ${MOCK_QUEUES.filter(q => q.status === 'active').map(q => `
              <option value="${q.id}">${q.name}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Job Name</label>
          <input type="text" class="input-field" placeholder="e.g., send_welcome_email" id="job-name-input">
        </div>
        <div class="form-group">
          <label>Priority</label>
          <select class="select-field" id="job-priority">
            <option value="high">🔴 High</option>
            <option value="medium" selected>🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
        <div class="form-group">
          <label>Payload (JSON)</label>
          <textarea class="input-field mono" rows="6" placeholder='{"to": "user@example.com", "template": "welcome"}' id="job-payload" style="resize: vertical; font-size: 0.85rem;"></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" id="submit-job-btn">
            📨 Submit Job
          </button>
          <a href="#/dashboard/jobs" class="btn btn-secondary">Cancel</a>
        </div>
      </div>
    </div>
  `;
}

function renderSettings() {
  const ws = getWalletState();
  const mode = getDataMode();
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
        </div>
        <div class="form-group">
          <label class="flex items-center gap-md">
            <label class="toggle">
              <input type="checkbox" ${mode === 'live' ? 'checked' : ''} id="settings-live-data">
              <span class="toggle-slider"></span>
            </label>
            Use live on-chain data (requires wallet + deployed program)
          </label>
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
          <button class="btn btn-primary" id="save-settings-btn">💾 Save Settings</button>
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
          <button class="btn btn-secondary btn-sm">🔄 Retry Job</button>
          <a href="#" class="btn btn-primary btn-sm" target="_blank">🔗 View on Explorer</a>
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
    high: '<span style="color: var(--color-error); font-size: 0.8rem; font-weight: 600;">🔴 High</span>',
    medium: '<span style="color: var(--color-warning); font-size: 0.8rem; font-weight: 600;">🟡 Medium</span>',
    low: '<span style="color: var(--sol-green); font-size: 0.8rem; font-weight: 600;">🟢 Low</span>',
  };
  return badges[priority] || escapeHtml(priority);
}

export function initDashboard(page) {
  // Cleanup previous animations
  destroyAnimations();

  // Initialize sidebar navigation
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      const nextPage = item.getAttribute('data-page');
      window.location.hash = `/dashboard/${nextPage}`;
    });
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
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
    const barCanvas = document.getElementById('bar-chart');
    if (barCanvas) {
      barChartAnim = new BarChartAnimation(barCanvas, MOCK_CHART_DATA.throughput, '#9945FF');
    }

    const lineCanvas = document.getElementById('line-chart');
    if (lineCanvas) {
      lineChartAnim = new LineChartAnimation(lineCanvas, [
        { data: MOCK_CHART_DATA.lineData.completed, color: '#14F195' },
        { data: MOCK_CHART_DATA.lineData.failed, color: '#ff4545' },
      ]);
    }
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

function showJobDetail(jobId) {
  const job = MOCK_JOBS.find(j => j.id === jobId);
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
