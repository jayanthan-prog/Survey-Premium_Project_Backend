'use strict';
const express = require('express');
const router = express.Router();
const actionPlanController = require('../controllers/actionPlanController');

router.get('/', actionPlanController.getAllActionPlans);
router.get('/:id', actionPlanController.getActionPlanById);
router.post('/', actionPlanController.createActionPlan);
router.put('/:id', actionPlanController.updateActionPlan);
router.delete('/:id', actionPlanController.deleteActionPlan);

module.exports = router;
