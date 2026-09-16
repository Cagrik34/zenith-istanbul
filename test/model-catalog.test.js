import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  validateModelId,
  parseModelCatalog,
  loadModelCatalog,
  BUILTIN_MODEL_CATALOG
} from '../src/agent/model-catalog.js';

test('ModelCatalog - ValidateModelId sanitizes shell injection characters', () => {
  // Safe model IDs
  assert.equal(validateModelId('claude-fable-5-1'), 'claude-fable-5-1');
  assert.equal(validateModelId('gpt-6-astra'), 'gpt-6-astra');
  assert.equal(validateModelId('qwen2.5-coder:14b'), 'qwen2.5-coder:14b');
  assert.equal(validateModelId('Gemini 3.7 Flash (High)'), 'Gemini 3.7 Flash (High)');

  // Shell injection attempts stripped
  assert.equal(validateModelId('gpt-4o; rm -rf /'), 'gpt-4o rm -rf /');
  assert.equal(validateModelId('model`whoami`'), 'model whoami');
  assert.equal(validateModelId('$(calc.exe)'), '(calc.exe)');

  // Control characters stripped
  assert.equal(validateModelId('claude\n--danger'), 'claude --danger');

  // Null/non-string
  assert.equal(validateModelId(null), null);
  assert.equal(validateModelId(12345), null);
});

test('ModelCatalog - ParseModelCatalog validates schema and drops malformed providers', () => {
  // Valid payload
  const valid = {
    version: 1,
    providers: {
      claude: [
        { id: 'claude-fable-5', label: 'Fable 5' },
        { label: 'Default' }
      ]
    }
  };
  const parsed = parseModelCatalog(valid);
  assert.ok(parsed);
  assert.equal(parsed.version, 1);
  assert.equal(parsed.providers.claude.length, 2);

  // Wrong version
  assert.equal(parseModelCatalog({ version: 99, providers: {} }), null);

  // Missing providers
  assert.equal(parseModelCatalog({ version: 1 }), null);
});

test('ModelCatalog - LoadModelCatalog respects disk cache TTL and fallback', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenith-catalog-test-'));
  const cacheFile = path.join(tmpDir, 'model-catalog.json');

  try {
    // 1. Fallback when cache is absent
    const res1 = await loadModelCatalog(cacheFile);
    assert.ok(res1.catalog.providers.claude);
    assert.equal(res1.stale, false);

    // 2. Write valid cache file
    const cachedData = {
      catalog: {
        version: 1,
        providers: {
          custom: [{ id: 'custom-model-x', label: 'Custom Model X' }]
        }
      },
      fetchedAt: Date.now()
    };
    fs.writeFileSync(cacheFile, JSON.stringify(cachedData), 'utf8');

    // 3. Read from cache
    const res2 = await loadModelCatalog(cacheFile);
    assert.ok(res2.catalog.providers.custom);
    assert.equal(res2.catalog.providers.custom[0].id, 'custom-model-x');
    assert.equal(res2.stale, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
