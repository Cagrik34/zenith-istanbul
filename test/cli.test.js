import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.resolve(__dirname, '../bin/cli.js');

test('CLI Interface & Arguments', async (t) => {
  await t.test('--help outputs manual and exits 0', () => {
    const stdout = execSync(`node "${cliPath}" --help`, { encoding: 'utf8' });
    assert.ok(stdout.includes('ZenithIstanbul'), 'Output must contain project name');
    assert.ok(stdout.includes('USAGE:'), 'Output must show usage');
    assert.ok(stdout.includes('--fail-on-cycle'), 'Output must show CI flags');
  });

  await t.test('--version outputs version number and exits 0', () => {
    const stdout = execSync(`node "${cliPath}" --version`, { encoding: 'utf8' });
    assert.ok(stdout.includes('zenith-istanbul v1.0.0'), 'Output must display valid version');
  });

  await t.test('fails with non-zero exit code when target directory does not exist', () => {
    assert.throws(
      () => {
        execSync(`node "${cliPath}" /definitely/nonexistent/directory/xyz`, { stdio: 'pipe' });
      },
      (err) => {
        return err.status === 1;
      },
      'CLI must exit with code 1 on missing directory'
    );
  });

  await t.test('automatically falls back to next available port when specified port is occupied', async () => {
    const net = await import('node:net');
    const dummyServer = net.createServer();
    await new Promise((resolve) => dummyServer.listen(5190, resolve));

    const { spawn } = await import('node:child_process');
    const child = spawn('node', [cliPath, '--port', '5190', '.'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    const portFoundPromise = new Promise((resolve) => {
      child.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('5191') || output.includes('ZenithIstanbul ready')) {
          resolve(output);
        }
      });
      child.stderr.on('data', (data) => {
        output += data.toString();
      });
      setTimeout(() => resolve(output), 3000);
    });

    const result = await portFoundPromise;
    child.kill('SIGKILL');
    await new Promise((resolve) => dummyServer.close(resolve));

    assert.ok(result.includes('5191') || result.includes('ZenithIstanbul ready'), 'Server must seamlessly bind to next available port without crashing');
  });
});
