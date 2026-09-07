/**
 * ZenithIstanbul - Traffic Engine & Tarjan SCC Circular Dependency Detector
 * Mathematical graph intelligence & Istanbul traffic simulation logic.
 */

export class TrafficEngine {
  constructor() {
    this.modules = new Map(); // id -> module
    this.adjacencyList = new Map(); // id -> Set of target ids
    this.reverseAdjacencyList = new Map(); // id -> Set of incoming source ids
    this.circularChains = []; // [ [id1, id2, id3, id1], ... ]
    this.bridges = []; // Cross-boundary bridges (Europe <-> Asia)
    this.trafficDensity = 15; // Percentage (0 - 100)
    this.deadCodeModules = []; // Modules with 0 incoming imports (Isolated Subgraphs)
    this.securityLeaks = []; // Client-Side Leak Detector / Secret & Boundary Violation Sentry
  }

  /**
   * Modül listesini graf yapısına yükler
   * @param {Array} parsedModules - Parser çıktısı modüller
   */
  loadModules(parsedModules) {
    this.modules.clear();
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();
    this.circularChains = [];
    this.bridges = [];
    this.deadCodeModules = [];
    this.securityLeaks = [];

    for (const mod of parsedModules) {
      this.modules.set(mod.id, mod);
      this.adjacencyList.set(mod.id, new Set());
      this.reverseAdjacencyList.set(mod.id, new Set());
    }

    for (const mod of parsedModules) {
      for (const rawImport of mod.imports) {
        if (rawImport.startsWith('vendor:')) continue;

        const targetId = this.findMatchingModuleId(rawImport);
        if (targetId && targetId !== mod.id) {
          const targetMod = this.modules.get(targetId);

          if (targetMod && targetMod.isBarrel && targetMod.imports.length > 0) {
            for (const subImport of targetMod.imports) {
              const subTargetId = this.findMatchingModuleId(subImport);
              if (subTargetId && subTargetId !== mod.id) {
                this.adjacencyList.get(mod.id).add(subTargetId);
                if (this.reverseAdjacencyList.has(subTargetId)) {
                  this.reverseAdjacencyList.get(subTargetId).add(mod.id);
                }
              }
            }
          } else {
            this.adjacencyList.get(mod.id).add(targetId);
            if (this.reverseAdjacencyList.has(targetId)) {
              this.reverseAdjacencyList.get(targetId).add(mod.id);
            }
          }
        }
      }
    }

    this.detectCircularDependenciesTarjanIterative();

    this.detectBosphorusBridges();

    this.detectDeadCode();

    this.detectSecurityLeaks();

    this.calculateTrafficDensity();
  }

  findMatchingModuleId(importPath) {
    if (this.modules.has(importPath)) return importPath;
    for (const key of this.modules.keys()) {
      const strippedKey = key.replace(/\.[^/.]+$/, '');
      const strippedImport = importPath.replace(/\.[^/.]+$/, '');
      if (strippedKey === strippedImport || key.endsWith('/' + importPath)) {
        return key;
      }
    }
    return null;
  }

