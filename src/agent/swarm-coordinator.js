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
import {
  redactSecrets as _redactSecrets,
  repairLiteralLineBreaksInJsonStrings as _repairBreaks,
  selectBroadcastTargets as _selectTargets,
  normalizeMessage as _normalizeMessage,
  routeMessage as _routeMessage,
  drainOutbox as _drainOutbox,
  HOP_CAP
} from './swarm-messaging.js';
import {
  startHeartbeat as _startHeartbeat,
  stopHeartbeat as _stopHeartbeat,
  heartbeatTick as _heartbeatTick,
  executeAgentReflex as _executeAgentReflex,
  executeAutonomousPatrol as _executeAutonomousPatrol
} from './swarm-reflex.js';

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

/**
 * Re-exported from swarm-messaging.js for backward compatibility.
 */
export function redactSecrets(text) { return _redactSecrets(text); }
export function repairLiteralLineBreaksInJsonStrings(raw) { return _repairBreaks(raw); }
export function selectBroadcastTargets(agents, fromId) { return _selectTargets(agents, fromId); }

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
   * Delegates to swarm-messaging.js.
   */
  normalizeMessage(partial, from = 'system') {
    return _normalizeMessage(partial, from);
  }

  /**
   * Routes a message into the recipient agent's inbox folder.
   * Delegates to swarm-messaging.js.
   */
  routeMessage(rawMsg) {
    return _routeMessage(this, rawMsg);
  }

  /**
   * Scans all agent outboxes, repairs literal line breaks, delivers pending
   * files to target inboxes, and quarantines malformed files safely.
   * Delegates to swarm-messaging.js.
   */
  drainOutbox() {
    return _drainOutbox(this);
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
   * Delegates to swarm-reflex.js.
   */
  startHeartbeat(intervalMs = 3500) {
    _startHeartbeat(this, intervalMs);
  }

  stopHeartbeat() {
    _stopHeartbeat(this);
  }

  /**
   * Single autonomous tick. Delegates to swarm-reflex.js.
   */
  heartbeatTick() {
    _heartbeatTick(this);
  }

  /**
   * Agent Reflex: Delegates to swarm-reflex.js.
   */
  executeAgentReflex(agentId, msg) {
    _executeAgentReflex(this, agentId, msg);
  }

  /**
   * Autonomous Patrol: Delegates to swarm-reflex.js.
   */
  executeAutonomousPatrol() {
    _executeAutonomousPatrol(this);
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
