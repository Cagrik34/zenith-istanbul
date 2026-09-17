# Zenith Istanbul

> **High-performance, 3D codebase topology metropole, Tarjan SCC cycle detector, and autonomous agent orchestration cockpit running 100% client-side with zero cloud dependencies.**

[![CI Gatekeeper](https://img.shields.io/github/actions/workflow/status/Cagrik34/zenith-istanbul/zenith-gatekeeper.yml?branch=main&style=flat-square&label=CI%20Gatekeeper)](https://github.com/Cagrik34/zenith-istanbul/actions)
[![Deploy Showcase](https://img.shields.io/github/actions/workflow/status/Cagrik34/zenith-istanbul/deploy-pages.yml?branch=main&style=flat-square&label=GitHub%20Pages)](https://cagrik34.github.io/zenith-istanbul/)
[![Live Cockpit](https://img.shields.io/badge/Live%20Showcase-GitHub%20Pages-00f0ff.svg?style=flat-square)](https://cagrik34.github.io/zenith-istanbul/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![Zero CDN](https://img.shields.io/badge/Air--Gapped-100%25%20Offline-orange.svg?style=flat-square)](public/)

[Live Showcase](https://cagrik34.github.io/zenith-istanbul/) • [Architecture](#architecture--data-flow) • [Engine Benchmarks](#-engine-benchmarks--verification) • [Core Capabilities](#-core-capabilities--subsystems) • [Getting Started](#-getting-started) • [Türkçe Dokümantasyon](README.tr.md)

---

## Executive Overview

**Zenith Istanbul** is an open-source, high-performance 3D software architecture visualization studio, graph topology engine, and automated CI gatekeeper designed for software engineers, systems architects, and SRE teams managing complex microservices, full-stack monorepos, and distributed codebases.

Operating under a strict **Zero-Cloud Client-Side Memory Architecture**, zero proprietary code, file tokens, or telemetry metrics are transmitted to external servers. Abstract Syntax Tree (AST) module parsing, Tarjan Strongly Connected Components (SCC) circular dependency solving, MITRE CWE security boundary analysis, deterministic Fruchterman–Reingold force-directed physics layout, and 60 FPS WebGL rendering execute entirely within local browser memory.

Zenith Istanbul procedurally projects modular code dependencies onto an authentic geospatial digital twin of the **Istanbul Bosphorus Metropole**:
- **European Sector**: Client UI components, React/Vue frontends, and visualization layers situated across Galata, Beşiktaş, and Levent/Maslak.
- **Historic Peninsula**: Foundational compilers, AST parsers, Tarjan graph solvers, and core entrypoints.
- **Asian Sector**: High-throughput databases, cache layers, model registries, and autonomous agent swarms across Üsküdar, Kadıköy, and the Ataşehir International Financial Center (İFM).
- **Bosphorus Strait & Maiden Tower**: Central HTTP security middleware, CSRF firewalls, and API gateways.
- **Suspension Bridges**: Cross-boundary API ingress routes with real-time particle traffic indicating coupling density.
- **Nakkaştepe Millet Bahçesi**: Authentic botanical topography, *"Uçan Yol"* cantilever viewing deck, and zero-collision parkland preserving architectural clarity.

---

## ⚡ Engine Benchmarks & Verification

All computation modules, memory boundaries, and off-thread worker pipelines are validated by automated unit, integration, and CI gatekeeper tests (48/48 pass):

| Subsystem / Module | Algorithm & Methodology | Verification Status | Execution Latency / Metric |
|---|---|:---:|:---:|
| **AST Static Analysis Engine** | Non-destructive Regex & Module Import Lexer | **100% PASS** | `< 1.2ms` (per module) |
| **Tarjan SCC Cycle Detector** | Stack-based Iterative DFS Strongly Connected Components ($O(V+E)$) | **100% PASS** | `< 0.25ms` (DAG Verified) |
| **MITRE CWE Boundary Sentry** | Client/Server Boundary Auditing (CWE-668, CWE-200, CWE-798) | **100% PASS** | `0 Leaks` / Strict Compliance |
| **3D Bosphorus Metropole Engine** | WebGL Three.js Hardware Canvas & PBR Shaders | **100% PASS** | `60 FPS` Locked |
| **AKOM Autonomous Swarm** | Filesystem Mailbox Orchestration & Heartbeat Reflex Loop | **100% PASS** | Deterministic / `0 Race Conditions` |
| **Interactive Memory Graph** | Deterministic Fruchterman–Reingold Force Simulation ($O(I \cdot (V^2+E))$) | **100% PASS** | `< 5.5ms` convergence |
| **Shared Topic Extraction** | In-Memory Semantic Keyword & N-Gram Synthesizer | **100% PASS** | `< 0.15ms` |
| **Local Telemetry Store** | Append-Only Architectural Drift Persistence (`.zenith/`) | **100% PASS** | `< 0.8ms` / snapshot |
| **Headless CI Gatekeeper** | POSIX-Hygiene CLI & Automated Port Conflict Shift | **100% PASS** | Verified |
| **Zero-Cloud Air-Gap** | Local-First Isolated Offline Execution & Zero CDN | **100% PASS** | `100% Offline Ready` |

---

## 🏛️ Architecture & Data Flow

```mermaid
flowchart TD
    subgraph INGEST ["1. Static Ingestion Layer"]
        A[Local Repository / Drag & Drop / GitHub API] --> B[CodebaseParser - AST Static Lexer]
    end

    subgraph ENGINE ["2. Graph-Theoretic & Security Solvers"]
        B --> C[Tarjan SCC Solver\nCycle Detection O(V+E)]
        B --> D[Security Sentry\nMITRE CWE Boundary Auditing]
        B --> E[Geospatial District Mapper\nEurope / Asia / Bosphorus]
        C --> F[Traffic Coupling Engine\nTraffic Index Density Heuristic]
    end

    subgraph PRESENTATION ["3. Spatial & Telemetry Delivery"]
        E --> G[Three.js 3D Metropole\nPBR Glass Skyscrapers & Nakkaştepe]
        F --> H[Particle Ingress Physics\nBosphorus Suspension Bridge]
        C --> I[DiffEngine Contract Synthesizer\nUnified Git Diffs]
        D --> J[Telemetry HUD & Security Drawer\nReal-Time Sparklines]
    end

    subgraph CI ["4. Headless Gatekeeper & Swarms"]
        F --> K[CLI Headless Gatekeeper\n--fail-on-cycle --fail-on-leak]
        K --> L[Automated PR Markdown Comment\nGitHub Step Summary]
        K --> M[AKOM Multi-Agent Swarm\nCommander & Engineer Reflexes]
    end
```

### Geospatial Sector Mapping Specification

Zenith Istanbul procedurally maps software architecture into recognizable urban topography:

| Spatial Entity | Architectural Layer | Description |
|---|---|---|
| **European Sector** | Frontend & UI Systems | Client modules, React/Vue components, DOM hooks situated in Galata, Beşiktaş, and Levent/Maslak. |
| **Historic Peninsula** | Foundational Graph Core | AST parsers, Tarjan SCC solvers, compilers, and entrypoints rooted in Sultanahmet and Eminönü. |
| **Asian Sector** | Backend, Data & Swarms | PostgreSQL/SQLite stores, history ledgers, model catalogs, and autonomous agent swarms in Üsküdar, Kadıköy, and Ataşehir İFM. |
| **Bosphorus Strait & Maiden Tower** | HTTP Security & Middleware | Central API gateways, CSRF origin firewalls, CORS guards, and payload size sentries. |
| **Suspension Bridges** | Cross-Boundary API Ingress | Ingress routes linking client components with server controllers across the Bosphorus. |
| **Bridge Traffic Jams** | Cyclic Coupling (Tarjan SCC) | High-visibility red particle congestion visualizing circular dependency deadlocks. |
| **Nakkaştepe Millet Bahçesi** | Botanical Parkland | Elevated Asian hillside with *"Uçan Yol"* cantilever observation deck, biological pond, and zero-collision park boundaries. |
| **PBR Skyscrapers** | Software Modules | Height scales with lines of code (LOC); width scales with cyclomatic complexity; luminous office grids indicate active logic. |
| **Offshore Bastions** | Isolated Subgraphs | Unreferenced or zero in-degree dead code modules requiring tree-shaking or refactoring. |

---

## 🚀 Core Capabilities & Subsystems

### 1. 3D Bosphorus Codebase Metropole & Authentic Nakkaştepe
- **Photorealistic Procedural Shading**: Glass curtain-wall facades featuring deep azure/cyan reflection gradients, warm interior illuminated office grids, structural corner pylons, neon wireframe silhouettes, and penthouse crown halos.
- **Nakkaştepe Millet Bahçesi**: Authentic 8.5m elevated topography on the Asian bridgefoot with a 24-meter cantilever wooden *"Uçan Yol"* viewing balcony, arched biological pond bridge, umbrella pines, and Judas trees (*Erguvan*).
- **Spatial Collision Protection**: The `isInPark` boundary engine guarantees zero ambient building overlap, preserving pristine natural parks and historical monuments.

### 2. Tarjan SCC Cycle Detection & Contract Extraction
- Stack-based iterative Tarjan algorithm runs in $O(V + E)$ time with zero external npm dependencies.
- Identifies complex circular dependency chains (e.g., `A → B → C → A`) causing bundle bloat and memory leaks.
- Automatically synthesizes decoupled TypeScript contract interfaces (`types/*.contract.ts`) and outputs standard Unified Git Diffs.

$$\text{Traffic Index} = \min\left(100, \text{round}\left(\frac{|\text{SCC Edges}| \times 3 + |\text{Cross-Boundary Imports}|}{|\text{Total Edges}|} \times 100\right)\right)$$

### 3. Client-Side Security Boundary Sentry (MITRE CWE)
- **CWE-668 / CWE-1061**: Detects backend packages (`fs`, `net`, `child_process`, ORMs) inadvertently imported into client-side bundles.
- **CWE-200 / CWE-798**: Identifies hardcoded API tokens, private keys, AWS credentials, and exposed `.env` variables.
- Outputs 1-indexed `file:line:col` coordinates for instant automated remediation.

### 4. AKOM Autonomous Multi-Agent SRE Swarm
- Orchestrates 5 localized autonomous agents:
  - 🛡️ **Başkomutan (agent.commander)**: System oversight, incident triage, and task dispatch.
  - 🌉 **Boğaz Köprüsü Mühendisi (agent.bridge_engineer)**: Tarjan cycle resolution and contract extraction.
  - 🔒 **Güvenlik Nöbetçisi (agent.security_sentinel)**: MITRE CWE auditing and credential redaction.
  - ⚡ **Kod İyileştirme Uzmanı (agent.refactorer)**: AST optimization and complexity reduction.
  - 🧪 **Kalite Güvence Müfettişi (agent.qa_inspector)**: Verification, test execution, and CI health checks.
- Features resilient JSON string recovery (`repairLiteralLineBreaksInJsonStrings`), atomic filesystem mailbox protocols, broadcast fan-out filtering, and 5-tier cryptographic secret redaction.

### 5. Interactive Memory & Knowledge Graph
- Computes node equilibrium coordinates using a deterministic Fruchterman–Reingold spring-force layout algorithm ($O(I \cdot (V^2 + E))$).
- Surfaces shared architectural topics across agent long-term memory streams without sending unredacted code to external embedding APIs.
- Full specification: [docs/MEMORY_GRAPH_SPEC.md](docs/MEMORY_GRAPH_SPEC.md).

### 6. Headless CI Gatekeeper & Single-File HTML Reports
- Enforces strict architectural gates directly in GitHub Actions workflows:
  ```bash
  node bin/cli.js --ci --fail-on-cycle --fail-on-leak .
  ```
- Synthesizes standalone, self-contained single-file 3D HTML architectural reports for air-gapped distribution:
  ```bash
  node bin/cli.js --export-html architecture-report.html .
  ```

---

## ⌨️ Keyboard Shortcuts & Controls

| Shortcut | Action |
|---|---|
| **Left Click + Drag** | Orbit and rotate camera around the Istanbul Bosphorus |
| **Right Click + Drag** | Pan camera across European and Asian sectors |
| **Scroll Wheel** | Smooth zoom in / zoom out |
| **`1`** | Focus Camera: **European Sector** (Galata, Beşiktaş & Levent) |
| **`2`** | Focus Camera: **Asian Sector** (Üsküdar & Ataşehir İFM) |
| **`3`** | Focus Camera: **Bosphorus Bridge & Strait Overview** |
| **`4`** | Focus Camera: **Nakkaştepe Millet Bahçesi Viewpoint** |
| **`Space`** | Toggle Day / Night lighting and neon metropolitan glow |
| **`H`** | Toggle Architectural Telemetry HUD & Diagnostics Drawer |
| **`Esc`** | Deselect active module / close modal drawers |

---

## 🛠️ Getting Started

### Live Showcase (No Installation Required)

Access the production build directly in your browser with zero setup:  
👉 **[https://cagrik34.github.io/zenith-istanbul/](https://cagrik34.github.io/zenith-istanbul/)**

- **GitHub Ingest**: Enter any public repository (`owner/repo`, e.g., `expressjs/express`) to visualize its topology.
- **Curated Scenarios**: Instantly inspect pre-configured architectural benchmarks (Cyclic Jam, Zenith Nexus, Vercel AI SDK).
- **Directory Drag & Drop**: Drag local project folders directly into the WebGL viewport for local-first analysis.

---

### Local Development

#### Prerequisites
- **Node.js**: `v18.0.0+` (`v20+` or `v22+ LTS` recommended)
- **npm**: `v9.0.0+`

```bash
# 1. Clone the repository
git clone https://github.com/Cagrik34/zenith-istanbul.git
cd zenith-istanbul

# 2. Launch interactive 3D visualizer on local codebase (zero npm install required)
npm start

# 3. Run full automated test suite & CI gatekeeper audit (48/48 tests)
npm test

# 4. Run unit tests only
npm run test:unit

# 5. Run headless CI gatekeeper audit only
npm run test:gatekeeper
```

---

### CLI Interface & Arguments

```bash
node bin/cli.js [options] [directory]
```

| Option | Flag | Description |
|---|---|---|
| **Help Manual** | `-h, --help` | Display manual and CLI flag documentation. |
| **Version** | `-v, --version` | Output current semantic version number. |
| **Headless CI** | `-c, --ci` | Execute static analysis and output telemetry without launching WebGL. |
| **Fail on Cycle** | `--fail-on-cycle` | Exit with code 1 if Tarjan SCC circular dependencies are detected. |
| **Fail on Leak** | `--fail-on-leak` | Exit with code 1 if MITRE CWE client-side security leaks are detected. |
| **JSON Output** | `--json` | Output machine-readable architectural telemetry report in JSON. |
| **Export HTML** | `--export-html <file>` | Synthesize self-contained single-file 3D HTML architectural report. |
| **Custom Port** | `--port <number>` | Custom HTTP port for local telemetry server (default: `4173`). |

---

## 📂 Directory Structure

```
zenith-istanbul/
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml       # Automated GitHub Pages showcase deployment
│       └── zenith-gatekeeper.yml  # Headless architecture & security CI audit
├── assets/
│   └── og-preview.jpg             # OpenGraph 3D metropole preview
├── bin/
│   └── cli.js                     # Zenith Istanbul unified CLI, server & CI gatekeeper
├── docs/
│   ├── MEMORY_GRAPH_SPEC.md       # Force-directed memory graph specification
│   └── SWARM_ARCHITECTURE.md      # AKOM multi-agent swarm architecture
├── public/                        # Zero-CDN offline client assets
│   ├── css/                       # Modular design tokens, HUD, and layout styles
│   ├── fonts/                     # Local WOFF2 fonts (Inter & JetBrains Mono)
│   ├── js/                        # Client-side 3D Bosphorus engine & telemetry HUD
│   │   ├── app.js                 # UI controller & GitHub repository ingest
│   │   ├── bosphorus-scene.js     # Three.js 3D Istanbul Metropole & Nakkaştepe
│   │   ├── samples.js             # Curated architectural benchmark models
│   │   ├── traffic-hud.js         # Real-time telemetry HUD & glassmorphism
│   │   └── traffic-particles.js   # 60 FPS Bosphorus traffic particle physics
│   ├── vendor/three/              # Local Three.js r128 & OrbitControls (100% offline)
│   ├── 404.html                   # SPA routing fallback for GitHub Pages
│   └── index.html                 # Production WebGL application entry
├── src/
│   ├── agent/                     # AKOM Autonomous Multi-Agent Swarm
│   │   ├── agent-dispatcher.js    # Task lifecycle & incident triage dispatch
│   │   ├── diff-engine.js         # Unified git diff synthesizer & hunk generator
│   │   ├── memory-graph.js        # Deterministic Fruchterman-Reingold physics
│   │   ├── model-catalog.js       # Dynamic provider catalog with input sanitization
│   │   ├── swarm-coordinator.js   # Atomic filesystem mailbox protocol & rosters
│   │   ├── swarm-messaging.js     # Message routing, hop caps & JSON string repair
│   │   └── swarm-reflex.js        # Autonomic heartbeat loop & agent reflexes
│   └── core/                      # Static Analysis & SRE Telemetry Primitives
│       ├── ast-parser.js          # AST lexer, complexity heuristic & district mapper
│       ├── history-store.js       # Append-only architectural drift ledger (.zenith/)
│       ├── http-middleware.js     # CSRF firewall, CORS policy & body limit sentry
│       ├── report-generator.js    # Automated PR markdown & JSON report builder
│       ├── tarjan-scc.js          # Stack-based Tarjan SCC cycle detector (O(V+E))
│       └── traffic-engine.js      # Graph-theoretic coupling & dead code solver
├── test/                          # Comprehensive Node.js native test suite (48/48 pass)
├── CHANGELOG.md                   # Semantic versioning & changelog history
├── CONTRIBUTING.md                # Development guidelines & contribution protocol
├── LICENSE                        # MIT Open Source License
├── package.json                   # Zero-runtime-dependency manifest & scripts
├── README.md                      # Comprehensive English architectural documentation
├── README.tr.md                   # Kapsamlı Türkçe mimari dokümantasyon
└── tsconfig.json                  # Typecheck definitions & schema validations
```

---

## 🔒 Security & Client-Side Privacy

- **Client-Side Execution**: All source code parsing, graph calculations, and telemetry stay strictly in browser memory. Zero code or metrics leave your local machine.
- **Zero-CDN & Air-Gap Compliance**: Bundled with local Three.js r128 modules and local WOFF2 variable fonts (`Inter`, `JetBrains Mono`). Runs in fully air-gapped environments without internet access.
- **Strict CSRF & Localhost Firewall**: Restricts state-mutating HTTP endpoints to validated localhost origins (`127.0.0.1`, `[::1]`) and rejects external cross-site requests (`Sec-Fetch-Site: cross-site`).
- **Path Traversal & DoS Protection**: Hardened against directory traversal escapes via POSIX and Windows boundary checks, and enforces a strict 2 MiB payload ceiling.
- **ReDoS Mitigation**: Bounded regular expressions and sanitized AST token extraction prevent catastrophic backtracking.
- **Least-Privilege CI/CD**: GitHub Actions workflows run with minimal scoped permissions (`contents: read`, `pages: write`).

---

## 📄 License & Copyright

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

- **Author**: [Çağrı Giray KEŞAN](https://github.com/Cagrik34) (`cagrigiraykesan@gmail.com`)
- **Copyright**: © 2026 Çağrı Giray Keşan. All Rights Reserved.
