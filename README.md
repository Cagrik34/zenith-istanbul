# 🌉 ZenithIstanbul (`zenith-istanbul`)
### *3D Codebase Metropole & Autonomous Agent Command Deck*
> **"Inspired by Istanbul's Bosphorus geography and engineered for Principal/Staff Engineer architectural telemetry."**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero-Cloud Security](https://img.shields.io/badge/Security-Zero--Cloud%20Client--Side-brightgreen.svg)](#security--privacy)
[![WebGL 60FPS](https://img.shields.io/badge/Render-WebGL%20Three.js-cyan.svg)](#architecture)
[![Author](https://img.shields.io/badge/Crafted%20by-Çağrı%20Giray%20KEŞAN-ff007f.svg)](https://github.com/Cagrik34)

---

## 🌆 Architectural Topology & Engineering Mapping

Instead of passive tables or static graph visualizers, **ZenithIstanbul** procedurally models any JavaScript/TypeScript codebase into an interactive **3D Cyberpunk Metropole** evaluated against formal graph invariants:

| Spatial Metropole Entity | Software Architecture Mapping | Visual & Simulation Behavior |
|---|---|---|
| **Boğaziçi (The Bosphorus)** | Client / Server Boundary | 3D procedural water shader separating client bundles from backend infrastructure. |
| **Avrupa Yakası (European Side)** | Frontend / UI / Components / Hooks | Illuminated glass towers (Beşiktaş, Levent, Maslak). |
| **Anadolu Yakası (Asian Side)** | Backend / Services / Database / Core Engine | Industrial infrastructure blocks (Kadıköy, Üsküdar, Ataşehir). |
| **Kız Kulesi (Maiden's Tower)** | API Gateway / Middleware / Proxy (`middleware.ts`) | Cylindrical stone tower in the strait with dual rotating beacons. |
| **Galata Kulesi (Galata Tower)** | Root Entry Point (`index.ts`, `main.tsx`, `App.tsx`) | Towering master structure with observation deck anchoring historical dependencies. |
| **Security Boundary Sentry** | Client-Side Leak Detector (CWE-668 / CWE-200 / CWE-798) | Sentry patrol boat bobbing in the strait with visual alert strobes upon detected secret or ORM leaks. |
| **15 Temmuz & FSM Bridges** | Ingress API Gateway & Cross-Boundary Imports | Suspension bridges with luminous cables connecting European and Asian subsystems. |
| **Bridge Cyclic Deadlock** | **Tarjan Strongly Connected Component (SCC)** | Directed cycles trigger visual red alert, bridge ingress deadlocks, and alarm audio. |
| **Maslak High-Rises** | Monolithic Modules (1000+ LOC / High Cyclomatic Complexity) | Skyscrapers scaling dynamically with line counts and branch complexity. |
| **Tarihi Yarımada (Historic Peninsula)** | Core Immutable Primitives & Configs | Low-churn architectural bastions anchoring the foundation. |
| **Isolated Subgraphs** | Zero In-Degree Unreferenced Modules (Dead Code) | Isolated islands floating offshore with zero inbound dependency edges. |
| **Atmospheric Telemetry** | Dynamic Code Health & Meteorology Engine | Real-time Istanbul weather (Open-Meteo API) mapped to AST Code Health scores. |
| **2D Topological Minimap** | 360° Sector Radar HUD | Real-time minimap with live camera tracking and instant sector navigation. |

---

## 📐 Mathematical Traffic Index (Graph Theory Formulation)

Traffic congestion on the Bosphorus bridges is deterministically derived from graph topology:

$$\text{Traffic Index} = \min\left(100, \operatorname{round}\left(\frac{|\text{SCC Edges}| \times 3 + |\text{Cross-Boundary Imports}|}{|\text{Total Edges}|} \times 100\right)\right)$$

- **$|\text{SCC Edges}|$:** Directed edges participating in strongly connected component cycles.
- **$|\text{Cross-Boundary Imports}|$:** High-order couplings bridging the client/server divide.
- **$\text{Traffic Index} = 0$:** Clean Directed Acyclic Graph (DAG) topology.

---

## 🤖 Autonomous Agent Dispatch & Lexical Contract Extractor

ZenithIstanbul provides an interactive remediation bridge for cyclic invariants:
1. **Detection:** When Tarjan's algorithm identifies a cycle (e.g., `AuthModal ➔ sessionManager ➔ userService ➔ AuthModal`), the Ingress Bridge deadlocks.
2. **Dispatch Protocol:** Clicking **`⚡ Dispatch Autonomous Remediation Agent`** executes:
   - Queries the local process bridge (`POST /api/dispatch-agent`) to probe local LLM CLI tools (`ollama`, `aider`, `claude-code`).
   - If offline or CLI unconfigured, executes the deterministic built-in **Lexical / Regex-based Contract Extractor**.
   - Synthesizes an independent contract file (`src/contracts/[target].contract.ts`), extracts exported types and multiline generic interfaces, and rewrites the offending import statements.
   - Computes a formal unified git diff (`.patch`).
3. **Live File Patching:** Clicking **`🛠️ Apply Remediation Patch to Disk`** writes changes to disk (`POST /api/apply-patch`), refreshes the AST graph, clears Tarjan SCC cycles, and turns the bridge emerald green.

---

## 🛡️ Zero-Tolerance Security Boundary Sentry

Client-side modules (directories containing `client`, `ui`, `components`, or files containing `'use client'`) are audited against strict MITRE enterprise standards:
- **CWE-668 (Exposure of Resource to Wrong Sphere / CWE-1061 Encapsulation Breach):** Client-side ingress of forbidden Node.js core modules (`fs`, `child_process`, `net`, `tls`, `cluster`, `worker_threads`) and backend database ORM engines (`@prisma/client`, `typeorm`, `pg`, `ioredis`).
- **CWE-200 (Exposure of Sensitive Information):** Leaked server environment variables (`DATABASE_URL`, `AWS_SECRET`, `JWT_SECRET`).
- **CWE-798 (Use of Hard-coded Credentials):** Hardcoded AWS access keys (`AKIA...`), and JWT tokens.
- **CWE-321 (Use of Hard-coded Cryptographic Key):** Hardcoded private encryption key blocks (`-----BEGIN PRIVATE KEY-----`).
- **Exact Coordinates:** HUD and Inspector display exact 1-indexed `file:line:col` coordinates for remediation.

---

## ⚡ Live Real-Time Telemetry & SSE Watcher

ZenithIstanbul features a native Server-Sent Events (SSE) stream (`GET /api/events`):
- Local directory changes trigger debounced (300ms) file watch events via `fs.watch`.
- The 3D WebGL scene re-parses and updates automatically without manual page refreshes or keypresses.
- Real-time atmospheric conditions are fetched from Open-Meteo (`41.0082°N, 28.9784°E`) with in-memory caching and deterministic AST fallback.

---

## 🚀 Quick Start (Interactive 3D UI & CLI)

```bash
# 1. Launch interactive 3D telemetry cockpit
npx zenith-istanbul .

# 2. Export standalone zero-dependency 3D HTML report
npx zenith-istanbul --export-html my-architecture.html .

# 3. Headless CI gatekeeper for GitHub Actions
npx zenith-istanbul --ci --fail-on-cycle --fail-on-leak .
```

### GitHub Actions Workflow (`.github/workflows/zenith-gatekeeper.yml`):
```yaml
name: ZenithIstanbul Architecture Gatekeeper

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Run Zenith Architecture Gatekeeper
        run: npx zenith-istanbul --ci --fail-on-cycle --fail-on-leak . >> $GITHUB_STEP_SUMMARY
```

---

## 👨‍💻 Author

Crafted with high engineering rigor by **[Çağrı Giray KEŞAN](https://github.com/Cagrik34)**.
Part of the **Zenith Project Ecosystem** (*Zenith Atlas, Zenith Nexus, Zenith Istanbul*).

Licensed under the [MIT License](LICENSE).
