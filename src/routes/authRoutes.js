const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware');

// Login does not require an auth token
router.post('/login', authController.login);

// Logout requires the token to be present
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
