const express = require('express');
const router = express.Router();
const controller = require('../controllers/survey.controller');

router.get('/', controller.getSurveys);
router.post('/', controller.createSurvey);
router.get('/:id', controller.getSurveyById);

module.exports = router;

