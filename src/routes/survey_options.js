const express = require('express');
const router = express.Router();
const surveyOptionController = require('../controllers/surveyOptionController');

router.get('/', surveyOptionController.getAllOptions);
router.get('/:id', surveyOptionController.getOptionById);
router.post('/', surveyOptionController.createOption);
router.put('/:id', surveyOptionController.updateOption);
router.delete('/:id', surveyOptionController.deleteOption);

module.exports = router;
