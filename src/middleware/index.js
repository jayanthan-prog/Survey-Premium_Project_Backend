"use strict";
const { Op } = require('sequelize');

// Request logger
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
}

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

// 404 handler
function notFound(req, res, next) {
  res.status(404).json({ error: 'Not Found' });
}

// Admin API key check. Use an environment variable ADMIN_API_KEY to protect admin endpoints.
function requireAdmin(req, res, next) {
  const header = (req.headers['x-admin-key'] || req.headers['x-api-key'] || req.headers.authorization || '').toString();
  const envKey = process.env.ADMIN_API_KEY || '';
  if (!envKey) {
    // If admin key not configured, deny by default to avoid accidental exposure
    return res.status(403).json({ error: 'Admin access is disabled on this server' });
  }

  // Support Authorization: ApiKey <key> or Bearer <key> as well as x-admin-key header
  let token = header;
  if (token.startsWith('ApiKey ')) token = token.slice(7).trim();
  if (token.startsWith('Bearer ')) token = token.slice(7).trim();
  // Also support a cookie named `admin_token` set by the admin UI login
  try {
    if (!token) {
      const cookieHeader = req.headers.cookie || '';
      // very small cookie parse: look for admin_token=...
      const match = cookieHeader.match(/(?:^|; )admin_token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }
  } catch (e) {
    // ignore cookie parse errors and continue to check header
  }

  if (!token || token !== envKey) return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Error handler
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('Unhandled error:', err && (err.stack || err));
  const status = err && err.status && Number(err.status) >= 400 ? Number(err.status) : 500;
  res.status(status).json({ error: err && err.message ? err.message : 'Internal Server Error' });
}

module.exports = {
  requestLogger,
  requireAuth,
  requireAdmin,
  notFound,
  errorHandler,
};
