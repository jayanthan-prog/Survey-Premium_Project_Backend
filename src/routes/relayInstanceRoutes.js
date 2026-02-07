const express = require('express');
const router = express.Router();
const relayInstanceController = require('../controllers/relayInstanceController');

router.get('/', relayInstanceController.getAllRelayInstances);
router.get('/:id', relayInstanceController.getRelayInstanceById);
router.post('/', relayInstanceController.createRelayInstance);
router.put('/:id', relayInstanceController.updateRelayInstance);
router.delete('/:id', relayInstanceController.deleteRelayInstance);

module.exports = router;
