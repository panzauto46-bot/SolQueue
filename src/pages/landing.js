import { FEATURES_DATA } from '../utils/mock-data.js';

const ICON_BOLT = `
<svg class="btn-inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="currentColor"></path>
</svg>`;

const ICON_ARCHITECTURE = `
<svg class="btn-inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <rect x="3" y="3" width="7" height="7" rx="1.2"></rect>
  <rect x="14" y="3" width="7" height="7" rx="1.2"></rect>
  <rect x="3" y="14" width="7" height="7" rx="1.2"></rect>
  <rect x="14" y="14" width="7" height="7" rx="1.2"></rect>
</svg>`;

const ICON_DOC = `
<svg class="btn-inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
  <path d="M14 3v6h6"></path>
  <path d="M9 13h6"></path>
  <path d="M9 17h6"></path>
</svg>`;

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
            ⬡ GitHub
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
            ${ICON_BOLT}<span>Launch App</span>
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
        <div class="section-label">⚙️ How It Works</div>
        <h2 class="heading-lg section-title">Job Pipeline <span class="text-gradient">Flow</span></h2>
        <p class="section-desc">
          From submission to completion, each transition is deterministic, atomic, and auditable on Devnet.
        </p>
      </div>
      <div class="pipeline-container">
        <div class="pipeline-flow">
          <div class="pipeline-node" data-animate="fadeInUp">
            <div class="pipeline-node-icon producer">📤</div>
            <div class="pipeline-node-label">Producer</div>
            <div class="pipeline-node-desc">Submits jobs with payload & priority</div>
          </div>
          <div class="pipeline-arrow">
            <div class="arrow-line"></div>
            <div class="arrow-head"></div>
          </div>
          <div class="pipeline-node" data-animate="fadeInUp">
            <div class="pipeline-node-icon queue">📋</div>
            <div class="pipeline-node-label">Queue (PDA)</div>
            <div class="pipeline-node-desc">On-chain account stores job state</div>
          </div>
          <div class="pipeline-arrow">
            <div class="arrow-line"></div>
            <div class="arrow-head"></div>
          </div>
          <div class="pipeline-node" data-animate="fadeInUp">
            <div class="pipeline-node-icon worker">👷</div>
            <div class="pipeline-node-label">Worker</div>
            <div class="pipeline-node-desc">Claims & processes atomically</div>
          </div>
          <div class="pipeline-arrow">
            <div class="arrow-line"></div>
            <div class="arrow-head"></div>
          </div>
          <div class="pipeline-node" data-animate="fadeInUp">
            <div class="pipeline-node-icon result">✅</div>
            <div class="pipeline-node-label">Result</div>
            <div class="pipeline-node-desc">Completed with result payload</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features-section container" id="features">
      <div class="section-header">
        <div class="section-label">🧩 Features</div>
        <h2 class="heading-lg section-title">Everything a <span class="text-gradient">Queue Needs</span></h2>
        <p class="section-desc">
          Core backend queue capabilities translated into Solana-native account patterns.
        </p>
      </div>
      <div class="features-grid">
        ${FEATURES_DATA.map((f, i) => `
          <div class="glass-card feature-card" data-animate="fadeInUp" style="animation-delay: ${i * 0.1}s">
            <div class="feature-icon" style="background: rgba(var(--feature-${f.color}-rgb, 153, 69, 255), 0.15)">
              ${f.icon}
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
        <div class="section-label">🔀 Comparison</div>
        <h2 class="heading-lg section-title">Web2 <span class="text-gradient">vs</span> Solana</h2>
        <p class="section-desc">
          Side-by-side mapping of Web2 queue infrastructure to on-chain program design.
        </p>
      </div>
      <div class="comparison-grid">
        <div class="glass-card-static comparison-card web2">
          <div class="card-header">
            <div class="icon">🖥️</div>
            <div class="card-title">Traditional Backend</div>
          </div>
          <div class="comparison-list">
            <div class="comparison-item">
              <span class="item-icon">📦</span>
              <span>Jobs stored in Redis/RabbitMQ in-memory</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">🔗</span>
              <span>Workers connect via TCP/AMQP protocol</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">🔒</span>
              <span>Distributed locks prevent double-processing</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">📊</span>
              <span>Metrics via external monitoring (Prometheus)</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">⚡</span>
              <span>Sub-millisecond latency, push model</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">🏗️</span>
              <span>Requires infrastructure management</span>
            </div>
          </div>
        </div>
        <div class="comparison-vs">
          <span>VS</span>
        </div>
        <div class="glass-card-static comparison-card solana">
          <div class="card-header">
            <div class="icon">◎</div>
            <div class="card-title">SolQueue (On-Chain)</div>
          </div>
          <div class="comparison-list">
            <div class="comparison-item">
              <span class="item-icon">🔗</span>
              <span>Jobs are PDAs (Program Derived Addresses)</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">⚛️</span>
              <span>Workers claim via atomic transactions</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">🔐</span>
              <span>No locks needed — Solana runtime atomicity</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">📊</span>
              <span>Metrics on-chain, fully transparent & auditable</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">⏱️</span>
              <span>~400ms confirmation, pull model</span>
            </div>
            <div class="comparison-item">
              <span class="item-icon">🌐</span>
              <span>Serverless — no infrastructure to manage</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Architecture -->
    <section class="architecture-section container" id="architecture">
      <div class="section-header">
        <div class="section-label">📐 Architecture</div>
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
              <div class="arch-account">🌐 Web Dashboard</div>
              <div class="arch-account">⌨️ CLI Tool</div>
              <div class="arch-account">📡 SDK (TypeScript)</div>
            </div>
          </div>
          <div class="arch-connector"><div class="connector-line"></div></div>
          <div class="arch-layer program">
            <span class="arch-layer-label">Solana Program (Rust/Anchor)</span>
            <div class="arch-accounts">
              <div class="arch-account">📋 create_queue</div>
              <div class="arch-account">📨 submit_job</div>
              <div class="arch-account">🤚 claim_job</div>
              <div class="arch-account">✅ complete_job</div>
              <div class="arch-account">❌ fail_job</div>
              <div class="arch-account">👷 register_worker</div>
              <div class="arch-account">🔄 retry_job</div>
            </div>
          </div>
          <div class="arch-connector"><div class="connector-line"></div></div>
          <div class="arch-layer state">
            <span class="arch-layer-label">On-Chain State (PDAs)</span>
            <div class="arch-accounts">
              <div class="arch-account">📦 QueueConfig</div>
              <div class="arch-account">📄 JobAccount</div>
              <div class="arch-account">👤 WorkerAccount</div>
              <div class="arch-account">📊 QueueMetrics</div>
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
          <a href="#/dashboard" class="btn btn-primary btn-lg">${ICON_BOLT}<span>Launch App</span></a>
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
