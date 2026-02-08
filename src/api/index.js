'use strict';
const express = require('express');
const app = express();

// Swagger UI
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger/swagger.json');

app.use(express.json());

// Middleware
const { requestLogger, requireAuth, notFound, errorHandler } = require('../middleware');
app.use(requestLogger);

// Route modules
const userRoutes = require('../routes/userRoutes');
const groupRoutes = require('../routes/groupRoutes');
const relayStageActionRoutes = require('../routes/relayStageActionRoutes');
const relayWorkflowRoutes = require('../routes/relayWorkflowRoutes');
const actionPlanItemRoutes = require('../routes/actionPlanItemRoutes');
const actionPlanRoutes = require('../routes/actionPlanRoutes');
const auditEventRoutes = require('../routes/auditEventRoutes');
const auditLogRoutes = require('../routes/auditLogRoutes');
const authTokenRoutes = require('../routes/authTokenRoutes');
const calendarSlotRoutes = require('../routes/calendarSlotRoutes');
const enumRoutes = require('../routes/enumRoutes');
const groupMemberRoutes = require('../routes/groupMemberRoutes');
const relayInstanceRoutes = require('../routes/relayInstanceRoutes');
const relayStageRoutes = require('../routes/relayStageRoutes');
const slotBookingRoutes = require('../routes/slotBookingRoutes');
const surveyAnswerSelectionRoutes = require('../routes/surveyAnswerSelectionRoutes');
const surveyAnswerRoutes = require('../routes/survey_answer');
const surveyOptionRoutes = require('../routes/survey_options');
const survey_participants = require('../routes/survey_participant');
const surveyQuestionRoutes = require('../routes/surveyQuestionRoutes');
const surveyReleaseRoutes = require('../routes/surveyReleaseRoutes');
const surveyRoutes = require('../routes/surveyroutes');
const approvalRoutes = require('../routes/approvalRoutes');
const roleRoutes = require('../routes/roleRoutes');
const permissionRoutes = require('../routes/permissionRoutes');
const rolePermissionRoutes = require('../routes/rolePermissionRoutes');
const optionCapacityRoutes = require('../routes/optionCapacityRoutes');
const optionQuotaBucketRoutes = require('../routes/optionQuotaBucketRoutes');
const surveySessionRoutes = require('../routes/surveySessionRoutes');
const authRoutes = require('../routes/authRoutes');

// Mount public-auth routes first (login/logout)
app.use('/api', authRoutes);

// Swagger UI route (API docs) - keep public
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api/docs.json', (req, res) => res.json(swaggerDocument));

// Apply auth middleware to all later /api routes
app.use('/api', requireAuth);

// Mount routes under /api (protected)
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
app.use('/api/survey_question_options', require('../routes/survey_question_option'));
app.use('/api/survey-questions', surveyQuestionRoutes);
app.use('/api/survey-releases', surveyReleaseRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/user-roles', require('../routes/userRole.routes'));
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/role-permissions', rolePermissionRoutes);
app.use('/api/option-capacities', optionCapacityRoutes);
app.use('/api/option-quota-buckets', optionQuotaBucketRoutes);
app.use('/api/survey-sessions', surveySessionRoutes);


app.get('/', (req, res) => res.send('Survey Premium Backend API running (modular app)!'));

// 404 / error handlers (should be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
