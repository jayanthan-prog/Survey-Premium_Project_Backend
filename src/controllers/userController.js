const User = require('../models/users'); // match exact filename, lowercase

exports.getAllUsers = async (req, res) => {
  try { res.json(await User.findAll()); }
  catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if(!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch(e){ res.status(500).json({ error: e.message }); }
};

exports.createUser = async (req, res) => {
  try { res.status(201).json(await User.create(req.body)); }
  catch(e){ res.status(500).json({ error: e.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if(!user) return res.status(404).json({ message: 'User not found' });
    await user.update(req.body);
    res.json(user);
  } catch(e){ res.status(500).json({ error: e.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if(!user) return res.status(404).json({ message: 'User not found' });
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch(e){ res.status(500).json({ error: e.message }); }
};
