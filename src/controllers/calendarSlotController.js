const CalendarSlot = require('../models/calendar_slot');

exports.getAllSlots = async (req, res) => {
  try {
    const slots = await CalendarSlot.findAll();
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch calendar slots' });
  }
};

exports.getSlotById = async (req, res) => {
  try {
    const slot = await CalendarSlot.findByPk(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Calendar slot not found' });
    res.json(slot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch calendar slot' });
  }
};

exports.createSlot = async (req, res) => {
  try {
    const slot = await CalendarSlot.create(req.body);
    res.status(201).json(slot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create calendar slot' });
  }
};

exports.updateSlot = async (req, res) => {
  try {
    const slot = await CalendarSlot.findByPk(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Calendar slot not found' });
    await slot.update(req.body);
    res.json(slot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update calendar slot' });
  }
};

exports.deleteSlot = async (req, res) => {
  try {
    const slot = await CalendarSlot.findByPk(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Calendar slot not found' });
    await slot.destroy();
    res.json({ message: 'Calendar slot deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete calendar slot' });
  }
};