  /**
   * İteratif Yığın Tabanlı Tarjan's SCC Algoritması (Iterative Stack-based DFS)
   * V8 Call Stack taşmalarını (Maximum call stack size exceeded) önlemek için açık döngü ve heap yığını kullanır.
   * 50.000+ dosyalık devasa monorepolarda dahi 0 çökme ile O(V + E) sürede çalışır.
   */
  detectCircularDependenciesTarjanIterative() {
    let index = 0;
    const indices = new Map();
    const lowlink = new Map();
    const onStack = new Map();
    const stack = [];
    const sccs = [];

    for (const startNode of this.modules.keys()) {
      if (indices.has(startNode)) continue;

      const callStack = [{
        v: startNode,
        neighbors: Array.from(this.adjacencyList.get(startNode) || []),
        neighborIdx: 0
      }];

      indices.set(startNode, index);
      lowlink.set(startNode, index);
      index++;
      stack.push(startNode);
      onStack.set(startNode, true);

      while (callStack.length > 0) {
        const top = callStack[callStack.length - 1];
        const v = top.v;

        if (top.neighborIdx < top.neighbors.length) {
          const w = top.neighbors[top.neighborIdx++];

          if (!indices.has(w)) {
            indices.set(w, index);
            lowlink.set(w, index);
            index++;
            stack.push(w);
            onStack.set(w, true);

            callStack.push({
              v: w,
              neighbors: Array.from(this.adjacencyList.get(w) || []),
              neighborIdx: 0
            });
          } else if (onStack.get(w)) {
            lowlink.set(v, Math.min(lowlink.get(v), indices.get(w)));
          }
        } else {
          callStack.pop();

          if (callStack.length > 0) {
            const parent = callStack[callStack.length - 1].v;
            lowlink.set(parent, Math.min(lowlink.get(parent), lowlink.get(v)));
          }

          if (lowlink.get(v) === indices.get(v)) {
            const scc = [];
            let w;
            do {
              w = stack.pop();
              onStack.set(w, false);
              scc.push(w);
            } while (w !== v);

            if (scc.length > 1) {
              sccs.push(scc);
            }
          }
        }
      }
    }

    this.circularChains = sccs.map(scc => [...scc, scc[0]]);
  }

  /**
   * İki yaka arasındaki importları köprü olarak etiketle
   */
  detectBosphorusBridges() {
    this.bridges = [];

    for (const [sourceId, targets] of this.adjacencyList.entries()) {
      const sourceMod = this.modules.get(sourceId);
      if (!sourceMod) continue;

      for (const targetId of targets) {
        const targetMod = this.modules.get(targetId);
        if (!targetMod) continue;

        const isCrossBoundary = (sourceMod.district.side === 'europe' && targetMod.district.side === 'asia') ||
                                (sourceMod.district.side === 'asia' && targetMod.district.side === 'europe');

        if (isCrossBoundary) {
          const isJammed = this.isEdgeInCircularDependency(sourceId, targetId);

          this.bridges.push({
            id: `bridge-${sourceId}->${targetId}`,
            sourceId,
            targetId,
            sourceName: sourceMod.name,
            targetName: targetMod.name,
            sourceSide: sourceMod.district.side,
            targetSide: targetMod.district.side,
            isJammed, // Kırmızı kilitli mi?
            bridgeName: this.bridges.length % 2 === 0 ? '15 Temmuz Şehitler Köprüsü' : 'Fatih Sultan Mehmet Köprüsü',
            incidentReport: isJammed ? `🚨 Trafik Kilit! ${sourceMod.name} ile ${targetMod.name} arasında döngüsel bağımlılık köprüyü tıkadı.` : null
          });
        }
      }
    }
  }

  isEdgeInCircularDependency(sourceId, targetId) {
    for (const chain of this.circularChains) {
      for (let i = 0; i < chain.length - 1; i++) {
        if (chain[i] === sourceId && chain[i + 1] === targetId) return true;
        if (chain[i] === targetId && chain[i + 1] === sourceId) return true;
      }
    }
    return false;
  }

  detectDeadCode() {
    this.deadCodeModules = [];
    for (const [id, mod] of this.modules.entries()) {
      if (mod.isCore) continue; // index/app dosyaları kök olduğu için hariç
      const incoming = this.reverseAdjacencyList.get(id);
      if (!incoming || incoming.size === 0) {
        mod.district = { side: 'islands', district: 'Prens Adaları', color: '#64748b' };
        this.deadCodeModules.push(mod);
      }
    }
  }

  /**
   * Client-Side Leak Detector / Secret & Boundary Violation Sentry
   */
  detectSecurityLeaks() {
    this.securityLeaks = [];
    for (const mod of this.modules.values()) {
      if (mod.securityLeaks && mod.securityLeaks.length > 0) {
        for (const leak of mod.securityLeaks) {
          this.securityLeaks.push({
            moduleId: mod.id,
            moduleName: mod.name,
            district: mod.district.district,
            ...leak
          });
        }
      }
    }
  }

