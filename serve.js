#!/usr/bin/env node

/**
 * ZenithIstanbul - Telemetry Server Entrypoint
 * Bridges to interactive WebGL & REST telemetry engine with localhost CSRF firewall
 */

export { isAllowedLocalOrigin } from './bin/cli.js';
import './bin/cli.js';
