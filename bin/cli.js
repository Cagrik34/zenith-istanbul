#!/usr/bin/env node

/**
 * ZenithIstanbul CLI & Headless CI Gatekeeper
 *
 * Usage:
 *   Interactive 3D UI : npx zenith-istanbul [dizin]
 *   Headless CI Mode  : npx zenith-istanbul --ci [--fail-on-cycle] [dizin]
 *
 * Zero dependencies, cross-platform POSIX path hygiene.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { CodebaseParser } from '../src/core/ast-parser.js';
import { TrafficEngine } from '../src/core/traffic-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// CLI Argümanlarını Ayrıştır
const args = process.argv.slice(2);
const isCI = args.includes('--ci') || args.includes('-c');
const failOnCycle = args.includes('--fail-on-cycle');
const failOnLeak = args.includes('--fail-on-leak');
const isJson = args.includes('--json');

// HTML Dışa Aktarma Bayrağı (--export-html [dosya-adi])
const exportHtmlIdx = args.indexOf('--export-html');
const exportHtmlPath = exportHtmlIdx !== -1 ? (args[exportHtmlIdx + 1] || 'zenith-istanbul-report.html') : null;

// Hedef dizini belirle (Bayrak veya değer olmayan ilk argüman veya '.')
const targetArg = args.find((a, i) => !a.startsWith('-') && (exportHtmlIdx === -1 || i !== exportHtmlIdx + 1)) || '.';
const targetDir = path.resolve(targetArg);
const posixTargetDir = targetDir.replace(/\\/g, '/');

const PORT = parseInt(process.env.PORT, 10) || 4173;

/**
 * Kod Dizinini Tarar ve AST Ayrıştırması Yapar
 */
function scanAndParseDirectory(dir) {
  const parser = new CodebaseParser();
  const filesToAudit = [];

  function scan(current) {
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (e) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const relativePath = path.relative(dir, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.next', '.turbo', '.idea', 'coverage', '.cache'].includes(entry.name)) {
          scan(fullPath);
        }
      } else if (entry.isFile() && parser.isAuditableFile(relativePath)) {
        filesToAudit.push({ fullPath, relativePath });
      }
    }
  }

  scan(dir);

  const parsed = [];
  for (const { fullPath, relativePath } of filesToAudit) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      parsed.push(parser.parseModule(relativePath, content));
    } catch (e) {}
  }

  return parsed;
}

/**
 * Giriş Noktası Akış Yönlendiricisi
 */
if (exportHtmlPath) {
  runExportHtml();
} else if (isCI) {
  runHeadlessCI();
} else {
  runInteractiveServer();
}

/**
 * 1. STANDALONE HTML MİMARİ RAPORU AKTARICI (--export-html)
 */
function runExportHtml() {
  console.log(`\x1b[36m[ZenithIstanbul]\x1b[0m "${posixTargetDir}" taranıyor ve 3D Standalone HTML raporu üretiliyor...`);
  const parsedModules = scanAndParseDirectory(targetDir);

  const templatePath = path.join(projectRoot, 'index.html');
  let htmlContent = fs.readFileSync(templatePath, 'utf8');

  // Gömülü modül JSON verisini enjekte et
  const injection = `<script>window.__ZENITH_EMBEDDED_MODULES__ = ${JSON.stringify(parsedModules)};</script>\n</head>`;
  htmlContent = htmlContent.replace('</head>', injection);

  const outPath = path.resolve(exportHtmlPath);
  fs.writeFileSync(outPath, htmlContent, 'utf8');

  console.log(`\x1b[32m✔ [BAŞARILI] 3D Standalone HTML mimari raporu dışa aktarıldı:\x1b[0m \x1b[36m${outPath}\x1b[0m`);
  console.log(`   Herhangi bir tarayıcıda doğrudan çift tıklayarak açabilirsiniz. Sıfır sunucu kurulumu gerektirir.\n`);
  process.exit(0);
}

/**
 * 2. HEADLESS CI MODU (--ci)
 */
