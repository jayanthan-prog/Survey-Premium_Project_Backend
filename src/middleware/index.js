"use strict";
const { Op } = require('sequelize');

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
  if (featureFlags && typeof featureFlags.getFlags === 'function') {
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
    if (!AuthToken) return res.status(500).json({ error: 'AuthToken model not found' });
    const authToken = await AuthToken.findOne({
      where: {
        token,
        revoked_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
    });
    if (!authToken) return res.status(401).json({ error: 'Invalid or expired token' });
    req.userId = authToken.user_id;
    req.authToken = authToken;
    next();
  } catch (err) {
    next(err);
  }
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
  } catch (e) {}

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
  requireAdmin,
  apiGatekeeper, // Export the gatekeeper
  apiControl,    // Export the control helpers
  notFound,
  errorHandler,
};