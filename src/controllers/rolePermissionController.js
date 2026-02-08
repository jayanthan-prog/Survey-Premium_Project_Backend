'use strict';

exports.getAll = async (req, res) => {
	try{
		const { RolePermission } = require('../models');
		if (!RolePermission) throw new Error('RolePermission model not available');
		res.json(await RolePermission.findAll());
	}catch(e){ console.error('rolePermissionController.getAll error', e); res.status(500).json({ error: e.message }); }
};
exports.getById = async (req, res) => {
	try{
		const { RolePermission } = require('../models');
		if (!RolePermission) throw new Error('RolePermission model not available');
		const r = await RolePermission.findByPk(req.params.id); if(!r) return res.status(404).json({ message:'Not found' }); res.json(r);
	}catch(e){ console.error('rolePermissionController.getById error', e); res.status(500).json({ error: e.message }); }
};
exports.create = async (req, res) => {
	try{
		const { RolePermission } = require('../models');
		if (!RolePermission) throw new Error('RolePermission model not available');
		res.status(201).json(await RolePermission.create(req.body));
	}catch(e){ console.error('rolePermissionController.create error', e); res.status(500).json({ error: e.message }); }
};
exports.update = async (req, res) => {
	try{
		const { RolePermission } = require('../models');
		if (!RolePermission) throw new Error('RolePermission model not available');
		const r = await RolePermission.findByPk(req.params.id); if(!r) return res.status(404).json({ message:'Not found' }); await r.update(req.body); res.json(r);
	}catch(e){ console.error('rolePermissionController.update error', e); res.status(500).json({ error: e.message }); }
};
exports.remove = async (req, res) => {
	try{
		const { RolePermission } = require('../models');
		if (!RolePermission) throw new Error('RolePermission model not available');
		const r = await RolePermission.findByPk(req.params.id); if(!r) return res.status(404).json({ message:'Not found' }); await r.destroy(); res.json({ message:'Deleted' });
	}catch(e){ console.error('rolePermissionController.remove error', e); res.status(500).json({ error: e.message }); }
};
