import test from 'node:test';
import assert from 'node:assert/strict';
import { TrafficEngine } from '../src/core/traffic-engine.js';
import { findSCCs } from '../src/core/tarjan-scc.js';

test('TrafficEngine - Tarjan SCC Cycle Detection', async (t) => {
  await t.test('verifies clean DAG topology has 0 cyclic deadlocks', () => {
    const engine = new TrafficEngine();
    const dagModules = [
      { id: 'src/index.ts', name: 'index.ts', path: 'src/index.ts', loc: 50, imports: ['src/utils/math.ts'], exports: [] },
      { id: 'src/utils/math.ts', name: 'math.ts', path: 'src/utils/math.ts', loc: 30, imports: [], exports: ['add'] }
    ];

    engine.loadModules(dagModules);
    const report = engine.generateTelemetryReport();

    assert.equal(report.circularDependencies, 0, 'DAG should have 0 circular dependencies');
    assert.equal(report.trafficIndex, 0, 'Clean DAG should have 0% traffic density');
  });

  await t.test('detects 3-node circular dependency chain accurately', () => {
    const engine = new TrafficEngine();
    const cyclicModules = [
      { id: 'src/ui/AuthModal.tsx', name: 'AuthModal.tsx', path: 'src/ui/AuthModal.tsx', loc: 200, imports: ['src/services/session.ts'], exports: [] },
      { id: 'src/services/session.ts', name: 'session.ts', path: 'src/services/session.ts', loc: 150, imports: ['src/services/user.ts'], exports: [] },
      { id: 'src/services/user.ts', name: 'user.ts', path: 'src/services/user.ts', loc: 180, imports: ['src/ui/AuthModal.tsx'], exports: [] }
    ];

    engine.loadModules(cyclicModules);
    const report = engine.generateTelemetryReport();

    assert.ok(report.circularDependencies > 0, 'Should detect circular dependency');
    assert.ok(engine.circularChains.length > 0, 'Circular chains must be populated');
    assert.ok(report.trafficIndex > 0, 'Traffic index must reflect coupling');
  });

  await t.test('identifies isolated subgraphs (dead code modules)', () => {
    const engine = new TrafficEngine();
    const modules = [
      { id: 'src/active.ts', name: 'active.ts', path: 'src/active.ts', loc: 100, imports: ['src/dep.ts'], exports: [] },
      { id: 'src/dep.ts', name: 'dep.ts', path: 'src/dep.ts', loc: 50, imports: [], exports: [] },
      { id: 'src/isolated.ts', name: 'isolated.ts', path: 'src/isolated.ts', loc: 40, imports: [], exports: [] }
    ];

    engine.loadModules(modules);
    const report = engine.generateTelemetryReport();

    assert.ok(report.deadCodeModules >= 1, 'Should identify isolated modules');
  });

  await t.test('standalone findSCCs returns empty array for empty graph or DAG', () => {
    const emptyAdj = new Map();
    assert.deepEqual(findSCCs(emptyAdj), []);

    const dagAdj = new Map([
      ['A', new Set(['B'])],
      ['B', new Set(['C'])],
      ['C', new Set()]
    ]);
    assert.deepEqual(findSCCs(dagAdj), []);
  });

  await t.test('standalone findSCCs detects cycles in arbitrary directed graphs', () => {
    const cyclicAdj = new Map([
      ['A', new Set(['B'])],
      ['B', new Set(['C'])],
      ['C', new Set(['A'])],
      ['D', new Set(['A'])]
    ]);
    const sccs = findSCCs(cyclicAdj);
    assert.equal(sccs.length, 1);
    const cycleNodes = sccs[0].sort();
    assert.deepEqual(cycleNodes, ['A', 'B', 'C']);
  });
});
