'use strict';

const express = require('express');
const router = express.Router();
const allocationTaskController = require('../controllers/allocationTaskController');

router.get('/', allocationTaskController.getAllAllocationTasks);
router.get('/:id', allocationTaskController.getAllocationTaskById);
router.post('/', allocationTaskController.createAllocationTask);
router.put('/:id', allocationTaskController.updateAllocationTask);
router.delete('/:id', allocationTaskController.deleteAllocationTask);

module.exports = router;
