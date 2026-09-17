#!/usr/bin/env node

/**
 * ZenithIstanbul CLI & Headless CI Gatekeeper
 *
 * Usage:
 *   Interactive 3D UI : npx zenith-istanbul [directory]
 *   Headless CI Mode  : npx zenith-istanbul --ci [--fail-on-cycle] [--fail-on-leak] [directory]
 *
 * Zero dependencies, cross-platform POSIX path hygiene.
 */

import http from 'node:http';
import net from 'node:net';
import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, exec } from 'node:child_process';
import { CodebaseParser } from '../src/core/ast-parser.js';
import { TrafficEngine } from '../src/core/traffic-engine.js';
import { AgentDispatcher } from '../src/agent/agent-dispatcher.js';
import { DiffEngine } from '../src/agent/diff-engine.js';
import { SwarmCoordinator } from '../src/agent/swarm-coordinator.js';
import { HistoryStore } from '../src/core/history-store.js';
import { loadModelCatalog, validateModelId } from '../src/agent/model-catalog.js';
import {
  MAX_BODY_BYTES,
  MIME_TYPES,
  readBodyWithLimit,
  isAllowedLocalOrigin as _isAllowedLocalOrigin,
  setCorsHeaders,
  sendPayloadTooLarge,
  sendCsrfForbidden
} from '../src/core/http-middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const pkgPath = path.join(projectRoot, 'package.json');
let version = '1.0.0';
try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  version = pkg.version || '1.0.0';
} catch (e) {}

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
\x1b[36m🌉 ZenithIstanbul\x1b[0m — \x1b[37m3D Codebase Metropole & Architectural CI Gatekeeper\x1b[0m (v${version})

\x1b[33mUSAGE:\x1b[0m
  node bin/cli.js [options] [directory]

\x1b[33mOPTIONS:\x1b[0m
  \x1b[32m-h, --help\x1b[0m              Show this help manual and exit
  \x1b[32m-v, --version\x1b[0m           Output version number and exit
  \x1b[32m-c, --ci\x1b[0m                Run in headless CI audit mode (no WebGL UI)
  \x1b[32m--fail-on-cycle\x1b[0m         Exit with code 1 if Tarjan SCC circular dependencies are found
  \x1b[32m--fail-on-leak\x1b[0m          Exit with code 1 if client-side security leaks (CWE) are found
  \x1b[32m--json\x1b[0m                  Output machine-readable telemetry report in JSON format (CI mode)
  \x1b[32m--export-html <file>\x1b[0m    Synthesize 3D HTML architectural report to standalone file
  \x1b[32m--port <number>\x1b[0m         Custom HTTP port for local telemetry server (default: 4173)

\x1b[33mEXAMPLES:\x1b[0m
  \x1b[90m# Launch interactive 3D visualizer on current repository:\x1b[0m
  npm start

  \x1b[90m# Headless CI gatekeeper audit blocking PRs on architectural violations:\x1b[0m
  node bin/cli.js --ci --fail-on-cycle --fail-on-leak .

  \x1b[90m# Standalone HTML report export:\x1b[0m
  node bin/cli.js --export-html architecture-report.html .
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log(`zenith-istanbul v${version}`);
  process.exit(0);
}

const isCI = args.includes('--ci') || args.includes('-c');
const failOnCycle = args.includes('--fail-on-cycle');
const failOnLeak = args.includes('--fail-on-leak');
const isJson = args.includes('--json');

const exportHtmlIdx = args.indexOf('--export-html');
const exportHtmlPath = exportHtmlIdx !== -1 ? (args[exportHtmlIdx + 1] || 'zenith-istanbul-report.html') : null;

const portIdx = args.indexOf('--port');
const portArg = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : null;
const PORT = portArg || parseInt(process.env.PORT, 10) || 4173;

const targetArg = args.find((a, i) => {
  if (a.startsWith('-')) return false;
  if (exportHtmlIdx !== -1 && i === exportHtmlIdx + 1) return false;
  if (portIdx !== -1 && i === portIdx + 1) return false;
  return true;
}) || '.';

const targetDir = path.resolve(targetArg);
const posixTargetDir = targetDir.replace(/\\/g, '/');

if (!fs.existsSync(targetDir)) {
  console.error(`\x1b[31m[ZenithIstanbul Error]\x1b[0m Target directory does not exist: "${posixTargetDir}"`);
  process.exit(1);
}

/**
 * Scans and parses directory AST
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
        if (!['node_modules', '.git', 'dist', 'build', '.next', '.turbo', '.idea', 'coverage', '.cache', '.zenith', 'vendor', 'test', 'tests', '__tests__'].includes(entry.name)) {
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
 * Entry Point Flow Router
 */
if (exportHtmlPath) {
  runExportHtml();
} else if (isCI) {
  runHeadlessCI();
} else {
  runInteractiveServer();
}

/**
 * 1. STANDALONE HTML ARCHITECTURAL REPORT EXPORTER (--export-html)
 */
function runExportHtml() {
  console.log(`\x1b[36m[ZenithIstanbul]\x1b[0m Scanning "${posixTargetDir}" and synthesizing standalone 3D HTML telemetry report...`);
  const parsedModules = scanAndParseDirectory(targetDir);

  const templatePath = fs.existsSync(path.join(projectRoot, 'public', 'index.html'))
    ? path.join(projectRoot, 'public', 'index.html')
    : path.join(projectRoot, 'index.html');
  let htmlContent = fs.readFileSync(templatePath, 'utf8');

  const injection = `<script>window.__ZENITH_EMBEDDED_MODULES__ = ${JSON.stringify(parsedModules)};</script>\n</head>`;
  htmlContent = htmlContent.replace('</head>', injection);

  const outPath = path.resolve(exportHtmlPath);
  fs.writeFileSync(outPath, htmlContent, 'utf8');

  console.log(`\x1b[32m✔ [SUCCESS] 3D Standalone HTML architectural report emitted:\x1b[0m \x1b[36m${outPath}\x1b[0m`);
  console.log(`   Double-click to open in any modern browser. Zero local server dependencies.\n`);
  process.exit(0);
}

/**
 * 2. HEADLESS CI MODE (--ci)
 */
async function runHeadlessCI() {
  const engine = new TrafficEngine();
  const parsedModules = scanAndParseDirectory(targetDir);

  if (parsedModules.length === 0) {
    console.error(`\x1b[33m[ZenithIstanbul CI] Warning: No auditable JS/TS modules identified in "${posixTargetDir}".\x1b[0m`);
    process.exit(0);
  }

  engine.loadModules(parsedModules);
  const report = engine.generateTelemetryReport();

  const historyStore = new HistoryStore(targetDir);
  const persistedRecord = historyStore.recordScan({
    trafficIndex: report.trafficIndex,
    cyclicDeadlocks: report.circularDependencies,
    securityExposures: report.securityLeakCount,
    isolatedModules: report.deadCodeModules,
    totalModules: report.totalModules,
    totalEdges: report.totalEdges
  });

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const prComment = engine.generatePrCommentMarkdown();
    console.log(prComment);
  }

  console.log(`\x1b[36m[Zenith Local-First]\x1b[0m Architecture drift snapshot persisted to .zenith/ (ID: ${persistedRecord.id})`);

  let hasFailed = false;
  if (failOnCycle && report.circularDependencies > 0) {
    console.error(`\n\x1b[31m❌ [CI GATEKEEPER FAILED] CRITICAL: Cyclic Deadlock Detected (Tarjan SCC Violation in Bridge Ingress: ${report.circularDependencies} cycle invariants)\x1b[0m`);
    console.error(`\x1b[31m   PR deployment blocked. Refactor cyclic module dependencies into decoupled contract layers.\x1b[0m\n`);
    hasFailed = true;
  }

  if (failOnLeak && report.securityLeakCount > 0) {
    console.error(`\n\x1b[31m❌ [CI GATEKEEPER FAILED] CRITICAL: Client-Side Security Boundary Violation Detected (${report.securityLeakCount} leaked server secrets or backend packages)\x1b[0m`);
    console.error(`\x1b[31m   PR deployment blocked. Remove server secrets and backend ORM imports from client bundles.\x1b[0m\n`);
    hasFailed = true;
  }

  if (hasFailed) {
    process.exit(1);
  } else {
    if (failOnCycle || failOnLeak) {
      console.log(`\n\x1b[32m✔ [CI GATEKEEPER PASSED] Architectural graph topology nominal. Zero cyclic deadlocks, zero security boundary breaches.\x1b[0m\n`);
    }
    process.exit(0);
  }
}

/**
 * Strict Localhost CSRF Firewall.
 * Delegated to http-middleware.js for modular security testing.
 * Re-exported for backward compatibility with serve.js.
 */
export function isAllowedLocalOrigin(req) {
  return _isAllowedLocalOrigin(req);
}

/**
 * Tests if a specific port is currently occupied.
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.unref();

    tester.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    tester.once('listening', () => {
      tester.close(() => {
        resolve(false);
      });
    });

    tester.listen(port);
  });
}

/**
 * Cross-platform browser opener with CI/headless detection and error safety.
 */
function openBrowser(url) {
  if (process.env.CI || !process.stdout?.isTTY) return;
  try {
    if (process.platform === 'win32') {
      exec(`start "" "${url}"`, { windowsHide: true });
    } else if (process.platform === 'darwin') {
      const child = spawn('open', [url], { stdio: 'ignore' });
      child.on('error', () => {});
    } else {
      const child = spawn('xdg-open', [url], { stdio: 'ignore' });
      child.on('error', () => {});
    }
  } catch (e) {}
}

/**
 * Cross-platform process killer for a specific port.
 * Safely frees up the port by terminating the occupying process.
 */
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`netstat -ano -p tcp | findstr :${port}`, (err, stdout) => {
        if (err || !stdout) return resolve({ success: false, pids: [] });
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        for (const line of lines) {
          if (line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pid = parseInt(parts[parts.length - 1], 10);
            if (pid && pid !== process.pid) pids.add(pid);
          }
        }
        if (pids.size === 0) return resolve({ success: false, pids: [] });
        const pidList = Array.from(pids);
        let completed = 0;
        for (const pid of pidList) {
          exec(`taskkill /F /PID ${pid}`, () => {
            completed++;
            if (completed === pidList.length) {
              setTimeout(() => resolve({ success: true, pids: pidList }), 300);
            }
          });
        }
      });
    } else {
      exec(`lsof -ti :${port}`, (err, stdout) => {
        if (err || !stdout) return resolve({ success: false, pids: [] });
        const pids = stdout.trim().split(/\s+/).map(p => parseInt(p, 10)).filter(p => p && p !== process.pid);
        for (const pid of pids) {
          try { process.kill(pid, 'SIGKILL'); } catch (e) {}
        }
        setTimeout(() => resolve({ success: pids.length > 0, pids }), 300);
      });
    }
  });
}

/**
 * Prompts user interactively (e/h). If piped or unattended, gracefully defaults.
 */
function promptUser(questionText) {
  return new Promise((resolve) => {
    let answered = false;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const finish = (val) => {
      if (!answered) {
        answered = true;
        clearTimeout(timer);
        try { rl.close(); } catch (e) {}
        resolve(val);
      }
    };

    rl.on('close', () => {
      finish(process.stdin.isTTY ? 'k' : 'y');
    });

    const timeoutMs = process.stdin.isTTY ? 15000 : 1500;
    const timer = setTimeout(() => {
      finish(process.stdin.isTTY ? 'k' : 'y');
    }, timeoutMs);

    rl.question(questionText, (answer) => {
      finish(answer.trim().toLowerCase());
    });
  });
}

/**
 * Scans for an available TCP port starting from startPort.
 * Prevents EADDRINUSE crashes by automatically testing and finding the first open port.
 */
function findAvailablePort(startPort, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;

    function testNext() {
      if (attempts >= maxAttempts) {
        return reject(new Error(`Could not find an available port after ${maxAttempts} attempts starting from ${startPort}`));
      }
      const tester = net.createServer();
      tester.unref();

      tester.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          currentPort++;
          attempts++;
          testNext();
        } else {
          reject(err);
        }
      });

      tester.once('listening', () => {
        tester.close(() => {
          resolve(currentPort);
        });
      });

      tester.listen(currentPort);
    }

    testNext();
  });
}

/**
 * 3. INTERACTIVE 3D WEBGEL SERVER MODE
 */
async function runInteractiveServer() {
  let activePort = PORT;
  const inUse = await isPortInUse(PORT);

  if (inUse) {
    if (process.env.CI || !process.stdin?.isTTY) {
      console.log(`\n\x1b[36m🔄 [CI / Non-interactive] Port ${PORT} occupied. Finding next available port...\x1b[0m`);
      try {
        activePort = await findAvailablePort(PORT + 1);
      } catch (err) {
        activePort = PORT + 1;
      }
    } else {
      console.log(`\n\x1b[33m⚠️  Port ${PORT} zaten kullanımda (çalışan bir süreç tespit edildi).\x1b[0m`);
      console.log(`\x1b[90m👉 Nasıl devam etmek istersiniz?\x1b[0m`);
      console.log(`   \x1b[32m[K / H]\x1b[0m Eski süreci sonlandır (kill et) ve ${PORT} portunda tertemiz başlat \x1b[36m(Önerilen)\x1b[0m`);
      console.log(`   \x1b[33m[E]\x1b[0m     Mevcut çalışan web sayfasını tarayıcıda aç`);
      console.log(`   \x1b[35m[Y]\x1b[0m     Eski süreci koru, yeni bir portta başlat`);

      const answer = await promptUser(`\x1b[37mSeçiminiz [K / E / Y] (Varsayılan: K):\x1b[0m `);

      if (answer === 'e' || answer === 'evet' || (answer.startsWith('y') && answer.length > 2)) {
        const url = `http://localhost:${PORT}`;
        console.log(`\n\x1b[32m✔ Mevcut sunucu web arayüzü tarayıcıda açılıyor:\x1b[0m \x1b[36m${url}\x1b[0m\n`);
        openBrowser(url);
        process.exit(0);
      } else if (answer === 'y' || answer === 'yeni') {
        console.log(`\n\x1b[36m🔄 Eski sürece dokunulmadı. Yeni sunucu için boş port aranıyor...\x1b[0m`);
        try {
          activePort = await findAvailablePort(PORT + 1);
        } catch (err) {
          console.warn(`\x1b[33m[ZenithIstanbul]\x1b[0m Port arama uyarısı: ${err.message}. Port ${PORT + 1} deneniyor.`);
          activePort = PORT + 1;
        }
      } else {
        // Default: 'k', 'h', empty string (Enter pressed) -> Kill old process & restart on PORT!
        console.log(`\n\x1b[33m🛑 Port ${PORT}'deki eski süreç sonlandırılıyor...\x1b[0m`);
        const killRes = await killProcessOnPort(PORT);
        if (killRes.success) {
          console.log(`\x1b[32m✔ Port ${PORT} başarıyla serbest bırakıldı (Sonlandırılan PID: ${killRes.pids.join(', ')}).\x1b[0m\n`);
          activePort = PORT;
        } else {
          console.warn(`\x1b[33mℹ Süreç doğrudan sonlandırılamadı, alternatif boş port aranıyor...\x1b[0m`);
          try {
            activePort = await findAvailablePort(PORT + 1);
          } catch (e) {
            activePort = PORT + 1;
          }
        }
      }
    }
  }

  const mimeTypes = MIME_TYPES;

  const historyStore = new HistoryStore(targetDir);

  const sseClients = new Set();
  const activeWatchers = new Map();
  let watchDebounceTimer = null;

  const ignoredDirs = new Set([
    'node_modules', '.git', 'dist', 'build', '.next', '.turbo', 
    '.idea', 'coverage', '.cache', 'tmp', '.zenith', 'test', 'tests', '__tests__'
  ]);

  function broadcastChange(normalizedPath) {
    if (watchDebounceTimer) clearTimeout(watchDebounceTimer);
    watchDebounceTimer = setTimeout(() => {
      const payload = JSON.stringify({
        type: 'file-change',
        file: normalizedPath,
        timestamp: Date.now()
      });
      for (const client of sseClients) {
        try {
          client.write(`data: ${payload}\n\n`);
        } catch (e) {
          sseClients.delete(client);
        }
      }
    }, 300);
  }

  function garbageCollectWatchers() {
    for (const [dirPath, watcher] of activeWatchers.entries()) {
      if (!fs.existsSync(dirPath)) {
        try {
          watcher.close();
        } catch (e) {}
        activeWatchers.delete(dirPath);
      }
    }
  }

  function closeAllWatchers() {
    for (const [dirPath, watcher] of activeWatchers.entries()) {
      try {
        watcher.close();
      } catch (e) {}
    }
    activeWatchers.clear();
  }

  process.once('SIGINT', () => {
    closeAllWatchers();
    process.exit(0);
  });
  process.once('SIGTERM', () => {
    closeAllWatchers();
    process.exit(0);
  });
  process.once('exit', () => {
    closeAllWatchers();
  });

  function attachDirWatcher(dir) {
    if (activeWatchers.has(dir)) return;
    try {
      const watcher = fs.watch(dir, (eventType, filename) => {
        if (!fs.existsSync(dir)) {
          try { watcher.close(); } catch (e) {}
          activeWatchers.delete(dir);
          garbageCollectWatchers();
          return;
        }

        if (eventType === 'rename') {
          garbageCollectWatchers();
        }

        if (!filename) return;
        const normalized = filename.replace(/\\/g, '/');
        if (ignoredDirs.has(normalized)) return;

        const fullPath = path.join(dir, filename);
        const relPath = path.relative(targetDir, fullPath).replace(/\\/g, '/');

        try {
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
            const baseName = path.basename(fullPath);
            if (!ignoredDirs.has(baseName)) {
              attachDirWatcher(fullPath);
            }
          }
        } catch (e) {}

        broadcastChange(relPath);
      });

      watcher.on('error', () => {
        try { watcher.close(); } catch (e) {}
        activeWatchers.delete(dir);
      });

      activeWatchers.set(dir, watcher);
    } catch (err) {
    }
  }

  function recursiveDirectoryWalk(current) {
    attachDirWatcher(current);
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (e) {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory() && !ignoredDirs.has(entry.name)) {
        recursiveDirectoryWalk(path.join(current, entry.name));
      }
    }
  }

  recursiveDirectoryWalk(targetDir);

  const WEATHER_CACHE_TTL = 10 * 60 * 1000;
  let weatherCache = { data: null, timestamp: 0 };

  async function fetchEnvironment() {
    const now = Date.now();
    if (weatherCache.data && (now - weatherCache.timestamp < WEATHER_CACHE_TTL)) {
      return { ...weatherCache.data, cached: true };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=41.0082&longitude=28.9784&current=weather_code,wind_speed_10m';
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const data = {
          success: true,
          source: 'open-meteo',
          coordinates: { latitude: 41.0082, longitude: 28.9784 },
          current: json.current || { weather_code: 0, wind_speed_10m: 12.0 },
          cached: false,
          timestamp: now
        };
        weatherCache = { data, timestamp: now };
        return data;
      }
    } catch (e) {}

    return {
      success: true,
      source: 'deterministic-ast-fallback',
      coordinates: { latitude: 41.0082, longitude: 28.9784 },
      current: {
        weather_code: 0,
        wind_speed_10m: 14.5,
        time: new Date().toISOString()
      },
      cached: false,
      timestamp: now
    };
  }

  const swarm = new SwarmCoordinator(targetDir);
  swarm.startHeartbeat(3000);

  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    setCorsHeaders(req, res, activePort);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

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

    if (req.method === 'GET' && req.url === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);
      sseClients.add(res);

      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/environment') {
      try {
        const envData = await fetchEnvironment();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(envData));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'GET' && req.url === '/api/history') {
      try {
        const history = historyStore.getHistory(30);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, history }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'GET' && req.url === '/api/swarm/status') {
      try {
        const snapshot = swarm.getSnapshot();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...snapshot }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'POST' && req.url === '/api/swarm/dispatch') {
      if (!isAllowedLocalOrigin(req)) {
        sendCsrfForbidden(res);
        return;
      }
      let body;
      try {
        body = await readBodyWithLimit(req);
      } catch (err) {
        if (err.message === 'PAYLOAD_TOO_LARGE') {
          sendPayloadTooLarge(res);
          return;
        }
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
        return;
      }
      try {
        const payload = JSON.parse(body || '{}');
        const dispatchRes = await swarm.dispatchIncident(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...dispatchRes }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'POST' && req.url === '/api/swarm/task') {
      if (!isAllowedLocalOrigin(req)) {
        sendCsrfForbidden(res);
        return;
      }
      let body;
      try {
        body = await readBodyWithLimit(req);
      } catch (err) {
        if (err.message === 'PAYLOAD_TOO_LARGE') {
          sendPayloadTooLarge(res);
          return;
        }
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
        return;
      }
      try {
        const payload = JSON.parse(body || '{}');
        const task = swarm.createTask(payload.title, payload.description, payload.assignee, payload.priority);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, task }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'POST' && req.url === '/api/swarm/route') {
      if (!isAllowedLocalOrigin(req)) {
        sendCsrfForbidden(res);
        return;
      }
      try {
        const routed = swarm.drainOutbox();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, routed }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/swarm/graph')) {
      try {
        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const showTopics = urlObj.searchParams.get('topics') !== 'false';
        const graph = swarm.getMemoryGraph({ width: 800, height: 480, showTopics });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, graph }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'GET' && pathname === '/api/models') {
      try {
        const cachePath = path.join(targetDir, '.zenith', 'cache', 'model-catalog.json');
        const catalogRes = await loadModelCatalog(cachePath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...catalogRes }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'POST' && req.url === '/api/scan') {
      if (!isAllowedLocalOrigin(req)) {
        sendCsrfForbidden(res);
        return;
      }
      let body;
      try {
        body = await readBodyWithLimit(req);
      } catch (err) {
        if (err.message === 'PAYLOAD_TOO_LARGE') {
          sendPayloadTooLarge(res);
          return;
        }
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
        return;
      }
      try {
        let metrics = {};
        if (body.trim()) {
          try { metrics = JSON.parse(body); } catch (e) {}
        }

        if (metrics.trafficIndex === undefined || metrics.totalModules === undefined) {
          const parsed = scanAndParseDirectory(targetDir);
          const engine = new TrafficEngine();
          engine.loadModules(parsed);
          const rep = engine.generateTelemetryReport();
          metrics = {
            trafficIndex: rep.trafficIndex,
            cyclicDeadlocks: rep.circularDependencies,
            securityExposures: rep.securityLeakCount,
            isolatedModules: rep.deadCodeModules,
            totalModules: rep.totalModules,
            totalEdges: rep.totalEdges
          };
        }

        const record = historyStore.recordScan(metrics);

        const ssePayload = JSON.stringify({
          type: 'history-updated',
          timestamp: Date.now(),
          record
        });
        for (const client of sseClients) {
          try {
            client.write(`data: ${ssePayload}\n\n`);
          } catch (e) {
            sseClients.delete(client);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, record }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'POST' && req.url === '/api/dispatch-agent') {
      if (!isAllowedLocalOrigin(req)) {
        sendCsrfForbidden(res);
        return;
      }
      let body;
      try {
        body = await readBodyWithLimit(req);
      } catch (err) {
        if (err.message === 'PAYLOAD_TOO_LARGE') {
          sendPayloadTooLarge(res);
          return;
        }
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
        return;
      }
      try {
        const payload = JSON.parse(body || '{}');
          const { chain = [], sourceId, targetId } = payload;
          const srcId = sourceId || chain[0] || 'src/services/userService.ts';
          const tgtId = targetId || chain[1] || 'src/ui/AuthModal.tsx';

          const dispatcher = new AgentDispatcher();
          const parser = new CodebaseParser();

          let srcContent = '';
          let tgtContent = '';
          const absSrc = path.join(targetDir, srcId);
          const absTgt = path.join(targetDir, tgtId);

          try { srcContent = fs.readFileSync(absSrc, 'utf8'); } catch (e) { srcContent = `// ${srcId}\nexport const Source = {};`; }
          try { tgtContent = fs.readFileSync(absTgt, 'utf8'); } catch (e) { tgtContent = `// ${tgtId}\nexport const Target = {};`; }

          const sourceMod = parser.parseModule(srcId, srcContent);
          const targetMod = parser.parseModule(tgtId, tgtContent);

          // Multi-provider detection: checks local CLI agents
          let detectedProvider = null;
          const providers = [
            { id: 'claude', testCmd: 'claude --version', cmd: 'claude', args: ['-p'], engine: 'CLAUDE_CODE_IPC' },
            { id: 'codex', testCmd: 'codex --version', cmd: 'codex', args: ['exec'], engine: 'CODEX_CLI_IPC' },
            { id: 'ollama', testCmd: 'ollama --version', cmd: 'ollama', args: ['run', 'qwen2.5-coder:7b'], engine: 'OLLAMA_HOST_IPC' },
            { id: 'agy', testCmd: 'agy --version', cmd: 'agy', args: [], engine: 'ANTIGRAVITY_IPC' }
          ];

          for (const prov of providers) {
            try {
              await new Promise((resolve, reject) => {
                exec(prov.testCmd, { timeout: 1200 }, (err) => {
                  if (!err) resolve(true);
                  else reject(err);
                });
              });
              detectedProvider = prov;
              break;
            } catch (e) {}
          }

          let executionResult = null;
          if (detectedProvider) {
            try {
              const prompt = `Refactor the circular dependency between ${srcId} and ${tgtId}.\n\nSource (${srcId}):\n${srcContent}\n\nTarget (${tgtId}):\n${tgtContent}\n\nOutput only the decoupled contract interface.`;
              const child = spawn(detectedProvider.cmd, [...detectedProvider.args, prompt]);
              let outputText = '';
              await new Promise((resolve, reject) => {
                child.stdout.on('data', d => { outputText += d.toString(); });
                child.on('close', code => (code === 0 && outputText.trim()) ? resolve(outputText) : reject(new Error('CLI exit ' + code)));
                setTimeout(() => {
                  try { child.kill(); } catch (k) {}
                  reject(new Error('CLI timeout'));
                }, 6000);
              });

              if (outputText && outputText.includes('interface')) {
                const cleanTargetName = targetMod.name.replace(/\.[^/.]+$/, '');
                const contractPath = `src/contracts/${cleanTargetName}.contract.ts`;
                const contractContent = outputText.trim();
                const sourceDiff = DiffEngine.formatUnifiedDiff(srcId, srcContent, srcContent, false);
                const contractDiff = DiffEngine.formatUnifiedDiff(contractPath, '', contractContent, true);
                
                executionResult = {
                  engine: detectedProvider.engine,
                  diff: `${sourceDiff.unifiedDiff}\n${contractDiff.unifiedDiff}`,
                  sideBySideMatrix: DiffEngine.generateSideBySideMatrix(srcContent, srcContent),
                  stats: {
                    additions: contractDiff.stats.additions,
                    deletions: 0,
                    changes: contractDiff.stats.additions
                  },
                  files: [
                    { path: contractPath, content: contractContent }
                  ]
                };
              }
            } catch (cliErr) {}
          }

          if (!executionResult) {
            const codemod = dispatcher.extractLexicalContracts(sourceMod, targetMod, [srcId, tgtId]);
            executionResult = {
              engine: 'BALANCED_BRACE_CONTRACT_EXTRACTOR',
              ...codemod
            };
          }

          try {
            const swarmTask = swarm.createTask(
              `Decouple Circular Jam: ${srcId} <-> ${tgtId}`,
              `Dispatched to ${detectedProvider ? detectedProvider.id : 'lexical-agent'}. Output engine: ${executionResult.engine}`,
              'agent.bridge_engineer',
              'critical'
            );
            swarm.updateTaskStatus(swarmTask.id, 'done', `Diff synthesized with ${executionResult.stats ? executionResult.stats.changes : 0} changes`);
            swarm.updateAgentStatus('agent.bridge_engineer', 'done');
          } catch (se) {}

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            ...executionResult
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      return;
    }

    if (req.method === 'POST' && req.url === '/api/apply-patch') {
      if (!isAllowedLocalOrigin(req)) {
        sendCsrfForbidden(res);
        return;
      }
      let body;
      try {
        body = await readBodyWithLimit(req);
      } catch (err) {
        if (err.message === 'PAYLOAD_TOO_LARGE') {
          sendPayloadTooLarge(res);
          return;
        }
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
        return;
      }
      try {
        const payload = JSON.parse(body || '{}');
        const updatedFiles = [];
        const resolvedTarget = path.resolve(targetDir);

        for (const file of payload.files || []) {
          if (!file || typeof file.path !== 'string') continue;
          const absPath = path.resolve(targetDir, file.path);
          if (!absPath.startsWith(resolvedTarget + path.sep) && absPath !== resolvedTarget) {
            continue; // Path traversal protection (handles .. and absolute path escapes)
          }

          fs.mkdirSync(path.dirname(absPath), { recursive: true });
          fs.writeFileSync(absPath, file.content, 'utf8');
          updatedFiles.push(path.relative(targetDir, absPath).replace(/\\/g, '/'));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, updatedFiles }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    let safePath = req.url.split('?')[0];
    if (safePath === '/') safePath = '/index.html';

    const publicDir = path.join(projectRoot, 'public');
    let filePath = path.normalize(path.join(publicDir, safePath));

    if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      filePath = path.normalize(path.join(projectRoot, safePath));
    }

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
          'Cache-Control': 'no-cache'
        });
        res.end(content);
      }
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`\x1b[33m[ZenithIstanbul]\x1b[0m Port ${activePort} is busy, shifting to ${activePort + 1}...`);
      activePort++;
      setTimeout(() => {
        server.listen(activePort);
      }, 100);
    } else {
      console.error('\x1b[31m[ZenithIstanbul Server Error]\x1b[0m', err);
    }
  });

  server.listen(activePort, () => {
    const url = `http://localhost:${activePort}`;
    console.log(`\n\x1b[36m🌉 ZenithIstanbul\x1b[0m — \x1b[35m3D Codebase Metropole & Autonomous Agent Command Deck\x1b[0m\n\x1b[33m📍 Target:\x1b[0m ${posixTargetDir}\n\x1b[32m🚀 Telemetry Server Online:\x1b[0m \x1b[36m${url}\x1b[0m\n`);
    if (activePort !== PORT) {
      console.log(`\x1b[33mℹ Not: ${PORT} portu kullanımda olduğu için Zenith Istanbul otomatik olarak ${activePort} portuna bağlandı.\x1b[0m\n`);
    }
    console.log(`\x1b[32m✔ ZenithIstanbul ready.\x1b[0m Opening browser: \x1b[36m${url}\x1b[0m (Press Ctrl+C to terminate)\n`);

    openBrowser(url);
  });

  const gracefulShutdown = () => {
    console.log('\n\x1b[33m🛑 Zenith Istanbul shutting down...\x1b[0m');
    swarm.stopHeartbeat();
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 500).unref();
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}
