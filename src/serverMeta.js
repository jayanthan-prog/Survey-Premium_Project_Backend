const os = require('os');

let startTs = null;

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
  }
};
