/**
 * ZenithIstanbul - AKOM Autonomous Multi-Agent Memory & Knowledge Graph Engine
 * Pure zero-dependency deterministic spring-force layout, heuristic topic extraction,
 * and directed multi-agent communication graph assembler.
 */

const GOLDEN_ANGLE = 2.399963229728653; // radians

/**
 * Deterministic phyllotaxis spiral seed centred in the layout frame.
 * @param {string[]} ids
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @returns {Map<string, {x: number, y: number}>}
 */
function seedPhyllotaxis(ids, cx, cy, radius) {
  const pos = new Map();
  const n = Math.max(1, ids.length);
  ids.forEach((id, i) => {
    const r = radius * Math.sqrt((i + 0.5) / n);
    const a = i * GOLDEN_ANGLE;
    pos.set(id, { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  });
  return pos;
}

/**
 * Deterministic Fruchterman-Reingold force-directed layout.
 * @param {Array<{id: string, gravityBias?: number}>} nodes
 * @param {Array<{source: string, target: string, strength?: number}>} edges
 * @param {{width: number, height: number, padding?: number, iterations?: number, pinned?: Record<string, {x: number, y: number}>}} opts
 * @returns {Map<string, {x: number, y: number}>}
 */
export function forceLayout(nodes, edges, opts = {}) {
  const width = opts.width || 800;
  const height = opts.height || 500;
  const padding = opts.padding ?? 32;
  const iterations = opts.iterations ?? 300;
  const pinned = opts.pinned || {};

  const ids = nodes.map(n => n.id);
  const cx = width / 2;
  const cy = height / 2;
  const usableR = Math.max(40, Math.min(width, height) / 2 - padding);
  const pos = seedPhyllotaxis(ids, cx, cy, usableR);

  for (const id of ids) {
    if (pinned[id]) pos.set(id, { ...pinned[id] });
  }

  if (ids.length <= 1) return pos;

  const area = width * height;
  const k = Math.sqrt(area / ids.length) * 0.55;
  const k2 = k * k;
  const gravity = 0.045;

  const biasById = new Map(nodes.map(n => [n.id, n.gravityBias ?? 1]));
  const disp = new Map(ids.map(id => [id, { x: 0, y: 0 }]));

  let temp = Math.min(width, height) * 0.12;
  const cool = Math.pow(0.02, 1 / iterations);

  for (let it = 0; it < iterations; it++) {
    for (const id of ids) {
      const d = disp.get(id);
      d.x = 0;
      d.y = 0;
    }

    // Repulsion
    for (let i = 0; i < ids.length; i++) {
      const pi = pos.get(ids[i]);
      const di = disp.get(ids[i]);
      for (let j = i + 1; j < ids.length; j++) {
        const pj = pos.get(ids[j]);
        let dx = pi.x - pj.x;
        let dy = pi.y - pj.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 0.01) {
          dx = (i - j) * 0.01 + 0.01;
          dy = 0.01;
          dist = Math.hypot(dx, dy);
        }
        const force = k2 / dist;
        const ux = dx / dist;
        const uy = dy / dist;
        di.x += ux * force;
        di.y += uy * force;
        const dj = disp.get(ids[j]);
        dj.x -= ux * force;
        dj.y -= uy * force;
      }
    }

    // Attraction
    for (const e of edges) {
      const ps = pos.get(e.source);
      const pt = pos.get(e.target);
      if (!ps || !pt) continue;
      const dx = ps.x - pt.x;
      const dy = ps.y - pt.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      const force = ((dist * dist) / k) * (e.strength ?? 1);
      const ux = dx / dist;
      const uy = dy / dist;
      const ds = disp.get(e.source);
      const dt = disp.get(e.target);
      if (ds) { ds.x -= ux * force; ds.y -= uy * force; }
      if (dt) { dt.x += ux * force; dt.y -= uy * force; }
    }

    // Centre Gravity
    for (const id of ids) {
      const p = pos.get(id);
      const d = disp.get(id);
      const g = gravity * (biasById.get(id) ?? 1);
      d.x += (cx - p.x) * g;
      d.y += (cy - p.y) * g;
    }

    // Step Integration
    for (const id of ids) {
      if (pinned[id]) {
        pos.set(id, { ...pinned[id] });
        continue;
      }
      const p = pos.get(id);
      const d = disp.get(id);
      const len = Math.hypot(d.x, d.y) || 0.01;
      const step = Math.min(len, temp);
      p.x += (d.x / len) * step;
      p.y += (d.y / len) * step;
      p.x = Math.max(padding, Math.min(width - padding, p.x));
      p.y = Math.max(padding, Math.min(height - padding, p.y));
    }

    temp *= cool;
  }

  return pos;
}

const STOP_WORDS = new Set([
  'update', 'updates', 'done', 'note', 'notes', 'next', 'open', 'todo', 'todos',
  'fixed', 'resolved', 'wip', 'status', 'context', 'memory', 'summary', 'decision',
  'decisions', 'plan', 'plans', 'task', 'tasks', 'phase 1', 'phase 2', 'phase',
  'why', 'how', 'what', 'gap', 'gaps', 'needed', 'important', 'fact', 'facts'
]);

function stripDatePrefix(s) {
  return s.replace(/^\s*\d{4}-\d{2}-\d{2}\s*[\u2014\-:·]*\s*/, '');
}

function normaliseCandidate(raw) {
  return raw
    .replace(/[`*_~]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[#:.,;!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function extractCandidatesFromMarkdown(markdown) {
  if (typeof markdown !== 'string') return [];
  const out = [];
  for (const line of markdown.split('\n')) {
    const heading = line.match(/^#{2,4}\s+(.+?)\s*$/);
    if (heading) out.push(stripDatePrefix(heading[1]));
    for (const m of line.matchAll(/\*\*(.+?)\*\*/g)) {
      out.push(stripDatePrefix(m[1]));
    }
  }
  return out;
}

function isUsableTopic(norm) {
  if (norm.length < 3 || norm.length > 42) return false;
  if (STOP_WORDS.has(norm)) return false;
  if (/^[\d\s\-\u2014.]+$/.test(norm)) return false;
  if (!/[a-z\u00C0-\u024F]/i.test(norm)) return false;
  return true;
}

/**
 * Heuristic topic extractor across multiple agent memories.
 * Identifies shared knowledge topics cited by >= 2 distinct agents.
 * @param {Record<string, string>} memories
 * @param {number} max
 * @returns {{topics: Array<{id: string, label: string, agentIds: string[], weight: number}>, total: number}}
 */
export function extractTopics(memories = {}, max = 24) {
  const acc = new Map();

  for (const [agentId, text] of Object.entries(memories)) {
    if (!text) continue;
    const seenThisAgent = new Set();
    for (const cand of extractCandidatesFromMarkdown(text)) {
      const norm = normaliseCandidate(cand);
      if (!isUsableTopic(norm) || seenThisAgent.has(norm)) continue;
      seenThisAgent.add(norm);

      const entry = acc.get(norm);
      if (entry) {
        entry.agents.add(agentId);
      } else {
        acc.set(norm, {
          label: cand.replace(/[`*_]/g, '').trim(),
          agents: new Set([agentId])
        });
      }
    }
  }

  const all = [];
  for (const [norm, { label, agents }] of acc) {
    if (agents.size < 2) continue;
    all.push({
      id: `topic:${norm}`,
      label,
      agentIds: [...agents],
      weight: agents.size
    });
  }

  all.sort((a, b) => b.weight - a.weight || a.label.localeCompare(b.label));

  return {
    topics: all.slice(0, max),
    total: all.length
  };
}

