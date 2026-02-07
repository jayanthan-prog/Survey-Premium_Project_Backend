const express = require('express');
const router = express.Router();
const enumController = require('../controllers/enumController');

// CRUD routes
router.get('/', enumController.getAllEnums);
router.get('/:name', enumController.getEnumByName);
router.post('/', enumController.createEnum);
router.put('/:name', enumController.updateEnum);
router.delete('/:name', enumController.deleteEnum);

module.exports = router;
