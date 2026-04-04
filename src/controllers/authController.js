"use strict";
const db = require('../models');
const { AuthToken, User } = db;
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const { getPrimaryRole, resolveUserRoles } = require('../utils/authRoles');

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || undefined,
  process.env.GOOGLE_CLIENT_SECRET || undefined,
  process.env.GOOGLE_REDIRECT_URI || undefined
);

function getBootstrapAdminEmails() {
  return String(process.env.ADMIN_BOOTSTRAP_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

async function findRoleIdByName(roleName) {
  const [rows] = await db.sequelize.query(
    'SELECT role_id FROM roles WHERE UPPER(name) = UPPER(:roleName) LIMIT 1',
    { replacements: { roleName } }
  );
  return rows && rows[0] ? Number(rows[0].role_id) : null;
}

async function ensureRole(roleName, description) {
  let roleId = await findRoleIdByName(roleName);
  if (roleId) return roleId;

  const [maxRows] = await db.sequelize.query('SELECT COALESCE(MAX(role_id), 0) AS maxRoleId FROM roles');
  const nextRoleId = Number(maxRows && maxRows[0] ? maxRows[0].maxRoleId : 0) + 1;

  await db.sequelize.query(
    'INSERT INTO roles (role_id, name, description, created_at, updated_at) VALUES (:roleId, :roleName, :description, NOW(), NOW())',
    {
      replacements: {
        roleId: nextRoleId,
        roleName,
        description,
      },
    }
  );

  return nextRoleId;
}

async function userHasRoleId(userId, roleId) {
  const [rows] = await db.sequelize.query(
    'SELECT 1 FROM user_roles WHERE user_id = :userId AND role_id = :roleId LIMIT 1',
    { replacements: { userId, roleId } }
  );
  return Boolean(rows && rows[0]);
}

async function assignRoleToUser(userId, roleName) {
  const normalizedRole = String(roleName || '').trim().toUpperCase();
  if (!normalizedRole) return;

  const roleId = await ensureRole(normalizedRole, `${normalizedRole} access role`);
  const alreadyAssigned = await userHasRoleId(userId, roleId);
  if (alreadyAssigned) return;

  await db.sequelize.query(
    'INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (:userId, :roleId, NOW())',
    { replacements: { userId, roleId } }
  );
}

async function shouldBootstrapAdmin(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return false;
  return getBootstrapAdminEmails().includes(normalizedEmail);
}

async function getNextAuthTokenId() {
  const [rows] = await db.sequelize.query(
    'SELECT COALESCE(MAX(auth_token_id), 0) + 1 AS nextAuthTokenId FROM auth_tokens'
  );
  return Number(rows && rows[0] ? rows[0].nextAuthTokenId : 1);
}

async function issueAuthTokenForUser(user) {
  const token = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const authTokenId = await getNextAuthTokenId();

  const created = await AuthToken.create({
    auth_token_id: authTokenId,
    user_id: user.user_id,
    token_hash: token,
    token_type: 'bearer',
    expires_at: expiresAt,
    revoked_at: null,
  });

  const roles = await resolveUserRoles(user.user_id);
  const primaryRole = getPrimaryRole(roles);

  return {
    token: token,
    token_type: created.token_type,
    expires_at: created.expires_at,
    user_id: created.user_id,
    roles,
    role: primaryRole,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: primaryRole,
      roles,
    },
  };
}

async function scalarCount(sql, replacements = {}) {
  const [rows] = await db.sequelize.query(sql, { replacements });
  const row = rows && rows[0] ? rows[0] : {};
  const value = row.countValue ?? row.count ?? row.total ?? 0;
  return Number(value || 0);
}

function toIsoOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function getDefaultSettings() {
  return {
    theme: 'light',
    language: 'English',
    timezone: 'GMT+5:30 (India Standard Time)',
    emailAlerts: true,
    pushAlerts: true,
    weeklyDigest: false,
    profileVisible: true,
    twoFactorEnabled: false,
  };
}

function getUserSettings(user) {
  const attributes = user && user.attributes && typeof user.attributes === 'object' ? user.attributes : {};
  const rawSettings = attributes.settings && typeof attributes.settings === 'object' ? attributes.settings : {};
  return {
    ...getDefaultSettings(),
    ...rawSettings,
  };
}

function getSanitizedUser(user, role, roles) {
  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    department: user.department || null,
    role,
    roles,
    settings: getUserSettings(user),
  };
}