async function runHeadlessCI() {
  const engine = new TrafficEngine();
  const parsedModules = scanAndParseDirectory(targetDir);

  if (parsedModules.length === 0) {
    console.error(`\x1b[33m[ZenithIstanbul CI] Uyarı: "${posixTargetDir}" dizininde taranacak JS/TS kod dosyası bulunamadı.\x1b[0m`);
    process.exit(0);
  }

  // Trafik Motorunu ve Tarjan SCC Çizge Analizini Koş
  engine.loadModules(parsedModules);
  const report = engine.generateAkomReport();

  // Çıktıyı Formatla ve Yazdır
  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const prComment = engine.generatePrCommentMarkdown();
    console.log(prComment);
  }

  // Gatekeeper Denetimi: Döngüsel Bağımlılık (--fail-on-cycle)
  let hasFailed = false;
  if (failOnCycle && report.circularDependencies > 0) {
    console.error(`\n\x1b[31m❌ [CI GATEKEEPER FAILED] Boğaziçi Köprülerinde ${report.circularDependencies} döngüsel bağımlılık (SCC) tespit edildi!\x1b[0m`);
    console.error(`\x1b[31m   PR engellendi. Lütfen döngüsel bağımlılıkları refactor edin.\x1b[0m\n`);
    hasFailed = true;
  }

  // Gatekeeper Denetimi: Sahil Güvenlik Sızıntısı (--fail-on-leak)
  if (failOnLeak && report.securityLeakCount > 0) {
    console.error(`\n\x1b[31m❌ [CI GATEKEEPER FAILED] Sahil Güvenlik: ${report.securityLeakCount} istemci dosyasında sunucu sırrı veya backend paketi tespit edildi!\x1b[0m`);
    hasFailed = true;
  }

  if (hasFailed) {
    process.exit(1);
  } else {
    if (failOnCycle || failOnLeak) {
      console.log(`\n\x1b[32m✔ [CI GATEKEEPER PASSED] Boğaziçi trafiği akıcı. Sıfır kilit, sıfır sızıntı.\x1b[0m\n`);
    }
    process.exit(0);
  }
}

/**
 * 3. İNTERAKTİF 3D WEBGEL SUNUCU MODU
 */
function runInteractiveServer() {
  console.log(`
\x1b[36m   ______           _ _   _     _____     _                  _             _ 
  |___  /          (_) | | |   |_   _|   | |                | |           | |
     / / ___ _ __   _| |_| |__   | |  ___| |_ __ _ _ __  ___| |_   _ _ __ | |
    / / / _ \\ '_ \\ | | __| '_ \\  | | / __| __/ _\` | '_ \\/ __| | | | | '_ \\| |
   / /_|  __/ | | || | |_| | | |_| |_\\__ \\ || (_| | | | \\__ \\ | |_| | |_) | |
  /_____\\___|_| |_||_|\\__|_| |_|_____|___/\\__\\__,_|_| |_|___/_|\\__,_| .__/|_|
                                                                      | |     
                                                                      |_|     \x1b[0m
  \x1b[35m🌉 3D Codebase Metropole & Autonomous Agent Command Deck\x1b[0m
  \x1b[33m📍 Taranan Dizin:\x1b[0m ${posixTargetDir}
  \x1b[32m🚀 Sunucu Başlatılıyor:\x1b[0m http://localhost:${PORT}
`);

  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // 1. ÇALIŞMA ALANI MODÜLLERİNİ CANLI GETİR (/api/project-modules)
    if (req.method === 'GET' && req.url === '/api/project-modules') {
      try {
        const parsed = scanAndParseDirectory(targetDir);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, targetDir: posixTargetDir, count: parsed.length, modules: parsed }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    // 2. CANLI YAMA UYGULAMA API ENDPOINT'İ (/api/apply-patch)
    if (req.method === 'POST' && req.url === '/api/apply-patch') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const updatedFiles = [];

          for (const file of payload.files || []) {
            const safeRelPath = file.path.replace(/\\/g, '/').replace(/^\//, '');
            if (safeRelPath.includes('..')) continue;

            const absPath = path.join(targetDir, safeRelPath);
            fs.mkdirSync(path.dirname(absPath), { recursive: true });
            fs.writeFileSync(absPath, file.content, 'utf8');
            updatedFiles.push(safeRelPath);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, updatedFiles }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    let safePath = req.url.split('?')[0];
    if (safePath === '/') safePath = '/index.html';

    const filePath = path.normalize(path.join(projectRoot, safePath));
    if (!filePath.startsWith(projectRoot)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found: ' + safePath);
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        });
        res.end(content);
      }
    });
  });

  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`\x1b[32m✔ ZenithIstanbul hazır!\x1b[0m Tarayıcıda açılıyor: \x1b[36m${url}\x1b[0m (Durdurmak için Ctrl+C)\n`);

    const startCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${startCmd} ${url}`);
  });
}
