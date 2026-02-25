const os = require('os');
const fs = require('fs');
const path = require('path');

let startTs = null;

// System status - online/offline
const SYSTEM_STATUS_FILE = path.resolve(__dirname, '..', 'system-status.json');

function loadSystemStatus() {
  try {
    if (fs.existsSync(SYSTEM_STATUS_FILE)) {
      const raw = fs.readFileSync(SYSTEM_STATUS_FILE, 'utf8');
      return JSON.parse(raw || '{}');
    }
  } catch (err) {
    console.error('serverMeta: failed to load system status', err);
  }
  return { isOnline: true, offlineMessage: '' };
}

function saveSystemStatus(status) {
  try {
    fs.writeFileSync(SYSTEM_STATUS_FILE, JSON.stringify(status, null, 2), 'utf8');
  } catch (err) {
    console.error('serverMeta: failed to save system status', err);
  }
}

let systemStatus = loadSystemStatus();

module.exports = {
  setStart(ts = Date.now()) {
    startTs = ts;
    return startTs;
  },

  getStart() {
    return startTs;
  },

  getUptimeSeconds() {
    if (!startTs) return 0;
    return Math.floor((Date.now() - startTs) / 1000);
  },

  systemInfo() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalmem: os.totalmem()
    };
  },

  // System online/offline methods
  isSystemOnline() {
    return systemStatus.isOnline !== false;
  },

  getSystemStatus() {
    return { ...systemStatus };
  },

  setSystemOnline(online, message = '') {
    systemStatus.isOnline = online;
    systemStatus.offlineMessage = message;
    systemStatus.lastChanged = new Date().toISOString();
    saveSystemStatus(systemStatus);
    return systemStatus;
  },

  getOfflineMessage() {
    return systemStatus.offlineMessage || '';
  }
};
