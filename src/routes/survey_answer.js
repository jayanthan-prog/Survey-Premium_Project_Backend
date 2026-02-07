const express = require('express');
const router = express.Router();
const surveyAnswerController = require('../controllers/surveyAnswerController');

// CRUD routes for survey answers
router.get('/', surveyAnswerController.getAllAnswers);          // Get all answers
router.get('/:id', surveyAnswerController.getAnswerById);      // Get answer by ID
router.post('/', surveyAnswerController.createAnswer);         // Create new answer
router.put('/:id', surveyAnswerController.updateAnswer);       // Update answer by ID
router.delete('/:id', surveyAnswerController.deleteAnswer);    // Delete answer by ID

module.exports = router;
