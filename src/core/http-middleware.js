/**
 * ZenithIstanbul - HTTP Security Middleware & Request Utilities
 * Body size enforcement, CSRF origin validation, CORS policy, and MIME type mapping.
 * Extracted from cli.js to isolate security primitives into a testable module.
 */

/**
 * Maximum allowed request body size in bytes (2 MiB).
 * Protects against memory exhaustion from oversized payloads.
 */
export const MAX_BODY_BYTES = 2 * 1024 * 1024;

/**
 * Static file MIME type mapping for the local telemetry server.
 */
export const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

/**
 * Reads the full request body up to a byte limit.
 * Destroys the socket and rejects if the payload exceeds maxBytes.
 *
 * @param {Object} req
 * @param {number} [maxBytes=MAX_BODY_BYTES]
 * @returns {Promise<string>} Resolved body string, or rejection on oversize / error.
 */
export function readBodyWithLimit(req, maxBytes = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytes = 0;

    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        req.destroy();
        reject(new Error('PAYLOAD_TOO_LARGE'));
        return;
      }
      body += chunk;
    });

    req.on('end', () => resolve(body));

    req.on('error', (err) => reject(err));
  });
}

/**
 * Strict Localhost CSRF Firewall.
 * Validates Origin and Referer headers via URL parsing, enforcing that
 * only localhost / 127.0.0.1 origins are permitted for mutation endpoints.
 * Also rejects cross-site Sec-Fetch-Site headers.
 *
 * @param {Object} req
 * @returns {boolean} true if the request originates from localhost.
 */
export function isAllowedLocalOrigin(req) {
  const origin = req.headers['origin'];
  const referer = req.headers['referer'];

  if (origin) {
    try {
      const parsed = new URL(origin);
      if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== '[::1]') {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  if (referer) {
    try {
      const parsed = new URL(referer);
      if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== '[::1]') {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  const secFetchSite = req.headers['sec-fetch-site'];
  if (secFetchSite && secFetchSite === 'cross-site') {
    return false;
  }

  return true;
}

/**
 * Sets standard CORS response headers based on origin validation.
 * Uses the request Origin when it passes localhost validation;
 * falls back to the explicit localhost address otherwise.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {number} port - Local server port for fallback origin.
 */
export function setCorsHeaders(req, res, port) {
  const originHeader = req.headers['origin'];
  if (originHeader && isAllowedLocalOrigin(req)) {
    res.setHeader('Access-Control-Allow-Origin', originHeader);
  } else {
    res.setHeader('Access-Control-Allow-Origin', `http://localhost:${port}`);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Sends a JSON error response for oversized payloads.
 *
 * @param {Object} res
 */
export function sendPayloadTooLarge(res) {
  if (!res.headersSent) {
    res.writeHead(413, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Payload Too Large' }));
  }
}

/**
 * Sends a 403 Forbidden JSON response for CSRF violations.
 *
 * @param {Object} res
 * @param {string} [detail='Forbidden: CSRF Origin/Referer check failed. External cross-origin request blocked.']
 */
export function sendCsrfForbidden(res, detail) {
  res.writeHead(403, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    error: detail || 'Forbidden: CSRF Origin/Referer check failed. External cross-origin request blocked.'
  }));
}
