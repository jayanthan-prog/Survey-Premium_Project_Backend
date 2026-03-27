"use strict";
const { Op } = require('sequelize');
const { normalizeRole, resolveUserRoles } = require('../utils/authRoles');

// --- NEW: KILL SWITCH STORAGE ---
// Using a Set for high-performance lookups
const disabledRoutes = new Set();

// Request logger
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
}

function sanitizePayload(input, depth = 0) {
  if (depth > 3) return '[truncated]';
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.slice(0, 20).map((item) => sanitizePayload(item, depth + 1));
  if (typeof input !== 'object') return input;

  const out = {};
  for (const [key, value] of Object.entries(input)) {
    const lowered = String(key || '').toLowerCase();
    if (lowered.includes('password') || lowered.includes('token') || lowered.includes('credential') || lowered.includes('secret')) {
      out[key] = '[redacted]';
    } else {
      out[key] = sanitizePayload(value, depth + 1);
    }
  }
  return out;
}

function getModuleFromPath(path = '') {
  const normalized = String(path || '').split('?')[0];
  const parts = normalized.split('/').filter(Boolean);
  if (!parts.length) return 'SYSTEM';
  if (parts[0] === 'api' && parts[1]) return String(parts[1]).toUpperCase();
  return String(parts[0]).toUpperCase();
}

function getEntityId(req) {
  const pathId = Number(req?.params?.id);
  if (Number.isFinite(pathId)) return pathId;

  const body = req && req.body && typeof req.body === 'object' ? req.body : {};
  const keys = ['id', 'user_id', 'survey_id', 'release_id', 'approval_item_id', 'allocation_task_id', 'action_plan_id'];
  for (const key of keys) {
    const numeric = Number(body[key]);
    if (Number.isFinite(numeric)) return numeric;
  }

  return null;
}

function getClientIpAddress(req) {
  const normalizeIp = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;

    const withoutPort = raw.startsWith('[')
      ? raw.replace(/^\[|\]$/g, '')
      : raw.replace(/:\d+$/, '');

    return withoutPort.replace(/^::ffff:/i, '');
  };

  const forwarded = req && req.headers ? req.headers['x-forwarded-for'] : null;
  if (forwarded) {
    const first = String(forwarded)
      .split(',')
      .map((value) => value.trim())
      .find(Boolean);
    if (first) return normalizeIp(first);
  }

  const realIp = req && req.headers ? req.headers['x-real-ip'] : null;
  if (realIp && String(realIp).trim()) {
    return normalizeIp(realIp);
  }

  const clientPublicIp = req && req.headers ? req.headers['x-client-public-ip'] : null;
  if (clientPublicIp && String(clientPublicIp).trim()) {
    return normalizeIp(clientPublicIp);
  }

  return normalizeIp((req && (req.ip || (req.socket && req.socket.remoteAddress))) || null);
}

async function createAuditLogSafe(AuditLog, db, payload) {
  try {
    await AuditLog.create(payload);
    return;
  } catch (err) {
    const message = String(err && err.message ? err.message : '');
    const needsManualId = message.includes("audit_log_id") && message.toLowerCase().includes('default value');
    if (!needsManualId) {
      throw err;
    }

    const [rows] = await db.sequelize.query('SELECT COALESCE(MAX(audit_log_id), 0) + 1 AS nextValue FROM audit_logs');
    const nextAuditLogId = Number(rows && rows[0] ? rows[0].nextValue : 1);

    await AuditLog.create({
      ...payload,
      audit_log_id: nextAuditLogId,
    });
  }
}


function mapHttpAction(method) {
  const value = String(method || '').toUpperCase();
  if (value === 'GET') return 'READ';
  if (value === 'POST') return 'CREATE';
  if (value === 'PUT' || value === 'PATCH') return 'UPDATE';
  if (value === 'DELETE') return 'DELETE';
  return value;
}

