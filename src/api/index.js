'use strict';
const express = require('express');
const cors = require('cors');
const app = express();
const serverMeta = require('../serverMeta');

// Swagger UI
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger/swagger.json');

app.use(express.json());
// accept URL-encoded form bodies for the admin UI login form
app.use(express.urlencoded({ extended: false }));

const configuredCorsOrigins = String(process.env.CORS_ALLOWED_ORIGINS || '')
	.split(',')
	.map((value) => value.trim())
	.filter(Boolean);

const defaultCorsOrigins = [
	'http://localhost:5173',
	'http://127.0.0.1:5173',
	'http://10.150.20.138:3000',
	'http://localhost:3000',
	'http://localhost:4000',
	'http://10.150.20.138:4000',
	'https://survey.bitsathy.ac.in',
];

const allowedOrigins = new Set([...defaultCorsOrigins, ...configuredCorsOrigins]);

app.use(
	cors({
		origin(origin, callback) {
			// Allow non-browser clients (curl, Postman, server-to-server)
			if (!origin) return callback(null, true);
			if (allowedOrigins.has(origin)) return callback(null, true);
			return callback(new Error(`CORS blocked for origin: ${origin}`));
		},
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Public-IP'],
		credentials: true,
	})
);

// Middleware
const { requestLogger, createAuditTrail, notFound, errorHandler, apiGatekeeper, requireAuth, requireAnyRole } = require('../middleware');
app.use(requestLogger);

// Route modules
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const groupRoutes = require('../routes/groupRoutes');
const relayStageActionRoutes = require('../routes/relayStageActionRoutes');
const relayWorkflowRoutes = require('../routes/relayWorkflowRoutes');
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
const notificationRoutes = require('../routes/notificationRoutes');
const allocationTaskRoutes = require('../routes/allocationTaskRoutes');
const actionPlanRoutes = require('../routes/actionPlanRoutes');
const actionPlanItemRoutes = require('../routes/actionPlanItemRoutes');
const adminRoutes = require('../routes/adminRoutes');

// Swagger UI route (API docs)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api/docs.json', (req, res) => res.json(swaggerDocument));
app.use('/api', createAuditTrail());

// Auth routes (login/logout) - mounted before gatekeeper
app.use('/api/auth', authRoutes);

// Public API routes (before gatekeeper)
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/version', (req, res) => res.json({ version: serverMeta.version || '1.0.0', build: serverMeta.build || 'dev' }));

// Gatekeeper: block/allow API routes based on admin toggles and feature flags
app.use('/api', apiGatekeeper);
app.use('/api', requireAuth);

// Protected routes
app.get('/api/me', (req, res) => res.json({ user: req.user }));

// Mount routes under /api
app.use('/api/users', requireAnyRole(['ADMIN', 'APPROVER']), userRoutes);
app.use('/api/groups', requireAnyRole(['ADMIN', 'APPROVER']), groupRoutes);
app.use('/api/relay-stage-actions', requireAnyRole(['ADMIN', 'APPROVER']), relayStageActionRoutes);
app.use('/api/relay-workflows', requireAnyRole(['ADMIN', 'APPROVER']), relayWorkflowRoutes);
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
app.use('/api/notifications', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), notificationRoutes);
app.use('/api/allocations', requireAnyRole(['ADMIN', 'APPROVER', 'USER']), allocationTaskRoutes);
app.use('/api/action-plans', requireAnyRole(['ADMIN', 'APPROVER']), actionPlanRoutes);
app.use('/api/action-plan-items', requireAnyRole(['ADMIN', 'APPROVER']), actionPlanItemRoutes);

// Admin dashboard routes (protected by ADMIN_API_KEY)
app.use('/api/admin', adminRoutes);


app.get('/', (req, res) => res.send('Survey Premium Backend API running (modular app)!'));

// 404 / error handlers (should be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
