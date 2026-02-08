'use strict';
const { OptionCapacity } = require('../models');

exports.getAll = async (req, res) => {
	try {
		if (!OptionCapacity) throw new Error('OptionCapacity model not available');
		const rows = await OptionCapacity.findAll();
		res.json(rows);
	} catch (e) {
		console.error('optionCapacityController.getAll error', e);
		res.status(500).json({ error: e.message });
	}
};

exports.getById = async (req, res) => {
	try {
		if (!OptionCapacity) throw new Error('OptionCapacity model not available');
		const r = await OptionCapacity.findByPk(req.params.id);
		if (!r) return res.status(404).json({ message: 'Not found' });
		res.json(r);
	} catch (e) {
		console.error('optionCapacityController.getById error', e);
		res.status(500).json({ error: e.message });
	}
};

exports.create = async (req, res) => {
	try {
		if (!OptionCapacity) throw new Error('OptionCapacity model not available');
		const c = await OptionCapacity.create(req.body);
		res.status(201).json(c);
	} catch (e) {
		console.error('optionCapacityController.create error', e);
		res.status(500).json({ error: e.message });
	}
};

exports.update = async (req, res) => {
	try {
		if (!OptionCapacity) throw new Error('OptionCapacity model not available');
		const r = await OptionCapacity.findByPk(req.params.id);
		if (!r) return res.status(404).json({ message: 'Not found' });
		await r.update(req.body);
		res.json(r);
	} catch (e) {
		console.error('optionCapacityController.update error', e);
		res.status(500).json({ error: e.message });
	}
};

exports.remove = async (req, res) => {
	try {
		if (!OptionCapacity) throw new Error('OptionCapacity model not available');
		const r = await OptionCapacity.findByPk(req.params.id);
		if (!r) return res.status(404).json({ message: 'Not found' });
		await r.destroy();
		res.json({ message: 'Deleted' });
	} catch (e) {
		console.error('optionCapacityController.remove error', e);
		res.status(500).json({ error: e.message });
	}
};
