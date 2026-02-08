"use strict";
const express = require('express');
const router = express.Router();
const approvalWorkflow = require('../controllers/approvalWorkflowController');
const approvalStep = require('../controllers/approvalStepController');
const approvalItem = require('../controllers/approvalItemController');
const approvalAction = require('../controllers/approvalActionController');

router.get('/workflows', approvalWorkflow.getAll);
router.post('/workflows', approvalWorkflow.create);
router.get('/workflows/:id', approvalWorkflow.getById);
router.put('/workflows/:id', approvalWorkflow.update);
router.delete('/workflows/:id', approvalWorkflow.remove);

router.get('/steps', approvalStep.getAll);
router.post('/steps', approvalStep.create);
router.get('/steps/:id', approvalStep.getById);
router.put('/steps/:id', approvalStep.update);
router.delete('/steps/:id', approvalStep.remove);

router.get('/items', approvalItem.getAll);
router.post('/items', approvalItem.create);
router.get('/items/:id', approvalItem.getById);
router.put('/items/:id', approvalItem.update);
router.delete('/items/:id', approvalItem.remove);

router.get('/actions', approvalAction.getAll);
router.post('/actions', approvalAction.create);
router.get('/actions/:id', approvalAction.getById);
router.put('/actions/:id', approvalAction.update);
router.delete('/actions/:id', approvalAction.remove);

// Root index for approvals to avoid 404 on /api/approvals
router.get('/', (req, res) => {
	res.json({
		message: 'Approvals API root',
		endpoints: ['/workflows', '/steps', '/items', '/actions']
	});
});

module.exports = router;
// "use strict";