// POST /api/auth/login
// Body: { identifier | email | user_id, password? }
exports.login = async (req, res, next) => {
  try {
    const body = req.body || {};
    const identifier = body.identifier || body.email || body.user_id || body.userId;
    if (!identifier) {
      return res.status(400).json({ error: 'Identifier is required (email or user id)' });
    }

    const where = String(identifier).includes('@')
      ? { email: String(identifier).trim() }
      : { user_id: identifier };

    const user = await User.findOne({ where });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Account is inactive. Contact an administrator.' });
    }

    const attributes = user && user.attributes && typeof user.attributes === 'object' ? user.attributes : {};
    const storedPasswordHash = attributes.password_hash;
    if (storedPasswordHash) {
      const password = String(body.password || '');
      if (!password) {
        return res.status(401).json({ error: 'Password is required' });
      }

      const validPassword = await bcrypt.compare(password, storedPasswordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    return res.json(await issueAuthTokenForUser(user));
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/google
// Body: { credential }
exports.googleLogin = async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'GOOGLE_CLIENT_ID is not configured on the server' });
    }

    const credential = req.body && req.body.credential;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const email = payload && payload.email;
    const fullName = payload && (payload.name || payload.given_name || 'Google User');

    if (!email) {
      return res.status(401).json({ error: 'Unable to verify Google account email' });
    }

    let user = await User.findOne({ where: { email } });
    const isBootstrapAdmin = await shouldBootstrapAdmin(email);

    if (!user) {
      if (!isBootstrapAdmin) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'This email is not provisioned. Ask an admin to add your account before signing in.',
        });
      }

      user = await User.create({
        name: fullName,
        email,
        is_active: true,
        attributes: {},
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({ error: 'Account is inactive. Contact an administrator.' });
    }

    if (isBootstrapAdmin) {
      await assignRoleToUser(user.user_id, 'ADMIN');
    } else {
      await assignRoleToUser(user.user_id, 'USER');
    }

    return res.json(await issueAuthTokenForUser(user));
  } catch (err) {
    if (err && (err.message || '').toLowerCase().includes('token used too late')) {
      return res.status(401).json({ error: 'Google token expired. Please try again.' });
    }
    next(err);
  }
};

