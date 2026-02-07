const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupcontroller'); // must match file

// Routes (no /groups prefix here, mount in server.js)
router.get('/', groupController.getAllGroups);
router.get('/:id', groupController.getGroupById);
router.post('/', groupController.createGroup);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

module.exports = router;