function getActionDescription(method, path) {
  const pathLower = String(path || '').toLowerCase();
  const methodUpper = String(method || '').toUpperCase();

  const verbs = {
    READ: 'viewed',
    CREATE: 'created',
    UPDATE: 'updated',
    DELETE: 'deleted',
  };

  const methodAction = mapHttpAction(methodUpper);
  const actionVerb = verbs[methodAction] || methodAction.toLowerCase();

  // Authentication
  if (pathLower.includes('/auth/login')) return 'User logged in';
  if (pathLower.includes('/auth/logout')) return 'User logged out';
  if (pathLower.includes('/auth/register') || pathLower.includes('/auth/signup')) return 'User registered';
  if (pathLower.includes('/auth/change-password') || pathLower.includes('/change-password')) return 'User changed password';

  // Frequent explicit workflow actions
  if (pathLower.includes('/publish')) return 'Survey published';
  if (pathLower.includes('/unpublish')) return 'Survey unpublished';
  if (pathLower.includes('/archive')) return 'Survey archived';
  if (pathLower.includes('/freeze')) return 'Entity frozen';
  if (pathLower.includes('/unfreeze') || pathLower.includes('/resume')) return 'Entity resumed';
  if (pathLower.includes('/approve')) return 'Item approved';
  if (pathLower.includes('/reject')) return 'Item rejected';
  if (pathLower.includes('/assign')) return 'Assignment updated';

  // CRUD labels for major modules requested by user
  if (pathLower.includes('/users')) return `User ${actionVerb}`;
  if (pathLower.includes('/groups')) return `Group ${actionVerb}`;
  if (pathLower.includes('/group-members')) return `Group member ${actionVerb}`;
  if (pathLower.includes('/surveys')) return `Survey ${actionVerb}`;
  if (pathLower.includes('/survey-releases')) return `Survey release ${actionVerb}`;
  if (pathLower.includes('/survey-questions')) return `Survey question ${actionVerb}`;
  if (pathLower.includes('/survey_options') || pathLower.includes('/survey-options')) return `Survey option ${actionVerb}`;
  if (pathLower.includes('/survey_answers') || pathLower.includes('/survey-answers')) return `Survey answer ${actionVerb}`;
  if (pathLower.includes('/survey_participants') || pathLower.includes('/survey-participants')) return `Survey participant ${actionVerb}`;

  // Other modules
  if (pathLower.includes('/roles')) return `Role ${actionVerb}`;
  if (pathLower.includes('/permissions')) return `Permission ${actionVerb}`;
  if (pathLower.includes('/user-roles')) return `User role ${actionVerb}`;
  if (pathLower.includes('/action-plans')) return `Action plan ${actionVerb}`;
  if (pathLower.includes('/action-plan-items')) return `Action plan item ${actionVerb}`;
  if (pathLower.includes('/approvals')) return `Approval ${actionVerb}`;
  if (pathLower.includes('/calendar-slots')) return `Calendar slot ${actionVerb}`;
  if (pathLower.includes('/slot-bookings')) return `Slot booking ${actionVerb}`;
  if (pathLower.includes('/notifications')) return `Notification ${actionVerb}`;
  if (pathLower.includes('/allocations')) return `Allocation ${actionVerb}`;

  return `${methodAction} operation`;
}
function createAuditTrail() {
  return (req, res, next) => {
    const startedAt = Date.now();
    const method = String(req.method || 'GET').toUpperCase();
    const originalUrl = String(req.originalUrl || req.url || '');
    const pathOnly = originalUrl.split('?')[0];

    // Avoid noisy self-auditing endpoints.
    if (pathOnly.startsWith('/api/audit-logs') || pathOnly.startsWith('/api/docs')) {
      return next();
    }

    // Log only write operations (CREATE/UPDATE/DELETE).
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next();
    }

    const requestBody = sanitizePayload(req.body);
    const query = sanitizePayload(req.query || {});


    res.on('finish', async () => {
      try {
        const db = require('../models');
        const AuditLog = db.AuditLog;
        if (!AuditLog) return;

        const moduleName = getModuleFromPath(pathOnly);
        const statusCode = Number(res.statusCode || 0);
        const outcome = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARNING' : 'SUCCESS';
        const actionDescription = getActionDescription(method, pathOnly);
        const httpAction = mapHttpAction(method);

        await createAuditLogSafe(AuditLog, db, {
          actor_user_id: Number(req.userId) || null,
          entity_type: moduleName,
          entity_id: getEntityId(req),
          action: httpAction,
          old_value: null,
          new_value: {
            module: moduleName,
            method,
            path: pathOnly,
            query,
            request_body: requestBody,
            status_code: statusCode,
            outcome,
            response_time_ms: Date.now() - startedAt,
            description: actionDescription,
            timestamp: new Date().toISOString(),
          },
          ip_address: getClientIpAddress(req),
          user_agent: req.headers['user-agent'] || null,
        });
      } catch (err) {
        // Never block API response on audit failures.
        console.error('[audit] failed to persist audit log', err && (err.message || err));
      }
    });
    next();
  };
}

const featureFlags = require('../featureFlags');

