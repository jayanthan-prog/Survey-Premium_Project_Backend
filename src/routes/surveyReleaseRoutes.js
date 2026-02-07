const express = require('express');
const router = express.Router();
const surveyReleaseController = require('../controllers/surveyReleaseController');

router.get('/', surveyReleaseController.getAllSurveyReleases);
router.get('/:id', surveyReleaseController.getSurveyReleaseById);
router.post('/', surveyReleaseController.createSurveyRelease);
router.put('/:id', surveyReleaseController.updateSurveyRelease);
router.delete('/:id', surveyReleaseController.deleteSurveyRelease);

module.exports = router;
