# Contributing to Zenith Istanbul

Thank you for your interest in contributing to **Zenith Istanbul**! We welcome architectural enhancements, graph-theoretic optimizations, visual rendering refinements, and automated CI gatekeeper improvements.

---

## 🏛️ Core Architectural Invariants

All contributions must adhere to the following architectural design principles:

1. **Zero External Runtime Dependencies & 100% Offline Autonomy**:
   - The core analysis engine, AST lexer, Tarjan SCC solver, and CLI server must rely exclusively on native Node.js core modules (`fs`, `path`, `http`, `crypto`). No third-party npm packages may be introduced to runtime dependencies.
   - The client-side 3D visualization operates strictly offline with bundled local Three.js r128 (`public/vendor/three/`) and local WOFF2 typography (`public/fonts/`). No external CDN requests or remote telemetry endpoints are permitted.

2. **Deterministic Graph Theory**:
   - The Tarjan Strongly Connected Components (SCC) algorithm must execute as an iterative, stack-based depth-first search in $O(V + E)$ time complexity. Recursive traversal is prohibited to avoid call stack exhaustion on enterprise monorepos.
   - Force-directed layout computations must follow deterministic physical equilibrium (Fruchterman–Reingold) without non-deterministic random drift across frames.

3. **Geospatial & Architectural Boundary Mapping**:
   Contributions modifying the 3D metropolitan layout must preserve authentic geographical sector semantics:
   - **European Sector**: Client-side UI modules, React/Vue views, DOM utilities, and presentation assets (Galata, Beşiktaş, Levent/Maslak).
   - **Historic Peninsula**: Compilers, AST parsers, and graph analysis primitives (Sultanahmet, Eminönü).
   - **Asian Sector**: Backend services, database controllers, model catalogs, and local agent memory ledgers (Üsküdar, Kadıköy, Ataşehir IFM).
   - **Bosphorus Strait & Maiden Tower**: Central HTTP security middleware, CSRF firewall, and API gateway routing.
   - **Nakkaştepe Parkland**: Preserved elevated green space on the Asian shore (`x: 88, z: -30`). The `isInPark` boundary check must be strictly enforced to guarantee zero ambient building collisions.

4. **Security & MITRE CWE Boundary Auditing**:
   - Sentry rules audit codebases against MITRE CWE standards (CWE-668 / CWE-1061 for server packages in client bundles, CWE-200 / CWE-798 for credential leaks).
   - Any modifications to HTTP middleware must maintain localhost CSRF validation, strict origin checks, and body payload limits (2 MiB ceiling).

5. **Cross-Platform POSIX Path Hygiene**:
   - File path operations must normalize Windows backslashes (`\`) into POSIX forward slashes (`/`) to ensure deterministic behavior across Windows, macOS, and Linux runners.

---

## 🛠️ Development Workflow

### Prerequisites
- **Node.js**: `>= 18.0.0` (v20+ or v22+ LTS recommended)
- **npm**: `>= 9.0.0`
- **Git**: Modern release

### Setup
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/Cagrik34/zenith-istanbul.git
   cd zenith-istanbul
   ```
2. Start the interactive local 3D telemetry server:
   ```bash
   npm start
   ```
3. Open `http://localhost:4173` in a modern browser with WebGL hardware acceleration.

---

## 🧪 Verification & Test Suite

Before submitting a Pull Request, verify that all test suites pass with 100% success (48/48 tests):

```bash
# 1. Run complete automated test suite & CI gatekeeper audit (48 tests)
npm test

# 2. Run unit tests only
npm run test:unit

# 3. Run headless CI gatekeeper audit only
npm run test:gatekeeper
```

### Pull Request Validation Checklist
- [ ] `npm test` passes 48/48 tests with zero errors or warnings.
- [ ] No new third-party npm dependencies added to `dependencies` in `package.json`.
- [ ] Memory allocation is bounded: geometries and materials instantiated in Three.js are disposed of when scenes reload.
- [ ] All new file paths are normalized to POSIX standard (`/`).
- [ ] Code follows standard ESM JavaScript conventions and strict typing guidelines in `tsconfig.json`.

---

## 📝 Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(metropole)`: New 3D visual or architectural mapping feature
- `feat(core)`: Enhancements to AST parser, Tarjan solver, or telemetry
- `fix(ci)`: Bug fixes for headless CLI, path traversal, or platform compatibility
- `perf(graph)`: Performance optimizations in graph computation or rendering
- `docs(readme)`: Documentation updates or technical specification refinements
- `test(scc)`: Additions or updates to the automated test suite

---

## 📄 License & Attribution

By contributing to **Zenith Istanbul**, you agree that your contributions will be licensed under the [MIT License](LICENSE).
