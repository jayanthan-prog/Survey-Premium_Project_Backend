const express = require('express');
const router = express.Router();
const db = require('../models');
const { requireAdmin } = require('../middleware');

/* =========================================================
   ADMIN LOGIN PAGE (Modern UI)
========================================================= */
router.get('/login', (req, res) => {
  res.send(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Admin Login</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      padding: 34px;
    }

    .login-title {
      margin: 0;
      text-align: center;
      font-size: 26px;
      color: #222;
    }

    .login-subtitle {
      text-align: center;
      margin: 10px 0 28px;
      color: #666;
      font-size: 14px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group span {
      font-size: 13px;
      color: #444;
      display: block;
      margin-bottom: 6px;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #ccc;
      font-size: 14px;
      outline: none;
    }

    .form-control:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
    }

    .btn {
      width: 100%;
      padding: 13px;
      border: none;
      border-radius: 8px;
      background: #667eea;
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .btn:hover {
      background: #5a6fdc;
    }

    .login-hint {
      margin-top: 22px;
      font-size: 12px;
      color: #777;
      text-align: center;
    }
  </style>
</head>

<body>

  <div class="login-card">
    <h1 class="login-title">Admin Login</h1>
    <p class="login-subtitle">Secure access to admin dashboard</p>

    <form method="post" action="/admin/login">

      <div class="form-group">
        <span>Username</span>
        <input class="form-control" name="username" value="admin" required>
      </div>

      <div class="form-group">
        <span>Password</span>
        <input class="form-control" type="password" name="password" value="admin" required>
      </div>

      <div class="form-group" style="margin-bottom:22px;">
        <span>Admin Token</span>
        <input class="form-control" name="token" placeholder="Enter admin API key" required>
      </div>

      <button type="submit" class="btn">Sign In</button>

    </form>

    <p class="login-hint">
      Default credentials: <code>admin / admin</code>
    </p>
  </div>

</body>
</html>
  `);
});

/* =========================================================
   PROCESS LOGIN
========================================================= */
router.post(
  '/login',
  express.urlencoded({ extended: false }),
  async (req, res) => {
    try {
      const { username, password, token } = req.body || {};
      const adminKey = (process.env.ADMIN_API_KEY || '').trim();

      if (
        username !== 'admin' ||
        password !== 'admin' ||
        !token ||
        token !== adminKey
      ) {
        return res.status(401).send(`
          <p style="font-family:Arial;padding:20px;">
            ❌ Login failed.
            <a href="/admin/login">Try again</a>
          </p>
        `);
      }

      const maxAge = 60 * 60 * 24; // 1 day

      res.setHeader(
        'Set-Cookie',
        `admin_token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${maxAge}`
      );

      return res.redirect('/admin/dashboard');
    } catch (err) {
      console.error('Admin login error:', err);
      return res.status(500).send('Server error');
    }
  }
);

/* =========================================================
   LOGOUT
========================================================= */
router.get('/logout', (req, res) => {
  res.setHeader(
    'Set-Cookie',
    'admin_token=; HttpOnly; Path=/; Max-Age=0'
  );
  res.redirect('/admin/login');
});

/* =========================================================
   DASHBOARD (Protected)
========================================================= */
router.get('/dashboard', requireAdmin, async (req, res, next) => {
  try {
    const User = db.User;
    const Survey = db.Survey;
    const SurveyParticipant = db.SurveyParticipant || db.Survey_Participant;
    const SurveyAnswer = db.SurveyAnswer || db.Survey_Answer;
    const SlotBooking = db.SlotBooking;
    const AuditLog = db.AuditLog;

    const [
      usersCount,
      surveysCount,
      participantsCount,
      answersCount,
      bookingsCount,
      auditCount
    ] = await Promise.all([
      User ? User.count() : 0,
      Survey ? Survey.count() : 0,
      SurveyParticipant ? SurveyParticipant.count() : 0,
      SurveyAnswer ? SurveyAnswer.count() : 0,
      SlotBooking ? SlotBooking.count() : 0,
      AuditLog ? AuditLog.count() : 0
    ]);

    res.send(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Admin Dashboard</title>

  <style>
    body{
      font-family: Segoe UI, Arial, sans-serif;
      background:#f4f6f8;
      margin:0;
      padding:0;
    }

    .container{
      max-width: 1000px;
      margin: 30px auto;
      padding: 20px;
    }

    .header{
      display:flex;
      justify-content: space-between;
      align-items:center;
      background:#1e293b;
      color:white;
      padding:15px 20px;
      border-radius:10px;
    }

    .logout a{
      color:white;
      text-decoration:none;
      background:#ef4444;
      padding:8px 12px;
      border-radius:6px;
    }

    .stats{
      display:grid;
      grid-template-columns: repeat(3, 1fr);
      gap:15px;
      margin-top:20px;
    }

    .card{
      background:white;
      padding:15px;
      border-radius:10px;
      box-shadow:0 2px 5px rgba(0,0,0,0.1);
    }

    .card h3{
      margin:0;
      color:#1e293b;
    }

    .card p{
      font-size:22px;
      font-weight:bold;
      margin:8px 0 0;
      color:#2563eb;
    }

    .section{
      margin-top:25px;
    }

    .links, .api-list{
      background:white;
      padding:15px;
      border-radius:10px;
      box-shadow:0 2px 5px rgba(0,0,0,0.1);
    }

    ul{
      list-style:none;
      padding:0;
    }

    li{
      margin:6px 0;
    }

    a{
      text-decoration:none;
      color:#2563eb;
      font-weight:600;
    }

    .api-grid{
      display:grid;
      grid-template-columns: repeat(2, 1fr);
      gap:12px;
    }

    /* ===== NEW: STATUS STYLES INSIDE CARD ===== */
    .api-card{
      background:#f8fafc;
      padding:12px;
      border-radius:10px;
      border:1px solid #e2e8f0;
      display:flex;
      justify-content:space-between;
      align-items:center;
    }

    .status{
      padding:5px 10px;
      border-radius:6px;
      font-size:12px;
      font-weight:bold;
    }

    .active{
      background:#16a34a;
      color:white;
    }

    .inactive{
      background:#dc2626;
      color:white;
    }

    .checking{
      background:#f59e0b;
      color:black;
    }

    .footer{
      text-align:center;
      margin-top:30px;
      color:#555;
    }
  </style>
</head>

<body>

<div class="container">

  <div class="header">
    <h1>Admin Dashboard</h1>
    <div class="logout">
      <a href="/admin/logout">Sign out</a>
    </div>
  </div>

  <div class="stats">
    <div class="card">
      <h3>Users</h3>
      <p>${usersCount}</p>
    </div>

    <div class="card">
      <h3>Surveys</h3>
      <p>${surveysCount}</p>
    </div>

    <div class="card">
      <h3>Participants</h3>
      <p>${participantsCount}</p>
    </div>

    <div class="card">
      <h3>Answers</h3>
      <p>${answersCount}</p>
    </div>

    <div class="card">
      <h3>Slot Bookings</h3>
      <p>${bookingsCount}</p>
    </div>

    <div class="card">
      <h3>Audit Events</h3>
      <p>${auditCount}</p>
    </div>
  </div>

  <div class="section">
    <h2>Quick Links</h2>
    <div class="links">
      <ul>
        <li><a href="/api/admin/users">Users (JSON)</a></li>
        <li><a href="/api/admin/surveys">Surveys (JSON)</a></li>
        <li><a href="/api/admin/audit-logs">Audit Logs (JSON)</a></li>
        <li><a href="/api/docs">Swagger API Docs</a></li>
      </ul>
    </div>
  </div>

  <div class="section">
    <h2>All Available APIs (Live Status)</h2>
    <div class="api-list">
      <div class="api-grid" id="apiGrid">
        <!-- Cards injected by JS -->
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Survey Premium Backend • Admin Panel</p>
  </div>

</div>

<script>
const apis = [
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
"/api/survey-questions",
"/api/survey-releases",
"/api/surveys",
"/api/approvals",
"/api/roles",
"/api/permissions",
"/api/role-permissions",
"/api/option-capacities",
"/api/option-quota-buckets",
"/api/survey-sessions",
"/api/admin"
];

const grid = document.getElementById("apiGrid");

apis.forEach(api => {
  const card = document.createElement("div");
  card.className = "api-card";

  const link = document.createElement("a");
  link.href = api;
  link.innerText = api;

  const status = document.createElement("span");
  status.className = "status checking";
  status.innerText = "CHECKING...";

  card.appendChild(link);
  card.appendChild(status);
  grid.appendChild(card);

  fetch(api)
    .then(res => {
      if(res.ok){
        status.className = "status active";
        status.innerText = "ACTIVE";
      } else {
        status.className = "status inactive";
        status.innerText = "INACTIVE";
      }
    })
    .catch(err => {
      status.className = "status inactive";
      status.innerText = "INACTIVE";
    });
});
</script>

</body>
</html>


</html>
    `);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
