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

    // Özel İstanbul Simgeleri (Landmarks) Tespiti
    const isMiddleware = this.isMiddlewareGateway(filePath, content);
    const isEntryPoint = this.isRootEntryPoint(filePath);

    // Güvenlik Denetimi: İstemci Tarafına Sunucu Sırları Sızıntısı (Coast Guard Check)
    const securityLeaks = this.detectSecurityLeaks(filePath, content, imports);

    // İstanbul Bölgesi & Monorepo Tayini
    const district = this.assignDistrict(filePath, content, { isMiddleware, isEntryPoint });

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
      isMiddleware,
      isEntryPoint,
      securityLeaks,
      district,
      isCore: this.isCoreModule(filePath),
      healthScore: this.calculateHealthScore(loc, complexity, securityLeaks.length)
    };
  }

  /**
   * Middleware / API Gateway tespiti (Kız Kulesi simgesi)
   */
  isMiddlewareGateway(filePath, content) {
    const p = filePath.toLowerCase();
    return p.includes('middleware.') || 
           p.includes('proxy.') || 
           p.includes('gateway.') || 
           p.includes('server-bridge.') ||
           (p.includes('router') && (content.includes('next/server') || content.includes('express.Router')));
  }

  /**
   * Kök Giriş Noktası tespiti (Galata Kulesi simgesi)
   */
  isRootEntryPoint(filePath) {
    const p = filePath.toLowerCase();
    const fileName = p.split('/').pop().split('\\').pop();
    return ['index.ts', 'index.js', 'index.tsx', 'main.ts', 'main.js', 'main.tsx', 'app.ts', 'app.js', 'app.tsx'].includes(fileName) &&
           (p.startsWith('src/') || !p.includes('/') || p === fileName);
  }

  /**
   * Calculates exact 1-indexed line and column coordinates for a string character index
   */
  calculateLineCol(content, index) {
    const prefix = content.slice(0, index);
    const lines = prefix.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    return { line, col };
  }

  /**
   * Client-Side Leak Detector & Secret Boundary Sentry (Zero-Tolerance Security Audit)
   * Enforces MITRE standards:
   *  - CWE-668: Exposure of Resource to Wrong Sphere (Client-Side Backend Dependency Ingress)
   *  - CWE-1061: Insufficient Encapsulation
   *  - CWE-200: Exposure of Sensitive Information to an Unauthorized Actor
   *  - CWE-798: Use of Hard-coded Credentials
   *  - CWE-321: Use of Hard-coded Cryptographic Key
   * @param {string} filePath - Relative file path
   * @param {string} content - Raw source code
   * @param {Array<string>} imports - Extracted module imports
   * @returns {Array<Object>} Comprehensive list of security boundary violations with exact line/col
   */
  auditSecurityBoundaries(filePath, content, imports) {
    const violations = [];
    const p = filePath.toLowerCase();
    const isClientModule = p.includes('components/') || p.includes('ui/') || p.includes('views/') || 
                           p.includes('pages/') || p.includes('.client.') || content.includes("'use client'") || content.includes('"use client"');

    // 1. Client-Side Ingress Violation: Forbidden Node.js Core and Server ORM packages (CWE-668 / CWE-1061)
    if (isClientModule) {
      const forbiddenPackages = [
        'fs', 'fs/promises', 'child_process', 'cluster', 'net', 'tls', 'dns', 'worker_threads', 'dgram',
        '@prisma/client', 'prisma', 'typeorm', 'sequelize', 'mongoose', 'knex', 'drizzle-orm', 
        'pg', 'mysql2', 'ioredis', 'redis', 'bcrypt', 'bcryptjs', 'jsonwebtoken', 'jsonwebtoken-esm'
      ];

      for (const imp of imports) {
        for (const pkg of forbiddenPackages) {
          const isMatch = imp === `vendor:${pkg}` || imp.includes(`vendor:${pkg}/`) || imp.includes(`/${pkg}/`);
          if (isMatch) {
            // Find exact index of the import statement in source code
            const importPattern = new RegExp(`(?:import|require)\\s*.*?['"](?:vendor:)?${pkg.replace('/', '\\/')}['"]`, 'g');
            const match = importPattern.exec(content);
            const index = match ? match.index : 0;
            const { line, col } = this.calculateLineCol(content, index);

            violations.push({
              type: 'BOUNDARY_VIOLATION_INGRESS',
              cwe: 'CWE-668',
              rule: 'CWE-668: Exposure of Resource to Wrong Sphere (Encapsulation Breach: CWE-1061)',
              severity: 'CRITICAL',
              target: pkg,
              file: filePath,
              line,
              col,
              location: `${filePath}:${line}:${col}`,
              message: `CWE-668 / CWE-1061 Violation: Server-only package [${pkg}] exposed in client module [${filePath}:${line}:${col}]. Severe boundary breach.`
            });
          }
        }
      }
    }

    // 2. Secret Telemetry Scan: Leaked Environment Variables (CWE-200)
    const secretEnvRegex = /\b(?:process\.env\.(?:[A-Z0-9_]*(?:SECRET|KEY|PASSWORD|TOKEN|DATABASE_URL|PRISMA_URL|AUTH_SECRET|OPENAI_API_KEY|AWS_SECRET_ACCESS_KEY|STRIPE_SECRET_KEY)[A-Z0-9_]*))\b/g;
    let envMatch;
    while ((envMatch = secretEnvRegex.exec(content)) !== null) {
      const { line, col } = this.calculateLineCol(content, envMatch.index);
      violations.push({
        type: 'SECRET_EXPOSURE_ENV',
        cwe: 'CWE-200',
        rule: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
        severity: 'CRITICAL',
        target: envMatch[0],
        file: filePath,
        line,
        col,
        location: `${filePath}:${line}:${col}`,
        message: `High-entropy server secret credential [${envMatch[0]}] exposed at [${filePath}:${line}:${col}].`
      });
    }

    // 3. Raw Private Key Headers & Cloud Credential Patterns (CWE-321)
    const privateKeyRegex = /-----BEGIN (?:[A-Z0-9_-]+\s+)?PRIVATE KEY-----/g;
    let keyMatch;
    while ((keyMatch = privateKeyRegex.exec(content)) !== null) {
      const { line, col } = this.calculateLineCol(content, keyMatch.index);
      violations.push({
        type: 'CRYPTO_KEY_EXPOSURE',
        cwe: 'CWE-321',
        rule: 'CWE-321: Use of Hard-coded Cryptographic Key',
        severity: 'EMERGENCY',
        target: 'PRIVATE_KEY_HEADER',
        file: filePath,
        line,
        col,
        location: `${filePath}:${line}:${col}`,
        message: `Hardcoded Private Cryptographic Key header exposed at [${filePath}:${line}:${col}]. Immediate remediation required.`
      });
    }

    // 4. AWS Access Key Pattern (AKIA... - CWE-798)
    const awsKeyRegex = /\bAKIA[0-9A-Z]{16}\b/g;
    let awsMatch;
    while ((awsMatch = awsKeyRegex.exec(content)) !== null) {
      const { line, col } = this.calculateLineCol(content, awsMatch.index);
      violations.push({
        type: 'CLOUD_CREDENTIAL_EXPOSURE',
        cwe: 'CWE-798',
        rule: 'CWE-798: Use of Hard-coded Cloud Credentials',
        severity: 'EMERGENCY',
        target: awsMatch[0].slice(0, 8) + '********',
        file: filePath,
        line,
        col,
        location: `${filePath}:${line}:${col}`,
        message: `AWS Cloud IAM Access Key ID exposed at [${filePath}:${line}:${col}].`
      });
    }

    return violations;
  }

  detectSecurityLeaks(filePath, content, imports) {
    return this.auditSecurityBoundaries(filePath, content, imports);
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
  assignDistrict(filePath, content = '', landmarks = {}) {
    const p = filePath.toLowerCase();
    const cleanContent = content ? content.slice(0, 1000).toLowerCase() : '';

    // 0. Özel Simgeler: Kız Kulesi (Middleware / Gateway)
    if (landmarks.isMiddleware) {
      return { side: 'bosphorus', district: 'Kız Kulesi (API Gateway)', color: '#00ffff', isLandmark: 'maiden_tower' };
    }

    // 0. Özel Simgeler: Galata Kulesi (Root Entry Point)
    if (landmarks.isEntryPoint) {
      return { side: 'europe', district: 'Galata (Root Entry)', color: '#ffd700', isLandmark: 'galata_tower' };
    }

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

  calculateHealthScore(loc, complexity, leakCount = 0) {
    let score = 100;
    if (loc > 500) score -= 20;
    if (loc > 1000) score -= 30;
    if (complexity > 30) score -= 20;
    if (complexity > 60) score -= 30;
    if (leakCount > 0) score -= (leakCount * 25);
    return Math.max(5, score);
  }
}
