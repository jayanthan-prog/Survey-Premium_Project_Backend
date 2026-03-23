'use strict';

const db = require('../models');

const AllocationTask = db.AllocationTask;
const User = db.User;

function normalizeRole(role) {
    const value = String(role || '').trim().toUpperCase();
    if (value === 'STUDENT') return 'USER';
    return value;
}

function hasManagerAccess(roles = []) {
    const normalized = (Array.isArray(roles) ? roles : [roles]).map(normalizeRole);
    return normalized.includes('ADMIN') || normalized.includes('APPROVER');
}

function mapTask(task) {
    const json = typeof task.toJSON === 'function' ? task.toJSON() : task;
    return {
        ...json,
        assigned_to_name: json?.assignee?.name || null,
        assigned_to_email: json?.assignee?.email || null,
        assigned_by_name: json?.assigner?.name || null,
        assigned_by_email: json?.assigner?.email || null,
    };
}

exports.getAllAllocationTasks = async (req, res) => {
    try {
        const isManager = hasManagerAccess(req.userRoles || []);
        const where = isManager ? {} : { assigned_to: req.userId };

        const tasks = await AllocationTask.findAll({
            where,
            include: [
                { model: User, as: 'assignee', attributes: ['user_id', 'name', 'email'], required: false },
                { model: User, as: 'assigner', attributes: ['user_id', 'name', 'email'], required: false },
            ],
            order: [['created_at', 'DESC']],
        });

        res.json(tasks.map(mapTask));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch allocations' });
    }
};

exports.getAllocationTaskById = async (req, res) => {
    try {
        const isManager = hasManagerAccess(req.userRoles || []);

        const task = await AllocationTask.findByPk(req.params.id, {
            include: [
                { model: User, as: 'assignee', attributes: ['user_id', 'name', 'email'], required: false },
                { model: User, as: 'assigner', attributes: ['user_id', 'name', 'email'], required: false },
            ],
        });

        if (!task) return res.status(404).json({ error: 'Allocation not found' });
        if (!isManager && Number(task.assigned_to) !== Number(req.userId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json(mapTask(task));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch allocation' });
    }
};

exports.createAllocationTask = async (req, res) => {
    try {
        const isManager = hasManagerAccess(req.userRoles || []);
        if (!isManager) {
            return res.status(403).json({ error: 'Only admin/approver can create allocations' });
        }

        const payload = {
            title: req.body?.title,
            allocation_type: String(req.body?.allocation_type || 'TASK').toUpperCase(),
            status: String(req.body?.status || 'ASSIGNED').toUpperCase(),
            start_at: req.body?.start_at || null,
            end_at: req.body?.end_at || null,
            location: req.body?.location || null,
            instructions: req.body?.instructions || null,
            notes: req.body?.notes || null,
            assigned_to: Number(req.body?.assigned_to),
            assigned_by: Number(req.userId),
        };

        if (!payload.title || !payload.assigned_to) {
            return res.status(400).json({ error: 'title and assigned_to are required' });
        }

        const created = await AllocationTask.create(payload);

        const createdWithUsers = await AllocationTask.findByPk(created.allocation_task_id, {
            include: [
                { model: User, as: 'assignee', attributes: ['user_id', 'name', 'email'], required: false },
                { model: User, as: 'assigner', attributes: ['user_id', 'name', 'email'], required: false },
            ],
        });

        res.status(201).json(mapTask(createdWithUsers || created));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create allocation' });
    }
};

exports.updateAllocationTask = async (req, res) => {
    try {
        const isManager = hasManagerAccess(req.userRoles || []);
        if (!isManager) {
            return res.status(403).json({ error: 'Only admin/approver can update allocations' });
        }

        const task = await AllocationTask.findByPk(req.params.id);
        if (!task) return res.status(404).json({ error: 'Allocation not found' });

        const updates = {
            title: Object.prototype.hasOwnProperty.call(req.body || {}, 'title') ? req.body.title : task.title,
            allocation_type: Object.prototype.hasOwnProperty.call(req.body || {}, 'allocation_type') ? String(req.body.allocation_type || '').toUpperCase() : task.allocation_type,
            status: Object.prototype.hasOwnProperty.call(req.body || {}, 'status') ? String(req.body.status || '').toUpperCase() : task.status,
            start_at: Object.prototype.hasOwnProperty.call(req.body || {}, 'start_at') ? req.body.start_at : task.start_at,
            end_at: Object.prototype.hasOwnProperty.call(req.body || {}, 'end_at') ? req.body.end_at : task.end_at,
            location: Object.prototype.hasOwnProperty.call(req.body || {}, 'location') ? req.body.location : task.location,
            instructions: Object.prototype.hasOwnProperty.call(req.body || {}, 'instructions') ? req.body.instructions : task.instructions,
            notes: Object.prototype.hasOwnProperty.call(req.body || {}, 'notes') ? req.body.notes : task.notes,
            assigned_to: Object.prototype.hasOwnProperty.call(req.body || {}, 'assigned_to') ? Number(req.body.assigned_to) : task.assigned_to,
        };

        await task.update(updates);

        const updated = await AllocationTask.findByPk(task.allocation_task_id, {
            include: [
                { model: User, as: 'assignee', attributes: ['user_id', 'name', 'email'], required: false },
                { model: User, as: 'assigner', attributes: ['user_id', 'name', 'email'], required: false },
            ],
        });

        res.json(mapTask(updated || task));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update allocation' });
    }
};

exports.deleteAllocationTask = async (req, res) => {
    try {
        const isManager = hasManagerAccess(req.userRoles || []);
        if (!isManager) {
            return res.status(403).json({ error: 'Only admin/approver can delete allocations' });
        }

        const task = await AllocationTask.findByPk(req.params.id);
        if (!task) return res.status(404).json({ error: 'Allocation not found' });

        await task.destroy();
        res.json({ message: 'Allocation deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete allocation' });
    }
};
