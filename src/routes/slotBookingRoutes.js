const express = require('express');
const router = express.Router();
const slotBookingController = require('../controllers/slotBookingController');

router.get('/', slotBookingController.getAllSlotBookings);
router.get('/:id', slotBookingController.getSlotBookingById);
router.post('/', slotBookingController.createSlotBooking);
router.put('/:id', slotBookingController.updateSlotBooking);
router.delete('/:id', slotBookingController.deleteSlotBooking);

module.exports = router;
