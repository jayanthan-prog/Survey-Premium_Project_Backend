const express = require('express');
const router = express.Router();
const calendarSlotController = require('../controllers/calendarSlotController');

router.get('/', calendarSlotController.getAllSlots);
router.get('/:id', calendarSlotController.getSlotById);
router.post('/', calendarSlotController.createSlot);
router.put('/:id', calendarSlotController.updateSlot);
router.delete('/:id', calendarSlotController.deleteSlot);

module.exports = router;  // ✅ MUST export the router
