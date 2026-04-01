const express = require('express');
const router = express.Router();

// GET /api/venues
router.get('/', (req, res) => {
    // Placeholder implementation - return empty array
    res.json({ venues: [] });
});

module.exports = router;