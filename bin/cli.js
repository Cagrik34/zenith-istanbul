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
const isJson = args.includes('--json');

// Hedef dizini belirle (Bayrak olmayan ilk argüman veya '.')
const targetArg = args.find(a => !a.startsWith('-')) || '.';
const targetDir = path.resolve(targetArg);
const posixTargetDir = targetDir.replace(/\\/g, '/');

const PORT = parseInt(process.env.PORT, 10) || 4173;

/**
 * 1. HEADLESS CI MODU (--ci)
 */
if (isCI) {
  runHeadlessCI();
} else {
  runInteractiveServer();
}

async function runHeadlessCI() {
  const parser = new CodebaseParser();
  const engine = new TrafficEngine();

  // 1. Dizin İçindeki Kod Dosyalarını POSIX Hijyeniyle Tara
  const filesToAudit = [];
  function scanDir(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(targetDir, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.next', '.turbo', '.idea'].includes(entry.name)) {
          scanDir(fullPath);
        }
      } else if (entry.isFile()) {
        if (parser.isAuditableFile(relativePath)) {
          filesToAudit.push({ fullPath, relativePath });
        }
      }
    }
  }

  scanDir(targetDir);

  if (filesToAudit.length === 0) {
    console.error(`\x1b[33m[ZenithIstanbul CI] Uyarı: "${posixTargetDir}" dizininde taranacak JS/TS kod dosyası bulunamadı.\x1b[0m`);
    process.exit(0);
  }

  // 2. Kod Modüllerini Ayrıştır
  const parsedModules = [];
  for (const { fullPath, relativePath } of filesToAudit) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      parsedModules.push(parser.parseModule(relativePath, content));
    } catch (e) {
      // Okunamayan dosyaları atla
    }
  }

  // 3. Trafik Motorunu ve Tarjan SCC Çizge Analizini Koş
  engine.loadModules(parsedModules);
  const report = engine.generateAkomReport();

  // 4. Çıktıyı Formatla ve Yazdır
  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const prComment = engine.generatePrCommentMarkdown();
    console.log(prComment);
  }

  // 5. Gatekeeper Denetimi (--fail-on-cycle)
  if (failOnCycle && report.circularDependencies > 0) {
    console.error(`\n\x1b[31m❌ [CI GATEKEEPER FAILED] Boğaziçi Köprülerinde ${report.circularDependencies} döngüsel bağımlılık (SCC) tespit edildi!\x1b[0m`);
    console.error(`\x1b[31m   PR engellendi. Lütfen döngüsel bağımlılıkları refactor edin.\x1b[0m\n`);
    process.exit(1);
  } else {
    if (failOnCycle) {
      console.log(`\n\x1b[32m✔ [CI GATEKEEPER PASSED] Boğaziçi trafiği akıcı. Sıfır döngüsel kilit.\x1b[0m\n`);
    }
    process.exit(0);
  }
}

/**
 * 2. İNTERAKTİF 3D WEBGEL SUNUCU MODU
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
