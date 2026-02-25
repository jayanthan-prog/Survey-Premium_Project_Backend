'use strict';
const db = require('../models');

exports.getAll = async (req, res) => {
	try{
		const results = await db.sequelize.query(
			'SELECT role_id, permission_id, created_at FROM role_permissions', 
			{ type: db.sequelize.QueryTypes.SELECT }
		);
		res.json(results);
	}catch(e){ console.error('rolePermissionController.getAll error', e); res.status(500).json({ error: e.message }); }
};
exports.getById = async (req, res) => {
	try{
		const { role_id, permission_id } = req.params;
		const results = await db.sequelize.query(
			'SELECT role_id, permission_id, created_at FROM role_permissions WHERE role_id = :role_id AND permission_id = :permission_id', 
			{ replacements: { role_id, permission_id }, type: db.sequelize.QueryTypes.SELECT }
		);
		if(results.length === 0) return res.status(404).json({ message:'Not found' }); 
		res.json(results[0]);
	}catch(e){ console.error('rolePermissionController.getById error', e); res.status(500).json({ error: e.message }); }
};
exports.create = async (req, res) => {
	try{
		await db.sequelize.query(
			'INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES (:role_id, :permission_id, NOW())', 
			{ replacements: req.body }
		);
		res.status(201).json(req.body);
	}catch(e){ console.error('rolePermissionController.create error', e); res.status(500).json({ error: e.message }); }
};
exports.update = async (req, res) => {
	try{
		const { role_id, permission_id } = req.params;
		await db.sequelize.query(
			'UPDATE role_permissions SET created_at = NOW() WHERE role_id = :role_id AND permission_id = :permission_id', 
			{ replacements: { role_id, permission_id, ...req.body } }
		);
		res.json({ message: 'Updated' });
	}catch(e){ console.error('rolePermissionController.update error', e); res.status(500).json({ error: e.message }); }
};
exports.remove = async (req, res) => {
	try{
		const { role_id, permission_id } = req.params;
		await db.sequelize.query(
			'DELETE FROM role_permissions WHERE role_id = :role_id AND permission_id = :permission_id', 
			{ replacements: { role_id, permission_id } }
		);
		res.json({ message:'Deleted' });
	}catch(e){ console.error('rolePermissionController.remove error', e); res.status(500).json({ error: e.message }); }
};
