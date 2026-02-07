const express = require('express');
const router = express.Router();
const surveyParticipantController = require('../controllers/surveyParticipantController');

router.get('/', surveyParticipantController.getAllParticipants);
router.get('/:id', surveyParticipantController.getParticipantById);
router.post('/', surveyParticipantController.createParticipant);
router.put('/:id', surveyParticipantController.updateParticipant);
router.delete('/:id', surveyParticipantController.deleteParticipant);

module.exports = router;
