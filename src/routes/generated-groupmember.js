const express = require('express');
const router = express.Router();
const db = require('../models');
const { requireAdmin } = require('../middleware');
const Model = db['GroupMember'];
const allowedFields = ["group_id"];

function pickAllowed(obj) {
  const out = {};
  if (!obj) return out;
  allowedFields.forEach(k => { if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k]; });
  return out;
}

// List
router.get('/generated/groupmember/', requireAdmin, async (req, res) => {
  try {
    const rows = await Model.findAll({ attributes: allowedFields.length ? allowedFields : undefined, limit: 100 });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get by PK
router.get('/generated/groupmember/:id', requireAdmin, async (req, res) => {
  try {
    const r = await Model.findByPk(req.params.id, { attributes: allowedFields.length ? allowedFields : undefined });
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create
router.post('/generated/groupmember/', requireAdmin, express.json(), async (req, res) => {
  try {
    const payload = pickAllowed(req.body || {});
    const created = await Model.create(payload);
    res.status(201).json(created);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update
router.put('/generated/groupmember/:id', requireAdmin, express.json(), async (req, res) => {
  try {
    const item = await Model.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const payload = pickAllowed(req.body || {});
    const updated = await item.update(payload);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete
router.delete('/generated/groupmember/:id', requireAdmin, async (req, res) => {
  try {
    const item = await Model.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await item.destroy();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
