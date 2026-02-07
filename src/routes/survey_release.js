const express = require('express');
const router = express.Router();
const controller = require('../controllers/surveyReleaseController');

router.post('/', controller.create);
router.get('/survey/:surveyId', controller.getBySurvey);
router.get('/:id', controller.getOne);
router.put('/:id', controller.update);
router.patch('/:id/freeze', controller.toggleFreeze);
router.delete('/:id', controller.remove);

module.exports = router;
