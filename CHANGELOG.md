# Changelog

All notable changes to **ZenithIstanbul** (`zenith-istanbul`) are documented in this file.
The project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-09-07 (Production Release)

### 🌟 Core Architectural Metropole Engine
- **Procedural 3D Cyberpunk Metropole**: Renders codebase modules as architectural skyscrapers across the Bosphorus strait using zero-cloud, client-side WebGL (Three.js).
  - **European Side (Avrupa Yakası)**: Frontend, UI, and client-side components.
  - **Asian Side (Anadolu Yakası)**: Backend services, databases, and infrastructure blocks.
  - **Kız Kulesi & Galata Kulesi**: Procedurally anchored beacons representing API gateways (`middleware.ts`) and root entrypoints.
- **Dynamic Traffic Coupling Index**: Real-time graph-theoretic calculation of codebase coupling and complexity:
  $$\text{Traffic Index} = \min\left(100, \text{round}\left(\frac{|\text{SCC Edges}| \times 3 + |\text{Cross-Boundary Imports}|}{|\text{Total Edges}|} \times 100\right)\right)$$
- **Atmospheric Weather Telemetry**: Real-time Istanbul meteorology integration mapping code health to atmospheric fog, rain density, and lighting conditions.

### 🔄 Tarjan SCC Circular Dependency Detection & Agent Remediation
- **Tarjan's Strongly Connected Components (SCC)**: Deterministic detection of cyclic graph invariants with zero runtime npm dependencies.
- **Bridge Ingress Deadlock Visualization**: Circular dependencies cause physical bridge gridlocks and red laser alarms across the Bosphorus.
- **Balanced-Brace Contract Extractor**: Zero-dependency lexical scanner extracting shared TypeScript interface and type definitions into decoupled contracts (`src/contracts/*.contract.ts`), eliminating unexported code leaks.
- **Live Patching Engine**: Direct disk remediation via `POST /api/apply-patch` with path traversal protections.

### 🛡️ Enterprise Security Boundary Sentry
- **MITRE CWE Mapping**:
  - **CWE-668 / CWE-1061 (Exposure to Wrong Sphere)**: Identifies Node.js core modules (`fs`, `net`) and backend ORMs (`@prisma/client`, `typeorm`) leaked into client bundles.
  - **CWE-200 / CWE-798**: Intercepts leaked credentials and environment secrets.
- **Localhost CSRF Firewall**:
  - Strict Origin and Referer validation using `new URL()` checking `parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"`.
  - Blocks cross-site browser requests (`Sec-Fetch-Site: cross-site`) to prevent Drive-by RCE on developer machines.

### 📈 Local-First Fullstack Drift Altimeter
- **Node.js 22+ SQLite & JSONL Persistence**: Dual-engine storage in `.zenith/` tracking architectural metrics across Git commits.
- **Pure SVG Sparkline HUD**: Dynamic time-series HUD with zero-division (`max === min`) and single-point guards.

### 🚀 Headless CI Gatekeeper
- **CLI & GitHub Actions Integration**:
  - `zenith-istanbul --ci --fail-on-cycle --fail-on-leak .`
  - Automated pull request and push blocking for cyclic invariants and security leaks.
  - Native step summary reporting via `$GITHUB_STEP_SUMMARY`.