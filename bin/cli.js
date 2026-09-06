#!/usr/bin/env node

/**
 * ZenithIstanbul CLI Runner
 * Run: npx zenith-istanbul [path]
 * Zero dependencies, instant local server & automatic browser launcher.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const targetDir = path.resolve(process.argv[2] || '.');
const projectRoot = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 4173;

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
  \x1b[33m📍 Taranan Dizin:\x1b[0m ${targetDir}
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

  // Otomatik Tarayıcı Açma
  const startCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${startCmd} ${url}`);
});
