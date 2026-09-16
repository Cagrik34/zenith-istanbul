/**
 * ZenithIstanbul - Dynamic AI Model Catalog & Command Injection Guard
 * Fetches, caches (6h TTL), and validates AI provider model listings.
 * Enforces strict control-character neutralization and slug validation
 * to ensure safe execution on command lines (--model flags).
 */

import fs from 'node:fs';
import path from 'node:path';

export const CATALOG_SCHEMA_VERSION = 1;

export const MAX_BOUNDS = {
  id: 120,
  label: 60,
  key: 40,
  version: 24,
  providers: 40,
  models: 60
};

const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export const BUILTIN_MODEL_CATALOG = {
  version: 1,
  providers: {
    claude: [
      { id: 'claude-fable-5-1', label: 'Claude Fable 5.1' },
      { id: 'claude-fable-5', label: 'Claude Fable 5' },
      { id: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' }
    ],
    openai: [
      { id: 'gpt-6-astra', label: 'GPT-6 Astra' },
      { id: 'gpt-5.6-sol', label: 'GPT-5.6 Sol' },
      { id: 'gpt-5.6-terra', label: 'GPT-5.6 Terra' },
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'o3-mini', label: 'o3-mini' }
    ],
    antigravity: [
      { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash' },
      { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
      { id: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro' },
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' }
    ],
    ollama: [
      { id: 'qwen2.5-coder:14b', label: 'Qwen 2.5 Coder 14B (Local)' },
      { id: 'qwen2.5-coder:7b', label: 'Qwen 2.5 Coder 7B (Local)' },
      { id: 'deepseek-r1:14b', label: 'DeepSeek R1 14B (Local)' },
      { id: 'deepseek-r1:8b', label: 'DeepSeek R1 8B (Local)' },
      { id: 'llama3.3:70b', label: 'Llama 3.3 70B (Local)' }
    ]
  }
};

/**
 * Validates and cleanses a model ID string before it ever reaches a command line flag.
 * Neutralizes newlines, control characters, and command injection metacharacters.
 * @param {unknown} value
 * @returns {string|null} Clean model ID slug, or null if invalid.
 */
export function validateModelId(value) {
  if (typeof value !== 'string') return null;
  // Replace control chars and shell metacharacters with space
  const clean = value
    .replace(/[\u0000-\u001f\u007f;|&`$<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return null;
  if (clean.length > MAX_BOUNDS.id) return null;
  // Must match safe slug format (alphanumeric, dots, dashes, colons, slashes, brackets)
  if (!/^[a-zA-Z0-9_.:\-\/\[\] ()]+$/.test(clean)) return null;
  return clean;
}

function cleanString(value, cap) {
  if (typeof value !== 'string') return null;
  const clean = value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  return clean.length > cap ? clean.slice(0, cap) : clean;
}

function parseModel(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const label = cleanString(raw.label, MAX_BOUNDS.label);
  if (!label) return null;

  const model = { label };
  if (raw.id) {
    const validId = validateModelId(raw.id);
    if (validId) model.id = validId;
  }
  return model;
}

function parseProviderKey(key) {
  if (typeof key !== 'string' || key.length > MAX_BOUNDS.key) return null;
  if (!/^[a-z][a-z0-9_-]*$/i.test(key)) return null;
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return null;
  return key;
}

/**
 * Validates and parses a raw JSON catalog object into a typed ModelCatalog.
 * Returns null if the shape or version is invalid.
 * @param {unknown} raw
 * @returns {{version: number, providers: Record<string, Array<{id?: string, label: string}>>}|null}
 */
export function parseModelCatalog(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (raw.version !== CATALOG_SCHEMA_VERSION) return null;
  if (!raw.providers || typeof raw.providers !== 'object' || Array.isArray(raw.providers)) return null;

  const providers = Object.create(null);
  let kept = 0;

  for (const [rawKey, rawList] of Object.entries(raw.providers)) {
    if (kept >= MAX_BOUNDS.providers) break;
    const key = parseProviderKey(rawKey);
    if (!key || !Array.isArray(rawList)) continue;

    const models = [];
    const seen = new Set();
    for (const entry of rawList.slice(0, MAX_BOUNDS.models)) {
      const m = parseModel(entry);
      if (!m) continue;
      const dedupeKey = m.id || m.label;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      models.push(m);
    }

    if (models.length > 0 || rawList.length === 0) {
      providers[key] = models;
      kept++;
    }
  }

  if (kept === 0) return null;
  return { version: CATALOG_SCHEMA_VERSION, providers: { ...providers } };
}

/**
 * Loads model catalog with disk-caching and network fallbacks.
 * @param {string} cachePath
 * @param {object} [opts]
 * @param {string} [opts.remoteUrl]
 * @param {boolean} [opts.force]
 * @returns {Promise<{catalog: object, fetchedAt: number, stale: boolean}>}
 */
export async function loadModelCatalog(cachePath, opts = {}) {
  let cached = null;
  try {
    if (fs.existsSync(cachePath)) {
      const read = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      const parsed = parseModelCatalog(read?.catalog);
      if (parsed && typeof read.fetchedAt === 'number') {
        cached = { catalog: parsed, fetchedAt: read.fetchedAt };
      }
    }
  } catch (e) {
    cached = null;
  }

  if (cached && !opts.force && Date.now() - cached.fetchedAt < TTL_MS) {
    return { catalog: cached.catalog, fetchedAt: cached.fetchedAt, stale: false };
  }

  if (opts.remoteUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(opts.remoteUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const catalog = parseModelCatalog(json);
        if (catalog) {
          const payload = { catalog, fetchedAt: Date.now() };
          try {
            fs.mkdirSync(path.dirname(cachePath), { recursive: true });
            fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), 'utf8');
          } catch (w) {}
          return { ...payload, stale: false };
        }
      }
    } catch (err) {}
  }

  if (cached) {
    return { catalog: cached.catalog, fetchedAt: cached.fetchedAt, stale: true };
  }

  return {
    catalog: BUILTIN_MODEL_CATALOG,
    fetchedAt: Date.now(),
    stale: false
  };
}
