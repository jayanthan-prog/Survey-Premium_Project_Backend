const express = require('express');
const router = express.Router();
const surveyAnswerSelectionController = require('../controllers/surveyAnswerSelectionController');

router.get('/', surveyAnswerSelectionController.getAllSelections);
router.get('/:id', surveyAnswerSelectionController.getSelectionById);
router.post('/', surveyAnswerSelectionController.createSelection);
router.put('/:id', surveyAnswerSelectionController.updateSelection);
router.delete('/:id', surveyAnswerSelectionController.deleteSelection);

module.exports = router;
