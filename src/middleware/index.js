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
  requireAuth,
  requireAnyRole,
  requireAdmin,
  apiGatekeeper, // Export the gatekeeper
  apiControl,    // Export the control helpers
  notFound,
  errorHandler,
};