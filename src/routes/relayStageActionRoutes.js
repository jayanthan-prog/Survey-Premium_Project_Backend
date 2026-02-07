'use strict';
const express = require('express');
const router = express.Router();
const relayStageActionController = require('../controllers/relayStageActionController');

// REST endpoints
router.get('/', relayStageActionController.getAllRelayStageActions);
router.get('/:id', relayStageActionController.getRelayStageActionById);
router.post('/', relayStageActionController.createRelayStageAction);
router.put('/:id', relayStageActionController.updateRelayStageAction);
router.delete('/:id', relayStageActionController.deleteRelayStageAction);

module.exports = router;
