const fs = require('fs');
const path = require('path');

const STORE = path.resolve(__dirname, '..', 'feature-flags.json');

// In-memory cache that persists across server restarts (loaded from file)
let flags = {};

function load() {
  try {
    if (fs.existsSync(STORE)) {
      const raw = fs.readFileSync(STORE, 'utf8');
      const loaded = JSON.parse(raw || '{}');
      console.log('[FeatureFlags] Loaded flags:', JSON.stringify(loaded));
      return loaded;
    }
  } catch (err) {
    console.error('featureFlags: failed to load store', err);
  }
  return {};
}

function save(obj) {
  try {
    fs.writeFileSync(STORE, JSON.stringify(obj, null, 2), 'utf8');
    console.log('[FeatureFlags] Saved flags:', JSON.stringify(obj));
  } catch (err) {
    console.error('featureFlags: failed to save store', err);
  }
}

// Initialize flags on module load
flags = load();

module.exports = {
  getFlags() {
    return Object.assign({}, flags);
  },

  isEnabled(apiPath) {
    // If the path is explicitly set in flags, use that value
    if (Object.prototype.hasOwnProperty.call(flags, apiPath)) {
      const enabled = !!flags[apiPath];
      console.log(`[FeatureFlags] isEnabled('${apiPath}') => ${enabled} (explicit)`);
      return enabled;
    }
    // Default to true if not explicitly set
    console.log(`[FeatureFlags] isEnabled('${apiPath}') => true (default)`);
    return true;
  },

  setFlag(apiPath, enabled) {
    // Once set, the value persists forever until explicitly changed
    flags[apiPath] = !!enabled;
    save(flags);
    console.log(`[FeatureFlags] setFlag('${apiPath}', ${enabled}) => persisted`);
    return flags[apiPath];
  },

  // Clear a flag (reset to default behavior)
  clearFlag(apiPath) {
    delete flags[apiPath];
    save(flags);
    console.log(`[FeatureFlags] clearFlag('${apiPath}') => reset to default`);
    return true;
  }
};