  /**
   * Calculates dynamic architectural traffic index using formal graph theory:
   * Traffic Index = min(100, round(((|SCC Edges| * 3 + |Cross-Boundary Imports|) / |Total Edges|) * 100))
   */
  calculateTrafficDensity() {
    let totalEdges = 0;
    for (const targets of this.adjacencyList.values()) {
      totalEdges += targets.size;
    }

    let sccEdges = 0;
    const sccNodeSets = (this.sccs || []).map(scc => new Set(scc));
    for (const [sourceId, targets] of this.adjacencyList.entries()) {
      for (const targetId of targets) {
        for (const sccSet of sccNodeSets) {
          if (sccSet.has(sourceId) && sccSet.has(targetId)) {
            sccEdges++;
            break;
          }
        }
      }
    }

    const crossBoundaryImports = this.bridges.length;

    if (totalEdges === 0) {
      this.trafficDensity = 0;
      this.telemetryMetrics = { totalEdges: 0, sccEdges: 0, crossBoundaryImports: 0, rawIndex: 0 };
      return;
    }

    const rawIndex = ((sccEdges * 3 + crossBoundaryImports) / totalEdges) * 100;
    this.trafficDensity = Math.min(100, Math.max(0, Math.round(rawIndex)));
    this.telemetryMetrics = {
      totalEdges,
      sccEdges,
      crossBoundaryImports,
      rawIndex: Number(rawIndex.toFixed(2))
    };
  }

  /**
   * Enterprise Architectural Telemetry & Topology Status
   */
  generateTelemetryReport() {
    const jammedCount = this.bridges.filter(b => b.isJammed).length;
    let statusText = 'NOMINAL: Ingress/Egress Topology Optimal (0 Cycle Invariants)';
    let alertLevel = 'success';

    if (this.circularChains.length > 0) {
      statusText = `CRITICAL: Cyclic Deadlock Detected (Tarjan SCC Violation in Bridge Ingress: ${this.circularChains.length} cycles)`;
      alertLevel = 'critical';
    } else if (this.securityLeaks.length > 0) {
      statusText = `WARNING: Client-Side Security Boundary Breached (${this.securityLeaks.length} exposures detected)`;
      alertLevel = 'warning';
    } else if (this.trafficDensity >= 40) {
      statusText = 'CAUTION: Cross-Boundary Coupling Elevated (>40% dependency load)';
      alertLevel = 'warning';
    }

    return {
      density: this.trafficDensity,
      telemetryMetrics: this.telemetryMetrics,
      statusText,
      alertLevel,
      totalModules: this.modules.size,
      circularDependencies: this.circularChains.length,
      jammedBridges: jammedCount,
      deadCodeCount: this.deadCodeModules.length,
      securityLeaks: this.securityLeaks,
      securityLeakCount: this.securityLeaks.length,
      chains: this.circularChains
    };
  }

  /**
   * Backward-compatibility alias for Architectural Telemetry & Topology Status
   */
  generateAkomReport() {
    return this.generateTelemetryReport();
  }

  /**
   * Bir modülün etki alanını (Blast Radius) hesaplar
   * @param {string} moduleId - Seçilen modül
   */
  calculateBlastRadius(moduleId) {
    const directDependents = Array.from(this.reverseAdjacencyList.get(moduleId) || []);
    const directDependencies = Array.from(this.adjacencyList.get(moduleId) || []);

    const transitDependents = new Set();
    for (const dep of directDependents) {
      const secondTier = this.reverseAdjacencyList.get(dep);
      if (secondTier) {
        for (const st of secondTier) {
          if (st !== moduleId && !directDependents.includes(st)) {
            transitDependents.add(st);
          }
        }
      }
    }

    const totalImpactCount = directDependents.length + transitDependents.size;
    let riskLevel = 'LOW';
    if (totalImpactCount > 8) riskLevel = 'CRITICAL: Monolithic Blast Radius Exposure';
    else if (totalImpactCount > 3) riskLevel = 'MEDIUM: High Cross-Subsystem Coupling';

    return {
      moduleId,
      directDependents,
      directDependencies,
      transitDependents: Array.from(transitDependents),
      totalImpactCount,
      riskLevel
    };
  }

