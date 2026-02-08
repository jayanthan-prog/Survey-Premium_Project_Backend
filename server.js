require('dotenv').config();
const app = require('./src/api');
const sequelize = require('./src/config/database');

// Use BASE_URL from .env (fallback to http://localhost:3000)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const url = new URL(BASE_URL);
const HOST = url.hostname;
const PORT = Number(url.port) || 3000;

// Small cyber-style banner
function banner() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Survey Premium Backend — initializing startup flow   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

// spinner used during async operations
function withSpinner(promise, { text = 'Working' } = {}) {
  const chars = ['|', '/', '-', '\\'];
  let i = 0;
  const timer = setInterval(() => {
    process.stdout.write(`\r${text} ${chars[i++ % chars.length]}`);
  }, 120);
  return promise
    .then((res) => {
      clearInterval(timer);
      process.stdout.write('\r');
      return res;
    })
    .catch((err) => {
      clearInterval(timer);
      process.stdout.write('\r');
      throw err;
    });
}

async function init() {
  banner();
  console.log('-> Initializing database connection...');

  try {
    await withSpinner(sequelize.authenticate(), { text: 'Connecting to DB' });
    console.log('✅ Database connection established');
  } catch (err) {
    console.error('\n❌ Failed to connect to the database:');
    console.error(err && (err.stack || err.message || err));
    process.exit(1);
  }

  // start the HTTP server after DB is OK
  app.listen(PORT, HOST, () => {
    console.log(`\nServer running at ${BASE_URL}`);
    console.log('Ready to receive requests.');
  });
}

init();
