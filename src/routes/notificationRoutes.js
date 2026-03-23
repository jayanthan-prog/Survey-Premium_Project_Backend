const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController');

router.get('/me', controller.getMyNotifications);
router.post('/me/read-all', controller.markAllNotificationsAsRead);
router.post('/me/:notificationId/read', controller.markNotificationAsRead);

module.exports = router;
