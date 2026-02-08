'use strict';
const { SurveySession } = require('../models');

exports.getAll = async (req, res) => {
	try {
		if (!SurveySession) throw new Error('SurveySession model not available');
		res.json(await SurveySession.findAll());
	} catch(e){ console.error('surveySessionController.getAll error', e); res.status(500).json({ error: e.message }); }
};
exports.getById = async (req, res) => { try { if (!SurveySession) throw new Error('SurveySession model not available'); const r = await SurveySession.findByPk(req.params.id); if(!r) return res.status(404).json({ message: 'Not found' }); res.json(r);} catch(e){ console.error('surveySessionController.getById error', e); res.status(500).json({ error: e.message }); } };
exports.create = async (req, res) => { try { if (!SurveySession) throw new Error('SurveySession model not available'); const c = await SurveySession.create(req.body); res.status(201).json(c);} catch(e){ console.error('surveySessionController.create error', e); res.status(500).json({ error: e.message }); } };
exports.update = async (req, res) => { try { if (!SurveySession) throw new Error('SurveySession model not available'); const r = await SurveySession.findByPk(req.params.id); if(!r) return res.status(404).json({ message: 'Not found' }); await r.update(req.body); res.json(r);} catch(e){ console.error('surveySessionController.update error', e); res.status(500).json({ error: e.message }); } };
exports.remove = async (req, res) => { try { if (!SurveySession) throw new Error('SurveySession model not available'); const r = await SurveySession.findByPk(req.params.id); if(!r) return res.status(404).json({ message: 'Not found' }); await r.destroy(); res.json({ message: 'Deleted' }); } catch(e){ console.error('surveySessionController.remove error', e); res.status(500).json({ error: e.message }); } };