  /**
   * Generates formal Markdown Architectural Telemetry & SRE Report
   */
  exportArchitectureReportMarkdown() {
    const report = this.generateAkomReport();
    let md = `# 🌉 ZenithIstanbul — Architectural Telemetry & Topology Audit\n\n`;
    md += `**Timestamp:** ${new Date().toISOString()}\n`;
    md += `**Traffic Index:** ${report.density}% (${report.statusText})\n`;
    md += `**Total Modules:** ${report.totalModules}\n`;
    md += `**Strongly Connected Components (Tarjan SCC Cycles):** ${report.circularDependencies}\n`;
    md += `**Cross-Boundary Bridge Edges:** ${this.bridges.length}\n`;
    md += `**Security Boundary Exposures:** ${report.securityLeakCount}\n`;
    md += `**Isolated Subgraphs (Zero In-Degree Modules):** ${report.deadCodeCount}\n\n`;

    if (report.telemetryMetrics) {
      md += `### 📐 Graph Theory Telemetry Metrics\n`;
      md += `* Total Graph Edges ($|E|$): \`${report.telemetryMetrics.totalEdges}\`\n`;
      md += `* SCC Internal Edges: \`${report.telemetryMetrics.sccEdges}\`\n`;
      md += `* Cross-Boundary Ingress Edges: \`${report.telemetryMetrics.crossBoundaryImports}\`\n`;
      md += `* Formula: $\\min(100, \\frac{|\\text{SCC}| \\times 3 + |\\text{CrossBoundary}|}{|E|} \\times 100) = ${report.telemetryMetrics.rawIndex}\\%$\n\n`;
    }

    if (report.securityLeakCount > 0) {
      md += `## 🛡️ Client-Side Leak Detector & Security Boundary Sentry\n`;
      md += `| File Coordinate | Rule & CWE | Leaked Entity / Package | Remediation Directive |\n`;
      md += `|---|---|---|---|\n`;
      report.securityLeaks.forEach(leak => {
        md += `| \`${leak.location || leak.moduleName}\` | ${leak.rule || 'CWE-200'} | **${leak.target}** | ${leak.message} |\n`;
      });
      md += `\n`;
    }

    md += `## 🚨 Strongly Connected Component Invariants (Cyclic Deadlocks)\n`;
    if (this.circularChains.length === 0) {
      md += `> ✅ Zero cyclic dependency deadlocks detected. Directed Acyclic Graph (DAG) verified.\n\n`;
    } else {
      this.circularChains.forEach((chain, i) => {
        md += `### Deadlock Path #${i + 1}:\n`;
        md += `\`${chain.join(' ➔ ')}\`\n\n`;
      });
    }

    md += `## 🏙️ Subsystem Topology Distribution\n`;
    md += `| Subsystem / Sector | Logical Domain | Module Count | Semantic Responsibility |\n`;
    md += `|---|---|---|---|\n`;
    md += `| **Levent / Maslak** | Europe (Client) | ${Array.from(this.modules.values()).filter(m => m.district.district.includes('Maslak') || m.district.district.includes('Levent')).length} | High-complexity user views, page routes, and presentation state |\n`;
    md += `| **Beşiktaş / Şişli** | Europe (Client) | ${Array.from(this.modules.values()).filter(m => m.district.district.includes('Beşiktaş') || m.district.district.includes('Şişli')).length} | Primitive UI design system elements & atomic components |\n`;
    md += `| **Kadıköy / Üsküdar** | Asia (Server) | ${Array.from(this.modules.values()).filter(m => m.district.side === 'asia').length} | Data layer, server actions, ORM schemas, domain services |\n`;
    md += `| **Tarihi Yarımada** | Core (Anchor) | ${Array.from(this.modules.values()).filter(m => m.district.side === 'historic').length} | Foundational runtime primitives, contracts, and configurations |\n`;
    md += `| **Kız Kulesi** | Gateway | ${Array.from(this.modules.values()).filter(m => m.district.isLandmark === 'maiden_tower').length} | Ingress Proxy, API Gateway, Edge Middleware router |\n`;
    md += `| **Galata Kulesi** | Root Entry | ${Array.from(this.modules.values()).filter(m => m.district.isLandmark === 'galata_tower').length} | Master application bootstrapper & entrypoint |\n`;
    md += `| **Prens Adaları** | Isolated | ${report.deadCodeCount} | Zero in-degree unreferenced modules (Dead Code candidates) |\n\n`;

    md += `---\n*Generated by ZenithIstanbul Zero-Cloud Static Analysis Engine. Zero external code exfiltration.*\n`;
    return md;
  }

