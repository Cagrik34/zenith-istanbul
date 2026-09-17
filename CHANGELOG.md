# Changelog

All notable changes to **ZenithIstanbul** (`zenith-istanbul`) are documented in this file.
The project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] — 2026-09-17

### Zero-CDN Offline-First Architecture & Vendoring
- **Local Variable Typography**: Self-hosted `JetBrains Mono` and `Inter` variable WOFF2 subsets in `public/fonts/`, removing Google Fonts CDN dependencies.
- **Local Three.js ESM Runtime**: Vendored official Three.js r170 ESM engine and `OrbitControls.js` in `public/vendor/three/`, eliminating `esm.sh` and `unpkg.com` requests.
- **Strict Content Security Policy (CSP)**: Added `default-src 'self'` CSP metadata to prevent unauthorized third-party script injection.

### Modular Client Decomposition & Boundary Separation
- **Client/Server Physical Isolation**: Decomposed monolithic 4,677-line `index.html` into a lightweight HTML5 shell (`public/index.html`), 5 modular stylesheets (`public/css/`), and modular client JavaScript (`public/js/`).
- **Server Engine Purification**: Cleared client presentation code from `src/`, establishing `src/core/` and `src/agent/` as pure Node.js backend modules.
- **Dual GitHub Pages Compatibility**: Configured automated distribution workflow in `.github/workflows/deploy-pages.yml` with clean `_site` packaging and root fallback redirect.

### Security Hardening & Edge-Case Resilience
- **HTTP DoS Body Limiter**: Enforced 2 MiB hard limit on incoming mutation payloads via `readBodyWithLimit`.
- **Node.js 22+ Deprecation Fix**: Eliminated `DEP0190` shell warning in platform-specific browser launchers.
- **Offline GitHub Ingestion Guard**: Prevented synthetic data generation on network failure, surfacing actionable SRE recovery protocols.
- **WebGL Context Loss Recovery**: Attached `webglcontextlost` and `webglcontextrestored` event hooks to preserve telemetry state across GPU sleep/wake cycles.

---

## [1.0.0] — 2026-09-08

### Architectural Core Engine
- **3D Geospatial Topology Visualizer**: Renders codebase modules as 3D structures across the Bosphorus strait using client-side WebGL (Three.js).
  - **European Sector**: Presentation layers, UI components, and client-side modules.
  - **Asian Sector**: Backend services, database pools, and infrastructure components.
  - **Landmarks & Gateways**: Root entrypoints and API gateways procedurally anchored to landmark coordinates.
- **Dynamic Traffic Coupling Index**: Real-time graph-theoretic calculation of codebase coupling and complexity.
- **Luminous Lighting & Vector Topography**: Realistic S-curve waterway, Haliç (Golden Horn) inlet, and Sarayburnu promontory geometry with dual-color shoreline guides.

### Tarjan SCC Cycle Detection & Autonomous Remediation
- **Tarjan's Strongly Connected Components (SCC)**: Stack-based iterative cycle detection with zero external runtime dependencies.
- **Automated Contract Synthesis**: Disentangles circular dependencies through abstract TypeScript contract generation (`types/*.ts`).
- **Unified Diff Generation**: Emits standard Git patches for review and disk application.

### Security Boundary Invariant Sentry
- **MITRE CWE Audit**:
  - **CWE-668 / CWE-1061**: Intercepts backend module leakage into client-side bundles.
  - **CWE-200 / CWE-798**: Flags leaked credentials and environment secrets with 1-indexed source coordinates.
- **Localhost CSRF Firewall**: Origin and referer validation with DNS-rebinding protection.

### AKOM Autonomous SRE Swarm & Memory Graph
- **Autonomous Multi-Agent System**: 5 specialized agents (Commander, Bridge Engineer, Security Sentinel, Refactorer, QA Inspector) operating via atomic filesystem mailboxes.
- **FIPA-Lite Message Routing**: Type-safe speech acts (`request`, `inform`, `query`, `propose`, `agree`, `refuse`, `done`) with anti-livelock hop caps.
- **Resilient Message Pipeline**: Literal line-break recovery (`repairLiteralLineBreaksInJsonStrings`), `.malformed/` quarantine, and broadcast fan-out filtering.
- **Invariant-Preserving Task Ledger**: Atomic merge rules (`mergeTaskLedger`, `patchTaskInLedger`) safeguarding custom card metadata.
- **5-Tier Secret Redaction Battery**: Masks private keys, JWTs, cloud API keys, Bearer tokens, and named key-value credentials across all inter-agent traffic.
- **Interactive Memory Graph**: Force-directed equilibrium positioning using the Fruchterman–Reingold physics model, client-side semantic topic extraction, and interactive SVG dragging.
- **Dynamic Model Catalog**: 6-hour disk TTL catalog caching with strict shell injection validation (`validateModelId`).

### Headless CI Gatekeeper
- **CLI and GitHub Actions Integration**:
  - `zenith-istanbul --ci --fail-on-cycle --fail-on-leak [directory]`
  - Automated PR and push gating with step summary reporting.
