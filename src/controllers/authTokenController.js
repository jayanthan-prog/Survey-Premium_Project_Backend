const db = require('../models');
const AuthToken = db.AuthToken;

exports.getAllTokens = async (req, res) => {
  try {
    const tokens = await AuthToken.findAll();
    res.json(tokens);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
};

exports.getTokenById = async (req, res) => {
  try {
    const token = await AuthToken.findByPk(req.params.id);
    if (!token) return res.status(404).json({ error: 'Token not found' });
    res.json(token);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
};

exports.createToken = async (req, res) => {
  try {
    const token = await AuthToken.create(req.body);
    res.status(201).json(token);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create token' });
  }
};

exports.updateToken = async (req, res) => {
  try {
    const token = await AuthToken.findByPk(req.params.id);
    if (!token) return res.status(404).json({ error: 'Token not found' });
    await token.update(req.body);
    res.json(token);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update token' });
  }
};

exports.deleteToken = async (req, res) => {
  try {
    const token = await AuthToken.findByPk(req.params.id);
    if (!token) return res.status(404).json({ error: 'Token not found' });
    await token.destroy();
    res.json({ message: 'Token deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete token' });
  }
};
