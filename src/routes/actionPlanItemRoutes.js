'use strict';
const express = require('express');
const router = express.Router();
const actionPlanItemController = require('../controllers/actionPlanItemController');

router.get('/', actionPlanItemController.getAllActionPlanItems);
router.get('/:id', actionPlanItemController.getActionPlanItemById);
router.post('/', actionPlanItemController.createActionPlanItem);
router.put('/:id', actionPlanItemController.updateActionPlanItem);
router.delete('/:id', actionPlanItemController.deleteActionPlanItem);

module.exports = router;
