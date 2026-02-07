require('dotenv').config();
const express = require('express');
const app = express();

const userRoutes = require('./src/routes/userRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const relayStageActionRoutes = require('./src/routes/relayStageActionRoutes');
const relayWorkflowRoutes = require('./src/routes/relayWorkflowRoutes');
app.use(express.json());

// Mount routes
app.use('/users', userRoutes);
app.use('/groups', groupRoutes);
app.use('/api/relay-stage-actions', relayStageActionRoutes);
app.use('/api/relay-workflows', relayWorkflowRoutes);

// Use BASE_URL from .env
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const url = new URL(BASE_URL);
const HOST = url.hostname;
const PORT = url.port || 3000;
app.get('/', (req, res) => res.send('Survey Premium Backend API running!'));

app.listen(PORT, HOST, () => {
  console.log(`Server running at ${BASE_URL}`);
});
