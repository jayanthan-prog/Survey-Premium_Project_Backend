'use strict';

exports.getAll = async (req, res) => {
	try{
		const { Permission } = require('../models');
		if (!Permission) throw new Error('Permission model not available');
		res.json(await Permission.findAll());
	}catch(e){
		console.error('permissionController.getAll error', e);
		res.status(500).json({ error: e.message });
	}
};
exports.getById = async (req, res) => {
	try{
		const { Permission } = require('../models');
		if (!Permission) throw new Error('Permission model not available');
		const r = await Permission.findByPk(req.params.id);
		if(!r) return res.status(404).json({ message:'Not found' });
		res.json(r);
	}catch(e){
		console.error('permissionController.getById error', e);
		res.status(500).json({ error: e.message });
	}
};
exports.create = async (req, res) => {
	try{
		const { Permission } = require('../models');
		if (!Permission) throw new Error('Permission model not available');
		res.status(201).json(await Permission.create(req.body));
	}catch(e){
		console.error('permissionController.create error', e);
		res.status(500).json({ error: e.message });
	}
};
exports.update = async (req, res) => {
	try{
		const { Permission } = require('../models');
		if (!Permission) throw new Error('Permission model not available');
		const r = await Permission.findByPk(req.params.id);
		if(!r) return res.status(404).json({ message:'Not found' });
		await r.update(req.body);
		res.json(r);
	}catch(e){
		console.error('permissionController.update error', e);
		res.status(500).json({ error: e.message });
	}
};
exports.remove = async (req, res) => {
	try{
		const { Permission } = require('../models');
		if (!Permission) throw new Error('Permission model not available');
		const r = await Permission.findByPk(req.params.id);
		if(!r) return res.status(404).json({ message:'Not found' });
		await r.destroy();
		res.json({ message:'Deleted' });
	}catch(e){
		console.error('permissionController.remove error', e);
		res.status(500).json({ error: e.message });
	}
};
