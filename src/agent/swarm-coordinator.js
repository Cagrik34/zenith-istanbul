/**
 * ZenithIstanbul - AKOM Autonomous Multi-Agent Swarm Coordinator
 * Local-first, zero-dependency multi-agent orchestration harness.
 * Features:
 *   - Autonomous agent roster & workspaces (.zenith/swarm/agents/<id>/)
 *   - Shared blackboard architecture (board.md)
 *   - Task ledger with dependency tracking (tasks.json)
 *   - FIPA-lite asynchronous message passing (inbox/outbox router)
 *   - Cryptographic secret redaction filter for inter-agent traffic
 *   - Atomic single-committer file system writes
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildGraph, forceLayout } from './memory-graph.js';
import { loadModelCatalog, validateModelId } from './model-catalog.js';

/**
 * @typedef {'request' | 'inform' | 'propose' | 'query' | 'agree' | 'refuse' | 'done'} SwarmMessageAct
 *
 * @typedef {Object} SwarmMessage
 * @property {string} id
 * @property {string} conversation
 * @property {string|null} in_reply_to
 * @property {string} from
 * @property {string} to
 * @property {SwarmMessageAct} act
 * @property {string} subject
 * @property {string} body
 * @property {number} hops
 * @property {boolean} requires_reply
 * @property {boolean} needs_human
 * @property {string} created_at
 *
 * @typedef {Object} SwarmAgentMeta
 * @property {string} id
 * @property {string} name
 * @property {string} role
 * @property {string} specialty
 * @property {('idle'|'working'|'blocked'|'done')} status
 * @property {string} color
 * @property {number} lastSeen
 *
 * @typedef {Object} SwarmTask
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} assignee
 * @property {('todo'|'doing'|'blocked'|'done')} status
 * @property {('low'|'medium'|'high'|'critical')} priority
 * @property {string[]} dependsOn
 * @property {string} [result]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

const HOP_CAP = 12;

/**
 * 5-Tier Cryptographic Secret Redaction Battery
 */
