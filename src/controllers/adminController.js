"use strict";
const db = require('../models');

// GET /api/admin/metrics
exports.getMetrics = async (req, res, next) => {
  try {
    const User = db.User;
    const Survey = db.Survey;
    const SurveyParticipant = db.SurveyParticipant || db.Survey_Participant;
    const SurveyAnswer = db.SurveyAnswer || db.Survey_Answer;
    const SlotBooking = db.SlotBooking;
    const AuditLog = db.AuditLog;

    const [usersCount, surveysCount, participantsCount, answersCount, bookingsCount, auditCount] = await Promise.all([
      User ? User.count() : 0,
      Survey ? Survey.count() : 0,
      SurveyParticipant ? SurveyParticipant.count() : 0,
      SurveyAnswer ? SurveyAnswer.count() : 0,
      SlotBooking ? SlotBooking.count() : 0,
      AuditLog ? AuditLog.count() : 0,
    ]);

    res.json({
      users: usersCount,
      surveys: surveysCount,
      participants: participantsCount,
      answers: answersCount,
      slot_bookings: bookingsCount,
      audit_events: auditCount,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users?page=&limit=
exports.listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const offset = (page - 1) * limit;
    const User = db.User;
    if (!User) return res.json({ data: [], meta: {} });

    const [rows, count] = await Promise.all([
      User.findAll({ offset, limit, order: [['created_at', 'DESC']] }),
      User.count(),
    ]);

    res.json({ data: rows, meta: { total: count, page, limit } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/surveys?page=&limit=
exports.listSurveys = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const offset = (page - 1) * limit;
    const Survey = db.Survey;
    if (!Survey) return res.json({ data: [], meta: {} });

    const [rows, count] = await Promise.all([
      Survey.findAll({ offset, limit, order: [['created_at', 'DESC']] }),
      Survey.count(),
    ]);

    res.json({ data: rows, meta: { total: count, page, limit } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/audit-logs?page=&limit=
exports.listAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const offset = (page - 1) * limit;
    const AuditLog = db.AuditLog;
    if (!AuditLog) return res.json({ data: [], meta: {} });

    const [rows, count] = await Promise.all([
      AuditLog.findAll({ offset, limit, order: [['created_at', 'DESC']] }),
      AuditLog.count(),
    ]);

    res.json({ data: rows, meta: { total: count, page, limit } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/status
exports.getStatus = async (req, res, next) => {
  try {
    const status = {
      db: { ok: false, message: null },
      endpoints: [],
      timestamp: new Date().toISOString(),
    };

    // DB health
    try {
      if (db && db.sequelize) {
        await db.sequelize.authenticate();
        status.db.ok = true;
      } else {
        status.db.message = 'sequelize instance not found';
      }
    } catch (err) {
      status.db.ok = false;
      status.db.message = err && (err.message || String(err));
    }

    // endpoints to probe
    const port = Number(process.env.PORT || 3000);
    const host = '127.0.0.1';
    const base = `http://${host}:${port}`;
    const probes = [
      '/api/admin/metrics',
      '/api/admin/users',
      '/api/admin/surveys',
      '/api/admin/audit-logs',
      '/api/docs.json',
      '/api/users',
      '/api/surveys',
    ];

    // use fetch to probe endpoints; include admin key where appropriate
    const adminKey = (process.env.ADMIN_API_KEY || '').trim();
    const fetchPromises = probes.map(async (p) => {
      const out = { path: p, ok: false, status: 0, time_ms: null, error: null };
      try {
        const start = Date.now();
        const res = await fetch(base + p, { headers: { 'x-admin-key': adminKey }, method: 'GET' });
        out.time_ms = Date.now() - start;
        out.status = res.status;
        out.ok = res.ok;
      } catch (err) {
        out.error = err && (err.message || String(err));
      }
      return out;
    });

    const results = await Promise.all(fetchPromises);
    status.endpoints = results;

    res.json(status);
  } catch (err) {
    next(err);
  }
};
