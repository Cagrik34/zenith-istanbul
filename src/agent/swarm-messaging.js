/**
 * ZenithIstanbul - Swarm Messaging Router
 * FIPA-lite asynchronous message passing, outbox drainage, and secret redaction.
 * Extracted from SwarmCoordinator to isolate inter-agent communication concerns.
 *
 * All functions operate on a SwarmCoordinator instance via delegation.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Maximum message hops before quarantine.
 * Prevents infinite ping-pong between agents.
 */
export const HOP_CAP = 12;

/**
 * 5-Tier Cryptographic Secret Redaction Battery.
 * Strips private keys, JWTs, cloud API keys, bearer tokens, and named credential pairs.
 *
 * @param {string} text
 * @returns {string}
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
 * Prevents JSON.parse failures when multi-line LLM diffs are published.
 *
 * @param {string} raw
 * @returns {{ text: string, changed: boolean }}
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
 *
 * @param {Object} agents - Registry agents map.
 * @param {string} fromId - Sender agent ID to exclude.
 * @returns {string[]}
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
 * Normalizes a partial message payload into a complete FIPA-lite envelope.
 *
 * @param {Object} partial - Partial message fields.
 * @param {string} [from='system'] - Sender agent ID.
 * @returns {Object} Normalized message.
 */
export function normalizeMessage(partial, from = 'system') {
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
 *
 * @param {Object} coordinator SwarmCoordinator instance
 * @param {Object} rawMsg - Raw message to route.
 * @returns {boolean} true if delivered to at least one target.
 */
export function routeMessage(coordinator, rawMsg) {
  const msg = normalizeMessage(rawMsg, rawMsg.from);

  if (msg.hops > HOP_CAP) {
    coordinator.appendLog({
      kind: 'drop',
      reason: 'hop_cap_exceeded',
      id: msg.id,
      from: msg.from,
      to: msg.to
    });
    return false;
  }

  const reg = coordinator.getRegistry();
  const commanderId = reg.commanderId || 'agent.commander';
  const resolveTarget = t => (t === 'commander' || t === 'god' ? commanderId : t);

  let targets = [];
  if (msg.to === 'broadcast' || msg.to === 'all') {
    targets = selectBroadcastTargets(reg.agents, msg.from);
  } else {
    const resolved = resolveTarget(msg.to);
    if (resolved !== msg.from) targets = [resolved];
  }

  const agentsDir = path.join(coordinator.swarmRoot, 'agents');
  let deliveredCount = 0;

  for (const targetId of targets) {
    const targetInbox = path.join(agentsDir, targetId, 'inbox');
    if (fs.existsSync(targetInbox)) {
      const filePath = path.join(targetInbox, `${msg.created_at.replace(/[:.]/g, '-')}-${msg.id}.json`);
      coordinator.atomicWriteJson(filePath, msg);
      deliveredCount++;
    }
  }

  coordinator.appendLog({
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
 * files to target inboxes, and quarantines malformed files.
 *
 * @param {Object} coordinator SwarmCoordinator instance
 * @returns {number} Total messages routed.
 */
export function drainOutbox(coordinator) {
  const agentsDir = path.join(coordinator.swarmRoot, 'agents');
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
        routeMessage(coordinator, raw);

        const sentDir = path.join(outbox, '.sent');
        fs.mkdirSync(sentDir, { recursive: true });
        fs.renameSync(full, path.join(sentDir, f));
        routedTotal++;
      } catch (e) {
        try {
          const malformedDir = path.join(outbox, '.malformed');
          fs.mkdirSync(malformedDir, { recursive: true });
          fs.renameSync(full, path.join(malformedDir, f));
          coordinator.appendLog({
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
