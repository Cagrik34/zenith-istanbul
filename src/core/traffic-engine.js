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

    // 1. Modül indeksleme
    for (const mod of parsedModules) {
      this.modules.set(mod.id, mod);
      this.adjacencyList.set(mod.id, new Set());
      this.reverseAdjacencyList.set(mod.id, new Set());
    }

    // 2. Kenar (Edge / Import) bağlantılarını kurma
    for (const mod of parsedModules) {
      for (const rawImport of mod.imports) {
        if (rawImport.startsWith('vendor:')) continue; // Harici paketleri ayrı tut

        // Hedef modülü bul
        const targetId = this.findMatchingModuleId(rawImport);
        if (targetId && targetId !== mod.id) {
          this.adjacencyList.get(mod.id).add(targetId);
          if (this.reverseAdjacencyList.has(targetId)) {
            this.reverseAdjacencyList.get(targetId).add(mod.id);
          }
        }
      }
    }

    // 3. Döngüsel Bağımlılıkları (Circular Dependencies) Tarjan SCC ile bul
    this.detectCircularDependenciesTarjan();

    // 4. İki yaka arasındaki Boğaz Köprülerini çıkar (Avrupa <-> Anadolu)
    this.detectBosphorusBridges();

    // 5. Ölü Kodları (Dead Code / Unused Modules) tespit et -> Prens Adaları
    this.detectDeadCode();

    // 6. İstanbul Trafik Yoğunluk İndeksini Hesapla
    this.calculateTrafficDensity();
  }

  findMatchingModuleId(importPath) {
    if (this.modules.has(importPath)) return importPath;
    // .ts, .tsx, .js eşleşmesi
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
   * Tarjan's Strongly Connected Components (SCC) Algoritması
   * O(V + E) zaman karmaşıklığıyla kesin ve deterministik döngü tespiti
   */
  detectCircularDependenciesTarjan() {
    let index = 0;
    const indices = new Map();
    const lowlink = new Map();
    const onStack = new Map();
    const stack = [];
    const sccs = [];

    const strongConnect = (v) => {
      indices.set(v, index);
      lowlink.set(v, index);
      index++;
      stack.push(v);
      onStack.set(v, true);

      const neighbors = this.adjacencyList.get(v) || new Set();
      for (const w of neighbors) {
        if (!indices.has(w)) {
          // Komşu henüz ziyaret edilmedi
          strongConnect(w);
          lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)));
        } else if (onStack.get(w)) {
          // Komşu yığında, döngü tespit edildi!
          lowlink.set(v, Math.min(lowlink.get(v), indices.get(w)));
        }
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

        // 1'den fazla düğüm içeren SCC'ler döngüdür (Circular Dependency!)
        if (scc.length > 1) {
          sccs.push(scc);
        }
      }
    };

    for (const v of this.modules.keys()) {
      if (!indices.has(v)) {
        strongConnect(v);
      }
    }

    // Döngü zincirlerini formatla
    this.circularChains = sccs.map(scc => {
      // Zincir sırasını oluştur
      return [...scc, scc[0]];
    });
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
    md += `**Prens Adaları (Ölü Kodlar):** ${report.deadCodeCount}\n\n`;

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
    md += `| **Prens Adaları** | İzole | ${report.deadCodeCount} | Çağrılmayan ölü kodlar |\n\n`;

    md += `---\n*Rapor ZenithIstanbul tarafından yerel olarak üretilmiştir. Hiçbir kod dışarı sızdırılmamıştır.*\n`;
    return md;
  }

  /**
   * GitHub Actions / CI PR Botu için temiz Markdown yorum özeti
   */
  generatePrCommentMarkdown() {
    const report = this.generateAkomReport();
    const isClean = report.circularDependencies === 0;

    let comment = `## 🌉 ZenithIstanbul — 3D Codebase PR Telemetrisi\n\n`;
    comment += `| Metrik | Değer | Durum |\n`;
    comment += `|---|:---:|---|\n`;
    comment += `| **Boğaziçi Trafik Endeksi** | **%${report.density}** | ${isClean ? '🟢 Akıcı' : '🚨 KİLİTLENDİ'} |\n`;
    comment += `| **Döngüsel Kilitler (SCC)** | **${report.circularDependencies}** | ${isClean ? '✅ Temiz' : '⚠️ Döngü Var'} |\n`;
    comment += `| **Boğaz Köprü Geçişleri** | **${this.bridges.length}** | 🌉 API Bağlantısı |\n`;
    comment += `| **Prens Adaları (Ölü Kod)** | **${report.deadCodeCount}** | ${report.deadCodeCount === 0 ? '✅ Temiz' : 'ℹ️ İzole Modül'} |\n\n`;

    if (!isClean) {
      comment += `> 🚨 **DİKKAT:** Bu PR Boğaziçi Köprülerinde kilitlenmeye yol açan döngüsel bağımlılık içeriyor! Lütfen refactor ajanıyla ortak tipleri decoupled kontrat katmanına taşıyın.\n\n`;
    } else {
      comment += `> ✨ **ONAYLANDI:** Mimari trafik akıcı. 15 Temmuz ve FSM köprülerinde hiçbir döngüsel darboğaz tespit edilmedi.\n\n`;
    }

    comment += `*ZenithIstanbul Client-Side Zero-Cloud Engine ile doğrulandı.*`;
    return comment;
  }
}
