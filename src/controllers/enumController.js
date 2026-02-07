const Enum = require('../models/enum');

// GET all enums
exports.getAllEnums = async (req, res) => {
  try {
    const enums = await Enum.findAll();
    res.status(200).json(enums);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET enum by name
exports.getEnumByName = async (req, res) => {
  try {
    const { name } = req.params;
    const enumItem = await Enum.findOne({ where: { name } });
    if (!enumItem) return res.status(404).json({ message: 'Enum not found' });
    res.status(200).json(enumItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE enum
exports.createEnum = async (req, res) => {
  try {
    const { name, value } = req.body;
    const newEnum = await Enum.create({ name, value });
    res.status(201).json(newEnum);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE enum by name
exports.updateEnum = async (req, res) => {
  try {
    const { name } = req.params;
    const { value } = req.body;

    const enumItem = await Enum.findOne({ where: { name } });
    if (!enumItem) return res.status(404).json({ message: 'Enum not found' });

    enumItem.value = value;
    await enumItem.save();

    res.status(200).json(enumItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE enum by name
exports.deleteEnum = async (req, res) => {
  try {
    const { name } = req.params;
    const deleted = await Enum.destroy({ where: { name } });
    if (!deleted) return res.status(404).json({ message: 'Enum not found' });
    res.status(200).json({ message: 'Enum deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
