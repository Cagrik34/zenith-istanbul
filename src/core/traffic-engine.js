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
    this.deadCodeModules = []; // Modules with 0 incoming imports (Prens Adaları)
    this.securityLeaks = []; // İstemciye sızan sunucu paketleri ve ortam değişkenleri (Sahil Güvenlik)
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

    // 1. Modül indeksleme
    for (const mod of parsedModules) {
      this.modules.set(mod.id, mod);
      this.adjacencyList.set(mod.id, new Set());
      this.reverseAdjacencyList.set(mod.id, new Set());
    }

    // 2. Kenar (Edge / Import) bağlantılarını kurma & Barrel Flattening
    for (const mod of parsedModules) {
      for (const rawImport of mod.imports) {
        if (rawImport.startsWith('vendor:')) continue;

        // Hedef modülü bul
        const targetId = this.findMatchingModuleId(rawImport);
        if (targetId && targetId !== mod.id) {
          const targetMod = this.modules.get(targetId);

          // Barrel File Flattening: Eğer hedef bir barrel file ise doğrudan alt modüllere bağla
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

    // 3. Döngüsel Bağımlılıkları (Circular Dependencies) İteratif Tarjan SCC ile bul
    this.detectCircularDependenciesTarjanIterative();

    // 4. İki yaka arasındaki Boğaz Köprülerini çıkar (Avrupa <-> Anadolu)
    this.detectBosphorusBridges();

    // 5. Ölü Kodları (Dead Code / Unused Modules) tespit et -> Prens Adaları
    this.detectDeadCode();

    // 6. Sahil Güvenlik: İstemciye Sızan Sunucu Sırları & Yasaklı Paketleri Topla
    this.detectSecurityLeaks();

    // 7. İstanbul Trafik Yoğunluk İndeksini Hesapla
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

      // Açık çağrı yığını (Explicit call stack)
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
            // Ziyaret edilmemiş komşu: Yeni çerçeveyi yığına it
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
            // Komşu yığında, döngü tespit edildi!
            lowlink.set(v, Math.min(lowlink.get(v), indices.get(w)));
          }
        } else {
          // Bu düğümün tüm komşuları tamamlandı, geri dönüş (Post-order processing)
          callStack.pop();

          if (callStack.length > 0) {
            const parent = callStack[callStack.length - 1].v;
            lowlink.set(parent, Math.min(lowlink.get(parent), lowlink.get(v)));
          }

          // v kök düğüm ise SCC'yi çıkar
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

    // Döngü zincirlerini formatla
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
          // Bu bağlantı bir Boğaz Köprüsü üzerinden akıyor
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
        // Kimse bu modülü import etmiyor -> Adalar'a sürgün!
        mod.district = { side: 'islands', district: 'Prens Adaları', color: '#64748b' };
        this.deadCodeModules.push(mod);
      }
    }
  }

  /**
   * Sahil Güvenlik: İstemci bileşenlerine sızan sunucu paketleri ve secret anahtarlarını topla
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
   * İBB / AKOM tarzı İstanbul Trafik Yoğunluk İndeksi hesabı (%0 - %100)
   */
  calculateTrafficDensity() {
    let density = 20; // Baz akıcı trafik

    // Döngüsel bağımlılıklar trafiği kilitler
    density += this.circularChains.length * 25;

    // Kilitli köprüler
    const jammedBridges = this.bridges.filter(b => b.isJammed).length;
    density += jammedBridges * 20;

    // Sahil Güvenlik alarmları (Hassas anahtar / paket kaçakçılığı)
    density += this.securityLeaks.length * 15;

    // Yüksek karmaşıklık monolitleri
    let highComplexityCount = 0;
    for (const mod of this.modules.values()) {
      if (mod.complexity > 40) highComplexityCount++;
    }
    density += Math.min(25, highComplexityCount * 4);

    this.trafficDensity = Math.min(99, Math.max(12, density));
  }

  /**
   * Genel durum bülteni (AKOM Raporu)
   */
  generateAkomReport() {
    const jammedCount = this.bridges.filter(b => b.isJammed).length;
    let statusText = 'Trafik Akıcı (Tüm Köprüler Açık)';
    let alertLevel = 'success';

    if (this.trafficDensity >= 70) {
      statusText = '🚨 ŞEHİR GENELİ KİLİT! Köprülerde Dairesel Bağımlılık Alarmı';
      alertLevel = 'critical';
    } else if (this.securityLeaks.length > 0) {
      statusText = `🚨 SAHİL GÜVENLİK ALARMI! ${this.securityLeaks.length} Hassas Sunucu Sızıntısı Tespit Edildi`;
      alertLevel = 'warning';
    } else if (this.trafficDensity >= 40) {
      statusText = '⚠️ Yoğun Trafik: Maslak ve Köprü Bağlantılarında Yavaşlama';
      alertLevel = 'warning';
    }

    return {
      density: this.trafficDensity,
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
   * Bir modülün etki alanını (Blast Radius) hesaplar
   * @param {string} moduleId - Seçilen modül
   */
  calculateBlastRadius(moduleId) {
    const directDependents = Array.from(this.reverseAdjacencyList.get(moduleId) || []);
    const directDependencies = Array.from(this.adjacencyList.get(moduleId) || []);

    // 2. Derece etki alanı (Transit etkilenenler)
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
    let riskLevel = 'Düşük';
    if (totalImpactCount > 8) riskLevel = 'Kritik (Şehir Geneli Çökme Riski)';
    else if (totalImpactCount > 3) riskLevel = 'Orta (Köprü ve Semt Etkilenir)';

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
   * Mimari Raporu (Markdown formatında) üretir
   */
  exportArchitectureReportMarkdown() {
    const report = this.generateAkomReport();
    let md = `# 🌉 ZenithIstanbul — Kod Mimarisi & Trafik Raporu\n\n`;
    md += `**Tarih:** ${new Date().toLocaleString('tr-TR')}\n`;
    md += `**Trafik Yoğunluğu:** %${report.density} (${report.statusText})\n`;
    md += `**Toplam Modül Sayısı:** ${report.totalModules}\n`;
    md += `**Döngüsel Kilit (Circular SCC):** ${report.circularDependencies}\n`;
    md += `**Boğaz Köprüsü Importları:** ${this.bridges.length}\n`;
    md += `**Sahil Güvenlik Alarmları (Security Leaks):** ${report.securityLeakCount}\n`;
    md += `**Prens Adaları (Ölü Kodlar):** ${report.deadCodeCount}\n\n`;

    if (report.securityLeakCount > 0) {
      md += `## 🚨 Sahil Güvenlik Kaçakçılık Radarı (Security Leaks)\n`;
      md += `| İstemci Dosyası | Sızan Hedef / Paket | Güvenlik Uyarısı |\n`;
      md += `|---|---|---|\n`;
      report.securityLeaks.forEach(leak => {
        md += `| \`${leak.moduleName}\` | **${leak.target}** | ${leak.message} |\n`;
      });
      md += `\n`;
    }

    md += `## 🚨 Döngüsel Bağımlılık Zincirleri (Tarjan SCC)\n`;
    if (this.circularChains.length === 0) {
      md += `> ✅ Hiçbir döngüsel bağımlılık bulunamadı. Boğaz trafiği akıcı.\n\n`;
    } else {
      this.circularChains.forEach((chain, i) => {
        md += `### Zincir #${i + 1}:\n`;
        md += `\`${chain.join(' ➔ ')}\`\n\n`;
      });
    }

    md += `## 🏙️ Semt & Yaka Dağılımı\n`;
    md += `| Semt / Bölge | Yaka | Dosya Sayısı | Açıklama |\n`;
    md += `|---|---|---|---|\n`;
    md += `| **Levent / Maslak** | Avrupa | ${Array.from(this.modules.values()).filter(m => m.district.district.includes('Maslak') || m.district.district.includes('Levent')).length} | Yüksek karmaşıklıktaki iş mantığı ve sayfalar |\n`;
    md += `| **Beşiktaş / Şişli** | Avrupa | ${Array.from(this.modules.values()).filter(m => m.district.district.includes('Beşiktaş') || m.district.district.includes('Şişli')).length} | UI bileşenleri ve arayüz elemanları |\n`;
    md += `| **Kadıköy / Üsküdar** | Anadolu | ${Array.from(this.modules.values()).filter(m => m.district.side === 'asia').length} | Veri tabanı, servisler ve backend katmanı |\n`;
    md += `| **Tarihi Yarımada** | Çekirdek | ${Array.from(this.modules.values()).filter(m => m.district.side === 'historic').length} | Kadim konfigürasyon ve temel tipler |\n`;
    md += `| **Kız Kulesi** | Boğaz İçi | ${Array.from(this.modules.values()).filter(m => m.district.isLandmark === 'maiden_tower').length} | API Gateway / Middleware Köprüsü |\n`;
    md += `| **Galata Kulesi** | Avrupa | ${Array.from(this.modules.values()).filter(m => m.district.isLandmark === 'galata_tower').length} | Kök Başlangıç Noktası (Root Entrypoint) |\n`;
    md += `| **Prens Adaları** | İzole | ${report.deadCodeCount} | Çağrılmayan ölü kodlar |\n\n`;

    md += `---\n*Rapor ZenithIstanbul tarafından yerel olarak üretilmiştir. Hiçbir kod dışarı sızdırılmamıştır.*\n`;
    return md;
  }

  /**
   * GitHub Actions / CI PR Botu için temiz Markdown yorum özeti
   */
  generatePrCommentMarkdown() {
    const report = this.generateAkomReport();
    const isClean = report.circularDependencies === 0 && report.securityLeakCount === 0;

    let comment = `## 🌉 ZenithIstanbul — 3D Codebase PR Telemetrisi\n\n`;
    comment += `| Metrik | Değer | Durum |\n`;
    comment += `|---|:---:|---|\n`;
    comment += `| **Boğaziçi Trafik Endeksi** | **%${report.density}** | ${isClean ? '🟢 Akıcı' : '🚨 KİLİTLENDİ'} |\n`;
    comment += `| **Döngüsel Kilitler (SCC)** | **${report.circularDependencies}** | ${report.circularDependencies === 0 ? '✅ Temiz' : '⚠️ Döngü Var'} |\n`;
    comment += `| **Sahil Güvenlik (Kaçak Sızıntı)** | **${report.securityLeakCount}** | ${report.securityLeakCount === 0 ? '🛡️ Güvenli' : '🚨 Sızıntı Var!'} |\n`;
    comment += `| **Boğaz Köprü Geçişleri** | **${this.bridges.length}** | 🌉 API Bağlantısı |\n`;
    comment += `| **Prens Adaları (Ölü Kod)** | **${report.deadCodeCount}** | ${report.deadCodeCount === 0 ? '✅ Temiz' : 'ℹ️ İzole Modül'} |\n\n`;

    if (report.securityLeakCount > 0) {
      comment += `> 🚨 **SAHİL GÜVENLİK ALARMI:** ${report.securityLeakCount} istemci dosyasında sunucu sırları veya backend DB paketleri tespit edildi!\n\n`;
    }

    if (report.circularDependencies > 0) {
      comment += `> ⚠️ **DİKKAT:** Bu PR Boğaziçi Köprülerinde kilitlenmeye yol açan döngüsel bağımlılık içeriyor!\n\n`;
    }

    if (isClean) {
      comment += `> ✨ **ONAYLANDI:** Mimari trafik akıcı. 15 Temmuz ve FSM köprülerinde hiçbir döngüsel darboğaz ve güvenlik sızıntısı tespit edilmedi.\n\n`;
    }

    comment += `*ZenithIstanbul Client-Side Zero-Cloud Engine ile doğrulandı.*`;
    return comment;
  }
}
