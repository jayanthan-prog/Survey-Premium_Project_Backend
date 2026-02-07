'use strict';
const AuditEvent = require('../models/audit_event');

exports.getAllAuditEvents = async (req, res) => {
  try {
    const events = await AuditEvent.findAll();
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit events' });
  }
};

exports.getAuditEventById = async (req, res) => {
  try {
    const event = await AuditEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Audit event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit event' });
  }
};

exports.createAuditEvent = async (req, res) => {
  try {
    const newEvent = await AuditEvent.create(req.body);
    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create audit event' });
  }
};

exports.updateAuditEvent = async (req, res) => {
  try {
    const event = await AuditEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Audit event not found' });

    await event.update(req.body);
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update audit event' });
  }
};

exports.deleteAuditEvent = async (req, res) => {
  try {
    const event = await AuditEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Audit event not found' });

    await event.destroy();
    res.json({ message: 'Audit event deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete audit event' });
  }
};
