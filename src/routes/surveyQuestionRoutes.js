const express = require('express');
const router = express.Router();
const surveyQuestionController = require('../controllers/surveyQuestionController');

router.get('/', surveyQuestionController.getAllSurveyQuestions);
router.get('/:id', surveyQuestionController.getSurveyQuestionById);
router.post('/', surveyQuestionController.createSurveyQuestion);
router.put('/:id', surveyQuestionController.updateSurveyQuestion);
router.delete('/:id', surveyQuestionController.deleteSurveyQuestion);

module.exports = router;
