'use strict';
const { ApprovalAction } = require('../models');
const db = require('../models');
const { hasManageAccess, isApproverScoped, canAccessApprovalItem, canAccessApprovalAction, approvalOwnershipSql } = require('../utils/ownershipScope');

exports.getAll = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can view approval actions' });
        }

        if (isApproverScoped(req)) {
            const [rows] = await db.sequelize.query(
                `SELECT aa.*
				 FROM approval_actions aa
				 INNER JOIN approval_items ai ON ai.approval_item_id = aa.approval_item_id
				 INNER JOIN approval_workflows aw ON aw.approval_workflow_id = ai.approval_workflow_id
				 WHERE ${approvalOwnershipSql('aw', 'currentUserId')}
				 ORDER BY aa.acted_at DESC`,
                { replacements: { currentUserId: req.userId } }
            );
            return res.json(rows || []);
        }

        return res.json(await ApprovalAction.findAll());
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.getById = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can view approval actions' });
        }

        const record = await ApprovalAction.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Not found' });

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalAction(req, db, req.params.id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only access actions for their surveys' });
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
            return res.status(403).json({ error: 'Only admin/approver can create approval actions' });
        }

        if (!req.body || !req.body.approval_item_id) {
            return res.status(400).json({ error: 'approval_item_id is required' });
        }

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalItem(req, db, req.body.approval_item_id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only create actions for their surveys' });
            }
        }

        return res.status(201).json(await ApprovalAction.create(req.body));
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.update = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can update approval actions' });
        }

        const record = await ApprovalAction.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Not found' });

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalAction(req, db, req.params.id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only update actions for their surveys' });
            }

            if (Object.prototype.hasOwnProperty.call(req.body || {}, 'approval_item_id')) {
                const nextAllowed = await canAccessApprovalItem(req, db, req.body.approval_item_id);
                if (!nextAllowed) {
                    return res.status(403).json({ error: 'Approvers can only move actions to items for their surveys' });
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
            return res.status(403).json({ error: 'Only admin/approver can delete approval actions' });
        }

        const record = await ApprovalAction.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Not found' });

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalAction(req, db, req.params.id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only delete actions for their surveys' });
            }
        }

        await record.destroy();
        return res.json({ message: 'Deleted' });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
