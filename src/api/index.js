'use strict';
const express = require('express');
const cors = require('cors');
const app = express();

// Swagger UI
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger/swagger.json');

app.use(express.json());
// accept URL-encoded form bodies for the admin UI login form
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Middleware
const { requestLogger, notFound, errorHandler, apiGatekeeper, requireAuth, requireAnyRole } = require('../middleware');
app.use(requestLogger);

// Route modules
const authRoutes = require('../routes/authRoutes');
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
const adminRoutes = require('../routes/adminRoutes');
const adminUiRoutes = require('../routes/adminUiRoutes');

// Auto-load any generated admin route files so persisted generated APIs are mounted at startup.
const fs = require('fs');
const path = require('path');
try {
	const routesDir = path.join(__dirname, '..', 'routes');
	if (fs.existsSync(routesDir)) {
		fs.readdirSync(routesDir).filter(f => f.startsWith('generated-') && f.endsWith('.js')).forEach(f => {
			try {
				// mount under /admin so files with paths like /generated/<model> work
				app.use('/admin', require('../routes/' + f));
				console.log('Mounted generated admin route:', f);
			} catch (e) { /* ignore load errors at startup */ }
		});
	}
} catch (e) { /* ignore */ }

// Swagger UI route (API docs)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api/docs.json', (req, res) => res.json(swaggerDocument));

// Auth routes (login/logout) - mounted before gatekeeper
app.use('/api/auth', authRoutes);

// Gatekeeper: block/allow API routes based on admin toggles and feature flags
app.use('/api', apiGatekeeper);
app.use('/api', requireAuth);

// Mount routes under /api
app.use('/api/users', requireAnyRole(['ADMIN', 'APPROVER']), userRoutes);
app.use('/api/groups', requireAnyRole(['ADMIN', 'APPROVER']), groupRoutes);
app.use('/api/relay-stage-actions', requireAnyRole(['ADMIN', 'APPROVER']), relayStageActionRoutes);
app.use('/api/relay-workflows', requireAnyRole(['ADMIN', 'APPROVER']), relayWorkflowRoutes);
app.use('/api/action-plan-items', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), actionPlanItemRoutes);
app.use('/api/action-plans', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), actionPlanRoutes);
app.use('/api/audit-events', requireAnyRole(['ADMIN']), auditEventRoutes);
app.use('/api/audit-logs', requireAnyRole(['ADMIN']), auditLogRoutes);
app.use('/api/auth-tokens', requireAnyRole(['ADMIN']), authTokenRoutes);
app.use('/api/calendar-slots', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), calendarSlotRoutes);
app.use('/api/enums', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), enumRoutes);
app.use('/api/group-members', requireAnyRole(['ADMIN', 'APPROVER']), groupMemberRoutes);
app.use('/api/relay-instances', requireAnyRole(['ADMIN', 'APPROVER']), relayInstanceRoutes);
app.use('/api/relay-stages', requireAnyRole(['ADMIN', 'APPROVER']), relayStageRoutes);
app.use('/api/slot-bookings', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), slotBookingRoutes);
app.use('/api/survey-answer-selections', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), surveyAnswerSelectionRoutes);
app.use('/api/survey_answers', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), surveyAnswerRoutes);
app.use('/api/survey_options', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), surveyOptionRoutes);
app.use('/api/survey_participants', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), survey_participants);
app.use('/api/survey_question_options', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), require('../routes/survey_question_option'));
app.use('/api/survey-questions', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), surveyQuestionRoutes);
app.use('/api/survey-releases', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), surveyReleaseRoutes);
app.use('/api/surveys', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), surveyRoutes);
app.use('/api/approvals', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), approvalRoutes);
app.use('/api/user-roles', requireAnyRole(['ADMIN']), require('../routes/userRole.routes'));
app.use('/api/roles', requireAnyRole(['ADMIN']), roleRoutes);
app.use('/api/permissions', requireAnyRole(['ADMIN']), permissionRoutes);
app.use('/api/role-permissions', requireAnyRole(['ADMIN']), rolePermissionRoutes);
app.use('/api/option-capacities', requireAnyRole(['ADMIN', 'APPROVER']), optionCapacityRoutes);
app.use('/api/option-quota-buckets', requireAnyRole(['ADMIN', 'APPROVER']), optionQuotaBucketRoutes);
app.use('/api/survey-sessions', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), surveySessionRoutes);

// Admin dashboard routes (protected by ADMIN_API_KEY)
app.use('/api/admin', adminRoutes);

// Admin UI (login page, dashboard). Mount at /admin
app.use('/admin', adminUiRoutes);


app.get('/', (req, res) => res.send('Survey Premium Backend API running (modular app)!'));

// 404 / error handlers (should be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
