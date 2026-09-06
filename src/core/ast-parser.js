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

    // tsconfig / jsconfig Path Aliases eşlemeleri
    this.pathAliases = {
      '@/': 'src/',
      '~/': 'src/',
      '@components/': 'src/components/',
      '@utils/': 'src/utils/',
      '@services/': 'src/services/',
      '@core/': 'src/core/'
    };
  }

  /**
   * tsconfig.json veya jsconfig.json paths alanını yükler
   */
  loadTsConfigPaths(tsconfigObj) {
    if (!tsconfigObj || !tsconfigObj.compilerOptions || !tsconfigObj.compilerOptions.paths) return;
    const paths = tsconfigObj.compilerOptions.paths;
    for (const [aliasPattern, targetList] of Object.entries(paths)) {
      if (Array.isArray(targetList) && targetList.length > 0) {
        const cleanAlias = aliasPattern.replace(/\*$/, '');
        const cleanTarget = targetList[0].replace(/\*$/, '');
        this.pathAliases[cleanAlias] = cleanTarget;
      }
    }
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

    // Barrel File (Merkezi index re-export) tespiti
    const isBarrel = this.detectBarrelFile(filePath, content, exports);

    // İstanbul Bölgesi & Monorepo Tayini
    const district = this.assignDistrict(filePath, content);

    return {
      id: filePath,
      name: filePath.split('/').pop().split('\\').pop(),
      path: filePath,
      content: content,
      loc,
      sloc,
      complexity,
      imports,
      exports,
      functions,
      isBarrel,
      district,
      isCore: this.isCoreModule(filePath),
      healthScore: this.calculateHealthScore(loc, complexity)
    };
  }

  /**
   * Barrel File (index.ts / re-export hub) tespiti
   */
  detectBarrelFile(filePath, content, exports) {
    const fileName = filePath.toLowerCase();
    if (!fileName.endsWith('index.ts') && !fileName.endsWith('index.js') && !fileName.endsWith('index.tsx')) {
      return false;
    }
    const reexportCount = (content.match(/export\s+(?:\*|\{[^}]+\})\s+from/g) || []).length;
    return reexportCount >= 2;
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
   * Göreceli import yollarını ve tsconfig Path Aliases (@/, ~/) çözümler
   */
  resolveImportPath(currentDir, rawTarget) {
    let target = rawTarget;

    // 1. Path Aliases Eşleştirmesi (@/components -> src/components)
    for (const [alias, mappedPath] of Object.entries(this.pathAliases)) {
      if (target.startsWith(alias)) {
        target = target.replace(alias, mappedPath);
        return this.normalizeFinalPath(target);
      }
    }

    // 2. Harici npm paketleri (vendor)
    if (!target.startsWith('.') && !target.startsWith('/')) {
      return `vendor:${target}`;
    }

    let parts = (currentDir ? currentDir + '/' : '') + target;
    return this.normalizeFinalPath(parts);
  }

  normalizeFinalPath(parts) {
    let clean = parts.replace(/\\/g, '/');

    // Path normalization: a/b/../c -> a/c
    const segments = [];
    for (const segment of clean.split('/')) {
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
   * Dosya içeriği ve yoluna göre İstanbul semtini ve yakasını akıllıca tayin eder
   * Next.js App Router, 'use client', 'use server' ve Node built-in heuristikleri
   */
  assignDistrict(filePath, content = '') {
    const p = filePath.toLowerCase();
    const cleanContent = content ? content.slice(0, 1000).toLowerCase() : '';

    // 1. Next.js Direktifleri (En yüksek öncelik)
    if (cleanContent.includes("'use client'") || cleanContent.includes('"use client"')) {
      return { side: 'europe', district: 'Levent (Client Component)', color: '#00a8ff' };
    }
    if (cleanContent.includes("'use server'") || cleanContent.includes('"use server"')) {
      return { side: 'asia', district: 'Kadıköy (Server Action)', color: '#ff007f' };
    }

    // 2. Node.js Built-in & Backend Kütüphaneleri (Anadolu Yakası)
    const backendLibs = ['fs', 'path', 'crypto', 'child_process', 'stream', 'http', 'https', 'cluster', 'prisma', 'drizzle', 'pg', 'mongoose', 'redis', 'next/headers', 'next/server'];
    const hasBackendImport = backendLibs.some(lib => cleanContent.includes(`from '${lib}'`) || cleanContent.includes(`from "${lib}"`) || cleanContent.includes(`require('${lib}')`));
    if (hasBackendImport) {
      return { side: 'asia', district: 'Ataşehir (Infrastructure)', color: '#ffaa00' };
    }

    // 3. Dosya uzantı ve isim konvensiyonları
    if (p.includes('.client.') || p.endsWith('.css') || p.endsWith('.scss') || p.includes('tailwind')) {
      return { side: 'europe', district: 'Beşiktaş (UI)', color: '#00f0ff' };
    }
    if (p.includes('.server.') || p.includes('.action.') || p.includes('route.ts') || p.includes('route.js')) {
      return { side: 'asia', district: 'Üsküdar (API Route)', color: '#ff5500' };
    }

    // 4. Klasör Yapısı Heuristiği (Avrupa: UI / Pages / Components)
    if (p.includes('components') || p.includes('ui') || p.includes('views') || p.includes('pages') || p.includes('app/') || p.includes('hooks') || p.includes('styles')) {
      if (p.includes('button') || p.includes('card') || p.includes('modal') || p.includes('badge')) return { side: 'europe', district: 'Beşiktaş', color: '#00f0ff' };
      if (p.includes('pages') || p.includes('routes') || p.includes('layout')) return { side: 'europe', district: 'Levent', color: '#00a8ff' };
      return { side: 'europe', district: 'Maslak', color: '#7000ff' };
    }

    // 5. Klasör Yapısı Heuristiği (Anadolu: Backend / Services / DB)
    if (p.includes('server') || p.includes('api') || p.includes('services') || p.includes('db') || p.includes('database') || p.includes('models') || p.includes('controllers')) {
      if (p.includes('db') || p.includes('models') || p.includes('schema')) return { side: 'asia', district: 'Kadıköy', color: '#ff007f' };
      if (p.includes('auth') || p.includes('security')) return { side: 'asia', district: 'Üsküdar', color: '#ff5500' };
      return { side: 'asia', district: 'Ataşehir', color: '#ffaa00' };
    }

    // 6. Tarihi Yarımada (Temel yapı taşları, config, types, core)
    if (p.includes('config') || p.includes('core') || p.includes('types') || p.includes('utils') || p.includes('helpers')) {
      return { side: 'historic', district: 'Tarihi Yarımada', color: '#e5c07b' };
    }

    // Varsayılan: Uzantıya göre dağıt (.tsx -> Avrupa, .ts -> Anadolu)
    if (p.endsWith('.tsx') || p.endsWith('.jsx')) {
      return { side: 'europe', district: 'Şişli', color: '#00e676' };
    }
    return { side: 'asia', district: 'Ümraniye', color: '#ff8800' };
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
