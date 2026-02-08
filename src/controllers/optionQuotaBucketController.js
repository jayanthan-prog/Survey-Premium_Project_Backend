'use strict';
const { OptionQuotaBucket } = require('../models');

exports.getAll = async (req, res) => {
	try {
		if (!OptionQuotaBucket) throw new Error('OptionQuotaBucket model not available');
		res.json(await OptionQuotaBucket.findAll());
	} catch(e){ console.error('optionQuotaBucketController.getAll error', e); res.status(500).json({ error: e.message }); }
};
exports.getById = async (req, res) => { try { if (!OptionQuotaBucket) throw new Error('OptionQuotaBucket model not available'); const r = await OptionQuotaBucket.findByPk(req.params.id); if(!r) return res.status(404).json({ message: 'Not found' }); res.json(r);} catch(e){ console.error('optionQuotaBucketController.getById error', e); res.status(500).json({ error: e.message }); } };
exports.create = async (req, res) => { try { if (!OptionQuotaBucket) throw new Error('OptionQuotaBucket model not available'); const c = await OptionQuotaBucket.create(req.body); res.status(201).json(c); } catch(e){ console.error('optionQuotaBucketController.create error', e); res.status(500).json({ error: e.message }); } };
exports.update = async (req, res) => { try { if (!OptionQuotaBucket) throw new Error('OptionQuotaBucket model not available'); const r = await OptionQuotaBucket.findByPk(req.params.id); if(!r) return res.status(404).json({ message: 'Not found' }); await r.update(req.body); res.json(r); } catch(e){ console.error('optionQuotaBucketController.update error', e); res.status(500).json({ error: e.message }); } };
exports.remove = async (req, res) => { try { if (!OptionQuotaBucket) throw new Error('OptionQuotaBucket model not available'); const r = await OptionQuotaBucket.findByPk(req.params.id); if(!r) return res.status(404).json({ message: 'Not found' }); await r.destroy(); res.json({ message: 'Deleted' }); } catch(e){ console.error('optionQuotaBucketController.remove error', e); res.status(500).json({ error: e.message }); } };
