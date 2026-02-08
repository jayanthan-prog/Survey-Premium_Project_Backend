"use strict";
const db = require('../models');
const { AuthToken, User } = db;
const crypto = require('crypto');

// POST /api/login
// Body: { email }
// Note: project currently has no password field; this endpoint issues a token when a user with the email exists.
exports.login = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Create a token entry
    const token = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const created = await AuthToken.create({
      user_id: user.user_id,
      token,
      token_type: 'bearer',
      expires_at: expiresAt,
      revoked_at: null,
    });

    return res.json({
      token: created.token,
      token_type: created.token_type,
      expires_at: created.expires_at,
      user_id: created.user_id,
    });
  } catch (err) {
    next(err);
  }
};

// Optional: POST /api/logout to revoke token
exports.logout = async (req, res, next) => {
  try {
    // requireAuth sets req.authToken
    const authToken = req.authToken;
    if (!authToken) return res.status(400).json({ error: 'No token to revoke' });
    await authToken.update({ revoked_at: new Date() });
    res.json({ message: 'Token revoked' });
  } catch (err) {
    next(err);
  }
};
