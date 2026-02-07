 'use strict';
const express = require('express');
const router = express.Router();
const relayWorkflowController = require('../controllers/relayWorkflowController');

// REST endpoints
router.get('/', relayWorkflowController.getAllRelayWorkflows);
router.get('/:id', relayWorkflowController.getRelayWorkflowById);
router.post('/', relayWorkflowController.createRelayWorkflow);
router.put('/:id', relayWorkflowController.updateRelayWorkflow);
router.delete('/:id', relayWorkflowController.deleteRelayWorkflow);

module.exports = router;
