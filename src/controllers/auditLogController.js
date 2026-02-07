'use strict';
const AuditLog = require('../models/audit_log');

exports.getAllAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll();
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

exports.getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ error: 'Audit log not found' });
    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
};

exports.createAuditLog = async (req, res) => {
  try {
    const newLog = await AuditLog.create(req.body);
    res.status(201).json(newLog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
};

exports.updateAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ error: 'Audit log not found' });

    await log.update(req.body);
    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update audit log' });
  }
};

exports.deleteAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ error: 'Audit log not found' });

    await log.destroy();
    res.json({ message: 'Audit log deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete audit log' });
  }
};
