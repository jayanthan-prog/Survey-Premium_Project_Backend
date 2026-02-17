const fs = require('fs');
const path = require('path');

const STORE = path.resolve(__dirname, '..', 'feature-flags.json');

function load() {
  try {
    if (fs.existsSync(STORE)) {
      const raw = fs.readFileSync(STORE, 'utf8');
      return JSON.parse(raw || '{}');
    }
  } catch (err) {
    console.error('featureFlags: failed to load store', err);
  }
  return {};
}

function save(obj) {
  try {
    fs.writeFileSync(STORE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.error('featureFlags: failed to save store', err);
  }
}

const flags = load();

module.exports = {
  getFlags() {
    return Object.assign({}, flags);
  },

  isEnabled(apiPath) {
    if (Object.prototype.hasOwnProperty.call(flags, apiPath)) {
      return !!flags[apiPath];
    }
    return true;
  },

  setFlag(apiPath, enabled) {
    flags[apiPath] = !!enabled;
    save(flags);
    return flags[apiPath];
  }
};
