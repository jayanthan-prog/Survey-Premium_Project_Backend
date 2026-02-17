const fs = require('fs');
const path = require('path');
const db = require('../models');

const GENERATED_DIR = path.join(__dirname, '..', 'routes');
const MANIFEST_DIR = path.join(__dirname, '..', 'generated');
const MANIFEST_PATH = path.join(MANIFEST_DIR, 'generated-manifest.json');

function ensureDirs() {
  if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });
  if (!fs.existsSync(MANIFEST_DIR)) fs.mkdirSync(MANIFEST_DIR, { recursive: true });
}

function readManifest() {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) return {};
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8') || '{}');
  } catch (e) {
    return {};
  }
}

function writeManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
}

function buildRouteFileContent(modelKey, allowed) {
  const lower = modelKey.toLowerCase();
  // Use a safe JSON string for allowed fields
  const allowedJson = JSON.stringify(allowed || []);

  return `const express = require('express');
const router = express.Router();
const db = require('../models');
const { requireAdmin } = require('../middleware');
const Model = db['${modelKey}'];
const allowedFields = ${allowedJson};

function pickAllowed(obj) {
  const out = {};
  if (!obj) return out;
  allowedFields.forEach(k => { if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k]; });
  return out;
}

// List
router.get('/generated/${lower}/', requireAdmin, async (req, res) => {
  try {
    const rows = await Model.findAll({ attributes: allowedFields.length ? allowedFields : undefined, limit: 100 });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get by PK
router.get('/generated/${lower}/:id', requireAdmin, async (req, res) => {
  try {
    const r = await Model.findByPk(req.params.id, { attributes: allowedFields.length ? allowedFields : undefined });
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create
router.post('/generated/${lower}/', requireAdmin, express.json(), async (req, res) => {
  try {
    const payload = pickAllowed(req.body || {});
    const created = await Model.create(payload);
    res.status(201).json(created);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update
router.put('/generated/${lower}/:id', requireAdmin, express.json(), async (req, res) => {
  try {
    const item = await Model.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const payload = pickAllowed(req.body || {});
    const updated = await item.update(payload);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete
router.delete('/generated/${lower}/:id', requireAdmin, async (req, res) => {
  try {
    const item = await Model.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await item.destroy();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
`;
}

async function createGeneratedApi(modelKey, allowedFields) {
  ensureDirs();
  if (!modelKey) throw new Error('Missing modelKey');
  if (!Object.keys(db).includes(modelKey)) throw new Error('Model not found: ' + modelKey);

  const manifest = readManifest();
  const key = modelKey;
  const lower = key.toLowerCase();

  // ensure allowedFields are valid
  const Model = db[key];
  const modelAttrs = Model && Model.rawAttributes ? Object.keys(Model.rawAttributes) : [];
  let allowed = Array.isArray(allowedFields) && allowedFields.length ? allowedFields.slice() : modelAttrs.slice();
  allowed = allowed.filter(f => modelAttrs.includes(f));

  const filename = path.join(GENERATED_DIR, 'generated-' + lower + '.js');
  const content = buildRouteFileContent(key, allowed);
  fs.writeFileSync(filename, content, 'utf8');

  // update manifest
  manifest[key] = { file: path.relative(path.join(__dirname, '..'), filename), allowedFields: allowed, createdAt: new Date().toISOString() };
  writeManifest(manifest);

  const paths = ['/admin/generated/' + lower + '/', '/admin/generated/' + lower + '/:id'];
  return { ok: true, paths, allowedFields: allowed };
}

function listGenerated() {
  ensureDirs();
  const manifest = readManifest();
  return manifest;
}

module.exports = { createGeneratedApi, listGenerated };
