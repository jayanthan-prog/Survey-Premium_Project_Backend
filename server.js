require('dotenv').config();
const express = require('express');
const app = express();

const userRoutes = require('./src/routes/userRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const relayStageActionRoutes = require('./src/routes/relayStageActionRoutes');
const relayWorkflowRoutes = require('./src/routes/relayWorkflowRoutes');
app.use(express.json());
const actionPlanItemRoutes = require('./src/routes/actionPlanItemRoutes');
const actionPlanRoutes = require('./src/routes/actionPlanRoutes');
const auditEventRoutes = require('./src/routes/auditEventRoutes');
const auditLogRoutes = require('./src/routes/auditLogRoutes');
const authTokenRoutes = require('./src/routes/authTokenRoutes');
const calendarSlotRoutes = require('./src/routes/calendarSlotRoutes');
const enumRoutes = require('./src/routes/enumRoutes');
const groupMemberRoutes = require('./src/routes/groupMemberRoutes');
const relayInstanceRoutes = require('./src/routes/relayInstanceRoutes');
const relayStageRoutes = require('./src/routes/relayStageRoutes');
const slotBookingRoutes = require('./src/routes/slotBookingRoutes');
const surveyAnswerSelectionRoutes = require('./src/routes/surveyAnswerSelectionRoutes');
const surveyAnswerRoutes = require('./src/routes/survey_answer');
const surveyOptionRoutes = require('./src/routes/survey_options');
const survey_participants = require('./src/routes/survey_participant');
const surveyQuestionRoutes = require('./src/routes/surveyQuestionRoutes');
const surveyReleaseRoutes = require('./src/routes/surveyReleaseRoutes');


// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/relay-stage-actions', relayStageActionRoutes);
app.use('/api/relay-workflows', relayWorkflowRoutes);
app.use('/api/action-plan-items', actionPlanItemRoutes);
app.use('/api/action-plans', actionPlanRoutes);
app.use('/api/audit-events', auditEventRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/auth-tokens', authTokenRoutes);
app.use('/api/calendar-slots', calendarSlotRoutes);
app.use('/api/enums', enumRoutes);
app.use('/api/group-members', groupMemberRoutes);
app.use('/api/relay-instances', relayInstanceRoutes);
app.use('/api/relay-stages', relayStageRoutes);
app.use('/api/slot-bookings', slotBookingRoutes);
app.use('/api/survey-answer-selections', surveyAnswerSelectionRoutes);
app.use('/api/survey_answers', surveyAnswerRoutes);
app.use('/api/survey_options', surveyOptionRoutes);
app.use('/api/survey_participants', survey_participants);
app.use('/api/survey_question_options', require('./src/routes/survey_question_option'));
app.use('/api/survey-questions', surveyQuestionRoutes);
app.use('/api/survey-releases', surveyReleaseRoutes);

// Use BASE_URL from .env
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const url = new URL(BASE_URL);
const HOST = url.hostname;
const PORT = url.port || 3000;
app.get('/', (req, res) => res.send('Survey Premium Backend API running!'));

app.listen(PORT, HOST, () => {
  console.log(`Server running at ${BASE_URL}`);
});
