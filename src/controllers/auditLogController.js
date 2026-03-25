'use strict';
const { Op } = require('sequelize');
const { AuditLog, User } = require('../models');

exports.getAllAuditLogs = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 100, 1), 500);
    const offset = (page - 1) * pageSize;

    const where = {};

    if (req.query.module) {
      where.entity_type = String(req.query.module).toUpperCase();
    }

    if (req.query.outcome) {
      where.new_value = {
        ...(where.new_value || {}),
        outcome: String(req.query.outcome).toUpperCase(),
      };
    }

    if (req.query.action) {
      where.action = String(req.query.action).toUpperCase();
    }

    if (req.query.search) {
      const search = `%${String(req.query.search).trim()}%`;
      where[Op.or] = [
        { entity_type: { [Op.like]: search } },
        { action: { [Op.like]: search } },
        { user_agent: { [Op.like]: search } },
        { ip_address: { [Op.like]: search } },
      ];
    }

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit: pageSize,
      include: [
        {
          model: User,
          attributes: ['user_id', 'email', 'name'],
          required: false,
        },
      ],
    });

    res.json({
      items: rows,
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize),
    });
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
