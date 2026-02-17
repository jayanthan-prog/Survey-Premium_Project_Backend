const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware');

// All admin routes are protected by requireAdmin
router.use(requireAdmin);

router.get('/metrics', adminController.getMetrics);
router.get('/users', adminController.listUsers);
router.get('/surveys', adminController.listSurveys);
router.get('/audit-logs', adminController.listAuditLogs);
router.get('/status', adminController.getStatus);

// ===============================
// 🔥 LIVE API STATUS ENDPOINT
// ===============================

const API_LIST = [
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
  "/api/survey-sessions"
];

// LIVE STATUS PROVIDER FOR DASHBOARD
router.get('/api-status', async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const results = await Promise.all(
    API_LIST.map(async (api) => {
      const start = Date.now();
      try {
        const r = await fetch(baseUrl + api); // ✅ Uses built-in fetch
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
