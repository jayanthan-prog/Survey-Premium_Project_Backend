const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware');
const genController = require('../controllers/generatedApiController');
const featureFlags = require('../featureFlags');

// All admin routes are protected by requireAdmin
router.use(requireAdmin);

router.get('/metrics', adminController.getMetrics);
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/surveys', adminController.listSurveys);
router.get('/audit-logs', adminController.listAuditLogs);
router.get('/status', adminController.getStatus);

// ===============================
// 🔥 LIVE API STATUS ENDPOINT
// ===============================

const BASE_API_LIST = [
  "/api/users",
  "/api/groups",
  "/api/relay-stage-actions",
  "/api/relay-workflows",
  "/api/action-plan-items",
  "/api/action-plans",
  "/api/audit-events",
  "/api/audit-logs",
  "/api/auth-tokens",
  "/api/calendar-slots",
  "/api/enums",
  "/api/group-members",
  "/api/relay-instances",
  "/api/relay-stages",
  "/api/slot-bookings",
  "/api/survey-answer-selections",
  "/api/survey_answers",
  "/api/survey_options",
  "/api/survey_participants",
  "/api/survey_question_options",
  "/api/survey-questions",
  "/api/survey-releases",
  "/api/surveys",
  "/api/approvals",
  "/api/user-roles",
  "/api/roles",
  "/api/permissions",
  "/api/role-permissions",
  "/api/option-capacities",
  "/api/option-quota-buckets",
  "/api/survey-sessions",
  "/api/allocations"
];

// Get API list including generated APIs (always active by default)
function getApiList() {
  const generated = genController.listGenerated();
  const generatedPaths = Object.keys(generated).map(key => {
    const lower = key.toLowerCase();
    return '/admin/generated/' + lower + '/';
  });
  return [...BASE_API_LIST, ...generatedPaths];
}

const API_LIST = getApiList();

// LIVE STATUS PROVIDER FOR DASHBOARD
router.get('/api-status', async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const apiList = getApiList(); // Get fresh list including any newly generated APIs

  // Get admin key for authenticated status checks
  const adminKey = process.env.ADMIN_API_KEY || '';
  const fetchOptions = adminKey ? {
    headers: { 'X-Admin-Key': adminKey }
  } : {};

  const results = await Promise.all(
    apiList.map(async (api) => {
      const start = Date.now();
      try {
        // Use admin key for generated APIs (which are admin-only)
        const options = api.includes('/admin/generated/') ? fetchOptions : {};
        const r = await fetch(baseUrl + api, options);
        const time = Date.now() - start;

        return {
          api,
          status: r.ok ? "ACTIVE" : "INACTIVE",
          code: r.status,
          responseTime: time
        };
      } catch (err) {
        return {
          api,
          status: "INACTIVE",
          code: 500,
          responseTime: null
        };
      }
    })
  );

  const activeCount = results.filter(r => r.status === "ACTIVE").length;
  const uptime = Math.round((activeCount / results.length) * 100);

  res.json({
    uptime,
    total: results.length,
    active: activeCount,
    results
  });
});

module.exports = router;
