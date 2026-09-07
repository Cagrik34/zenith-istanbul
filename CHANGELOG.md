# Changelog

All notable changes to **ZenithIstanbul** (`zenith-istanbul`) are documented in this file.
The project adheres to [Semantic Versioning](https://semver.org/).

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

### Headless CI Gatekeeper
- **CLI and GitHub Actions Integration**:
  - `zenith-istanbul --ci --fail-on-cycle --fail-on-leak [directory]`
  - Automated PR and push gating with step summary reporting.
