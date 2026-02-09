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
<title>API CONSOLE</title>

<style>
body{
  margin:0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  background:#e5e9f0;
  color:#0f172a;
}

/* ========== TOP BAR ========== */
.topbar{
  background:#0b1220;
  color:white;
  padding:16px 32px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  box-shadow:0 4px 12px rgba(0,0,0,0.3);
}

.title{
  font-weight:700;
  letter-spacing:0.4px;
  font-size:18px;
}

.logout a{
  color:white;
  text-decoration:none;
  background:#ef4444;
  padding:8px 14px;
  border-radius:8px;
  font-size:13px;
  font-weight:600;
  transition: all .2s ease;
}

.logout a:hover{
  background:#dc2626;
}

/* ========== MAIN CONTENT ========== */
.main{
  max-width: 1180px;
  margin: 28px auto;
  padding: 0 22px;
}

.main h2{
  margin:0 0 14px;
  font-size:18px;
  color:#0f172a;
}

/* ========== STATS GRID ========== */
.stats{
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  gap:20px;
  margin-bottom:32px;
}

.card{
  background:white;
  padding:18px 20px;
  border-radius:16px;
  box-shadow:0 6px 16px rgba(0,0,0,0.06);
  border:1px solid #e5e7eb;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.card:hover{
  transform: translateY(-2px);
  box-shadow:0 10px 20px rgba(0,0,0,0.08);
}

.card h3{
  margin:0;
  font-size:12px;
  letter-spacing:.3px;
  color:#64748b;
  font-weight:700;
  text-transform:uppercase;
}

.card p{
  margin:10px 0 0;
  font-size:26px;
  font-weight:800;
  color:#2563eb;
}

/* ========== API STATUS PANEL ========== */
.api-panel{
  background:white;
  padding:22px;
  border-radius:16px;
  box-shadow:0 6px 16px rgba(0,0,0,0.06);
  border:1px solid #e5e7eb;
}

/* Better grid */
.api-grid{
  display:grid;
  grid-template-columns: repeat(2, 1fr);
  gap:16px;
  margin-top:14px;
}

/* API Card */
.api-card{
  background:#f8fafc;
  padding:12px 14px;
  border-radius:14px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  border:1px solid #e2e8f0;
  transition:.2s ease;
}

.api-card:hover{
  background:#f1f5f9;
}

/* API Link */
.api-card a{
  text-decoration:none;
  color:#2563eb;
  font-size:13px;
  font-weight:600;
}

/* Status badges */
.status{
  padding:5px 10px;
  border-radius:999px;
  font-size:12px;
  font-weight:700;
  letter-spacing:0.2px;
}

.active{ background:#16a34a; color:white; }
.inactive{ background:#dc2626; color:white; }
.checking{ background:#f59e0b; color:black; }

/* ========== SECTION SPACING ========== */
.section{
  margin-top:28px;
}

/* ========== FOOTER ========== */
.footer{
  text-align:center;
  margin:30px 0;
  color:#64748b;
  font-size:13px;
}
</style>
</head>

<body>

<div class="topbar">
  <div class="title">AWS Admin Console</div>
  <div class="logout">
    <a href="/admin/logout">Sign out</a>
  </div>
</div>

<!-- MAIN CONTENT -->
<div class="main">

  <h2>Overview</h2>

  <div class="stats">
    <div class="card">
      <h3>Users</h3>
      <p id="usersCount">0</p>
    </div>

    <div class="card">
      <h3>Surveys</h3>
      <p id="surveysCount">0</p>
    </div>

    <div class="card">
      <h3>Participants</h3>
      <p id="participantsCount">0</p>
    </div>

    <div class="card">
      <h3>Answers</h3>
      <p id="answersCount">0</p>
    </div>

    <div class="card">
      <h3>Slot Bookings</h3>
      <p id="bookingsCount">0</p>
    </div>

    <div class="card">
      <h3>Audit Events</h3>
      <p id="auditCount">0</p>
    </div>
  </div>

  <div class="section">
  <h2>API Health Dashboard</h2>
  <div class="api-panel">
    <div class="api-grid" id="apiGrid"></div>
  </div>
  </div>

  <div class="footer">
    <p>Survey Premium Backend • Admin Panel</p>
  </div>

</div>

<script>
const apis = [
"/api/users","/api/groups","/api/relay-stage-actions","/api/relay-workflows",
"/api/action-plan-items","/api/action-plans","/api/audit-events","/api/audit-logs",
"/api/auth-tokens","/api/calendar-slots","/api/enums","/api/group-members",
"/api/relay-instances","/api/relay-stages","/api/slot-bookings",
"/api/survey-answer-selections","/api/survey_answers","/api/survey_options",
"/api/survey_participants","/api/survey-questions","/api/survey-releases",
"/api/surveys","/api/approvals","/api/roles","/api/permissions",
"/api/role-permissions","/api/option-capacities","/api/option-quota-buckets",
"/api/survey-sessions","/api/admin"
];

const grid = document.getElementById("apiGrid");

function checkApiStatus(){
  grid.innerHTML = "";

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
      .catch(() => {
        status.className = "status inactive";
        status.innerText = "INACTIVE";
      });
  });
}

function loadCounts(){
  Promise.all([
    fetch("/api/users").then(r=>r.json()),
    fetch("/api/surveys").then(r=>r.json()),
    fetch("/api/survey_participants").then(r=>r.json()),
    fetch("/api/survey_answers").then(r=>r.json()),
    fetch("/api/slot-bookings").then(r=>r.json()),
    fetch("/api/audit-logs").then(r=>r.json())
  ])
  .then(([users, surveys, participants, answers, bookings, audits]) => {
    document.getElementById("usersCount").innerText = users.length || 0;
    document.getElementById("surveysCount").innerText = surveys.length || 0;
    document.getElementById("participantsCount").innerText = participants.length || 0;
    document.getElementById("answersCount").innerText = answers.length || 0;
    document.getElementById("bookingsCount").innerText = bookings.length || 0;
    document.getElementById("auditCount").innerText = audits.length || 0;
  })
  .catch(err => console.log("Count load failed", err));
}

// INITIAL LOAD
checkApiStatus();
loadCounts();

// AUTO REFRESH EVERY 30 SECONDS
setInterval(() => {
  checkApiStatus();
  loadCounts();
}, 30000);
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

