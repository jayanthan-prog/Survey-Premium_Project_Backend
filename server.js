require('dotenv').config();
// Import the modular API app which mounts all routes
const app = require('./src/api');

// Use BASE_URL from .env (fallback to localhost:3000)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const url = new URL(BASE_URL);
const HOST = url.hostname;
const PORT = url.port || 3000;

app.listen(PORT, HOST, () => {
  console.log(`Server running at ${BASE_URL}`);
});
