import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

let DatabaseSync = null;
try {
  const majorVersion = parseInt(process.versions.node.split('.')[0], 10);
  const hasNativeSqlite = majorVersion >= 22;
  if (hasNativeSqlite) {
    const sqliteModule = await import('node:sqlite');
    DatabaseSync = sqliteModule.DatabaseSync || null;
  }
} catch (e) {
  DatabaseSync = null;
}

/**
 * ZenithIstanbul - Zero-Dependency Local-First Telemetry Store
 * Persists architecture drift and time-series health metrics in .zenith/
 * Uses Node.js 22+ node:sqlite when available, with automatic append-only JSONL fallback.
 */
export class HistoryStore {
  constructor(targetDir = process.cwd()) {
    this.targetDir = path.resolve(targetDir);
    this.zenithDir = path.join(this.targetDir, '.zenith');
    this.dbPath = path.join(this.zenithDir, 'telemetry.db');
    this.jsonlPath = path.join(this.zenithDir, 'telemetry.jsonl');
    this.db = null;
    this.useSqlite = false;

    this.ensureDirectory();
    this.initStore();
  }

  ensureDirectory() {
    try {
      if (!fs.existsSync(this.zenithDir)) {
        fs.mkdirSync(this.zenithDir, { recursive: true });
      }
    } catch (e) {}
  }

  initStore() {
    if (DatabaseSync) {
      try {
        this.db = new DatabaseSync(this.dbPath);
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS telemetry (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            gitCommit TEXT NOT NULL,
            trafficIndex INTEGER NOT NULL,
            cyclicDeadlocks INTEGER NOT NULL,
            securityExposures INTEGER NOT NULL,
            isolatedModules INTEGER NOT NULL,
            totalModules INTEGER NOT NULL,
            totalEdges INTEGER NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp);
        `);
        this.useSqlite = true;
        return;
      } catch (err) {
        this.useSqlite = false;
        this.db = null;
      }
    }

    try {
      if (!fs.existsSync(this.jsonlPath)) {
        fs.writeFileSync(this.jsonlPath, '', 'utf8');
      }
    } catch (e) {}
  }

  getGitCommit() {
    try {
      const commit = execSync('git rev-parse --short HEAD', {
        cwd: this.targetDir,
        timeout: 1000,
        stdio: ['ignore', 'pipe', 'ignore']
      }).toString().trim();
      return commit || 'HEAD';
    } catch (e) {
      return 'HEAD';
    }
  }

  /**
   * Persists a scan snapshot to .zenith/
   * @param {Object} metrics 
   * @returns {Object} persisted record
   */
  recordScan(metrics = {}) {
    this.ensureDirectory();
    const gitCommit = metrics.gitCommit || this.getGitCommit();
    const timestamp = metrics.timestamp || new Date().toISOString();
    const hash = Math.random().toString(36).substring(2, 8);
    const id = metrics.id || `scan_${Date.now()}_${hash}`;

    const record = {
      id,
      timestamp,
      gitCommit,
      trafficIndex: Math.round(metrics.trafficIndex || 0),
      cyclicDeadlocks: Math.round(metrics.cyclicDeadlocks || 0),
      securityExposures: Math.round(metrics.securityExposures || 0),
      isolatedModules: Math.round(metrics.isolatedModules || 0),
      totalModules: Math.round(metrics.totalModules || 0),
      totalEdges: Math.round(metrics.totalEdges || 0)
    };

    if (this.useSqlite && this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO telemetry 
          (id, timestamp, gitCommit, trafficIndex, cyclicDeadlocks, securityExposures, isolatedModules, totalModules, totalEdges)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          record.id,
          record.timestamp,
          record.gitCommit,
          record.trafficIndex,
          record.cyclicDeadlocks,
          record.securityExposures,
          record.isolatedModules,
          record.totalModules,
          record.totalEdges
        );
        this.appendJsonl(record);
      } catch (e) {
        this.appendJsonl(record);
      }
    } else {
      this.appendJsonl(record);
    }

    return record;
  }

  appendJsonl(record) {
    try {
      fs.appendFileSync(this.jsonlPath, JSON.stringify(record) + '\n', 'utf8');
    } catch (e) {}
  }

  /**
   * Retrieves last N scans chronologically (oldest to newest)
   * @param {number} limit 
   * @returns {Array} array of telemetry records
   */
  getHistory(limit = 30) {
    this.ensureDirectory();
    let records = [];

    if (this.useSqlite && this.db) {
      try {
        const latestStmt = this.db.prepare(`
          SELECT id, timestamp, gitCommit, trafficIndex, cyclicDeadlocks, securityExposures, isolatedModules, totalModules, totalEdges
          FROM (
            SELECT * FROM telemetry ORDER BY timestamp DESC LIMIT ?
          ) ORDER BY timestamp ASC
        `);
        records = latestStmt.all(limit);
        if (records && records.length > 0) {
          return records;
        }
      } catch (e) {}
    }

    try {
      if (fs.existsSync(this.jsonlPath)) {
        const content = fs.readFileSync(this.jsonlPath, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);
        const parsed = [];
        for (const line of lines) {
          try {
            parsed.push(JSON.parse(line));
          } catch (e) {}
        }
        records = parsed.slice(-limit);
      }
    } catch (e) {}

    return records;
  }
}
