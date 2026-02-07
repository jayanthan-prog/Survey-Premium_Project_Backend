const express = require('express');
const router = express.Router();
const groupMemberController = require('../controllers/groupMemberController');

// CRUD routes
router.get('/', groupMemberController.getAllGroupMembers);
router.get('/:group_id/:user_id', groupMemberController.getGroupMember);
router.post('/', groupMemberController.createGroupMember);
router.put('/:group_id/:user_id', groupMemberController.updateGroupMember);
router.delete('/:group_id/:user_id', groupMemberController.deleteGroupMember);

module.exports = router;