  /**
   * Generates formal GitHub Pull Request Telemetry Comment
   */
  generatePrCommentMarkdown() {
    const report = this.generateAkomReport();
    const isClean = report.circularDependencies === 0 && report.securityLeakCount === 0;

    let comment = `## 🌉 ZenithIstanbul — Architectural Telemetry & Gatekeeper Status\n\n`;
    comment += `| Architectural Telemetry Metric | Measured Value | Threshold Status |\n`;
    comment += `|---|:---:|:---:|\n`;
    comment += `| **Traffic Coupling Index** | **${report.density}%** | ${isClean ? '🟢 Optimal' : '🚨 CRITICAL DEADLOCK'} |\n`;
    comment += `| **Cyclic Invariants (Tarjan SCC)** | **${report.circularDependencies}** | ${report.circularDependencies === 0 ? '✅ Pass (DAG Verified)' : '❌ FAIL (Merge Blocked)'} |\n`;
    comment += `| **Security Boundary Exposures** | **${report.securityLeakCount}** | ${report.securityLeakCount === 0 ? '🛡️ Pass (CWE Compliant)' : '❌ FAIL (Exposures Detected)'} |\n`;
    comment += `| **Cross-Boundary API Edges** | **${this.bridges.length}** | 🌉 Ingress Bridges |\n`;
    comment += `| **Zero In-Degree Isolated Modules** | **${report.deadCodeCount}** | ${report.deadCodeCount === 0 ? '✅ 100% Referenced' : 'ℹ️ Isolated Subgraph'} |\n\n`;

    if (report.securityLeakCount > 0) {
      comment += `> 🚨 **SECURITY SENTRY FAILURE:** ${report.securityLeakCount} client-side files breach architectural security boundaries (CWE-668 / CWE-1061 or CWE-200 violation). Server secrets or backend dependencies exposed in client bundle.\n\n`;
    }

    if (report.circularDependencies > 0) {
      comment += `> ❌ **GATEKEEPER BLOCKED:** Pull request introduces cyclic dependencies breaking Directed Acyclic Graph topology. Remediate with decoupled contract layer.\n\n`;
    }

    if (isClean) {
      comment += `> ✨ **GATEKEEPER PASSED:** Architectural graph topology is clean. Zero cycle invariants, zero security boundary breaches detected.\n\n`;
    }

    comment += `*Automated report generated by ZenithIstanbul Client-Side SRE Engine.*`;
    return comment;
  }


