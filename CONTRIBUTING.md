# Contributing to ZenithIstanbul

Thank you for your interest in contributing to **ZenithIstanbul**! We welcome architectural enhancements, parser optimisations, visual effects, and bug fixes.

---

## Development Workflow

### Prerequisites
- Node.js >= 18.0.0
- Git

### Quick Setup
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/Cagrik34/zenith-istanbul.git
   cd zenith-istanbul
   ```
2. Start the interactive local 3D telemetry server:
   ```bash
   npm start
   ```
3. Open `http://localhost:4173` in any modern browser with WebGL hardware acceleration.

---

## Architectural Principles

1. **Zero External Runtime Dependencies**: All AST parsing, Tarjan SCC graph algorithms, and CLI serving use native Node.js core modules. Three.js is consumed directly via standard ESM CDN in the browser.
2. **Deterministic Graph Theory**: Tarjan SCC runs in $O(V + E)$ stack-based iterative DFS to avoid call stack overflow on large monorepos.
3. **Cross-Platform POSIX Hygiene**: Always normalize file paths with forward slashes (`/`).

---

## Verification & Testing

Before submitting a Pull Request, verify that all test suites and gatekeeper rules pass:

```bash
# Run unit tests and gatekeeper audit
npm test

# Run unit tests only
npm run test:unit

# Run gatekeeper audit only
npm run test:gatekeeper
```
