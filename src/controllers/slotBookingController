const SlotBooking = require('../models/slot_booking');

// Get all slot bookings
exports.getAllSlotBookings = async (req, res) => {
  try {
    const bookings = await SlotBooking.findAll();
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch slot bookings' });
  }
};

// Get slot booking by ID
exports.getSlotBookingById = async (req, res) => {
  try {
    const booking = await SlotBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Slot booking not found' });
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch slot booking' });
  }
};

// Create a new slot booking
exports.createSlotBooking = async (req, res) => {
  try {
    const newBooking = await SlotBooking.create(req.body);
    res.status(201).json(newBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create slot booking' });
  }
};

// Update slot booking
exports.updateSlotBooking = async (req, res) => {
  try {
    const booking = await SlotBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Slot booking not found' });
    await booking.update(req.body);
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update slot booking' });
  }
};

// Delete slot booking
exports.deleteSlotBooking = async (req, res) => {
  try {
    const booking = await SlotBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Slot booking not found' });
    await booking.destroy();
    res.json({ message: 'Slot booking deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete slot booking' });
  }
};
