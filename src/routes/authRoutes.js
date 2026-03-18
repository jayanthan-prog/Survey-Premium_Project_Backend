const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware');

// Login does not require an auth token
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);

// Logout requires the token to be present
router.post('/logout', requireAuth, authController.logout);

// Current user profile
router.get('/me', requireAuth, authController.me);
router.patch('/me', requireAuth, authController.updateMe);
router.get('/dashboard', requireAuth, authController.dashboard);

module.exports = router;
