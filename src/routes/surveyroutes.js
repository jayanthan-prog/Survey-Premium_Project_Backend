const express = require('express');
const router = express.Router();
const controller = require('../controllers/survey.controller');

router.get('/', controller.getSurveys);
router.post('/', controller.createSurvey);
router.get('/:id', controller.getSurveyById);
router.put('/:id', controller.updateSurvey);
router.delete('/:id', controller.deleteSurvey);
router.post('/:id/publish', controller.publishSurvey);
router.post('/:id/unpublish', controller.unpublishSurvey);
router.post('/:id/archive', controller.archiveSurvey);
router.post('/:id/generate-otp', controller.generateSurveyOtp);
router.get('/:id/report', controller.getSurveyReport);
router.post('/:id/submit', controller.submitSurvey);
router.get('/:id/responses', controller.getSurveyResponses);
router.get('/:id/responses/export', controller.exportSurveyResponses);
router.get('/:id/responses/:participationId', controller.getSurveyResponseById);
router.delete('/:id/responses/:participationId', controller.deleteSurveyResponse);

// Release management
router.get('/:id/releases', controller.getReleasesForSurvey);
router.post('/:id/releases', controller.createRelease);
router.put('/:id/releases/:releaseId', controller.updateRelease);
router.delete('/:id/releases/:releaseId', controller.deleteRelease);

module.exports = router;

