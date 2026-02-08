'use strict';
const { SurveyReleaseAudience } = require('../models');

exports.getAll = async (req, res) => {
  try { const rows = await SurveyReleaseAudience.findAll(); res.json(rows); } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getById = async (req, res) => {
  try { const r = await SurveyReleaseAudience.findByPk(req.params.id); if(!r) return res.status(404).json({ message: 'Not found' }); res.json(r);} catch(e){ res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => { try { const created = await SurveyReleaseAudience.create(req.body); res.status(201).json(created); } catch(e){ res.status(500).json({ error: e.message }); } };

exports.update = async (req, res) => { try { const r = await SurveyReleaseAudience.findByPk(req.params.id); if(!r) return res.status(404).json({ message: 'Not found' }); await r.update(req.body); res.json(r); } catch(e){ res.status(500).json({ error: e.message }); } };

exports.remove = async (req, res) => { try { const r = await SurveyReleaseAudience.findByPk(req.params.id); if(!r) return res.status(404).json({ message: 'Not found' }); await r.destroy(); res.json({ message: 'Deleted' }); } catch(e){ res.status(500).json({ error: e.message }); } };
