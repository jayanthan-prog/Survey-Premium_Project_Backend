'use strict';

const db = require('../models');

exports.getMyNotifications = async (req, res) => {
    try {
        const userId = Number(req.userId);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
        const onlyUnread = ['1', 'true', 'yes'].includes(String(req.query.onlyUnread || '').toLowerCase());

        const whereClauses = ['user_id = :userId'];
        const replacements = { userId, limit };

        if (onlyUnread) {
            whereClauses.push('is_read = 0');
        }

        const [rows] = await db.sequelize.query(
            `SELECT
        notification_id,
        notification_type,
        title,
        message,
        is_read,
        read_at,
        meta,
        created_at
       FROM user_notifications
       WHERE ${whereClauses.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT :limit`,
            { replacements }
        );

        const [unreadRows] = await db.sequelize.query(
            `SELECT COUNT(*) AS unread_count
       FROM user_notifications
       WHERE user_id = :userId AND is_read = 0`,
            { replacements: { userId } }
        );

        return res.json({
            notifications: rows || [],
            unread_count: Number(unreadRows && unreadRows[0] ? unreadRows[0].unread_count : 0),
        });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to fetch notifications' });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const userId = Number(req.userId);
        const notificationId = Number(req.params.notificationId);

        const [result] = await db.sequelize.query(
            `UPDATE user_notifications
       SET is_read = 1,
           read_at = COALESCE(read_at, NOW()),
           updated_at = NOW()
       WHERE notification_id = :notificationId
         AND user_id = :userId`,
            { replacements: { notificationId, userId } }
        );

        if (!result || result.affectedRows === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        return res.json({ message: 'Notification marked as read', notification_id: notificationId });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to update notification' });
    }
};

exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = Number(req.userId);

        const [result] = await db.sequelize.query(
            `UPDATE user_notifications
       SET is_read = 1,
           read_at = COALESCE(read_at, NOW()),
           updated_at = NOW()
       WHERE user_id = :userId
         AND is_read = 0`,
            { replacements: { userId } }
        );

        return res.json({
            message: 'Notifications marked as read',
            updated: Number(result && result.affectedRows ? result.affectedRows : 0),
        });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to update notifications' });
    }
};
