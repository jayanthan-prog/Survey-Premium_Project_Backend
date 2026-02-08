 'use strict';
exports.getAll = async (req, res) => {
	try{
		const { Role } = require('../models');
		if (!Role) throw new Error('Role model not available');
		res.json(await Role.findAll());
	}catch(e){
		console.error('roleController.getAll error', e);
		res.status(500).json({ error: e.message });
	}
};
exports.getById = async (req, res) => {
	try{
		const { Role } = require('../models');
		if (!Role) throw new Error('Role model not available');
		const r = await Role.findByPk(req.params.id);
		if(!r) return res.status(404).json({ message:'Not found' });
		res.json(r);
	}catch(e){
		console.error('roleController.getById error', e);
		res.status(500).json({ error: e.message });
	}
};
exports.create = async (req, res) => {
	try{
		const { Role } = require('../models');
		if (!Role) throw new Error('Role model not available');
		res.status(201).json(await Role.create(req.body));
	}catch(e){
		console.error('roleController.create error', e);
		res.status(500).json({ error: e.message });
	}
};
exports.update = async (req, res) => {
	try{
		const { Role } = require('../models');
		if (!Role) throw new Error('Role model not available');
		const r = await Role.findByPk(req.params.id);
		if(!r) return res.status(404).json({ message:'Not found' });
		await r.update(req.body);
		res.json(r);
	}catch(e){
		console.error('roleController.update error', e);
		res.status(500).json({ error: e.message });
	}
};
exports.remove = async (req, res) => {
	try{
		const { Role } = require('../models');
		if (!Role) throw new Error('Role model not available');
		const r = await Role.findByPk(req.params.id);
		if(!r) return res.status(404).json({ message:'Not found' });
		await r.destroy();
		res.json({ message:'Deleted' });
	}catch(e){
		console.error('roleController.remove error', e);
		res.status(500).json({ error: e.message });
	}
};
