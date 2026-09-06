# 🌉 ZenithIstanbul (`zenith-istanbul`)
### *3D Codebase Metropole & Autonomous Agent Command Deck*
> **"Inspired by Istanbul's Bosphorus geography and engineered for Principal/Staff Engineer architectural telemetry."**

[![Live 3D Demo](https://img.shields.io/badge/Live_Demo-Interactive_3D_Bosphorus-00f0ff?style=for-the-badge&logo=three.js)](https://cagrik34.github.io/zenith-istanbul/)
[![npm version](https://img.shields.io/npm/v/zenith-istanbul?style=for-the-badge&color=ff0055)](https://www.npmjs.com/package/zenith-istanbul)
[![CI Gatekeeper](https://img.shields.io/github/actions/workflow/status/Cagrik34/zenith-istanbul/zenith-gatekeeper.yml?style=for-the-badge&label=CI%20Gatekeeper)](https://github.com/Cagrik34/zenith-istanbul/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero-Cloud Security](https://img.shields.io/badge/Security-Zero--Cloud%20Client--Side-brightgreen.svg)](#security--privacy)
[![Author](https://img.shields.io/badge/Crafted%20by-Çağrı%20Giray%20KEŞAN-ff007f.svg)](https://github.com/Cagrik34)

> 🎮 **Canlı Tarayıcı Demosu:** Kurulum yapmadan 3D Boğaz sahnesini doğrudan incelemek için [cagrik34.github.io/zenith-istanbul](https://cagrik34.github.io/zenith-istanbul/) adresini ziyaret edin.
> ⚡ **Terminalden Yerel Analiz:** Kendi projenizi tek komutla taratmak için terminalde `npx zenith-istanbul .` çalıştırın.

---

## 🌆 Architectural Topology & Engineering Mapping

ZenithIstanbul procedurally maps JavaScript/TypeScript codebases into an interactive **3D Cyberpunk Metropole**:

| Spatial Entity | Software Architecture Mapping | Visual Behavior |
|---|---|---|
| **Boğaziçi (Bosphorus)** | Client / Server Boundary | 3D water shader separating client bundles from backend. |
| **Avrupa Yakası** | Frontend / UI / Components | Glass skyscrapers (Beşiktaş, Levent, Maslak). |
| **Anadolu Yakası** | Backend / Services / Database | Infrastructure blocks (Kadıköy, Üsküdar, Ataşehir). |
| **Kız Kulesi** | Middleware / Gateway (`middleware.ts`) | Cylindrical stone tower with dual rotating beacons. |
| **Galata Kulesi** | Root Entry Point (`index.ts`, `App.tsx`) | Towering structure anchoring historical dependencies. |
| **Security Sentry** | Client Leak Detector (CWE-668 / CWE-200) | Patrol vessel triggering strobes upon detected leaks. |
| **Bosphorus Bridges** | Ingress API Gateway & Coupling | Suspension bridges connecting European and Asian subsystems. |
| **Bridge Gridlock** | **Tarjan SCC Cycles** | Directed cycles trigger visual red alert and gridlock. |
| **Maslak High-Rises** | Monolithic Modules (1000+ LOC) | Dynamic skyscrapers scaling with LOC and complexity. |
| **Tarihi Yarımada** | Core Primitives & Configs | Architectural bastions anchoring the foundation. |
| **Isolated Subgraphs**| Dead Code Modules | Offshore islands with zero inbound edges. |
| **Atmosphere Telemetry** | Meteorology Engine | Real-time Istanbul weather mapped to Code Health. |

---

## 📐 Mathematical Traffic Index

$$\text{Traffic Index} = \min\left(100, \text{round}\left(\frac{|\text{SCC Edges}| \times 3 + |\text{Cross-Boundary Imports}|}{|\text{Total Edges}|} \times 100\right)\right)$$

- **`|SCC Edges|`**: Edges participating in strongly connected component cycles.
- **`|Cross-Boundary Imports|`**: Coupling bridging client and server spheres.
- **`Traffic Index = 0`**: Clean Directed Acyclic Graph (DAG) topology.

---

## 🤖 Autonomous Agent Dispatch & Balanced-Brace Scanner

ZenithIstanbul provides an interactive remediation bridge for cyclic invariants:
1. **Detection:** Tarjan's algorithm flags cycles; ingress bridge deadlocks.
2. **Balanced-Brace Extraction:** Employs a zero-dependency lexical balanced-brace scanner to cleanly extract interface and type definitions into decoupled contracts (`src/contracts/*.contract.ts`), eliminating unexported local leaks.
3. **Live File Patching:** Applies remediation patch directly to disk via `POST /api/apply-patch` with path traversal protections.

---

## 🛡️ Zero-Tolerance Security Boundary Sentry

Audits client bundles against MITRE CWE security standards:
- **CWE-668 (Exposure to Wrong Sphere / CWE-1061):** Node.js core modules (`fs`, `net`) and backend ORMs (`@prisma/client`, `typeorm`) in client bundles.
- **CWE-200 / CWE-798:** Leaked environment variables (`DATABASE_URL`, `JWT_SECRET`) and hardcoded credentials.
- **Exact Coordinates:** HUD and Inspector display 1-indexed `file:line:col` for instant remediation.

---

## 📈 Architecture Drift & Local-First Fullstack Altimeter

- **History Store (`.zenith/`):** Persistent telemetry storage backed by Node 22+ `node:sqlite` with append-only JSONL fallback.
- **Architecture Drift HUD:** Pure SVG trend sparkline displaying time-series traffic index and cyclic invariants.
- **Snapshot Inspection:** Click any historical point to inspect past metrics directly in the HUD.

---

## 🚀 Quick Start

### Direct Execution (Clone & Run)
```bash
git clone https://github.com/Cagrik34/zenith-istanbul.git
cd zenith-istanbul

# 1. Launch interactive 3D telemetry cockpit
node bin/cli.js .

# 2. Export standalone zero-dependency 3D HTML report
node bin/cli.js --export-html my-architecture.html .

# 3. Headless CI gatekeeper for GitHub Actions
node bin/cli.js --ci --fail-on-cycle --fail-on-leak .
```

### Via NPX (Upon npm registry publication)
```bash
npx zenith-istanbul .
```

### GitHub Actions Workflow (`.github/workflows/zenith-gatekeeper.yml`):
```yaml
name: Zenith Gatekeeper
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: node bin/cli.js --ci --fail-on-cycle --fail-on-leak . >> $GITHUB_STEP_SUMMARY
```

---

## 👨‍💻 Author

Crafted by **[Çağrı Giray KEŞAN](https://github.com/Cagrik34)** — Zenith Project Ecosystem.
Licensed under the [MIT License](LICENSE).