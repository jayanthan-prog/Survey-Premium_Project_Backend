'use strict';
const express = require('express');
const router = express.Router();
const auditEventController = require('../controllers/auditEventController');

router.get('/', auditEventController.getAllAuditEvents);
router.get('/:id', auditEventController.getAuditEventById);
router.post('/', auditEventController.createAuditEvent);
router.put('/:id', auditEventController.updateAuditEvent);
router.delete('/:id', auditEventController.deleteAuditEvent);

module.exports = router;
