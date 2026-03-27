'use strict';
const { ApprovalWorkflow } = require('../models');
const db = require('../models');
const { hasManageAccess, isApproverScoped, canAccessApprovalEntity, canAccessApprovalWorkflow, approvalOwnershipSql } = require('../utils/ownershipScope');

exports.getAll = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can view approval workflows' });
        }

        if (isApproverScoped(req)) {
            const [rows] = await db.sequelize.query(
                `SELECT aw.*
				 FROM approval_workflows aw
				 WHERE ${approvalOwnershipSql('aw', 'currentUserId')}
				 ORDER BY aw.requested_at DESC`,
                { replacements: { currentUserId: req.userId } }
            );
            return res.json(rows || []);
        }

        return res.json(await ApprovalWorkflow.findAll());
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.getById = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can view approval workflows' });
        }

        const record = await ApprovalWorkflow.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Not found' });

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalWorkflow(req, db, req.params.id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only access workflows for their surveys' });
            }
        }

        return res.json(record);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.create = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can create approval workflows' });
        }

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalEntity(req, db, req.body?.entity_type, req.body?.entity_id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only create workflows for their surveys' });
            }
        }

        const payload = {
            ...(req.body || {}),
            requested_by: Object.prototype.hasOwnProperty.call(req.body || {}, 'requested_by') ? req.body.requested_by : req.userId,
        };

        return res.status(201).json(await ApprovalWorkflow.create(payload));
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.update = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can update approval workflows' });
        }

        const record = await ApprovalWorkflow.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Not found' });

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalWorkflow(req, db, req.params.id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only update workflows for their surveys' });
            }

            if (
                Object.prototype.hasOwnProperty.call(req.body || {}, 'entity_type') ||
                Object.prototype.hasOwnProperty.call(req.body || {}, 'entity_id')
            ) {
                const targetType = Object.prototype.hasOwnProperty.call(req.body || {}, 'entity_type')
                    ? req.body.entity_type
                    : record.entity_type;
                const targetId = Object.prototype.hasOwnProperty.call(req.body || {}, 'entity_id')
                    ? req.body.entity_id
                    : record.entity_id;
                const nextAllowed = await canAccessApprovalEntity(req, db, targetType, targetId);
                if (!nextAllowed) {
                    return res.status(403).json({ error: 'Approvers can only move workflows to their surveys' });
                }
            }
        }

        await record.update(req.body);
        return res.json(record);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.remove = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can delete approval workflows' });
        }

        const record = await ApprovalWorkflow.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Not found' });

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalWorkflow(req, db, req.params.id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only delete workflows for their surveys' });
            }
        }

        await record.destroy();
        return res.json({ message: 'Deleted' });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
