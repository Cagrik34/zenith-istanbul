import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SwarmCoordinator, redactSecrets } from '../src/agent/swarm-coordinator.js';

test('SwarmCoordinator - Workspace initialization creates core files and agent rosters', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenith-swarm-test-'));
  try {
    const coordinator = new SwarmCoordinator(tmpDir);

    const swarmRoot = path.join(tmpDir, '.zenith', 'swarm');
    assert.ok(fs.existsSync(swarmRoot));
    assert.ok(fs.existsSync(path.join(swarmRoot, 'registry.json')));
    assert.ok(fs.existsSync(path.join(swarmRoot, 'board.md')));
    assert.ok(fs.existsSync(path.join(swarmRoot, 'tasks.json')));

    const registry = coordinator.getRegistry();
    assert.equal(registry.commanderId, 'agent.commander');
    assert.ok(registry.agents['agent.commander']);
    assert.ok(registry.agents['agent.bridge_engineer']);
    assert.ok(registry.agents['agent.security_sentinel']);
    assert.ok(registry.agents['agent.refactorer']);
    assert.ok(registry.agents['agent.qa_inspector']);

    // Check that agent workspaces and inboxes are created
    const bridgeInbox = path.join(swarmRoot, 'agents', 'agent.bridge_engineer', 'inbox');
    assert.ok(fs.existsSync(bridgeInbox));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('SwarmCoordinator - Secret redaction strips sensitive tokens', () => {
  const samplePEM = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y123456789...
-----END RSA PRIVATE KEY-----`;
  const sampleJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const sampleApiKey = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890';
  const sampleBearer = 'Bearer ya29.a0AfH6SMA...';

  assert.ok(redactSecrets(samplePEM).includes('[REDACTED_PRIVATE_KEY]'));
  assert.ok(redactSecrets(sampleJWT).includes('[REDACTED_JWT]'));
  assert.ok(redactSecrets(sampleApiKey).includes('[REDACTED_API_KEY]'));
  assert.ok(redactSecrets(sampleBearer).includes('[REDACTED_TOKEN]'));
});

test('SwarmCoordinator - Message routing delivers to target inbox and drains outbox', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenith-swarm-test-'));
  try {
    const coordinator = new SwarmCoordinator(tmpDir);

    // 1. Direct message routing
    const sent = coordinator.routeMessage({
      from: 'agent.commander',
      to: 'agent.bridge_engineer',
      act: 'request',
      subject: 'Resolve Bosphorus Bridge Cycle',
      body: 'Please decouple auth.ts and user.ts with contract.'
    });
    assert.ok(sent);

    const bridgeInbox = path.join(tmpDir, '.zenith', 'swarm', 'agents', 'agent.bridge_engineer', 'inbox');
    const inboxFiles = fs.readdirSync(bridgeInbox).filter(f => f.endsWith('.json'));
    assert.equal(inboxFiles.length, 1);

    const receivedMsg = JSON.parse(fs.readFileSync(path.join(bridgeInbox, inboxFiles[0]), 'utf8'));
    assert.equal(receivedMsg.from, 'agent.commander');
    assert.equal(receivedMsg.to, 'agent.bridge_engineer');
    assert.equal(receivedMsg.act, 'request');

    // 2. Outbox draining
    const bridgeOutbox = path.join(tmpDir, '.zenith', 'swarm', 'agents', 'agent.bridge_engineer', 'outbox');
    const replyMsg = {
      to: 'agent.commander',
      act: 'done',
      subject: 'Decoupled Contract Ready',
      body: 'Contract patch synthesized.'
    };
    fs.writeFileSync(path.join(bridgeOutbox, 'msg_001.json'), JSON.stringify(replyMsg), 'utf8');

    const routedCount = coordinator.drainOutbox();
    assert.equal(routedCount, 1);

    // Verify outbox was archived
    assert.equal(fs.readdirSync(bridgeOutbox).filter(f => f.endsWith('.json')).length, 0);

    // Verify commander received it
    const commanderInbox = path.join(tmpDir, '.zenith', 'swarm', 'agents', 'agent.commander', 'inbox');
    const commanderFiles = fs.readdirSync(commanderInbox).filter(f => f.endsWith('.json'));
    assert.equal(commanderFiles.length, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('SwarmCoordinator - Hop cap guards against runaway message ping-pong', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenith-swarm-test-'));
  try {
    const coordinator = new SwarmCoordinator(tmpDir);

    const dropped = coordinator.routeMessage({
      from: 'agent.refactorer',
      to: 'agent.commander',
      act: 'inform',
      subject: 'Runaway Ping Pong',
      body: 'Loop test',
      hops: 15
    });

    assert.equal(dropped, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('SwarmCoordinator - Task lifecycle and incident triage dispatch', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenith-swarm-test-'));
  try {
    const coordinator = new SwarmCoordinator(tmpDir);

    // Task creation and updates
    const task = coordinator.createTask('De-duplicate auth token', 'Refactor token generation', 'agent.refactorer', 'high');
    assert.equal(task.status, 'todo');

    const updated = coordinator.updateTaskStatus(task.id, 'doing');
    assert.equal(updated.status, 'doing');

    coordinator.updateTaskStatus(task.id, 'done', 'Refactored successfully');
    const tasks = coordinator.getTasks();
    assert.equal(tasks[0].status, 'done');
    assert.equal(tasks[0].result, 'Refactored successfully');

    // Incident dispatch
    const incidentRes = await coordinator.dispatchIncident({
      type: 'cycle',
      chain: ['src/services/auth.ts', 'src/services/user.ts'],
      title: 'Cyclic Jam on Bosphorus Link',
      details: 'Tarjan SCC detected 2-node cycle.'
    });

    assert.equal(incidentRes.specialistId, 'agent.bridge_engineer');
    assert.equal(coordinator.getRegistry().agents['agent.bridge_engineer'].status, 'working');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
