const express = require('express');
const router = express.Router();
const relayStageController = require('../controllers/relayStageController');

router.get('/', relayStageController.getAllRelayStages);
router.get('/:id', relayStageController.getRelayStageById);
router.post('/', relayStageController.createRelayStage);
router.put('/:id', relayStageController.updateRelayStage);
router.delete('/:id', relayStageController.deleteRelayStage);

module.exports = router;
