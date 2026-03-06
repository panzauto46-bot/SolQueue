import { FEATURES_DATA } from '../utils/mock-data.js';

const icon = (paths, className = 'ui-icon') => `
<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
  ${paths}
</svg>`;

const ICON_BOLT = icon('<path d="M13 2 4 14h6l-1 8 9-12h-6z"></path>');
const ICON_BOLT_BTN = icon('<path d="M13 2 4 14h6l-1 8 9-12h-6z"></path>', 'btn-inline-icon');
const ICON_ARCH_GRID = icon('<rect x="3" y="3" width="7" height="7" rx="1.2"></rect><rect x="14" y="3" width="7" height="7" rx="1.2"></rect><rect x="3" y="14" width="7" height="7" rx="1.2"></rect><rect x="14" y="14" width="7" height="7" rx="1.2"></rect>');
const ICON_ARCHITECTURE = icon('<rect x="3" y="3" width="7" height="7" rx="1.2"></rect><rect x="14" y="3" width="7" height="7" rx="1.2"></rect><rect x="3" y="14" width="7" height="7" rx="1.2"></rect><rect x="14" y="14" width="7" height="7" rx="1.2"></rect>', 'btn-inline-icon');
const ICON_DOC = icon('<path d="M7 3h8l4 4v14H7z"></path><path d="M15 3v4h4"></path><path d="M9 13h6"></path><path d="M9 17h6"></path>', 'btn-inline-icon');

const ICON_PIPE_PRODUCER = icon('<path d="M22 2 11 13"></path><path d="M22 2 15 22l-4-9-9-4 20-7z"></path>');
const ICON_PIPE_QUEUE = icon('<rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M8 8h8M8 12h8M8 16h5"></path>');
const ICON_PIPE_WORKER = icon('<circle cx="12" cy="8" r="3"></circle><path d="M5 20c1.8-3.1 4.1-4.5 7-4.5s5.2 1.4 7 4.5"></path>');
const ICON_PIPE_RESULT = icon('<circle cx="12" cy="12" r="9"></circle><path d="m8.5 12.5 2.3 2.3 4.7-5.1"></path>');

const ICON_LINK = icon('<path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13"></path><path d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 0 1-7-7L7 11"></path>', 'ui-icon ui-icon-xs');
const ICON_LOCK = icon('<rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>', 'ui-icon ui-icon-xs');
const ICON_CHART = icon('<path d="M4 20h16"></path><path d="M7 16v-5"></path><path d="M12 16V7"></path><path d="M17 16v-3"></path>', 'ui-icon ui-icon-xs');
const ICON_CLOCK = icon('<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>', 'ui-icon ui-icon-xs');
const ICON_GLOBE = icon('<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3c2.5 2.5 2.5 15.5 0 18"></path><path d="M12 3c-2.5 2.5-2.5 15.5 0 18"></path>', 'ui-icon ui-icon-xs');
const ICON_SERVER = icon('<rect x="3" y="4" width="18" height="6" rx="2"></rect><rect x="3" y="14" width="18" height="6" rx="2"></rect><path d="M7 7h.01M7 17h.01"></path>');
const ICON_SOLANA = icon('<circle cx="12" cy="12" r="9"></circle><path d="M8 9h8M7.5 12h8M8 15h8"></path>');
const ICON_TERMINAL = icon('<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m7 10 3 2-3 2"></path><path d="M13 15h4"></path>');
const ICON_RADIO = icon('<circle cx="12" cy="12" r="2"></circle><path d="M16.2 7.8a6 6 0 0 1 0 8.4"></path><path d="M7.8 16.2a6 6 0 0 1 0-8.4"></path><path d="M19 5a10 10 0 0 1 0 14"></path><path d="M5 19A10 10 0 0 1 5 5"></path>');
const ICON_BOX = icon('<path d="M3 8 12 3l9 5-9 5-9-5z"></path><path d="M3 8v8l9 5 9-5V8"></path>', 'ui-icon ui-icon-xs');
const ICON_FILE = icon('<path d="M7 3h8l4 4v14H7z"></path><path d="M15 3v4h4"></path>', 'ui-icon ui-icon-xs');
const ICON_USER = icon('<circle cx="12" cy="8" r="3"></circle><path d="M5 20c1.8-3.1 4.1-4.5 7-4.5s5.2 1.4 7 4.5"></path>', 'ui-icon ui-icon-xs');
const ICON_RETRY = icon('<path d="M21 4v6h-6"></path><path d="M3 20v-6h6"></path><path d="M20 10a8 8 0 0 0-14-3l-3 3"></path><path d="M4 14a8 8 0 0 0 14 3l3-3"></path>');
const ICON_FAIL = icon('<circle cx="12" cy="12" r="9"></circle><path d="m9 9 6 6M15 9l-6 6"></path>', 'ui-icon ui-icon-xs');