// GET /api/auth/dashboard
exports.dashboard = async (req, res, next) => {
  try {
    const roles = Array.isArray(req.userRoles) && req.userRoles.length
      ? req.userRoles
      : await resolveUserRoles(req.userId);
    const role = getPrimaryRole(roles);

    const now = new Date();

    const [
      users,
      surveys,
      groups,
      activeReleases,
      pendingApprovals,
      actionPlansPending,
      myInvited,
      myStarted,
      myCompleted,
      myAnswerCount,
    ] = await Promise.all([
      scalarCount('SELECT COUNT(*) AS countValue FROM users'),
      scalarCount('SELECT COUNT(*) AS countValue FROM surveys'),
      scalarCount('SELECT COUNT(*) AS countValue FROM `groups`'),
      scalarCount(
        'SELECT COUNT(*) AS countValue FROM survey_releases WHERE (is_frozen = 0 OR is_frozen IS NULL) AND (closes_at IS NULL OR closes_at >= :now)',
        { now }
      ),
      scalarCount(
        "SELECT COUNT(*) AS countValue FROM approval_items WHERE UPPER(status) = 'PENDING'"
      ),
      scalarCount(
        "SELECT COUNT(*) AS countValue FROM action_plans WHERE UPPER(status) IN ('PENDING','OPEN','IN_PROGRESS')"
      ),
      scalarCount(
        "SELECT COUNT(*) AS countValue FROM survey_participants WHERE user_id = :userId AND status = 'INVITED'",
        { userId: req.userId }
      ),
      scalarCount(
        "SELECT COUNT(*) AS countValue FROM survey_participants WHERE user_id = :userId AND status = 'STARTED'",
        { userId: req.userId }
      ),
      scalarCount(
        "SELECT COUNT(*) AS countValue FROM survey_participants WHERE user_id = :userId AND status = 'COMPLETED'",
        { userId: req.userId }
      ),
      scalarCount(
        'SELECT COUNT(*) AS countValue FROM survey_answers sa JOIN survey_participants sp ON sa.participation_id = sp.participant_id WHERE sp.user_id = :userId',
        { userId: req.userId }
      ),
    ]);

    const [recentReleaseRows] = await db.sequelize.query(
      `SELECT release_id, name, opens_at, closes_at, is_frozen
       FROM survey_releases
       ORDER BY created_at DESC
       LIMIT 5`
    );

    const recentReleases = (recentReleaseRows || []).map((row) => ({
      release_id: Number(row.release_id),
      name: row.name,
      opens_at: toIsoOrNull(row.opens_at),
      closes_at: toIsoOrNull(row.closes_at),
      status: row.is_frozen ? 'FROZEN' : 'ACTIVE',
    }));

    const [recentApprovalRows] = await db.sequelize.query(
      `SELECT approval_item_id, entity_type, status, created_at
       FROM approval_items
       ORDER BY created_at DESC
       LIMIT 5`
    );

    const [myGroupRows] = await db.sequelize.query(
      `SELECT gm.group_id, g.name, gm.role_in_group, gm.joined_at
       FROM group_members gm
       JOIN \`groups\` g ON g.group_id = gm.group_id
       WHERE gm.user_id = :userId
       ORDER BY gm.joined_at DESC
       LIMIT 10`,
      { replacements: { userId: req.userId } }
    );

    const recentApprovals = (recentApprovalRows || []).map((row) => ({
      approval_item_id: Number(row.approval_item_id),
      entity_type: row.entity_type,
      status: row.status,
      created_at: toIsoOrNull(row.created_at),
    }));

    const myGroups = (myGroupRows || []).map((row) => ({
      group_id: Number(row.group_id),
      name: row.name,
      role_in_group: row.role_in_group || null,
      joined_at: toIsoOrNull(row.joined_at),
    }));

    return res.json({
      role,
      overview: {
        users,
        surveys,
        groups,
        active_releases: activeReleases,
        pending_approvals: pendingApprovals,
        action_plans_pending: actionPlansPending,
        my_invited: myInvited,
        my_started: myStarted,
        my_completed: myCompleted,
        my_answers: myAnswerCount,
      },
      recent_releases: recentReleases,
      recent_approvals: recentApprovals,
      my_groups: myGroups,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const roles = Array.isArray(req.userRoles) && req.userRoles.length
      ? req.userRoles
      : await resolveUserRoles(req.userId);

    const primaryRole = getPrimaryRole(roles);

    return res.json({ user: getSanitizedUser(user, primaryRole, roles) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/me
exports.updateMe = async (req, res, next) => {
  try {
    const roles = Array.isArray(req.userRoles) && req.userRoles.length
      ? req.userRoles
      : await resolveUserRoles(req.userId);
    if (!roles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Only admins can update profile details' });
    }

    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'email')) {
      return res.status(400).json({ error: 'Email cannot be changed from profile settings' });
    }

    const allowedFields = ['name', 'phone', 'department'];
    const updates = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
        updates[key] = req.body[key];
      }
    }

    await user.update(updates);

    const nextRoles = Array.isArray(req.userRoles) && req.userRoles.length
      ? req.userRoles
      : await resolveUserRoles(req.userId);
    const primaryRole = getPrimaryRole(nextRoles);

    return res.json({
      message: 'Profile updated successfully',
      user: getSanitizedUser(user, primaryRole, nextRoles),
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/me/preferences
exports.updatePreferences = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const allowedSettings = [
      'theme',
      'language',
      'timezone',
      'emailAlerts',
      'pushAlerts',
      'weeklyDigest',
      'profileVisible',
      'twoFactorEnabled',
    ];

    const incoming = req.body || {};
    const settingsUpdate = {};
    for (const key of allowedSettings) {
      if (Object.prototype.hasOwnProperty.call(incoming, key)) {
        settingsUpdate[key] = incoming[key];
      }
    }

    const currentAttributes = user.attributes && typeof user.attributes === 'object' ? user.attributes : {};
    const mergedSettings = {
      ...getUserSettings(user),
      ...settingsUpdate,
    };

    await user.update({
      attributes: {
        ...currentAttributes,
        settings: mergedSettings,
      },
    });

    const roles = Array.isArray(req.userRoles) && req.userRoles.length
      ? req.userRoles
      : await resolveUserRoles(req.userId);
    const primaryRole = getPrimaryRole(roles);

    return res.json({
      message: 'Preferences updated successfully',
      user: getSanitizedUser(user, primaryRole, roles),
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/me/password
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const currentPassword = String(req.body?.current_password || '');
    const newPassword = String(req.body?.new_password || '');
    const confirmPassword = String(req.body?.confirm_password || '');

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Password confirmation does not match' });
    }

    const currentAttributes = user.attributes && typeof user.attributes === 'object' ? user.attributes : {};
    const existingHash = currentAttributes.password_hash;

    if (existingHash) {
      const validCurrent = await bcrypt.compare(currentPassword, existingHash);
      if (!validCurrent) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    const nextHash = await bcrypt.hash(newPassword, 10);
    await user.update({
      attributes: {
        ...currentAttributes,
        password_hash: nextHash,
        password_updated_at: new Date().toISOString(),
      },
    });

    return res.json({ message: 'Password updated successfully' });
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
