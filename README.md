<p align="center">
  <img src="docs/assets/solqueue-banner.svg" alt="SolQueue Banner" width="800"/>
</p>

<h1 align="center">◈ SolQueue</h1>
<h3 align="center">On-Chain Job Queue System — Built on Solana</h3>

<p align="center">
  <strong>Rebuilding traditional backend message queue patterns as a Solana program written in Rust.</strong>
</p>

<p align="center">
  <a href="https://solana.com"><img src="https://img.shields.io/badge/Built_on-Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white" alt="Solana"/></a>
  <a href="https://www.anchor-lang.com/"><img src="https://img.shields.io/badge/Framework-Anchor_v0.30.1-14F195?style=for-the-badge" alt="Anchor"/></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Language-Rust-orange?style=for-the-badge&logo=rust&logoColor=white" alt="Rust"/></a>
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License"/></a>
  <img src="https://img.shields.io/badge/Phase_2-Solana_Program_✅-14F195?style=for-the-badge" alt="Phase 2"/>
</p>

<p align="center">
  <a href="#-live-demo">Live Demo</a> •
  <a href="#-submission-checklist">Submission Checklist</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-devnet-deployment">Devnet</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

---

## 🔗 Live Demo

- **Web App (Vercel):** https://solqueue.vercel.app
- **Public GitHub Repo:** https://github.com/panzauto46-bot/SolQueue
- **Devnet Program:** [GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64](https://solscan.io/account/GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64?cluster=devnet)
- **Devnet Deploy Tx:** [View on Solscan](https://solscan.io/tx/5JFf82paxM7QsggEpyTbhxZ6vH5JgHBopgsKDhj5T9pxRPXKGmoaWPWfdPb8aJ3qK2m8qR5b79wbYcJDT3eBQXkv?cluster=devnet)

---

## ✅ Submission Checklist

| Mandatory Requirement | Status | Evidence |
|-----------------------|--------|----------|
| Rust program (Anchor or native SDK) | ✅ | `programs/solqueue/src` |
| On-chain program deployed to Devnet | ✅ | Program ID + deploy tx in **Devnet Deployment** section |
| Public GitHub repo | ✅ | https://github.com/panzauto46-bot/SolQueue |
| Architecture explanation in README | ✅ | **Architecture**, **Web2 vs Solana**, **Tradeoffs & Constraints** |
| Web2 flow explanation | ✅ | **Web2 → Solana Translation** section |
| Solana flow explanation | ✅ | **Account Model** + instruction flow sections |
| Tradeoffs and constraints | ✅ | **Tradeoffs & Constraints** section |
| Devnet transaction links | ✅ | **Transaction Links** section |
| Testable client (frontend or CLI) | ✅ | Vercel dashboard + `cli/index.js` |

---

## 📖 Overview

**SolQueue** takes the familiar concept of a backend job queue — think Redis Queue, RabbitMQ, Amazon SQS, or Bull — and rebuilds its core logic as a **Solana on-chain program** using Rust and the Anchor framework.

The goal is to reframe Solana as a **distributed state-machine backend**, not just a crypto tool, and demonstrate how familiar Web2 backend patterns can be redesigned using on-chain architecture.

### Why a Job Queue?

Job queues are the backbone of modern backend systems. They power:
- 📧 Email delivery pipelines
- 📊 Data processing workflows  
- 🖼️ Image/video transcoding
- 🔔 Webhook delivery systems
- 📋 Report generation
- 🔄 Database synchronization

By bringing this pattern **on-chain**, we demonstrate that Solana can serve as a **trustless, transparent, and serverless backend** — with properties that traditional infrastructure simply cannot provide.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📋 **Queue Management** | Create, configure, pause, and resume multiple independent queues |
| 📨 **Job Submission** | Submit jobs with custom payloads, priorities (High/Medium/Low), and TTL |
| 👷 **Worker Registry** | Workers register on-chain and receive jobs through atomic claims |
| ⚡ **Priority Queue** | Three-tier priority system ensures critical jobs are processed first |
| 🔄 **Retry & Backoff** | Configurable retry policies with exponential backoff on failure |
| 🔒 **Atomic Claims** | Solana's runtime atomicity eliminates race conditions — no distributed locks needed |
| 📊 **On-Chain Analytics** | Success rates, throughput, and processing times stored transparently on-chain |
| ⏱️ **Job TTL & Expiry** | Expired jobs can be reclaimed or cleaned up automatically |
| 🔀 **Demo ↔ Live Data Mode** | Hybrid UX: demo dataset by default, one-click switch to live on-chain data when wallet is connected |
| ✅ **Form Validation & Feedback** | Create Queue / Submit Job forms include strict validation, mode-aware hints, and transaction feedback |
| 🔍 **State Machine** | Complete job lifecycle: `Pending → Processing → Completed/Failed` |
| 🌐 **Web Dashboard** | Professional real-time dashboard with 3D animations and live monitoring |

---

## 🏗️ Architecture

### Web2 → Solana Translation

```
┌─────────────────────────────────────────────────────────────────┐
│                     TRADITIONAL (Web2)                          │
│                                                                 │
│   Producer ──► Redis/RabbitMQ ──► Worker ──► Result Store       │
│                  (in-memory)       (TCP)      (Database)        │
│                                                                 │
│   ⚠️  Requires: Infrastructure, distributed locks, monitoring  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SOLQUEUE (On-Chain)                          │
│                                                                 │
│   Producer ──► Queue PDA ──► Worker (Atomic Claim) ──► Result   │
│                (on-chain)     (transaction)          (on-chain)  │
│                                                                 │
│   ✅  Serverless, trustless, transparent, zero infrastructure   │
└─────────────────────────────────────────────────────────────────┘
```

### Account Model

SolQueue maps traditional queue concepts to Solana's **Program Derived Addresses (PDAs)**:

```
┌──────────────────────────────────────────────────────┐
│                  CLIENT LAYER                         │
│                                                      │
│   🌐 Web Dashboard    ⌨️  CLI Tool    📡 SDK (TS)    │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼  (RPC Calls / Transactions)
┌──────────────────────────────────────────────────────┐
│            SOLANA PROGRAM (Rust / Anchor)             │
│                                                      │
│   📋 create_queue    📨 submit_job    🤚 claim_job   │
│   ✅ complete_job    ❌ fail_job      🔄 retry_job   │
│   👷 register_worker ⏸️  pause_queue  📊 get_stats   │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼  (Account State)
┌──────────────────────────────────────────────────────┐
│               ON-CHAIN STATE (PDAs)                   │
│                                                      │
│   📦 QueueConfig     📄 JobAccount                   │
│   • name             • job_id                        │
│   • authority        • queue                         │
│   • max_workers      • payload (bytes)               │
│   • max_retries      • status (enum)                 │
│   • priority         • priority                      │
│   • is_paused        • attempts                      │
│   • total_jobs       • worker (Option)               │
│   • completed_jobs   • result (Option)               │
│   • failed_jobs      • created_at                    │
│                      • expires_at                    │
│                                                      │
│   👤 WorkerAccount    📊 QueueMetrics                │
│   • worker_id        • total_processed               │
│   • authority        • avg_process_time              │
│   • queue            • success_rate                  │
│   • status           • throughput_per_hour           │
│   • jobs_completed   • last_updated                  │
│   • last_heartbeat                                   │
└──────────────────────────────────────────────────────┘
```

### State Machine — Job Lifecycle

```
  ┌──────────┐    claim     ┌────────────┐   complete   ┌───────────┐
  │ PENDING  │────────────►│ PROCESSING │────────────►│ COMPLETED │
  └──────────┘             └────────────┘              └───────────┘
       │                        │
       │ expire                 │ fail
       ▼                        ▼
  ┌──────────┐             ┌──────────┐    retry (< max)
  │ EXPIRED  │             │  FAILED  │──────────────► PENDING
  └──────────┘             └──────────┘
```

---

## 🔀 Web2 vs Solana: Design Analysis

| Aspect | Web2 (Redis/RabbitMQ) | SolQueue (Solana) |
|--------|----------------------|-------------------|
| **Storage** | In-memory (volatile) | On-chain accounts (persistent) |
| **Protocol** | TCP/AMQP (push model) | RPC transactions (pull model) |
| **Concurrency** | Distributed locks (Redis SETNX) | Solana runtime atomicity |
| **Latency** | Sub-millisecond | ~400ms (block confirmation) |
| **Durability** | Configurable (AOF/RDB) | Inherent (blockchain) |
| **Monitoring** | External (Prometheus/Grafana) | On-chain (transparent) |
| **Infrastructure** | Requires servers/containers | Serverless (no infrastructure) |
| **Trust** | Trust the operator | Trustless (verifiable) |
| **Cost** | Server costs (fixed) | Transaction fees (per-use) |
| **Scalability** | Vertical + horizontal | Parallel execution (Solana runtime) |

### Tradeoffs & Constraints

**Advantages of On-Chain:**
- ✅ **Zero infrastructure** — No servers, no Redis instances, no monitoring stack
- ✅ **Trustless execution** — Job processing is verifiable by anyone
- ✅ **Atomic operations** — No distributed lock bugs, no race conditions
- ✅ **Built-in audit trail** — Every state change is a transaction on the ledger
- ✅ **Censorship-resistant** — No single point of failure

**Limitations:**
- ⚠️ **Higher latency** — ~400ms vs sub-millisecond for in-memory queues
- ⚠️ **Payload size** — Limited by Solana account size (10KB default, expandable)
- ⚠️ **Cost per operation** — Each transaction costs SOL (tiny on devnet, ~$0.00025 on mainnet)
- ⚠️ **No push model** — Workers must poll for new jobs (no WebSocket push from program)
- ⚠️ **Compute limits** — Complex processing must happen off-chain; only state is on-chain

---

## 📂 Project Structure

```
SolQueue/
├── 📄 README.md                    # This file
├── 📄 LICENSE                      # MIT License
├── 📄 ROADMAP.md                   # Detailed development roadmap
├── 📁 scripts/                     # Utility scripts (tooling + deploy helpers)
│   ├── install-tools.sh            # WSL/Linux toolchain setup helper
│   ├── deploy-devnet.ps1           # Windows helper for devnet deploy checks
│   └── generate-devnet-demo-txs.mjs # Generate demo devnet tx signatures
│
├── 🌐 Frontend (Web Dashboard)
│   ├── index.html                  # Entry HTML with meta tags & fonts
│   ├── package.json                # Node.js dependencies
│   ├── vite.config.js              # Vite bundler configuration
│   ├── public/
│   │   └── favicon.svg             # App favicon
│   └── src/
│       ├── main.js                 # App entry — router, Three.js init, particles
│       ├── styles/
│       │   ├── global.css          # Design system — tokens, components, animations
│       │   ├── landing.css         # Landing page styles
│       │   └── dashboard.css       # Dashboard layout & component styles
│       ├── pages/
│       │   ├── landing.js          # Landing page — hero, pipeline, features, comparison
│       │   └── dashboard.js        # Dashboard — overview, queues, jobs, workers, analytics
│       ├── animations/
│       │   ├── three-bg.js         # Three.js 3D background (cubes, particles, lights)
│       │   └── pipeline.js         # 2D Canvas animations (pipeline, bar chart, line chart)
│       └── utils/
│           ├── router.js           # Hash-based SPA router
│           └── mock-data.js        # Mock data for dashboard UI
│
├── ⚓ Solana Program (Anchor/Rust) — [Phase 2]
│   ├── programs/
│   │   └── solqueue/
│   │       └── src/
│   │           ├── lib.rs          # Program entry point & instruction handlers
│   │           ├── state.rs        # Account structs (QueueConfig, JobAccount, etc.)
│   │           ├── instructions/   # Individual instruction implementations
│   │           │   ├── create_queue.rs
│   │           │   ├── submit_job.rs
│   │           │   ├── claim_job.rs
│   │           │   ├── complete_job.rs
│   │           │   ├── fail_job.rs
│   │           │   ├── retry_job.rs
│   │           │   └── register_worker.rs
│   │           └── errors.rs       # Custom error definitions
│   ├── tests/
│   │   └── solqueue.ts             # Integration tests (TypeScript)
│   └── Anchor.toml                 # Anchor configuration
│
├── 🔧 CLI Client — [Phase 3]
│   └── cli/
│       └── index.js                # Node.js CLI tool for interacting with SolQueue
│
└── 📚 Documentation
    └── docs/
        ├── assets/                 # Images, diagrams, banners
        ├── ARCHITECTURE.md         # Deep-dive architecture document
        ├── WEB2_VS_SOLANA.md       # Detailed comparison analysis
        └── API.md                  # Program instruction reference
        |-- SDK_GUIDE.md            # SDK integration and usage guide
        |-- CLI_REFERENCE.md        # CLI command reference
        `-- DEPLOY_GUIDE.md         # Devnet deployment troubleshooting
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install) v1.70+
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) v1.17+
- [Anchor](https://www.anchor-lang.com/docs/installation) v0.30.1

### 1. Clone & Install

```bash
git clone https://github.com/panzauto46-bot/SolQueue.git
cd SolQueue
npm install
```

### 2. Run the Web Dashboard

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the dashboard.

### 3. Build the Solana Program

```bash
cd programs/solqueue
anchor build --no-idl
```

> `--no-idl` is used here to avoid known host-side IDL generation issues with newer Rust toolchains.

### 4. Deploy to Devnet

```bash
cd ../..
solana config set --url devnet
solana airdrop 2
solana program deploy target/deploy/solqueue.so \
  --program-id target/deploy/solqueue-keypair.json \
  --url devnet
```

Windows helper (recommended in this repo):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-devnet.ps1
```

### 5. Run Tests

```bash
anchor test --skip-build
```

> Recommended flow on recent Rust toolchains:
> 1) `anchor build --no-idl`
> 2) `anchor test --skip-build`

---

## 🔗 Devnet Deployment

| Item | Details |
|------|---------|
| **Network** | Solana Devnet |
| **Program ID** | `GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64` |
| **Anchor Version** | `0.30.1` |
| **Rust Toolchain** | `1.94.0` (IDL skipped via `--no-idl`) |
| **Solana CLI** | `2.1.11 (Agave)` |
| **Build Status** | ✅ Compiled successfully |
| **Deploy Status** | ✅ Deployed to Devnet (March 6, 2026) |
| **Deploy Tx** | [View Deployment Transaction](https://solscan.io/tx/5JFf82paxM7QsggEpyTbhxZ6vH5JgHBopgsKDhj5T9pxRPXKGmoaWPWfdPb8aJ3qK2m8qR5b79wbYcJDT3eBQXkv?cluster=devnet) |
| **Explorer** | [View on Solscan](https://solscan.io/account/GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64?cluster=devnet) |

### Transaction Links
- `create_queue` — [View Transaction](https://solscan.io/tx/3b4DP3eUeZUrY9wDR4zcXEkin6JSTUEkFsEBDWTpuadg1hXso2BGz18qcHMznyAZFgWXCSqKZdcT3FiStrz5QcNT?cluster=devnet)
- `register_worker` — [View Transaction](https://solscan.io/tx/arPQ9waDUT2iyASnJT2kXiSYWds4KFGgubKiPsYV7DZJ46jdW9YaSkkgmJ4rGAA59DGJyuKvn3jKnSPNDgfGCDq?cluster=devnet)
- `submit_job` — [View Transaction](https://solscan.io/tx/3J2bgv51RrG81MA6avdLt3rJ1W2C6VYh8sBu9Pb4ZY5NNqrQZmfVHtVAmxEsiBx6Tx5m2eyNih2Nm5g6jchuu4GP?cluster=devnet)
- `claim_job` — [View Transaction](https://solscan.io/tx/3nfpLmxZRRwA8x8uEYaLteqjztuYzN7LAkHbnMXCFHVKgAGSKm8gaedB1uJMxPM3MscEAeg35t722PCr5tcowjd7?cluster=devnet)
- `complete_job` — [View Transaction](https://solscan.io/tx/5VLoYaZBzQEtmKU19H4KMeeUCqsTRcbpK2bNVVqT72kG68yFsrPHHuy9JyJ9NxDiYHmL46mRtz48WRT2K4E2Hjth?cluster=devnet)

---

## 🗺️ Roadmap

### Phase 1: Frontend & Design ✅
- [x] Project scaffolding (Vite + Vanilla JS)
- [x] Design system (Solana-themed dark mode)
- [x] Landing page with 3D animations (Three.js)
- [x] Terminal typing demo animation
- [x] Pipeline flow visualization
- [x] Feature showcase & Web2 vs Solana comparison
- [x] Architecture diagram section
- [x] Capsule-style top navigation with centered menu links
- [x] Dashboard — Overview with stats & activity feed
- [x] Dashboard — Queue management interface
- [x] Dashboard — Job monitor with conveyor belt animation
- [x] Dashboard — Worker registry
- [x] Dashboard — Analytics with animated charts
- [x] Dashboard — Create queue & submit job forms
- [x] Dashboard — Settings page
- [x] Job detail modal
- [x] Responsive design & micro-interactions

### Phase 2: Solana Program (Rust/Anchor) ✅
- [x] Define account structs (QueueConfig, JobAccount, WorkerAccount)
- [x] Implement `create_queue` instruction
- [x] Implement `submit_job` with priority system
- [x] Implement `claim_job` with atomic claiming
- [x] Implement `complete_job` and `fail_job`
- [x] Implement `retry_job` with attempt counter check
- [x] Implement `register_worker` with PDA derivation
- [x] Implement `deregister_worker`
- [x] Implement `pause_queue` and `resume_queue`
- [x] Custom error types (SolQueueError enum)
- [x] Account size calculations (InitSpace)
- [x] Proper access control (authority checks)
- [x] `anchor build --no-idl` — Program compiled (ID: `GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64`)
- [x] Integration test suite written (TypeScript/Mocha)
- [x] Deploy to Devnet

### Phase 3: Integration & Client ✅
- [x] TypeScript SDK (`src/sdk/index.js`) — SolQueueClient with 9 instruction methods
- [x] Connect frontend to on-chain data — Data service with mock/live toggle
- [x] Phantom wallet integration — Connect/disconnect with balance display
- [x] Real-time updates via WebSocket subscription — Account change listeners
- [x] CLI tool for queue management (`cli/index.js`) — 9 commands with colored output
- [x] Transaction links in dashboard — Solscan explorer integration
- [x] Toast notification system for transaction feedback

### Phase 4: Documentation & Polish 📚
- [x] Comprehensive architecture document
- [x] Web2 vs Solana deep-dive analysis
- [x] API reference documentation
- [ ] Demo video walkthrough
- [ ] Performance benchmarks
- [x] Final README polish

---

## 🧪 Testing

### Frontend
```bash
# Run dev server with hot reload
npm run dev

# Build for production
npm run build
```

### Solana Program
```bash
# Run all tests
anchor test --skip-build

# Run specific test
anchor test --skip-build -- --grep "create_queue"

# Test with logs
anchor test --skip-build -- --verbose
```

---

## 🎯 Judging Criteria Alignment

| Criteria | Weight | How SolQueue Addresses It |
|----------|--------|--------------------------|
| **Architecture & Account Modeling** | 30% | Comprehensive PDA design with QueueConfig, JobAccount, WorkerAccount, QueueMetrics. State machine pattern for job lifecycle. |
| **Code Quality & Rust Patterns** | 25% | Modular instruction handlers, custom error types, proper account validation, idiomatic Rust patterns. |
| **Correctness & Testing** | 20% | Full integration test suite covering all state transitions, edge cases, and error conditions. |
| **Web2 → Solana Design Analysis** | 15% | Detailed comparison of Redis/RabbitMQ patterns vs on-chain equivalents with honest tradeoff analysis. |
| **UX / Client Usability** | 10% | Professional web dashboard with 3D animations, real-time pipeline visualization, and intuitive queue management. |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Blockchain** | Solana | Runtime & consensus |
| **Framework** | Anchor | Program development |
| **Language** | Rust | On-chain program |
| **Frontend** | Vanilla JS + Vite | Web dashboard |
| **3D Graphics** | Three.js | Background animations |
| **2D Graphics** | Canvas API | Pipeline & chart animations |
| **Styling** | Vanilla CSS | Design system |
| **Fonts** | Space Grotesk + Inter + JetBrains Mono | Typography |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Solana Foundation](https://solana.com) — For the incredible blockchain platform
- [Anchor Framework](https://anchor-lang.com) — For making Solana development accessible
- [Superteam Poland](https://superteam.fun) — For organizing the hackathon
- [Three.js](https://threejs.org) — For the 3D visualization library

---

<p align="center">
  <strong>Built with ❤️ for the Superteam Poland "Rebuild Backend Systems as On-Chain Rust Programs" Challenge</strong>
</p>

<p align="center">
  <a href="https://solana.com">
    <img src="https://img.shields.io/badge/Powered_by-Solana-9945FF?style=flat-square&logo=solana&logoColor=white" alt="Powered by Solana"/>
  </a>
</p>