const FEATURE_ICON_MAP = {
    'Job Submission': ICON_PIPE_PRODUCER,
    'Priority Queue': ICON_BOLT,
    'Retry & Backoff': ICON_RETRY,
    'Worker Registry': ICON_PIPE_WORKER,
    'Atomic Claims': ICON_LOCK,
    'On-chain Analytics': ICON_CHART,
};

export function renderLandingPage() {
    return `
    <!-- Navigation -->
    <nav class="landing-nav" id="landing-nav">
      <div class="nav-inner">
        <a href="#/" class="nav-logo">
          <div class="logo-icon">◈</div>
          <div class="logo-text"><span>Sol</span>Queue</div>
        </a>
        <div class="nav-links-group">
          <div class="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <a href="#architecture">Architecture</a>
            <a href="#comparison">Web2 vs Solana</a>
          </div>
        </div>
        <div class="nav-actions">
          <a href="https://github.com/panzauto46-bot/SolQueue" target="_blank" class="btn btn-ghost btn-sm">
            GitHub
          </a>
          <a href="#/dashboard" class="btn btn-primary btn-sm">
            Launch App →
          </a>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section" id="hero">
      <div class="hero-glow-1"></div>
      <div class="hero-glow-2"></div>
      <div class="hero-content">
        <div class="hero-badge">
          <span class="pulse-dot"></span>
          Built on Solana · Devnet Live
        </div>
        <h1 class="heading-xl hero-title">
          <span class="line">On-Chain</span>
          <span class="line"><span class="text-gradient highlight">Job Queue</span> System</span>
        </h1>
        <p class="hero-subtitle">
          Rebuilding the backend queue pattern as a Solana state machine.
          SolQueue maps Web2 queue workflows into PDAs, atomic claims, retries,
          and transparent on-chain metrics using Rust + Anchor.
        </p>
        <div class="hero-actions">
          <a href="#/dashboard" class="btn btn-primary btn-lg">
            ${ICON_BOLT_BTN}<span>Launch App</span>
          </a>
          <a href="#architecture" class="btn btn-secondary btn-lg">
            ${ICON_ARCHITECTURE}<span>View Architecture</span>
          </a>
        </div>
        <div class="judge-strip">
          <div class="judge-label">For Judges</div>
          <div class="judge-links">
            <a href="https://github.com/panzauto46-bot/SolQueue" target="_blank">GitHub Repo</a>
            <a href="https://solscan.io/account/GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64?cluster=devnet" target="_blank">Devnet Program</a>
            <a href="https://solscan.io/tx/5JFf82paxM7QsggEpyTbhxZ6vH5JgHBopgsKDhj5T9pxRPXKGmoaWPWfdPb8aJ3qK2m8qR5b79wbYcJDT3eBQXkv?cluster=devnet" target="_blank">Deploy Tx</a>
            <a href="https://solscan.io/tx/3J2bgv51RrG81MA6avdLt3rJ1W2C6VYh8sBu9Pb4ZY5NNqrQZmfVHtVAmxEsiBx6Tx5m2eyNih2Nm5g6jchuu4GP?cluster=devnet" target="_blank">Core Flow Tx</a>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="stat-number" data-count="12847">0</div>
            <div class="stat-label">Jobs Processed</div>
          </div>
          <div class="hero-stat">
            <div class="stat-number" data-count="97">0</div>
            <div class="stat-label">Success Rate %</div>
          </div>
          <div class="hero-stat">
            <div class="stat-number" data-count="842">0</div>
            <div class="stat-label">Throughput/hr</div>
          </div>
          <div class="hero-stat">
            <div class="stat-number" data-count="24">0</div>
            <div class="stat-label">Active Workers</div>
          </div>
        </div>
      </div>

      <!-- Terminal Demo -->
      <div class="container">
        <div class="code-terminal">
          <div class="terminal-header">
            <div class="terminal-dot red"></div>
            <div class="terminal-dot yellow"></div>
            <div class="terminal-dot green"></div>
            <span class="terminal-title">solqueue-cli — Devnet</span>
          </div>
          <div class="terminal-body" id="terminal-body">
          </div>
        </div>
      </div>
    </section>

    <!-- Pipeline / How it Works -->
    <section class="pipeline-section container" id="how-it-works">
      <div class="section-header">
        <div class="section-label">How It Works</div>
        <h2 class="heading-lg section-title">Job Pipeline <span class="text-gradient">Flow</span></h2>
        <p class="section-desc">
          From submission to completion, each transition is deterministic, atomic, and auditable on Devnet.
        </p>
      </div>
      <div class="pipeline-container">
        <div class="pipeline-flow">
          <div class="pipeline-node" data-animate="fadeInUp">
            <div class="pipeline-node-icon producer">${ICON_PIPE_PRODUCER}</div>
            <div class="pipeline-node-label">Producer</div>
            <div class="pipeline-node-desc">Submits jobs with payload & priority</div>
          </div>
          <div class="pipeline-arrow">
            <div class="arrow-line"></div>
            <div class="arrow-head"></div>
          </div>
          <div class="pipeline-node" data-animate="fadeInUp">
            <div class="pipeline-node-icon queue">${ICON_PIPE_QUEUE}</div>
            <div class="pipeline-node-label">Queue (PDA)</div>
            <div class="pipeline-node-desc">On-chain account stores job state</div>
          </div>
          <div class="pipeline-arrow">
            <div class="arrow-line"></div>
            <div class="arrow-head"></div>
          </div>
          <div class="pipeline-node" data-animate="fadeInUp">
            <div class="pipeline-node-icon worker">${ICON_PIPE_WORKER}</div>
            <div class="pipeline-node-label">Worker</div>
            <div class="pipeline-node-desc">Claims & processes atomically</div>
          </div>
          <div class="pipeline-arrow">
            <div class="arrow-line"></div>
            <div class="arrow-head"></div>
          </div>
          <div class="pipeline-node" data-animate="fadeInUp">
            <div class="pipeline-node-icon result">${ICON_PIPE_RESULT}</div>
            <div class="pipeline-node-label">Result</div>
            <div class="pipeline-node-desc">Completed with result payload</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features-section container" id="features">
      <div class="section-header">
        <div class="section-label">Features</div>
        <h2 class="heading-lg section-title">Everything a <span class="text-gradient">Queue Needs</span></h2>
        <p class="section-desc">
          Core backend queue capabilities translated into Solana-native account patterns.
        </p>
      </div>
      <div class="features-grid">
        ${FEATURES_DATA.map((f, i) => `
          <div class="glass-card feature-card" data-animate="fadeInUp" style="animation-delay: ${i * 0.1}s">
            <div class="feature-icon" style="background: rgba(var(--feature-${f.color}-rgb, 153, 69, 255), 0.15)">
              ${FEATURE_ICON_MAP[f.title] || ICON_ARCH_GRID}
            </div>
            <h3 class="feature-title">${f.title}</h3>
            <p class="feature-desc">${f.desc}</p>
            <div class="feature-line"></div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Web2 vs Solana Comparison -->
    <section class="comparison-section container" id="comparison">
      <div class="section-header">
        <div class="section-label">Comparison</div>
        <h2 class="heading-lg section-title">Web2 <span class="text-gradient">vs</span> Solana</h2>
        <p class="section-desc">
          Side-by-side mapping of Web2 queue infrastructure to on-chain program design.
        </p>
      </div>
      <div class="comparison-grid">
        <div class="glass-card-static comparison-card web2">
          <div class="card-header">
            <div class="icon">${ICON_SERVER}</div>
            <div class="card-title">Traditional Backend</div>
          </div>
          <div class="comparison-list">
            <div class="comparison-item">
              <span class="item-icon">${ICON_BOX}</span>
              <span>Jobs stored in Redis/RabbitMQ in-memory</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">${ICON_LINK}</span>
              <span>Workers connect via TCP/AMQP protocol</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">${ICON_LOCK}</span>
              <span>Distributed locks prevent double-processing</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">${ICON_CHART}</span>
              <span>Metrics via external monitoring (Prometheus)</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">${ICON_BOLT}</span>
              <span>Sub-millisecond latency, push model</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">${ICON_ARCH_GRID}</span>
              <span>Requires infrastructure management</span>
            </div>
          </div>
        </div>
        <div class="comparison-vs">
          <span>VS</span>
        </div>
        <div class="glass-card-static comparison-card solana">
          <div class="card-header">
            <div class="icon">${ICON_SOLANA}</div>
            <div class="card-title">SolQueue (On-Chain)</div>
          </div>
          <div class="comparison-list">
            <div class="comparison-item">
              <span class="item-icon">${ICON_LINK}</span>
              <span>Jobs are PDAs (Program Derived Addresses)</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">${ICON_PIPE_WORKER}</span>
              <span>Workers claim via atomic transactions</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">${ICON_LOCK}</span>
              <span>No locks needed — Solana runtime atomicity</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">${ICON_CHART}</span>
              <span>Metrics on-chain, fully transparent & auditable</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">${ICON_CLOCK}</span>
              <span>~400ms confirmation, pull model</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">${ICON_GLOBE}</span>
              <span>Serverless — no infrastructure to manage</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Architecture -->
    <section class="architecture-section container" id="architecture">
      <div class="section-header">
        <div class="section-label">Architecture</div>
        <h2 class="heading-lg section-title">On-Chain <span class="text-gradient">Account Model</span></h2>
        <p class="section-desc">
          Queue state, permissions, and execution mapped into PDAs and instruction flows.
        </p>
      </div>
      <div class="glass-card-static arch-diagram">
        <div class="arch-layers">
          <div class="arch-layer client">
            <span class="arch-layer-label">Client Layer</span>
            <div class="arch-accounts">
              <div class="arch-account">${ICON_GLOBE}<span>Web Dashboard</span></div>
              <div class="arch-account">${ICON_TERMINAL}<span>CLI Tool</span></div>
              <div class="arch-account">${ICON_RADIO}<span>SDK (TypeScript)</span></div>
            </div>
          </div>
          <div class="arch-connector"><div class="connector-line"></div></div>
          <div class="arch-layer program">
            <span class="arch-layer-label">Solana Program (Rust/Anchor)</span>
            <div class="arch-accounts">
              <div class="arch-account">${ICON_PIPE_QUEUE}<span>create_queue</span></div>
              <div class="arch-account">${ICON_PIPE_PRODUCER}<span>submit_job</span></div>
              <div class="arch-account">${ICON_LINK}<span>claim_job</span></div>
              <div class="arch-account">${ICON_PIPE_RESULT}<span>complete_job</span></div>
              <div class="arch-account">${ICON_FAIL}<span>fail_job</span></div>
              <div class="arch-account">${ICON_PIPE_WORKER}<span>register_worker</span></div>
              <div class="arch-account">${ICON_RETRY}<span>retry_job</span></div>
            </div>
          </div>
          <div class="arch-connector"><div class="connector-line"></div></div>
          <div class="arch-layer state">
            <span class="arch-layer-label">On-Chain State (PDAs)</span>
            <div class="arch-accounts">
              <div class="arch-account">${ICON_BOX}<span>QueueConfig</span></div>
              <div class="arch-account">${ICON_FILE}<span>JobAccount</span></div>
              <div class="arch-account">${ICON_USER}<span>WorkerAccount</span></div>
              <div class="arch-account">${ICON_CHART}<span>QueueMetrics</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section container">
      <div class="cta-card">
        <h2 class="heading-lg cta-title">Ready to <span class="text-gradient">Queue On-Chain</span>?</h2>
        <p class="cta-desc">
          Open the app, create a queue, submit a job, and inspect each state transition on Solana Devnet.
        </p>
        <div class="cta-actions">
          <a href="#/dashboard" class="btn btn-primary btn-lg">${ICON_BOLT_BTN}<span>Launch App</span></a>
          <a href="https://github.com/panzauto46-bot/SolQueue#readme" target="_blank" class="btn btn-secondary btn-lg">${ICON_DOC}<span>Read Docs</span></a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-inner">
        <div class="footer-text">
          © 2026 SolQueue — Built for Superteam Poland Hackathon
        </div>
        <div class="footer-links">
          <a href="https://github.com/panzauto46-bot/SolQueue" target="_blank">GitHub</a>
          <a href="https://solana.com" target="_blank">Solana</a>
          <a href="https://anchor-lang.com" target="_blank">Anchor</a>
        </div>
      </div>
    </footer>
  `;
}

export function initLandingPage() {
    // Scroll navigation effect
    const nav = document.getElementById('landing-nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }

    // Animated counter
    animateCounters();

    // Terminal typing animation
    animateTerminal();

    // Intersection Observer for scroll animations
    initScrollAnimations();
}

function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);

            counter.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString();
            }
        }

        // Start after a short delay
        setTimeout(() => requestAnimationFrame(updateCounter), 800);
    });
}

function animateTerminal() {
    const terminal = document.getElementById('terminal-body');
    if (!terminal) return;

    const lines = [
        { type: 'cmd', prompt: '$ ', text: 'solqueue init --name "email-notifications" --priority high' },
        { type: 'output', text: '✓ Queue created: email-notifications (QueueConfig PDA: 7xKX...9mPw)' },
        { type: 'empty' },
        { type: 'cmd', prompt: '$ ', text: 'solqueue submit --queue email-notifications --payload \'{"to":"user@sol.com"}\'' },
        { type: 'output', text: '✓ Job submitted: job-001 (JobAccount PDA: 3pFR...kL2x) | Priority: HIGH' },
        { type: 'empty' },
        { type: 'cmd', prompt: '$ ', text: 'solqueue worker register --queue email-notifications' },
        { type: 'output', text: '✓ Worker registered: W-01 (WorkerAccount PDA: 9dVQ...nB7y)' },
        { type: 'output', text: '→ Claiming job-001...' },
        { type: 'success', text: '✓ Job job-001 completed! Result: "email_sent" | Time: 1.2s' },
        { type: 'empty' },
        { type: 'cmd', prompt: '$ ', text: 'solqueue stats --queue email-notifications' },
        { type: 'output', text: '  Pending: 45 | Processing: 12 | Completed: 3,420 | Failed: 8' },
        { type: 'success', text: '  Success Rate: 99.7% | Throughput: 120 jobs/hr' },
    ];

    let lineIndex = 0;
    let charIndex = 0;

    function typeLine() {
        if (lineIndex >= lines.length) {
            // Add cursor at the end
            const cursorLine = document.createElement('div');
            cursorLine.classList.add('terminal-line');
            cursorLine.innerHTML = '<span class="terminal-prompt">$ </span><span class="terminal-cursor"></span>';
            terminal.appendChild(cursorLine);
            return;
        }

        const line = lines[lineIndex];

        if (line.type === 'empty') {
            const el = document.createElement('div');
            el.style.height = '8px';
            terminal.appendChild(el);
            lineIndex++;
            setTimeout(typeLine, 100);
            return;
        }

        if (line.type === 'cmd') {
            if (charIndex === 0) {
                const el = document.createElement('div');
                el.classList.add('terminal-line');
                el.id = `term-line-${lineIndex}`;
                el.innerHTML = `<span class="terminal-prompt">${line.prompt}</span><span class="terminal-cmd"></span>`;
                terminal.appendChild(el);
            }

            const cmdEl = document.querySelector(`#term-line-${lineIndex} .terminal-cmd`);
            if (charIndex < line.text.length) {
                cmdEl.textContent = line.text.substring(0, charIndex + 1);
                charIndex++;
                setTimeout(typeLine, 20 + Math.random() * 30);
            } else {
                charIndex = 0;
                lineIndex++;
                setTimeout(typeLine, 300);
            }
        } else {
            const el = document.createElement('div');
            el.classList.add('terminal-line');
            const className = line.type === 'success' ? 'terminal-success' : 'terminal-output';
            el.innerHTML = `<span class="${className}">${line.text}</span>`;
            el.style.opacity = '0';
            el.style.transform = 'translateX(-10px)';
            terminal.appendChild(el);

            requestAnimationFrame(() => {
                el.style.transition = 'all 0.3s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateX(0)';
            });

            lineIndex++;
            setTimeout(typeLine, 150);
        }

        // Auto-scroll terminal
        terminal.scrollTop = terminal.scrollHeight;
    }

    // Start typing after page loads
    setTimeout(typeLine, 1500);
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                const animType = entry.target.getAttribute('data-animate');
                if (animType) {
                    entry.target.classList.add(`animate-${animType}`);
                }
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });
}
