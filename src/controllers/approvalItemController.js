'use strict';
const { ApprovalItem } = require('../models');
const db = require('../models');
const { hasManageAccess, isApproverScoped, canAccessApprovalWorkflow, canAccessApprovalItem, approvalOwnershipSql } = require('../utils/ownershipScope');

exports.getAll = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can view approval items' });
        }

        if (isApproverScoped(req)) {
            const [rows] = await db.sequelize.query(
                `SELECT ai.*
				 FROM approval_items ai
				 INNER JOIN approval_workflows aw ON aw.approval_workflow_id = ai.approval_workflow_id
				 WHERE ${approvalOwnershipSql('aw', 'currentUserId')}
				 ORDER BY ai.created_at DESC`,
                { replacements: { currentUserId: req.userId } }
            );
            return res.json(rows || []);
        }

        return res.json(await ApprovalItem.findAll());
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.getById = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can view approval items' });
        }

        const record = await ApprovalItem.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Not found' });

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalItem(req, db, req.params.id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only access items for their surveys' });
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
            return res.status(403).json({ error: 'Only admin/approver can create approval items' });
        }

        if (!req.body || !req.body.approval_workflow_id) {
            return res.status(400).json({ error: 'approval_workflow_id is required' });
        }

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalWorkflow(req, db, req.body.approval_workflow_id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only create items for their surveys' });
            }
        }

        return res.status(201).json(await ApprovalItem.create(req.body));
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.update = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can update approval items' });
        }

        const record = await ApprovalItem.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Not found' });

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalItem(req, db, req.params.id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only update items for their surveys' });
            }

            if (Object.prototype.hasOwnProperty.call(req.body || {}, 'approval_workflow_id')) {
                const nextAllowed = await canAccessApprovalWorkflow(req, db, req.body.approval_workflow_id);
                if (!nextAllowed) {
                    return res.status(403).json({ error: 'Approvers can only move items to workflows for their surveys' });
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
            return res.status(403).json({ error: 'Only admin/approver can delete approval items' });
        }

        const record = await ApprovalItem.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Not found' });

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalItem(req, db, req.params.id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only delete items for their surveys' });
            }
        }

        await record.destroy();
        return res.json({ message: 'Deleted' });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
