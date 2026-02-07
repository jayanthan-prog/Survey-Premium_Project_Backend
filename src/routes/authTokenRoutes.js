const express = require('express');
const router = express.Router();
const authTokenController = require('../controllers/authTokenController');

router.get('/', authTokenController.getAllTokens);
router.get('/:id', authTokenController.getTokenById);
router.post('/', authTokenController.createToken);
router.put('/:id', authTokenController.updateToken);
router.delete('/:id', authTokenController.deleteToken);

module.exports = router;
