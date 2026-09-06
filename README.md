# 🌉 ZenithIstanbul (`zenith-istanbul`)
### *3D Codebase Metropole & Autonomous Agent Command Deck*
> **"Inspired by my hometown Istanbul's glorious Bosphorus geography and its notorious evening traffic gridlocks."**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero-Cloud Security](https://img.shields.io/badge/Security-Zero--Cloud%20Client--Side-brightgreen.svg)](#security--privacy)
[![WebGL 60FPS](https://img.shields.io/badge/Render-WebGL%20Three.js-cyan.svg)](#architecture)
[![Author](https://img.shields.io/badge/Crafted%20by-Çağrı%20Giray%20KEŞAN-ff007f.svg)](https://github.com/Cagrik34)

---

## 🌆 The Istanbul Metaphor & Engineering Model

Instead of boring flat dependency trees or passive file tables, **ZenithIstanbul** procedurally transforms any Git repository or local codebase into a living, breathing **3D Cyberpunk Istanbul Metropole**:

| Istanbul Landmark | Software Architecture Mapping | Visual & Simulation Behavior |
|---|---|---|
| **Boğaziçi (The Bosphorus)** | Client / Server Boundary | 3D procedural water shader dividing Frontend from Backend. |
| **Avrupa Yakası (European Side)** | Frontend / UI / Components / Hooks | Modern illuminated glass high-rises (Beşiktaş, Levent, Maslak). |
| **Anadolu Yakası (Asian Side)** | Backend / Services / Database / Core Engine | Heavy industrial infrastructure blocks (Kadıköy, Üsküdar, Ataşehir). |
| **15 Temmuz & FSM Bridges** | API Gateway, RPC & Cross-Boundary Imports | Suspension bridges with glowing cables connecting Europe and Asia. |
| **Köprü Trafik Kilidi (18:00 Traffic Jam)** | **Circular Dependency (Döngüsel Bağımlılık)** & Deadlocks | Vehicles stop, bridge cables turn glowing red, horn alerts sound! Discovered deterministically via **Tarjan's SCC Algorithm**. |
| **Maslak Gökdelenleri** | Monolithic / Complex Files (1000+ LOC) | Mega skyscrapers towering into the sky; roof warning beacons flash on high complexity. |
| **Tarihi Yarımada (Historic Peninsula)** | Core Legacy Primitives & Configs | Ancient stone bastions that rarely change but anchor the entire foundation. |
| **Prens Adaları (Princes' Islands)** | Isolated Microservices & Dead Code | Lone, uninhabited islands floating out in the sea with zero bridge connections. |
| **Metrobüs Line** | High-Throughput Streams (WebSockets, SSE) | High-speed, tightly-packed data packets flowing across the bridges. |

---

## 🤖 Munder-Difflin Style Autonomous Agent Dispatch

ZenithIstanbul doesn't just display bugs; it fixes them live:
1. When a circular dependency or architectural bottleneck is detected, an alert triggers on the AKOM Traffic Bulletin.
2. Click **`⚡ Ajanı Görevlendir (Dispatch Agent)`**.
3. An autonomous refactoring agent (inspired by *Munder-Difflin*) is dispatched to the incident site:
   * Analyzes the Tarjan cycle (`AuthModal ➔ sessionManager ➔ userService ➔ AuthModal`).
   * Decouples the shared interfaces to an independent contract layer in `Tarihi Yarımada`.
   * Live AST updates break the loop in real-time.
4. **Result:** The 15 Temmuz Bridge turns emerald green, traffic begins flowing at 60 FPS, and the celebration horn sounds!

---

## 🛡️ Security & Privacy (Zero-Vulnerability Architecture)

* **100% Zero-Cloud:** All parsing, AST graph generation, and WebGL rendering run completely inside your local browser sandbox. Not a single byte of your code ever leaves your machine.
* **Path Traversal Protection:** All relative import specifiers are strictly sanitized and normalized; attempts to break out of the project root boundary are immediately rejected.
* **Secret Redaction:** `.env*`, `*.pem`, `*.key`, `id_rsa`, `credentials*` and high-entropy secrets are automatically ignored from memory.
* **ReDoS & Infinite Loop Immunity:** Fast single-pass regex extraction with bounded recursion depth prevents UI lockups.

---

## 🚀 Quick Start (Interactive 3D UI & CLI)

No heavy Docker containers, no paid cloud APIs, no C++ compilation struggles:

```bash
# 1. Direct interactive command deck
npx zenith-istanbul .

# 2. Or run from source
git clone https://github.com/Cagrik34/zenith-istanbul.git
cd zenith-istanbul
node bin/cli.js .
```

---

## 🚦 Headless CI Gatekeeper Mode (`--ci`, `--fail-on-cycle`)

Run ZenithIstanbul as an automated architecture linter in your GitHub Actions or CI/CD pipelines without launching a browser:

```bash
# Block merge if there are circular dependencies (exits with code 1)
npx zenith-istanbul --ci --fail-on-cycle .
```

### GitHub Actions Workflow Example (`.github/workflows/zenith-gatekeeper.yml`):
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
        run: npx zenith-istanbul --ci --fail-on-cycle . >> $GITHUB_STEP_SUMMARY
```

---

## 👨‍💻 Author

Crafted with high engineering rigor and love for Istanbul by **[Çağrı Giray KEŞAN](https://github.com/Cagrik34)**.
Part of the **Zenith Project Ecosystem** (*Zenith Atlas, Zenith Nexus, Zenith Istanbul*).

Licensed under the [MIT License](LICENSE).
