import test from 'node:test';
import assert from 'node:assert/strict';
import { CodebaseParser } from '../src/core/ast-parser.js';

test('CodebaseParser - AST Static Analysis', async (t) => {
  const parser = new CodebaseParser();

  await t.test('filters auditable code files and ignores node_modules/.git', () => {
    assert.equal(parser.isAuditableFile('src/components/Header.tsx'), true);
    assert.equal(parser.isAuditableFile('server/api.js'), true);
    assert.equal(parser.isAuditableFile('core/engine.py'), true);
    assert.equal(parser.isAuditableFile('node_modules/express/index.js'), false);
    assert.equal(parser.isAuditableFile('.env.production'), false);
    assert.equal(parser.isAuditableFile('dist/bundle.js'), false);
  });

  await t.test('extracts imports and path aliases accurately', () => {
    const code = `
      import React, { useState } from 'react';
      import { Button } from '@/components/Button';
      import { authHelper } from '../utils/auth';
      const lodash = require('lodash');
      export const App = () => {};
    `;

    const parsed = parser.parseModule('src/App.tsx', code);
    assert.equal(parsed.name, 'App.tsx');
    assert.ok(parsed.loc > 0);
    assert.ok(parsed.sloc > 0);
    assert.ok(parsed.imports.includes('src/components/Button.tsx') || parsed.imports.some(i => i.includes('Button')));
  });

  await t.test('computes cyclomatic complexity accurately', () => {
    const simpleCode = `export const sum = (a, b) => a + b;`;
    const complexCode = `
      export function evaluate(x) {
        if (x > 10) {
          return x === 20 ? 'twenty' : 'other';
        } else if (x < 0) {
          while (x < 0) { x++; }
        }
        return 'done';
      }
    `;

    const simpleParsed = parser.parseModule('src/simple.js', simpleCode);
    const complexParsed = parser.parseModule('src/complex.js', complexCode);

    assert.ok(complexParsed.complexity > simpleParsed.complexity, 'Branching increases complexity');
  });

  await t.test('assigns districts according to Istanbul Bosphorus sectors', () => {
    const clientCode = `import React from 'react'; export const View = () => <div>Client</div>;`;
    const serverCode = `import { Pool } from 'pg'; export const query = () => {};`;

    const clientMod = parser.parseModule('src/ui/View.tsx', clientCode);
    const serverMod = parser.parseModule('src/services/db.ts', serverCode);

    assert.equal(clientMod.district.side, 'europe', 'UI component belongs to European sector');
    assert.equal(serverMod.district.side, 'asia', 'Backend service belongs to Asian sector');
  });
});
