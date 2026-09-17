# AKOM Autonomous SRE Swarm Architecture

> **Local-First, Multi-Agent System (MAS) with FIPA-Lite Asynchronous Message Passing, Shared Blackboard, and Invariant-Preserving Task Ledger**

Zenith Istanbul embeds an autonomous Site Reliability Engineering (SRE) multi-agent swarm modeled after disaster coordination centers (AKOM). The swarm operates directly on the local filesystem with zero external cloud runtime dependencies, coordinating five specialized autonomous agents to detect, isolate, and remediate architectural anomalies.

---

## 1. Architectural Principles

1. **Local-First & Git-Aligned**: All state resides in plain, human-readable files under `.zenith/swarm/`. The filesystem is the single source of truth.
2. **Single-Writer-Per-File**: Each agent exclusively writes within its dedicated workspace (`agents/<agentId>/outbox/`). Cross-agent communication is mediated by the atomic coordinator router moving files from sender outboxes to recipient inboxes.
3. **FIPA-Lite Speech Acts**: Structured communication drops LISP syntax in favor of typed JSON envelopes utilizing standardized communicative acts (`request`, `inform`, `query`, `propose`, `agree`, `refuse`, `done`).
4. **Anti-Livelock Invariants**:
   - Every reply increments a `hops` counter. Hops exceeding `HOP_CAP = 12` are quarantined to prevent recursive feedback loops.
   - Only `request`, `query`, and `propose` obligate a response; `inform` and `done` acts are terminal.
5. **5-Tier Cryptographic Secret Redaction**: All inter-agent traffic is sanitized before serialization and persistence, stripping private keys, JWTs, cloud API keys, Bearer tokens, and sensitive key-value pairs.
6. **Non-Destructive Task Ledger Merging**: Modifying or updating cards preserves arbitrary on-disk metadata (`deliverable`, `notes`, `scope`, `diff`, `stats`) through atomic shallow folding.

---

## 2. On-Disk Swarm Layout

State is structured under `.zenith/swarm/`:

```
.zenith/swarm/
├── registry.json             # Agent roster: IDs, roles, specialties, status, colors
├── board.md                  # Shared blackboard: global architectural state & incident log
├── tasks.json                # Task ledger: IDs (AKOM-101), assignees, status, dependencies
├── log.jsonl                 # Append-only immutable event telemetry feed
└── agents/
    ├── agent.commander/      # AKOM Başkomutanı (Chief Orchestrator)
    │   ├── identity.md       # Agent role prompt and capability boundary
    │   ├── memory.md         # Persistent long-term memory stream
    │   ├── inbox/            # Incoming messages (<timestamp>-<id>.json)
    │   │   └── .done/        # Processed message audit archive
    │   └── outbox/           # Outgoing messages waiting for coordinator drainage
    │       ├── .sent/        # Successfully delivered messages
    │       └── .malformed/   # Quarantined unparseable payloads
    ├── agent.bridge_engineer/ # Boğaz Köprüsü Mühendisi (Tarjan SCC Decoupler)
    ├── agent.security_sentinel/# Galata Güvenlik Gözcüsü (MITRE CWE Sentinel)
    ├── agent.refactorer/     # Tarihi Yarımada Mimarı (Complexity Refactorer)
    └── agent.qa_inspector/   # Kadıköy İskele Denetçisi (CI Gatekeeper Inspector)
```

---

## 3. FIPA-Lite Message Specification

Every message exchanged across the swarm conforms to the following schema:

```json
{
  "id": "2026-09-17T02-45-10-123Z-a1b2",
  "conversation": "conv-cycle-resolution",
  "in_reply_to": "2026-09-17T02-45-08-001Z-c3d4",
  "from": "agent.commander",
  "to": "agent.bridge_engineer",
  "act": "request",
  "subject": "Decouple Circular Dependency [auth.ts <-> userService.ts]",
  "body": "Analyze AST edges and synthesize contract interface.",
  "hops": 1,
  "requires_reply": true,
  "created_at": "2026-09-17T02:45:10.123Z"
}
```

### Supported Speech Acts
- `request`: Tasks or directives requiring action from the recipient.
- `inform`: Telemetry updates, status announcements, or findings (terminal).
- `query`: Inquiries requesting specific state or analysis.
- `propose`: Suggested refactoring patches or architectural migrations.
- `agree`: Acceptance of a proposed task or specification.
- `refuse`: Rejection of an action due to boundary or policy violation.
- `done`: Confirmation of task completion accompanied by verification evidence (terminal).

---

## 4. Resilience & Lexical Recovery

### Literal Line-Break Repair (`repairLiteralLineBreaksInJsonStrings`)
Large language models (LLMs) and CLI subprocesses occasionally output unescaped newline characters inside multi-line diff strings. Zenith Istanbul passes all raw outbox payloads through a lexical scanner that transforms unescaped literal line breaks (`\r`, `\n`) into valid escape sequences (`\r`, `\n`) prior to JSON parsing, preventing parse aborts.

### Malformed Outbox Quarantine (`outbox/.malformed/`)
If an outbox file cannot be decoded even after lexical repair, the coordinator moves it into `outbox/.malformed/` with an audit entry in `log.jsonl`, ensuring the router loop continues serving remaining valid messages without choking.

### Broadcast Fan-Out (`selectBroadcastTargets`)
Messages addressed to `broadcast` or `all` dynamically target all registered agents, excluding the sender itself and archived/offline agents.

### Task Ledger Protection (`mergeTaskLedger` & `patchTaskInLedger`)
When agents or the web UI serialize updates to `tasks.json`, unknown or backend-specific keys (`deliverable`, `notes`, `gitHunk`, `diff`) are retained byte-identically through two-way map folding, eliminating accidental field deletion.

---

## 5. Autonomic Heartbeat & Reflex Loop

The coordinator operates a recurring heartbeat timer (`intervalMs = 3000`):

1. **Outbox Drainage**: Sweeps all agent outboxes, repairs line breaks, and atomically delivers payloads into recipient inboxes.
2. **Agent Reflex Execution**: Inspects inboxes for actionable messages:
   - Sets agent status to `working`.
   - Synthesizes non-breaking decoupling contracts or masks security leaks.
   - Dispatches a `done` reply to the commander.
   - Updates `board.md` and appends telemetry logs to `log.jsonl`.
   - Transitions agent back to `idle` (Standby) after a visible observation window.
3. **Metropolitan Patrol Checks**: If no incident is active, the commander periodically queries specialists to ensure memory synchrony and boundary health.
