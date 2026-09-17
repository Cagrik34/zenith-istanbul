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

  await t.test('strictly separates European and Asian sectors for real project architecture', () => {
    // 1. European Side: Client, UI, 3D Engine, CLI Coordinator
    const appJs = parser.parseModule('public/js/app.js', 'console.log("Client dashboard");');
    const bosphorusScene = parser.parseModule('public/js/bosphorus-scene.js', 'import * as THREE from "../vendor/three/three.module.js";');
    const cliJs = parser.parseModule('bin/cli.js', '#!/usr/bin/env node\nconst fs = require("fs");\nconsole.log("CLI");');
    const swarmCoord = parser.parseModule('src/core/swarm-coordinator.js', 'export class SwarmCoordinator {}');

    assert.equal(appJs.district.side, 'europe', 'app.js must be in European sector (Galata)');
    assert.equal(bosphorusScene.district.side, 'europe', 'bosphorus-scene.js must be in European sector (Beşiktaş)');
    assert.equal(cliJs.district.side, 'europe', 'cli.js must be in European sector (Levent/Maslak)');
    assert.equal(cliJs.isCore, true, 'cli.js must be recognized as core entrypoint');
    assert.equal(swarmCoord.district.side, 'europe', 'swarm-coordinator must be in European sector (Maslak)');

    // 2. Asian Side: Databases, Vaults, Reflexes, Sentry
    const modelCatalog = parser.parseModule('src/core/model-catalog.js', 'export const catalog = [];');
    const swarmReflex = parser.parseModule('src/core/swarm-reflex.js', 'export function onEvent() {}');
    const securitySentry = parser.parseModule('src/core/security-sentry.js', 'export function auditLeakedSecrets() {}');

    assert.equal(modelCatalog.district.side, 'asia', 'model-catalog.js must be in Asian sector (Ataşehir)');
    assert.equal(swarmReflex.district.side, 'asia', 'swarm-reflex.js must be in Asian sector (Kadıköy)');
    assert.equal(securitySentry.district.side, 'asia', 'security-sentry.js must be in Asian sector (Üsküdar)');

    // 3. Bosphorus Strait (Boğaz): Central API Gateway & Middleware (Kız Kulesi)
    const httpMiddleware = parser.parseModule('src/core/http-middleware.js', 'export function securityHeaders() {}');
    assert.equal(httpMiddleware.district.side, 'bosphorus', 'http-middleware.js must be Maiden Tower in Bosphorus');
    assert.equal(httpMiddleware.district.isLandmark, 'maiden_tower', 'must be maiden_tower landmark');

    // 4. Historic Peninsula: Core Compilers & Graph Solvers
    const astParser = parser.parseModule('src/core/ast-parser.js', 'export class CodebaseParser {}');
    assert.equal(astParser.district.side, 'historic', 'ast-parser.js must be in Historic Peninsula');
  });
});
