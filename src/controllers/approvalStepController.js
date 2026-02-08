'use strict';
const { ApprovalStep } = require('../models');

exports.getAll = async (req, res) => { try{ res.json(await ApprovalStep.findAll()); }catch(e){ res.status(500).json({ error: e.message }); } };
exports.getById = async (req, res) => { try{ const r = await ApprovalStep.findByPk(req.params.id); if(!r) return res.status(404).json({ message:'Not found' }); res.json(r);}catch(e){ res.status(500).json({ error: e.message }); } };
exports.create = async (req, res) => { try{ res.status(201).json(await ApprovalStep.create(req.body)); }catch(e){ res.status(500).json({ error: e.message }); } };
exports.update = async (req, res) => { try{ const r = await ApprovalStep.findByPk(req.params.id); if(!r) return res.status(404).json({ message:'Not found' }); await r.update(req.body); res.json(r);}catch(e){ res.status(500).json({ error: e.message }); } };
exports.remove = async (req, res) => { try{ const r = await ApprovalStep.findByPk(req.params.id); if(!r) return res.status(404).json({ message:'Not found' }); await r.destroy(); res.json({ message:'Deleted' }); }catch(e){ res.status(500).json({ error: e.message }); } };