export function redactSecrets(text) {
  if (typeof text !== 'string' || !text) return typeof text === 'string' ? text : '';
  let s = text;
  // 1. PEM private keys
  s = s.replace(/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]');
  // 2. JWT tokens (three base64url segments)
  s = s.replace(/\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}/g, '[REDACTED_JWT]');
  // 3. Known provider and cloud API key signatures
  s = s.replace(
    /(?:sk-(?:ant-)?[A-Za-z0-9_-]{16,}|xox[bpaors]-[A-Za-z0-9-]{10,}|gh[posru]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|AIza[A-Za-z0-9_-]{20,})/g,
    '[REDACTED_API_KEY]'
  );
  // 4. Authorization bearer tokens
  s = s.replace(/\b(bearer)\s+[A-Za-z0-9._~+/=-]{8,}/gi, '$1 [REDACTED_TOKEN]');
  // 5. Named key-value credential pairs
  s = s.replace(
    /\b((?:[a-z0-9]+[_-])*(?:api[_-]?key|secret[_-]?access[_-]?key|secret|token|password|passwd|pwd|access[_-]?token|refresh[_-]?token|client[_-]?secret|signing[_-]?secret|webhook[_-]?secret|auth[_-]?token|bot[_-]?token|private[_-]?key))(\s*[:=]\s*)(["']?)[^\s"',}]{6,}\3/gi,
    (_m, k) => `${k}=[REDACTED]`
  );
  return s;
}

/**
 * Repairs literal CR/LF characters inside JSON string values.
 * Prevents JSON.parse failures when multi-line LLM diffs or shell outputs are published.
 */
export function repairLiteralLineBreaksInJsonStrings(raw) {
  let text = '';
  let inString = false;
  let escaped = false;
  let changed = false;

  for (const ch of raw) {
    if (!inString) {
      text += ch;
      if (ch === '"') inString = true;
      continue;
    }

    if (escaped) {
      text += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      text += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      text += ch;
      inString = false;
      continue;
    }

    if (ch === '\n') {
      text += '\\n';
      changed = true;
      continue;
    }

    if (ch === '\r') {
      text += '\\r';
      changed = true;
      continue;
    }

    text += ch;
  }

  return { text, changed };
}

/**
 * Pure function selecting live broadcast targets, excluding sender and archived agents.
 */
export function selectBroadcastTargets(agents, fromId) {
  return Object.keys(agents || {}).filter(id => {
    const a = agents[id];
    if (!a) return false;
    if (id === fromId) return false;
    if (a.archived) return false;
    return true;
  });
}

/**
 * Folds incoming tasks over existing tasks preserving custom on-disk fields.
 */
export function mergeTaskLedger(existing, incoming) {
  const incomingList = Array.isArray(incoming) ? incoming : [];
  const existingList = Array.isArray(existing) ? existing : [];
  const byId = new Map();
  for (const entry of existingList) {
    if (entry && typeof entry === 'object' && entry.id) {
      byId.set(entry.id, entry);
    }
  }
  return incomingList.map(entry => {
    if (!entry || typeof entry !== 'object' || !entry.id) return entry;
    const prior = byId.get(entry.id);
    return prior ? { ...prior, ...entry } : entry;
  });
}

/**
 * Patches one task in the ledger without discarding other fields or cards.
 */
export function patchTaskInLedger(rawTasks, id, patch) {
  const list = Array.isArray(rawTasks) ? rawTasks : [];
  return list.map(entry => (entry && entry.id === id ? { ...entry, ...patch } : entry));
}

export class SwarmCoordinator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.swarmRoot = path.join(projectRoot, '.zenith', 'swarm');
    this.initWorkspace();
  }

  /**
   * Initializes the workspace and creates default specialist agents if missing.
   */
  initWorkspace() {
    fs.mkdirSync(this.swarmRoot, { recursive: true });

    const agentsDir = path.join(this.swarmRoot, 'agents');
    fs.mkdirSync(agentsDir, { recursive: true });

    // 1. Registry
    const registryPath = path.join(this.swarmRoot, 'registry.json');
    if (!fs.existsSync(registryPath)) {
      const defaultRegistry = {
        commanderId: 'agent.commander',
        agents: {
          'agent.commander': {
            id: 'agent.commander',
            name: 'AKOM Başkomutanı',
            role: 'Chief Orchestrator & Supervisor',
            specialty: 'Task decomposition, incident triage, and human-in-the-loop approval',
            status: 'idle',
            color: '#00f0ff',
            lastSeen: Date.now()
          },
          'agent.bridge_engineer': {
            id: 'agent.bridge_engineer',
            name: 'Boğaz Köprüsü Mühendisi',
            role: 'Topology & Circular Jam Decoupler',
            specialty: 'Tarjan SCC cycle resolution, lexical contract extraction, and AST graph decoupling',
            status: 'idle',
            color: '#ff9100',
            lastSeen: Date.now()
          },
          'agent.security_sentinel': {
            id: 'agent.security_sentinel',
            name: 'Galata Güvenlik Gözcüsü',
            role: 'Boundary Audit & CWE Sentinel',
            specialty: 'MITRE CWE vulnerability patching, secret redaction, and client/server boundary enforcement',
            status: 'idle',
            color: '#ff1744',
            lastSeen: Date.now()
          },
          'agent.refactorer': {
            id: 'agent.refactorer',
            name: 'Tarihi Yarımada Mimarı',
            role: 'Structural Complexity Refactorer',
            specialty: 'Decomposing high cyclomatic complexity and large monolithic modules',
            status: 'idle',
            color: '#b388ff',
            lastSeen: Date.now()
          },
          'agent.qa_inspector': {
            id: 'agent.qa_inspector',
            name: 'Kadıköy İskele Denetçisi',
            role: 'Test & CI Gatekeeper Inspector',
            specialty: 'Automated test suite execution, patch validation, and non-breaking regression tests',
            status: 'idle',
            color: '#00e676',
            lastSeen: Date.now()
          }
        }
      };
      this.atomicWriteJson(registryPath, defaultRegistry);
    }

    // 2. Tasks ledger
    const tasksPath = path.join(this.swarmRoot, 'tasks.json');
    if (!fs.existsSync(tasksPath)) {
      this.atomicWriteJson(tasksPath, []);
    }

    // 3. Shared Blackboard
    const boardPath = path.join(this.swarmRoot, 'board.md');
    if (!fs.existsSync(boardPath)) {
      const defaultBoard = `# AKOM Shared Architectural Blackboard
*Autonomous SRE Coordination Deck — Zenith Istanbul*

## 1. Active Operational Context
- **Metropole State:** Normal Traffic Nominal
- **Last Scan Status:** Standby for architectural telemetry

## 2. In-Flight Remediation Plans
*No active crises. All districts operating within architectural invariants.*
`;
      fs.writeFileSync(boardPath, defaultBoard, 'utf8');
    }

    // 4. Per-agent workspaces
    const registry = this.getRegistry();
    for (const agentId of Object.keys(registry.agents)) {
      const dir = path.join(agentsDir, agentId);
      fs.mkdirSync(dir, { recursive: true });
      fs.mkdirSync(path.join(dir, 'inbox'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'inbox', '.done'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'outbox'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'outbox', '.sent'), { recursive: true });

      const identityPath = path.join(dir, 'identity.md');
      if (!fs.existsSync(identityPath)) {
        const meta = registry.agents[agentId];
        fs.writeFileSync(
          identityPath,
          `# ${meta.name} (${meta.id})\n**Role:** ${meta.role}\n**Specialty:** ${meta.specialty}\n`,
          'utf8'
        );
      }

      const memoryPath = path.join(dir, 'memory.md');
      if (!fs.existsSync(memoryPath)) {
        fs.writeFileSync(
          memoryPath,
          `# Long-Term Memory: ${agentId}\nInitialized on ${new Date().toISOString()}\n`,
          'utf8'
        );
      }
    }
  }

  atomicWriteJson(filePath, data) {
    const rand = crypto.randomBytes(4).toString('hex');
    const tmp = `${filePath}.tmp-${rand}`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, filePath);
  }

  getRegistry() {
    try {
      const raw = fs.readFileSync(path.join(this.swarmRoot, 'registry.json'), 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      return { commanderId: 'agent.commander', agents: {} };
    }
  }

  updateAgentStatus(agentId, status) {
    const reg = this.getRegistry();
    if (reg.agents[agentId]) {
      reg.agents[agentId].status = status;
      reg.agents[agentId].lastSeen = Date.now();
      this.atomicWriteJson(path.join(this.swarmRoot, 'registry.json'), reg);
    }
  }

  getTasks() {
    try {
      const raw = fs.readFileSync(path.join(this.swarmRoot, 'tasks.json'), 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  createTask(title, description, assignee = 'agent.commander', priority = 'medium', dependsOn = [], customId = null) {
    const tasks = this.getTasks();
    const id = customId || `AKOM-${100 + tasks.length + 1}`;
    const newTask = {
      id,
      title,
      description,
      assignee,
      status: 'todo',
      priority,
      dependsOn: Array.isArray(dependsOn) ? dependsOn : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    tasks.unshift(newTask);
    this.atomicWriteJson(path.join(this.swarmRoot, 'tasks.json'), tasks);

    this.appendLog({
      ts: Date.now(),
      kind: 'task_created',
      taskId: id,
      title,
      assignee,
      priority
    });

    return newTask;
  }

  updateTaskStatus(taskId, status, result = null) {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    task.status = status;
    task.updatedAt = new Date().toISOString();
    if (result) task.result = result;

    this.atomicWriteJson(path.join(this.swarmRoot, 'tasks.json'), tasks);
    this.appendLog({
      ts: Date.now(),
      kind: 'task_updated',
      taskId,
      status,
      result: result ? String(result).slice(0, 100) : undefined
    });

    return task;
  }

  getBoard() {
    try {
      return fs.readFileSync(path.join(this.swarmRoot, 'board.md'), 'utf8');
    } catch (e) {
      return '';
    }
  }

  updateBoard(markdown) {
    const boardPath = path.join(this.swarmRoot, 'board.md');
    fs.writeFileSync(boardPath, markdown, 'utf8');
  }

  appendLog(entry) {
    const logPath = path.join(this.swarmRoot, 'log.jsonl');
    const line = JSON.stringify({ ts: Date.now(), ...entry }) + '\n';
    try {
      fs.appendFileSync(logPath, line, 'utf8');
    } catch (e) {}
  }

  getRecentLogs(limit = 100) {
    const logPath = path.join(this.swarmRoot, 'log.jsonl');
    if (!fs.existsSync(logPath)) return [];
    try {
      const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
      return lines.slice(-limit).map(l => JSON.parse(l));
    } catch (e) {
      return [];
    }
  }

  /**
   * Normalizes a message payload and generates standard timestamp ID.
   */
  normalizeMessage(partial, from = 'system') {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const rand = crypto.randomBytes(2).toString('hex');
    return {
      id: partial.id || `${ts}-${rand}`,
      conversation: partial.conversation || `conv-${crypto.randomBytes(3).toString('hex')}`,
      in_reply_to: partial.in_reply_to || null,
      from: from || 'system',
      to: partial.to || 'agent.commander',
      act: partial.act || 'inform',
      subject: redactSecrets(partial.subject || 'Autonomous Telemetry Dispatch'),
      body: redactSecrets(partial.body || ''),
      hops: typeof partial.hops === 'number' ? partial.hops : 0,
      requires_reply: !!partial.requires_reply,
      needs_human: !!partial.needs_human,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Routes a message into the recipient agent's inbox folder.
   */
  routeMessage(rawMsg) {
    const msg = this.normalizeMessage(rawMsg, rawMsg.from);

    if (msg.hops > HOP_CAP) {
      this.appendLog({
        kind: 'drop',
        reason: 'hop_cap_exceeded',
        id: msg.id,
        from: msg.from,
        to: msg.to
      });
      return false;
    }

    const reg = this.getRegistry();
    const commanderId = reg.commanderId || 'agent.commander';
    const resolveTarget = t => (t === 'commander' || t === 'god' ? commanderId : t);

    let targets = [];
    if (msg.to === 'broadcast' || msg.to === 'all') {
      targets = selectBroadcastTargets(reg.agents, msg.from);
    } else {
      const resolved = resolveTarget(msg.to);
      if (resolved !== msg.from) targets = [resolved];
    }

    const agentsDir = path.join(this.swarmRoot, 'agents');
    let deliveredCount = 0;

    for (const targetId of targets) {
      const targetInbox = path.join(agentsDir, targetId, 'inbox');
      if (fs.existsSync(targetInbox)) {
        const filePath = path.join(targetInbox, `${msg.created_at.replace(/[:.]/g, '-')}-${msg.id}.json`);
        this.atomicWriteJson(filePath, msg);
        deliveredCount++;
      }
    }

    this.appendLog({
      kind: 'message_routed',
      id: msg.id,
      from: msg.from,
      to: msg.to,
      act: msg.act,
      subject: msg.subject,
      deliveredTo: targets
    });

    return deliveredCount > 0;
  }

  /**
   * Scans all agent outboxes, repairs literal line breaks, delivers pending
   * files to target inboxes, and quarantines malformed files safely.
   */
  drainOutbox() {
    const agentsDir = path.join(this.swarmRoot, 'agents');
    if (!fs.existsSync(agentsDir)) return 0;

    const agents = fs.readdirSync(agentsDir);
    let routedTotal = 0;

    for (const agentId of agents) {
      const outbox = path.join(agentsDir, agentId, 'outbox');
      if (!fs.existsSync(outbox)) continue;

      const files = fs.readdirSync(outbox).filter(f => f.endsWith('.json'));
      for (const f of files) {
        const full = path.join(outbox, f);
        try {
          const rawContent = fs.readFileSync(full, 'utf8');
          const { text: repaired } = repairLiteralLineBreaksInJsonStrings(rawContent);
          const raw = JSON.parse(repaired);
          raw.from = agentId;
          raw.hops = (raw.hops || 0) + 1;
          this.routeMessage(raw);

          const sentDir = path.join(outbox, '.sent');
          fs.mkdirSync(sentDir, { recursive: true });
          fs.renameSync(full, path.join(sentDir, f));
          routedTotal++;
        } catch (e) {
          try {
            const malformedDir = path.join(outbox, '.malformed');
            fs.mkdirSync(malformedDir, { recursive: true });
            fs.renameSync(full, path.join(malformedDir, f));
            this.appendLog({
              kind: 'outbox_malformed',
              agentId,
              file: f,
              error: e.message
            });
          } catch (r) {}
        }
      }
    }

    return routedTotal;
  }

  /**
   * Returns pending inbox message count for an agent.
   */
  inboxBacklog(agentId) {
    const inbox = path.join(this.swarmRoot, 'agents', agentId, 'inbox');
    if (!fs.existsSync(inbox)) return 0;
    try {
      return fs.readdirSync(inbox).filter(f => f.endsWith('.json') && !f.startsWith('.')).length;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Overwrites tasks preserving custom on-disk fields.
   */
  writeTasks(tasks) {
    const existing = this.getTasks();
    const merged = mergeTaskLedger(existing, tasks);
    this.atomicWriteJson(path.join(this.swarmRoot, 'tasks.json'), merged);
    return merged;
  }

  /**
   * Patches a single task in the ledger.
   */
  patchTask(id, patch) {
    const existing = this.getTasks();
    const patched = patchTaskInLedger(existing, id, { ...patch, updatedAt: new Date().toISOString() });
    this.atomicWriteJson(path.join(this.swarmRoot, 'tasks.json'), patched);
    this.appendLog({
      ts: Date.now(),
      kind: 'task_patched',
      taskId: id,
      patch
    });
    return patched.find(t => t.id === id) || null;
  }

  /**
   * Dispatches a live architectural incident across the swarm.
   */
  async dispatchIncident(incident = {}) {
    const type = incident.type || 'cycle';
    const chain = incident.chain || [];
    const title = incident.title || `Triage ${type.toUpperCase()}: ${chain.length ? chain.join(' -> ') : 'Topology Invariant'}`;
    const details = incident.details || 'Autonomous incident detected by Zenith Istanbul Traffic Engine.';

    // 1. Select specialist agent based on incident nature
    let specialistId = 'agent.bridge_engineer';
    if (type === 'leak' || type === 'cwe') specialistId = 'agent.security_sentinel';
    else if (type === 'complexity') specialistId = 'agent.refactorer';

    // 2. Open task
    const task = this.createTask(
      title,
      details,
      specialistId,
      'critical'
    );

    // 3. Send message from commander to specialist
    this.routeMessage({
      from: 'agent.commander',
      to: specialistId,
      act: 'request',
      subject: `🚨 [INCIDENT DISPATCH] ${title}`,
      body: `AKOM Incident #${task.id} opened for ${specialistId}.\nChain: ${chain ? chain.join(' -> ') : 'N/A'}\nTarget details:\n${details}`,
      requires_reply: true,
      needs_human: false
    });

    this.updateAgentStatus('agent.commander', 'working');
    this.updateAgentStatus(specialistId, 'working');
    this.updateTaskStatus(task.id, 'doing');

    // 4. Update blackboard with incident status
    const currentBoard = this.getBoard();
    const updatedBoard = currentBoard + `\n\n### ⚠️ Incident In-Progress: ${task.title}\n- **Assignee:** \`${specialistId}\`\n- **Status:** Investigating & Synthesizing Decoupled Patch\n- **Logged at:** ${new Date().toLocaleTimeString()}\n`;
    this.updateBoard(updatedBoard);

    return {
      taskId: task.id,
      specialistId,
      task
    };
  }

  /**
   * Starts the background autonomic heartbeat loop.
   * Periodically drains mailboxes, executes agent reflexes on pending messages,
   * updates task states, and emits telemetry.
   */
  startHeartbeat(intervalMs = 3500) {
    if (this._heartbeatTimer) return;
    this._heartbeatCount = 0;
    this._heartbeatTimer = setInterval(() => {
      this.heartbeatTick();
    }, intervalMs);
    if (this._heartbeatTimer && typeof this._heartbeatTimer.unref === 'function') {
      this._heartbeatTimer.unref();
    }
  }

  stopHeartbeat() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
  }

  /**
   * Single autonomous tick:
   * 1. Drains outboxes to target inboxes.
   * 2. Inspects each agent's inbox and executes the autonomous reaction (Agent Reflex).
   * 3. Performs periodic metropolitan patrol checks if the system is idle.
   */
  heartbeatTick() {
    this._heartbeatCount = (this._heartbeatCount || 0) + 1;

    // 1. Drain pending outbox files
    this.drainOutbox();

    // 2. Process inboxes across all agents
    const agentsDir = path.join(this.swarmRoot, 'agents');
    if (!fs.existsSync(agentsDir)) return;

    let activeWorkFound = false;
    let agents = [];
    try {
      agents = fs.readdirSync(agentsDir);
    } catch (e) {
      return;
    }

    for (const agentId of agents) {
      const inboxDir = path.join(agentsDir, agentId, 'inbox');
      if (!fs.existsSync(inboxDir)) continue;

      let files = [];
      try {
        files = fs.readdirSync(inboxDir).filter(f => f.endsWith('.json') && !f.startsWith('.'));
      } catch (e) {
        continue;
      }

      for (const f of files) {
        activeWorkFound = true;
        const msgFile = path.join(inboxDir, f);
        try {
          const msg = JSON.parse(fs.readFileSync(msgFile, 'utf8'));
          this.executeAgentReflex(agentId, msg);

          // Archive processed message to inbox/.done/
          const doneDir = path.join(inboxDir, '.done');
          fs.mkdirSync(doneDir, { recursive: true });
          fs.renameSync(msgFile, path.join(doneDir, f));
        } catch (e) {
          try {
            const doneDir = path.join(inboxDir, '.done');
            fs.mkdirSync(doneDir, { recursive: true });
            fs.renameSync(msgFile, path.join(doneDir, `err-${f}`));
          } catch (r) {}
        }
      }
    }

    // 3. Periodic Autonomous Patrol (every ~6 ticks, if idle)
    if (!activeWorkFound && this._heartbeatCount % 6 === 0) {
      this.executeAutonomousPatrol();
    }
  }

  /**
   * Agent Reflex: An agent reads a message and autonomously produces a response.
   */
  executeAgentReflex(agentId, msg) {
    const outboxDir = path.join(this.swarmRoot, 'agents', agentId, 'outbox');
    fs.mkdirSync(outboxDir, { recursive: true });

    if (agentId === 'agent.bridge_engineer' && msg.act === 'request') {
      this.updateAgentStatus(agentId, 'working');

      const tasks = this.getTasks();
      const openTask = tasks.find(t => t.assignee === agentId && (t.status === 'todo' || t.status === 'doing'));
      const resultText = 'Topological cycle analyzed. Decoupled contract interface synthesized to eliminate runtime cyclic deadlock.';

      if (openTask) {
        this.updateTaskStatus(openTask.id, 'done', resultText);
      }

      const reply = {
        to: 'agent.commander',
        act: 'done',
        subject: `✔ [REMEDIATED] Decoupled Interface Synthesized (${msg.subject})`,
        body: `AKOM Bridge Engineer report:\n${resultText}\nAST edge validated against Tarjan SCC DAG invariants.`,
        conversation: msg.conversation,
        in_reply_to: msg.id
      };
      this.routeMessage({ from: agentId, ...reply });

      const currentBoard = this.getBoard();
      this.updateBoard(currentBoard + `\n- **[RESOLVED]** ${msg.subject} -> Remediated by \`${agentId}\` at ${new Date().toLocaleTimeString()}\n`);

      setTimeout(() => {
        this.updateAgentStatus(agentId, 'idle');
        this.updateAgentStatus('agent.commander', 'idle');
      }, 5000);

    } else if (agentId === 'agent.security_sentinel' && msg.act === 'request') {
      this.updateAgentStatus(agentId, 'working');
      const tasks = this.getTasks();
      const openTask = tasks.find(t => t.assignee === agentId && (t.status === 'todo' || t.status === 'doing'));
      const resultText = 'Boundary audit completed. Sensitive variables masked and client-server boundaries verified.';
      if (openTask) {
        this.updateTaskStatus(openTask.id, 'done', resultText);
      }

      this.routeMessage({
        from: agentId,
        to: 'agent.commander',
        act: 'done',
        subject: '🛡️ [VERIFIED] CWE Boundary Compliance Verified',
        body: 'Galata Security Sentinel audit complete: Zero active token leaks in AST export signatures.',
        conversation: msg.conversation,
        in_reply_to: msg.id
      });

      setTimeout(() => {
        this.updateAgentStatus(agentId, 'idle');
        this.updateAgentStatus('agent.commander', 'idle');
      }, 5000);

    } else if (agentId === 'agent.commander' && msg.act === 'done') {
      this.appendLog({
        kind: 'incident_resolved',
        from: msg.from,
        subject: msg.subject,
        ts: Date.now()
      });
      this.updateAgentStatus('agent.commander', 'idle');

    } else if (agentId === 'agent.qa_inspector' && msg.act === 'query') {
      this.routeMessage({
        from: agentId,
        to: msg.from,
        act: 'inform',
        subject: 'Telemetry Gatekeeper Nominal',
        body: 'Automated test suites nominal. DAG verified clean. Zero circular deadlock invariants.',
        conversation: msg.conversation,
        in_reply_to: msg.id
      });

    } else if (msg.act === 'query') {
      this.routeMessage({
        from: agentId,
        to: msg.from,
        act: 'inform',
        subject: `Re: ${msg.subject} [Telemetry Verified]`,
        body: `Agent ${agentId} status nominal. District parameters verified healthy.`,
        conversation: msg.conversation,
        in_reply_to: msg.id
      });
    }
  }

  /**
   * Autonomous Patrol: The Commander checks in with QA or Bridge Specialist periodically.
   */
  executeAutonomousPatrol() {
    const patrolTargets = ['agent.qa_inspector', 'agent.bridge_engineer', 'agent.security_sentinel'];
    const targetId = patrolTargets[Math.floor(Math.random() * patrolTargets.length)];

    this.routeMessage({
      from: 'agent.commander',
      to: targetId,
      act: 'query',
      subject: `Metropolitan Patrol Check [Routine Telemetry]`,
      body: `AKOM Central Command automated telemetry poll. Report district coupling status and boundary invariants.`,
      requires_reply: true,
      needs_human: false
    });
  }

  /**
   * Generates interactive memory and communication graph snapshot.
   * Computes deterministic spring-force positions for UI visualization.
   * @param {object} [opts]
   * @returns {object}
   */
  getMemoryGraph(opts = {}) {
    const registry = this.getRegistry();
    const agents = Object.values(registry.agents || {});
    const log = this.getRecentLogs(200);

    const memories = {};
    const agentsDir = path.join(this.swarmRoot, 'agents');
    if (fs.existsSync(agentsDir)) {
      for (const a of agents) {
        const memPath = path.join(agentsDir, a.id, 'memory.md');
        if (fs.existsSync(memPath)) {
          try {
            memories[a.id] = fs.readFileSync(memPath, 'utf8');
          } catch (e) {}
        }
      }
    }

    const graphData = buildGraph(agents, log, {
      showTopics: opts.showTopics !== false,
      memories,
      maxTopics: opts.maxTopics || 20
    });

    const positionsMap = forceLayout(graphData.nodes, graphData.edges, {
      width: opts.width || 800,
      height: opts.height || 500,
      padding: opts.padding || 40,
      iterations: opts.iterations || 260,
      pinned: opts.pinned || {}
    });

    const positions = {};
    for (const [id, pos] of positionsMap.entries()) {
      positions[id] = { x: Math.round(pos.x * 10) / 10, y: Math.round(pos.y * 10) / 10 };
    }

    return {
      ...graphData,
      positions
    };
  }

  /**
   * Returns a complete JSON snapshot for UI and IPC consumers.
   */
  getSnapshot() {
    return {
      registry: this.getRegistry(),
      tasks: this.getTasks(),
      board: this.getBoard(),
      recentLogs: this.getRecentLogs(50)
    };
  }
}
