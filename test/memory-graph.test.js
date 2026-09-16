import test from 'node:test';
import assert from 'node:assert/strict';
import { forceLayout, extractTopics, buildGraph } from '../src/agent/memory-graph.js';

test('MemoryGraph - Deterministic force layout converges within bounding box', () => {
  const nodes = [
    { id: 'agent.commander', gravityBias: 1.5 },
    { id: 'agent.bridge_engineer' },
    { id: 'agent.security_sentinel' },
    { id: 'agent.refactorer' },
    { id: 'agent.qa_inspector' }
  ];

  const edges = [
    { source: 'agent.commander', target: 'agent.bridge_engineer', strength: 1.2 },
    { source: 'agent.commander', target: 'agent.security_sentinel', strength: 1.0 },
    { source: 'agent.bridge_engineer', target: 'agent.qa_inspector', strength: 0.8 }
  ];

  const width = 800;
  const height = 500;
  const padding = 30;

  const pos1 = forceLayout(nodes, edges, { width, height, padding, iterations: 200 });
  const pos2 = forceLayout(nodes, edges, { width, height, padding, iterations: 200 });

  assert.equal(pos1.size, 5);

  // Determinism check
  for (const n of nodes) {
    const p1 = pos1.get(n.id);
    const p2 = pos2.get(n.id);
    assert.ok(p1, `Missing position for ${n.id}`);
    assert.equal(p1.x, p2.x, `X coordinates should match deterministically for ${n.id}`);
    assert.equal(p1.y, p2.y, `Y coordinates should match deterministically for ${n.id}`);

    // Bounds check
    assert.ok(p1.x >= padding && p1.x <= width - padding, `X out of bounds: ${p1.x}`);
    assert.ok(p1.y >= padding && p1.y <= height - padding, `Y out of bounds: ${p1.y}`);
  }
});

test('MemoryGraph - Pinned nodes maintain exact coordinates', () => {
  const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const edges = [{ source: 'a', target: 'b' }];
  const pinned = { a: { x: 123, y: 456 } };

  const pos = forceLayout(nodes, edges, { width: 600, height: 600, pinned, iterations: 100 });
  assert.equal(pos.get('a').x, 123);
  assert.equal(pos.get('a').y, 456);
});

test('MemoryGraph - Topic extraction identifies shared knowledge with >=2 agents', () => {
  const memories = {
    'agent.commander': `
# Commander Notes
## 2026-09-16 — Bosphorus Bridge Coupling
Investigated the **Tarjan SCC** cycle in auth services.
`,
    'agent.bridge_engineer': `
## Tarjan SCC
Extracted decoupled interface to break circular chain.
Also reviewed **Bosphorus Bridge Coupling** telemetry.
`,
    'agent.security_sentinel': `
## Security Review
Audited MITRE CWE leaks. **Solo Topic** only here.
`
  };

  const { topics, total } = extractTopics(memories);
  assert.equal(total, 2);
  assert.equal(topics.length, 2);

  const topicLabels = topics.map(t => t.label.toLowerCase());
  assert.ok(topicLabels.includes('bosphorus bridge coupling'));
  assert.ok(topicLabels.includes('tarjan scc'));

  // Verify weight
  const tarjanTopic = topics.find(t => t.id === 'topic:tarjan scc');
  assert.equal(tarjanTopic.weight, 2);
  assert.deepEqual(tarjanTopic.agentIds.sort(), ['agent.bridge_engineer', 'agent.commander']);
});

test('MemoryGraph - BuildGraph aggregates directed edges and pseudo nodes', () => {
  const agents = [
    { id: 'agent.commander', name: 'AKOM Başkomutanı', status: 'idle', role: 'Commander' },
    { id: 'agent.bridge_engineer', name: 'Boğaz Köprüsü Mühendisi', status: 'working', role: 'Engineer' }
  ];

  const log = [
    { ts: 1000, kind: 'message_routed', from: 'agent.commander', to: 'agent.bridge_engineer', act: 'request', subject: 'Break loop' },
    { ts: 2000, kind: 'message_routed', from: 'agent.bridge_engineer', to: 'agent.commander', act: 'done', subject: 'Loop broken' },
    { ts: 3000, kind: 'message_routed', from: 'agent.commander', to: 'human', act: 'request', subject: 'Approval required' },
    { ts: 4000, kind: 'message_routed', from: 'agent.commander', to: 'broadcast', act: 'inform', subject: 'All clear' }
  ];

  const graph = buildGraph(agents, log, { showTopics: false });

  // 2 agents + human + broadcast = 4 nodes
  assert.equal(graph.nodes.length, 4);
  assert.ok(graph.nodes.some(n => n.id === 'human'));
  assert.ok(graph.nodes.some(n => n.id === 'broadcast'));

  // Edge between commander and bridge_engineer should have both directions
  const edge = graph.edges.find(e => e.id.includes('agent.bridge_engineer') && e.id.includes('agent.commander'));
  assert.ok(edge);
  assert.equal(edge.dir, 'both');
  assert.equal(edge.weight, 2);
  assert.equal(edge.lastAct, 'done');
});
