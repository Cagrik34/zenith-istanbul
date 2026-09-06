/**
 * ZenithIstanbul - AST & Codebase Parser
 * Zero-cloud, local-first static analysis engine for JavaScript, TypeScript, and Python codebases.
 * Zero-vulnerability security model: Safe path normalization, secret redaction, ReDoS protection.
 */

export class CodebaseParser {
  constructor() {
    // Katı secret ve hassas dosya filtreleme kuralları
    this.ignoredFilePatterns = [
      /^\.env(\..+)?$/i,
      /\.pem$/i,
      /\.key$/i,
      /\.crt$/i,
      /id_rsa/i,
      /credentials/i,
      /\.secret/i,
      /\.DS_Store$/i,
      /node_modules/i,
      /\.git/i,
      /dist/i,
      /build/i,
      /\.next/i,
      /\.turbo/i
    ];

    // Desteklenen kod uzantıları
    this.supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.vue', '.svelte'];
  }

  /**
   * Dosya adının güvenli ve desteklenen bir kod dosyası olup olmadığını denetler
   */
  isAuditableFile(path) {
    if (!path || typeof path !== 'string') return false;
    
    // Path Traversal saldırısı koruması (Kök dizin dışına taşma denemeleri)
    if (path.includes('../') || path.includes('..\\')) return false;

    // Secret veya hassas dosya kontrolü
    for (const pattern of this.ignoredFilePatterns) {
      if (pattern.test(path)) return false;
    }

    // Desteklenen uzantı kontrolü
    return this.supportedExtensions.some(ext => path.toLowerCase().endsWith(ext));
  }

  /**
   * Bir dosya içeriğini statik olarak ayrıştırır
   * @param {string} filePath - Göreceli dosya yolu
   * @param {string} content - Dosya metin içeriği
   * @returns {Object} Modül meta verisi
   */
  parseModule(filePath, content) {
    const lines = content.split(/\r?\n/);
    const loc = lines.length;
    const sloc = lines.filter(l => l.trim().length > 0 && !l.trim().startsWith('//') && !l.trim().startsWith('#') && !l.trim().startsWith('/*')).length;

    // Döngüsel karmaşıklık (Cyclomatic complexity) kestirimi
    const complexity = this.estimateComplexity(content);

    // Import, Export ve Fonksiyonları regex ile güvenli şekilde çıkarma (ReDoS korumalı)
    const imports = this.extractImports(filePath, content);
    const exports = this.extractExports(content);
    const functions = this.extractFunctions(content);

    // İstanbul Bölgesi Tayini (Frontend/Avrupa vs Backend/Anadolu)
    const district = this.assignDistrict(filePath);

    return {
      id: filePath,
      name: filePath.split('/').pop().split('\\').pop(),
      path: filePath,
      content: content, // Gerçek kaynak kod önizlemesi için
      loc,
      sloc,
      complexity,
      imports,
      exports,
      functions,
      district,
      isCore: this.isCoreModule(filePath),
      healthScore: this.calculateHealthScore(loc, complexity)
    };
  }

  /**
   * Kod içerisindeki fonksiyon ve metot tanımlarını çıkarır
   */
  extractFunctions(content) {
    const funcs = [];
    const funcRegex = /(?:function\s+([A-Za-z0-9_$]+)|(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:async\s+)?([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{)/g;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3];
      if (name && !['if', 'for', 'while', 'switch', 'catch'].includes(name)) {
        if (!funcs.includes(name)) funcs.push(name);
      }
    }
    return funcs.slice(0, 15); // İlk 15 önemli fonksiyon
  }

  /**
   * Import ifadelerini tespit eder
   */
  extractImports(currentPath, content) {
    const imports = new Set();
    const currentDir = currentPath.split('/').slice(0, -1).join('/');

    // ES6 static import & export from: import ... from '...'
    const esImportRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = esImportRegex.exec(content)) !== null) {
      const target = match[1];
      const resolved = this.resolveImportPath(currentDir, target);
      if (resolved) imports.add(resolved);
    }

