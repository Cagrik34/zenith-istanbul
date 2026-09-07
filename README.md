# ZenithIstanbul

> **3D Codebase Topology Visualizer, Tarjan SCC Cycle Detector & Architectural CI Gatekeeper**

[![npm version](https://img.shields.io/npm/v/zenith-istanbul.svg?style=flat-square)](https://www.npmjs.com/package/zenith-istanbul)
[![CI Gatekeeper](https://img.shields.io/github/actions/workflow/status/Cagrik34/zenith-istanbul/zenith-gatekeeper.yml?branch=main&style=flat-square&label=CI%20Gatekeeper)](https://github.com/Cagrik34/zenith-istanbul/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)

ZenithIstanbul is an interactive 3D software architecture visualization platform and automated gatekeeper. It statically analyzes JavaScript and TypeScript codebases, parses AST dependencies, evaluates Tarjan strongly connected components (SCC), and maps modular graph topology into an interactive geospatial digital twin.

- **Web Showcase**: [cagrik34.github.io/zenith-istanbul](https://cagrik34.github.io/zenith-istanbul/)
- **Command Line**: `npx zenith-istanbul [path]`

---

## Architectural Mapping

ZenithIstanbul procedurally maps dependency graphs into geospatial sectors:

| Spatial Entity | Architectural Layer | Description |
|---|---|---|
| **Bosphorus Strait** | Client / Server Boundary | Separates client-side bundles from backend services. |
| **European Sector** | Frontend & UI Systems | Client modules, React/Vue components, and presentation layers. |
| **Asian Sector** | Backend & Infrastructure | Server modules, database pools, and core business services. |
| **Suspension Bridges** | Cross-Boundary API Ingress | Ingress routes and data channels linking frontend and backend. |
| **Bridge Ingress Jam** | Cyclic Coupling (Tarjan SCC) | Visualizes circular dependencies causing deadlock alerts. |
| **Skyscrapers** | Software Modules | Height scales with lines of code (LOC); width scales with complexity. |
| **Offshore Islands** | Isolated Subgraphs | Unreferenced or zero in-degree dead modules. |
| **Historic Bastions** | Core Configuration & Entry | Foundational entrypoints, root configurations, and gateways. |

---

## Traffic Coupling Metric

The codebase coupling density is computed through graph-theoretic analysis:

$$\text{Traffic Index} = \min\left(100, \text{round}\left(\frac{|\text{SCC Edges}| \times 3 + |\text{Cross-Boundary Imports}|}{|\text{Total Edges}|} \times 100\right)\right)$$

- **`|SCC Edges|`**: Directed edges participating in strongly connected component cycles.
- **`|Cross-Boundary Imports|`**: Coupling between frontend and backend boundaries.
- **`Traffic Index = 0%`**: Verifies a clean Directed Acyclic Graph (DAG) topology.

---

## Core Capabilities

### 1. Tarjan SCC Cycle Detection & In-Memory Remediation
- Stack-based iterative Tarjan algorithm runs in $O(V + E)$ time with zero external npm dependencies.
- Disentangles circular dependencies through automated interface contract extraction (`types/*.ts`).
- Generates standard Unified Git Diffs ready for review and application.

### 2. Client-Side Security Boundary Sentry
- Audits client bundles against MITRE CWE standards:
  - **CWE-668 / CWE-1061**: Leaked backend dependencies (`fs`, `net`, ORMs) inside client bundles.
  - **CWE-200 / CWE-798**: Hardcoded secret patterns and private environment variables.
- Provides 1-indexed `file:line:col` coordinates for rapid remediation.

### 3. Architecture Drift & Local Telemetry Store
- Records time-series architectural telemetry in a lightweight local store (`.zenith/`).
- Generates dynamic SVG trend sparklines directly in the telemetry HUD.

### 4. Headless CI Gatekeeper
- Designed for GitHub Actions and pre-commit hooks:
  ```bash
  npx zenith-istanbul --ci --fail-on-cycle --fail-on-leak .
  ```
- Exits with non-zero status codes upon invariant violations, blocking unauthorized PR merges.

---

## Quick Start

### Local Analysis
```bash
# Run interactive 3D visualizer on current directory
npx zenith-istanbul .

# Run on a specific project directory
npx zenith-istanbul /path/to/project
```

### Export Standalone Reports
```bash
# Export single-file self-contained 3D HTML report
npx zenith-istanbul --export-html architecture-report.html .
```

### CI Workflow Integration (`.github/workflows/zenith-gatekeeper.yml`)
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
      - name: Architectural Gatekeeper Audit
        run: npx zenith-istanbul --ci --fail-on-cycle --fail-on-leak . >> $GITHUB_STEP_SUMMARY
```

---

## License

Distributed under the [MIT License](LICENSE).
Author: [Çağrı Giray KEŞAN](https://github.com/Cagrik34)
