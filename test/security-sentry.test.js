import test from 'node:test';
import assert from 'node:assert/strict';
import { CodebaseParser } from '../src/core/ast-parser.js';

test('SecuritySentry - MITRE CWE Boundary Auditing', async (t) => {
  const parser = new CodebaseParser();

  await t.test('detects CWE-668: backend package leaked into client component', () => {
    const clientCode = `
      'use client';
      import React from 'react';
      import fs from 'fs';
      export const FileViewer = () => <div>files</div>;
    `;

    const parsed = parser.parseModule('src/ui/FileViewer.tsx', clientCode);
    assert.ok(parsed.securityLeaks.length > 0, 'Must flag leaked backend package');

    const leak = parsed.securityLeaks.find(l => l.cwe === 'CWE-668');
    assert.ok(leak, 'Must identify CWE-668 violation');
    assert.equal(leak.target, 'fs');
    assert.ok(leak.line >= 1);
  });

  await t.test('detects CWE-200: sensitive environment secret exposed in code', () => {
    const leakingCode = `
      export const getAuthToken = () => {
        const apiKey = process.env.OPENAI_API_KEY;
        return apiKey;
      };
    `;

    const parsed = parser.parseModule('src/api/client.ts', leakingCode);
    const leak = parsed.securityLeaks.find(l => l.cwe === 'CWE-200');

    assert.ok(leak, 'Must identify CWE-200 exposed environment secret');
    assert.ok(leak.message.includes('OPENAI_API_KEY'));
  });

  await t.test('detects CWE-798: hardcoded cloud credentials (AWS IAM key)', () => {
    const credCode = `
      const config = {
        accessKeyId: "AKIAIOSFODNN7EXAMPLE",
        region: "eu-central-1"
      };
    `;

    const parsed = parser.parseModule('src/config/aws.ts', credCode);
    const leak = parsed.securityLeaks.find(l => l.cwe === 'CWE-798');

    assert.ok(leak, 'Must identify hardcoded cloud credential');
    assert.equal(leak.severity, 'EMERGENCY');
  });
});
