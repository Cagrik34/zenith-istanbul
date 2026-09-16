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
  return s;
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

  createTask(title, description, assignee = 'agent.commander', priority = 'medium', dependsOn = []) {
    const tasks = this.getTasks();
    const id = `task_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newTask = {
      id,
      title,
      description,
      assignee,
      status: 'todo',
      priority,
      dependsOn,
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
    if (msg.to === 'broadcast') {
      targets = Object.keys(reg.agents).filter(a => a !== msg.from);
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
   * Scans all agent outboxes, delivers pending files to target inboxes,
   * and moves them to .sent/ to prevent reprocessing.
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
          const raw = JSON.parse(fs.readFileSync(full, 'utf8'));
          raw.from = agentId;
          raw.hops = (raw.hops || 0) + 1;
          this.routeMessage(raw);

          const sentDir = path.join(outbox, '.sent');
          fs.mkdirSync(sentDir, { recursive: true });
          fs.renameSync(full, path.join(sentDir, f));
          routedTotal++;
        } catch (e) {
          try {
            const sentDir = path.join(outbox, '.sent');
            fs.mkdirSync(sentDir, { recursive: true });
            fs.renameSync(full, path.join(sentDir, `bad-${f}`));
          } catch (r) {}
        }
      }
    }

    return routedTotal;
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
