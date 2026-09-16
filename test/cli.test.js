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
});
