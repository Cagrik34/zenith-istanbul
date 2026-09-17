import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  MAX_BODY_BYTES,
  MIME_TYPES,
  readBodyWithLimit,
  isAllowedLocalOrigin,
  setCorsHeaders,
  sendPayloadTooLarge,
  sendCsrfForbidden
} from '../src/core/http-middleware.js';

test('HTTP Security Middleware & Primitives', async (t) => {
  await t.test('isAllowedLocalOrigin accepts localhost, 127.0.0.1, and empty headers', () => {
    assert.equal(isAllowedLocalOrigin({ headers: {} }), true);
    assert.equal(isAllowedLocalOrigin({ headers: { origin: 'http://localhost:4173' } }), true);
    assert.equal(isAllowedLocalOrigin({ headers: { origin: 'http://127.0.0.1:4173' } }), true);
    assert.equal(isAllowedLocalOrigin({ headers: { origin: 'http://[::1]:4173' } }), true);
    assert.equal(isAllowedLocalOrigin({ headers: { referer: 'http://localhost:4173/index.html' } }), true);
    assert.equal(isAllowedLocalOrigin({ headers: { referer: 'http://127.0.0.1:4173/' } }), true);
    assert.equal(isAllowedLocalOrigin({ headers: { referer: 'http://[::1]:4173/' } }), true);
  });

  await t.test('isAllowedLocalOrigin rejects external origins and cross-site requests', () => {
    assert.equal(isAllowedLocalOrigin({ headers: { origin: 'https://attacker.com' } }), false);
    assert.equal(isAllowedLocalOrigin({ headers: { origin: 'http://localhost.evil.com' } }), false);
    assert.equal(isAllowedLocalOrigin({ headers: { referer: 'https://evil.org/exploit' } }), false);
    assert.equal(isAllowedLocalOrigin({ headers: { 'sec-fetch-site': 'cross-site' } }), false);
    assert.equal(isAllowedLocalOrigin({ headers: { origin: 'invalid-url:::' } }), false);
  });

  await t.test('readBodyWithLimit resolves within payload limit', async () => {
    const server = http.createServer(async (req, res) => {
      try {
        const body = await readBodyWithLimit(req, 1024);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: body }));
      } catch (err) {
        res.writeHead(500);
        res.end(err.message);
      }
    });

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    const payload = JSON.stringify({ hello: 'istanbul' });
    const response = await new Promise((resolve, reject) => {
      const clientReq = http.request({
        hostname: '127.0.0.1',
        port,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      clientReq.on('error', reject);
      clientReq.write(payload);
      clientReq.end();
    });

    server.close();
    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(response.body), { received: payload });
  });

  await t.test('readBodyWithLimit rejects and closes connection when payload exceeds limit (DoS protection)', async () => {
    const smallLimit = 64; // 64 bytes
    const server = http.createServer(async (req, res) => {
      try {
        await readBodyWithLimit(req, smallLimit);
        res.writeHead(200);
        res.end('OK');
      } catch (err) {
        if (err.message === 'PAYLOAD_TOO_LARGE') {
          sendPayloadTooLarge(res);
        } else {
          res.writeHead(500);
          res.end();
        }
      }
    });

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    // Send payload of 1024 bytes (exceeds 64 byte limit)
    const oversizedPayload = 'X'.repeat(1024);
    const response = await new Promise((resolve) => {
      const clientReq = http.request({
        hostname: '127.0.0.1',
        port,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(oversizedPayload)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      clientReq.on('error', (err) => {
        // Socket destroyed / reset is also a valid protective response
        resolve({ status: 413, error: err.message });
      });
      clientReq.write(oversizedPayload);
      clientReq.end();
    });

    server.close();
    // Either the server managed to send 413 or the socket was destroyed early
    assert.ok(response.status === 413 || response.error, 'Should reject oversized payload with 413 or destroyed socket');
  });

  await t.test('setCorsHeaders uses validated origin and avoids wildcard', () => {
    const mockRes = {
      headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; }
    };

    // Valid localhost origin
    setCorsHeaders({ headers: { origin: 'http://localhost:3000' } }, mockRes, 4173);
    assert.equal(mockRes.headers['access-control-allow-origin'], 'http://localhost:3000');

    // External untrusted origin -> falls back to explicit localhost:port, NEVER '*'
    const untrustedRes = {
      headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; }
    };
    setCorsHeaders({ headers: { origin: 'https://evil.com' } }, untrustedRes, 4173);
    assert.equal(untrustedRes.headers['access-control-allow-origin'], 'http://localhost:4173');
    assert.notEqual(untrustedRes.headers['access-control-allow-origin'], '*');
  });

  await t.test('Path traversal containment prevents file escape', () => {
    const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenith-test-'));
    const resolvedTarget = path.resolve(testDir);

    const maliciousPaths = [
      '../../etc/passwd',
      '..\\..\\windows\\system32',
      'sub/../../../secret.txt',
      '/absolute/escape.txt',
      'C:\\escaped.txt'
    ];

    for (const testPath of maliciousPaths) {
      const absPath = path.resolve(testDir, testPath);
      const isContained = absPath.startsWith(resolvedTarget + path.sep) || absPath === resolvedTarget;
      assert.equal(isContained, false, `Path traversal attempt should be detected and blocked: ${testPath}`);
    }

    const safePath = 'src/components/Button.tsx';
    const safeAbs = path.resolve(testDir, safePath);
    assert.equal(safeAbs.startsWith(resolvedTarget + path.sep), true, 'Safe relative path should be contained');

    fs.rmSync(testDir, { recursive: true, force: true });
  });
});