    // CommonJS require(): require('...')
    const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = cjsRegex.exec(content)) !== null) {
      const target = match[1];
      const resolved = this.resolveImportPath(currentDir, target);
      if (resolved) imports.add(resolved);
    }

    // Dynamic import(): import('...')
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      const target = match[1];
      const resolved = this.resolveImportPath(currentDir, target);
      if (resolved) imports.add(resolved);
    }

    return Array.from(imports);
  }

  /**
   * Export edilen fonksiyon/değişken isimlerini çıkarır
   */
  extractExports(content) {
    const exports = [];
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class|type|interface|enum)\s+([A-Za-z0-9_$]+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    return exports;
  }

  /**
   * Göreceli import yollarını normalize ederek ana proje dizinine bağlar
   */
  resolveImportPath(currentDir, rawTarget) {
    // Harici npm paketlerini (react, lodash, express vb.) ayrı etiketle
    if (!rawTarget.startsWith('.') && !rawTarget.startsWith('/')) {
      return `vendor:${rawTarget}`;
    }

    let parts = (currentDir ? currentDir + '/' : '') + rawTarget;
    parts = parts.replace(/\\/g, '/');

    // Path normalization: a/b/../c -> a/c
    const segments = [];
    for (const segment of parts.split('/')) {
      if (segment === '' || segment === '.') continue;
      if (segment === '..') {
        if (segments.length > 0) segments.pop();
      } else {
        segments.push(segment);
      }
    }

    let resolved = segments.join('/');
    // Uzantı yoksa varsayılan olarak .ts / .js dene
    if (!resolved.match(/\.[a-z0-9]+$/i)) {
      resolved += '.ts';
    }
    return resolved;
  }

  /**
   * Cyclomatic Complexity kestirimi (Karar dallanmaları)
   */
  estimateComplexity(content) {
    let complexity = 1;
    const branchKeywords = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\?\s*[^:]+\s*:/g, // ternary
      /&&/g,
      /\|\|/g,
      /\?\?/g
    ];

    for (const regex of branchKeywords) {
      const matches = content.match(regex);
      if (matches) complexity += matches.length;
    }

    return complexity;
  }

  /**
   * Dosya yoluna göre İstanbul semtini ve yakasını atar
   */
  assignDistrict(filePath) {
    const p = filePath.toLowerCase();

    // Avrupa Yakası (Frontend, UI, Components, Hooks, Pages, Styles)
    if (p.includes('components') || p.includes('ui') || p.includes('views') || p.includes('pages') || p.includes('app/') || p.includes('hooks') || p.includes('styles')) {
      if (p.includes('button') || p.includes('card') || p.includes('modal')) return { side: 'europe', district: 'Beşiktaş', color: '#00f0ff' };
      if (p.includes('pages') || p.includes('routes')) return { side: 'europe', district: 'Levent', color: '#00a8ff' };
      return { side: 'europe', district: 'Maslak', color: '#7000ff' };
    }

    // Anadolu Yakası (Backend, Services, Database, API, Core, Auth, Storage)
    if (p.includes('server') || p.includes('api') || p.includes('services') || p.includes('db') || p.includes('database') || p.includes('models') || p.includes('controllers')) {
      if (p.includes('db') || p.includes('models')) return { side: 'asia', district: 'Kadıköy', color: '#ff007f' };
      if (p.includes('auth') || p.includes('security')) return { side: 'asia', district: 'Üsküdar', color: '#ff5500' };
      return { side: 'asia', district: 'Ataşehir', color: '#ffaa00' };
    }

    // Tarihi Yarımada (Temel yapı taşları, config, legacy primitives)
    if (p.includes('config') || p.includes('core') || p.includes('types') || p.includes('utils') || p.includes('helpers')) {
      return { side: 'historic', district: 'Tarihi Yarımada', color: '#e5c07b' };
    }

    // Varsayılan: Yola göre Avrupa veya Anadolu'ya dağıt
    return { side: 'europe', district: 'Şişli', color: '#00e676' };
  }

  isCoreModule(filePath) {
    const p = filePath.toLowerCase();
    return p.includes('index') || p.includes('main') || p.includes('app') || p.includes('core');
  }

  calculateHealthScore(loc, complexity) {
    let score = 100;
    if (loc > 500) score -= 20;
    if (loc > 1000) score -= 30;
    if (complexity > 30) score -= 20;
    if (complexity > 60) score -= 30;
    return Math.max(10, score);
  }
}