function sortedPairKey(a, b) {
  return a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`;
}

/**
 * Assembles the full graph model from agents, message logs, and memory topics.
 * @param {Array<{id: string, name: string, color?: string, role?: string, status: string, isCommander?: boolean}>} agents
 * @param {Array<{ts?: number, kind?: string, from?: string, to?: string, act?: string, subject?: string}>} log
 * @param {{showTopics?: boolean, memories?: Record<string, string>, maxTopics?: number}} opts
 */
export function buildGraph(agents, log = [], opts = {}) {
  const byId = new Map(agents.map(a => [a.id, a]));
  const degree = new Map();
  const pairs = new Map();
  const pseudoUsed = new Set();

  const resolve = (ep) => {
    if (!ep) return null;
    if (byId.has(ep)) return ep;
    if (ep === 'broadcast' || ep === 'all') {
      pseudoUsed.add('broadcast');
      return 'broadcast';
    }
    if (ep === 'human' || ep === 'operator') {
      pseudoUsed.add('human');
      return 'human';
    }
    return null;
  };

  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    if (e.kind !== 'message' && e.kind !== 'message_routed') continue;
    const from = resolve(e.from);
    const to = resolve(e.to);
    if (!from || !to || from === to) continue;

    const key = sortedPairKey(from, to);
    const ts = typeof e.ts === 'number' ? e.ts : i;
    let p = pairs.get(key);
    if (!p) {
      const [a, b] = from < to ? [from, to] : [to, from];
      p = { a, b, fwd: 0, bwd: 0, lastTs: -1 };
      pairs.set(key, p);
    }
    if (from === p.a) p.fwd++; else p.bwd++;
    if (ts >= p.lastTs) {
      p.lastTs = ts;
      p.lastAct = e.act;
      p.lastSubject = e.subject;
    }

    if (byId.has(from)) degree.set(from, (degree.get(from) ?? 0) + 1);
    if (byId.has(to)) degree.set(to, (degree.get(to) ?? 0) + 1);
  }

  const nodes = [];
  const edges = [];

  for (const a of agents) {
    nodes.push({
      kind: 'agent',
      id: a.id,
      label: a.name,
      color: a.color || '#00f0ff',
      status: a.status,
      role: a.role,
      isCommander: !!a.isCommander || a.id === 'agent.commander',
      degree: degree.get(a.id) ?? 0
    });
  }

  if (pseudoUsed.has('broadcast')) {
    nodes.push({ kind: 'pseudo', id: 'broadcast', label: 'Broadcast Channel', color: '#ffb74d' });
  }
  if (pseudoUsed.has('human')) {
    nodes.push({ kind: 'pseudo', id: 'human', label: 'Human SRE Operator', color: '#00e676' });
  }

  for (const p of pairs.values()) {
    const dir = p.fwd && p.bwd ? 'both' : p.fwd ? 'fwd' : 'bwd';
    edges.push({
      id: `message:${p.a}\u0000${p.b}`,
      kind: 'message',
      source: p.a,
      target: p.b,
      weight: p.fwd + p.bwd,
      dir,
      lastAct: p.lastAct,
      lastSubject: p.lastSubject
    });
  }

  let topicShown = 0;
  let topicTotal = 0;

  if (opts.showTopics && opts.memories) {
    const { topics, total } = extractTopics(opts.memories, opts.maxTopics ?? 24);
    topicTotal = total;
    topicShown = topics.length;

    for (const t of topics) {
      nodes.push({
        kind: 'topic',
        id: t.id,
        label: t.label,
        weight: t.weight,
        color: '#b388ff'
      });
      for (const agentId of t.agentIds) {
        if (!byId.has(agentId)) continue;
        edges.push({
          id: `topic:${agentId}\u0000${t.id}`,
          kind: 'topic',
          source: agentId,
          target: t.id,
          weight: 1
        });
      }
    }
  }

  return { nodes, edges, topicShown, topicTotal };
}
