#!/usr/bin/env node
require('dotenv').config();
const app = require('../src/api');
const port = process.env.TEMP_PORT || 3002;
app.listen(port, () => console.log(`TEMP_API_UP_${port}`));