// --- NEW: API GATEKEEPER MIDDLEWARE ---
function apiGatekeeper(req, res, next) {
  // Check if the current path is in our disabled list
  // We use req.originalUrl to match the paths defined in the dashboard (e.g., /api/users)
  const path = req.originalUrl.split('?')[0]; // Ignore query strings

  // If the route was toggled off in-memory or persisted as disabled, block it
  // Support prefix matching so disabling '/api/users' disables '/api/users/123' too.
  const inMemoryDisabled = Array.from(disabledRoutes).some(d => d === path || (d.length > 1 && path.startsWith(d)));

  let persistedDisabled = false;
  if (featureFlags && typeof featureFlags.isEnabled === 'function') {
    // Use isEnabled which respects persisted flags and defaults to true
    const isEnabled = featureFlags.isEnabled(path);
    persistedDisabled = !isEnabled;
    console.log(`[ApiGatekeeper] Path: ${path}, isEnabled: ${isEnabled}, persistedDisabled: ${persistedDisabled}`);
  } else if (featureFlags && typeof featureFlags.getFlags === 'function') {
    // Fallback to legacy method
    const flags = featureFlags.getFlags() || {};
    // Check exact key first, then any prefix keys that are explicitly false
    if (Object.prototype.hasOwnProperty.call(flags, path)) {
      persistedDisabled = !flags[path];
    } else {
      persistedDisabled = Object.keys(flags).some(k => {
        return k && k.length > 1 && path.startsWith(k) && flags[k] === false;
      });
    }
  }

  if (inMemoryDisabled || persistedDisabled) {
    console.log(`[ApiGatekeeper] Blocking: ${path} (inMemoryDisabled: ${inMemoryDisabled}, persistedDisabled: ${persistedDisabled})`);
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'This endpoint is temporarily disabled for maintenance.'
    });
  }
  next();
}

// Helper functions for the admin routes to communicate with this middleware
const apiControl = {
  toggle: (path, isOff) => {
    if (isOff) disabledRoutes.add(path);
    else disabledRoutes.delete(path);
  },
  getDisabled: () => Array.from(disabledRoutes)
};

// Auth middleware - check Authorization: Bearer <token>
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.slice(7).trim();
    const db = require('../models');
    const AuthToken = db.AuthToken || db.Auth_Token;
    const User = db.User;
    if (!AuthToken) return res.status(500).json({ error: 'AuthToken model not found' });

    const authToken = await AuthToken.findOne({
      where: {
        token_hash: token,
        revoked_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
    });
    if (!authToken) return res.status(401).json({ error: 'Invalid or expired token' });

    const tokenUser = User ? await User.findByPk(authToken.user_id, { attributes: ['user_id', 'is_active'] }) : null;
    if (!tokenUser || tokenUser.is_active === false) {
      return res.status(403).json({ error: 'Account is inactive. Contact an administrator.' });
    }

    req.userId = authToken.user_id;
    req.authToken = authToken;

    // Attach roles once to avoid duplicate queries in downstream handlers.
    req.userRoles = await resolveUserRoles(authToken.user_id);
    next();
  } catch (err) {
    next(err);
  }
}

function requireAnyRole(allowedRoles = []) {
  const normalizedAllowed = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles])
    .map(normalizeRole)
    .filter(Boolean);

  return async function roleGuard(req, res, next) {
    try {
      if (!req.userId && req.userId !== 0) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const assignedRoles = Array.isArray(req.userRoles) && req.userRoles.length
        ? req.userRoles.map(normalizeRole).filter(Boolean)
        : await resolveUserRoles(req.userId);

      req.userRoles = assignedRoles;

      if (!normalizedAllowed.length) return next();

      const isAllowed = assignedRoles.some((role) => normalizedAllowed.includes(role));
      if (!isAllowed) {
        return res.status(403).json({ error: 'Forbidden', message: 'Insufficient role permissions' });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

// Admin API key check
function requireAdmin(req, res, next) {
  const header = (req.headers['x-admin-key'] || req.headers['x-api-key'] || req.headers.authorization || '').toString();
  const envKey = process.env.ADMIN_API_KEY || '';
  if (!envKey) {
    return res.status(403).json({ error: 'Admin access is disabled on this server' });
  }

  let token = header;
  if (token.startsWith('ApiKey ')) token = token.slice(7).trim();
  if (token.startsWith('Bearer ')) token = token.slice(7).trim();

  try {
    if (!token) {
      const cookieHeader = req.headers.cookie || '';
      const match = cookieHeader.match(/(?:^|; )admin_token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }
  } catch (e) { }

  if (!token || token !== envKey) return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Error handler and 404
function notFound(req, res, next) {
  res.status(404).json({ error: 'Not Found' });
}

function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err && (err.stack || err));
  const status = err && err.status && Number(err.status) >= 400 ? Number(err.status) : 500;
  res.status(status).json({ error: err && err.message ? err.message : 'Internal Server Error' });
}

module.exports = {
  requestLogger,
  createAuditTrail,
  requireAuth,
  requireAnyRole,
  requireAdmin,
  apiGatekeeper, // Export the gatekeeper
  apiControl,    // Export the control helpers
  notFound,
  errorHandler,
};