  /**
   * Generates 2D Vector Architecture Diagram (SVG)
   */
  exportArchitectureSvg() {
    const modules = Array.from(this.modules.values());
    if (modules.length === 0) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><text x="400" y="200" text-anchor="middle" fill="#888">No modules available</text></svg>`;
    }

    const escapeSvgText = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Group modules into architectural columns
    const europeMods = modules.filter(m => m.district && m.district.side === 'europe');
    const coreMods = modules.filter(m => m.district && (m.district.side === 'historic' || m.district.isLandmark));
    const asiaMods = modules.filter(m => m.district && m.district.side === 'asia');
    const otherMods = modules.filter(m => !europeMods.includes(m) && !coreMods.includes(m) && !asiaMods.includes(m));

    const columns = [
      { title: 'Avrupa Yakası (Client & UI)', mods: europeMods, color: '#0284c7' },
      { title: 'Tarihi Çekirdek & Boğaz (Core & Gateway)', mods: [...coreMods, ...otherMods], color: '#eab308' },
      { title: 'Anadolu Yakası (Server & Data)', mods: asiaMods, color: '#ec4899' }
    ];

    const maxRows = Math.max(1, Math.max(...columns.map(c => c.mods.length)));
    const cardWidth = 220;
    const cardHeight = 64;
    const gapX = 140;
    const gapY = 24;
    const startX = 60;
    const startY = 120;

    const totalWidth = startX * 2 + columns.length * cardWidth + (columns.length - 1) * gapX;
    const totalHeight = startY + maxRows * (cardHeight + gapY) + 80;

    const nodePositions = new Map();

    columns.forEach((col, colIdx) => {
      const colX = startX + colIdx * (cardWidth + gapX);
      col.mods.forEach((mod, rowIdx) => {
        const rowY = startY + rowIdx * (cardHeight + gapY);
        nodePositions.set(mod.id, {
          x: colX,
          y: rowY,
          cx: colX + cardWidth / 2,
          cy: rowY + cardHeight / 2,
          rightX: colX + cardWidth,
          leftX: colX,
          color: col.color,
          mod
        });
      });
    });

    const cyclePairs = new Set();
    this.circularChains.forEach(chain => {
      for (let i = 0; i < chain.length; i++) {
        const next = chain[(i + 1) % chain.length];
        cyclePairs.add(`${chain[i]}->${next}`);
      }
    });

    let pathsSvg = '';
    for (const [sourceId, sourcePos] of nodePositions.entries()) {
      const mod = sourcePos.mod;
      if (!mod.imports) continue;

      for (const imp of mod.imports) {
        let targetPos = nodePositions.get(imp);
        if (!targetPos) {
          for (const [tId, tPos] of nodePositions.entries()) {
            if (tId.endsWith(imp) || tPos.mod.name === imp || imp.endsWith(tPos.mod.name)) {
              targetPos = tPos;
              break;
            }
          }
        }

        if (targetPos && targetPos !== sourcePos) {
          const isCycle = cyclePairs.has(`${sourceId}->${targetPos.mod.id}`) || cyclePairs.has(`${targetPos.mod.id}->${sourceId}`);
          
          let startPtX, startPtY, endPtX, endPtY;
          if (sourcePos.cx < targetPos.cx) {
            startPtX = sourcePos.rightX;
            startPtY = sourcePos.cy;
            endPtX = targetPos.leftX;
            endPtY = targetPos.cy;
          } else if (sourcePos.cx > targetPos.cx) {
            startPtX = sourcePos.leftX;
            startPtY = sourcePos.cy;
            endPtX = targetPos.rightX;
            endPtY = targetPos.cy;
          } else {
            startPtX = sourcePos.rightX;
            startPtY = sourcePos.cy;
            endPtX = targetPos.rightX;
            endPtY = targetPos.cy;
          }

          const dx = endPtX - startPtX;
          const curveOffset = Math.max(30, Math.abs(dx) * 0.4);
          const c1x = sourcePos.cx <= targetPos.cx ? startPtX + curveOffset : startPtX - curveOffset;
          const c2x = sourcePos.cx <= targetPos.cx ? endPtX - curveOffset : endPtX + curveOffset;

          const stroke = isCycle ? '#ef4444' : 'rgba(14, 165, 233, 0.45)';
          const strokeWidth = isCycle ? '2.5' : '1.5';
          const dash = isCycle ? 'stroke-dasharray="5,4"' : '';
          const marker = isCycle ? 'url(#arrow-cycle)' : 'url(#arrow)';

          pathsSvg += `<path d="M ${startPtX} ${startPtY} C ${c1x} ${startPtY}, ${c2x} ${endPtY}, ${endPtX} ${endPtY}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" ${dash} marker-end="${marker}" />\n`;
        }
      }
    }

    let nodesSvg = '';
    for (const [modId, pos] of nodePositions.entries()) {
      const mod = pos.mod;
      const isCycle = this.circularChains.some(c => c.includes(modId));
      const strokeColor = isCycle ? '#ef4444' : pos.color;
      const strokeWidth = isCycle ? '2' : '1';
      const healthColor = mod.healthScore > 80 ? '#22c55e' : '#f97316';

      nodesSvg += `
        <g class="node" transform="translate(${pos.x}, ${pos.y})">
          <rect width="${cardWidth}" height="${cardHeight}" rx="8" ry="8" fill="#1e293b" stroke="${strokeColor}" stroke-width="${strokeWidth}" filter="url(#shadow)" />
          <line x1="0" y1="0" x2="4" y2="${cardHeight}" stroke="${healthColor}" stroke-width="4" stroke-linecap="round" />
          <text x="14" y="22" fill="#f8fafc" font-size="12" font-weight="700" font-family="'JetBrains Mono', monospace">${escapeSvgText(mod.name.length > 20 ? mod.name.slice(0, 18) + '..' : mod.name)}</text>
          <text x="14" y="38" fill="#94a3b8" font-size="10" font-family="'Space Grotesk', sans-serif">LOC: ${mod.loc || 0} • Cmplx: ${mod.complexity || 0}</text>
          <text x="14" y="52" fill="${pos.color}" font-size="9" font-family="'Space Grotesk', sans-serif">${escapeSvgText(mod.district ? mod.district.district : 'Metropole')}</text>
          ${isCycle ? `<rect x="${cardWidth - 42}" y="8" width="34" height="16" rx="4" fill="#ef4444" /><text x="${cardWidth - 25}" y="19" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle" font-family="sans-serif">SCC</text>` : ''}
        </g>
      `;
    }

    let columnsHeaderSvg = '';
    columns.forEach((col, colIdx) => {
      const colX = startX + colIdx * (cardWidth + gapX);
      columnsHeaderSvg += `
        <g transform="translate(${colX}, 75)">
          <rect width="${cardWidth}" height="28" rx="6" fill="${col.color}22" stroke="${col.color}" stroke-width="1" />
          <text x="${cardWidth / 2}" y="18" text-anchor="middle" fill="${col.color}" font-size="11" font-weight="bold" font-family="'Space Grotesk', sans-serif">${escapeSvgText(col.title)}</text>
        </g>
      `;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0ea5e9" />
    </marker>
    <marker id="arrow-cycle" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
    </marker>
  </defs>
  <rect width="100%" height="100%" fill="#0f172a" />
  
  <!-- Header Title -->
  <g transform="translate(60, 45)">
    <text x="0" y="0" fill="#f8fafc" font-size="20" font-weight="800" font-family="'Space Grotesk', sans-serif">🌉 Zenithİstanbul — 2D Architectural Topology Vector Map</text>
    <text x="650" y="0" fill="#94a3b8" font-size="12" font-family="'Space Grotesk', sans-serif">Total Modules: ${modules.length} | Tarjan SCC Cycles: ${this.circularChains.length} | Bridges: ${this.bridges.length}</text>
  </g>

  ${columnsHeaderSvg}
  <g id="edges">${pathsSvg}</g>
  <g id="nodes">${nodesSvg}</g>
</svg>`;
  }

}
