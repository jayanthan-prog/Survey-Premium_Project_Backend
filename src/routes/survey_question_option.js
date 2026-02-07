const express = require('express');
const router = express.Router();
const surveyQuestionOptionController = require('../controllers/surveyQuestionOptionController');

router.get('/', surveyQuestionOptionController.getAllOptions);
router.get('/:id', surveyQuestionOptionController.getOptionById);
router.post('/', surveyQuestionOptionController.createOption);
router.put('/:id', surveyQuestionOptionController.updateOption);
router.delete('/:id', surveyQuestionOptionController.deleteOption);

module.exports = router;
