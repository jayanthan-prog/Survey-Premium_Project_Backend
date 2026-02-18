const express = require('express');
const router = express.Router();
const db = require('../models');
const { requireAdmin, apiControl } = require('../middleware');
const featureFlags = require('../featureFlags');
const genController = require('../controllers/generatedApiController');
// In-memory registry of generated model routes to avoid duplicate registration
const _generatedModels = {};

/* =========================================================
   ADMIN LOGIN PAGE
========================================================= */
router.get('/login', (req, res) => {
  res.send(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Admin Access | Survey Premium</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: radial-gradient(circle at top left, #1e293b, #0f172a); font-family: 'Inter', sans-serif; }
    .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
  <div class="glass w-full max-w-md p-10 rounded-3xl shadow-2xl">
    <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-xl shadow-blue-500/20 text-white font-bold text-2xl">S</div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Console Access</h1>
        <p class="text-slate-400 mt-2">Authorized Personnel Only</p>
    </div>
        <form method="post" action="/admin/login" class="space-y-6" aria-label="Admin login form">
            <div>
                <label for="token" class="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Security Token</label>
                <input id="token" type="password" name="token" placeholder="Enter Admin API Key" required
                             class="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                <p class="text-xs text-slate-400 mt-2">Use your admin API key to authenticate. This token is never stored in the browser.</p>
            </div>
      <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98]">
        Verify & Enter
      </button>
    </form>
  </div>
</body>
</html>
  `);
});

/* =========================================================
   PROCESS LOGIN
========================================================= */
router.post('/login', express.urlencoded({ extended: false }), async (req, res) => {
    try {
      const { token } = req.body || {};
      const adminKey = (process.env.ADMIN_API_KEY || '').trim();

      if (!token || token !== adminKey) {
        return res.status(401).send(`<div style="background:#0f172a;color:white;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;">
            <div style="text-align:center;"><h2 style="color:#ef4444;">Access Denied</h2><br><a href="/admin/login" style="color:#3b82f6;">Back to Login</a></div>
        </div>`);
      }
    // Set admin cookie to expire in 1 hour (3600 seconds). Add Secure when running under HTTPS/production.
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
    const secureFlag = isSecure ? '; Secure' : '';
    res.setHeader('Set-Cookie', `admin_token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax${secureFlag}`);
      return res.redirect('/admin/dashboard');
    } catch (err) {
      return res.status(500).send('Server Error');
    }
});

/* =========================================================
   DASHBOARD
========================================================= */
router.get('/dashboard', requireAdmin, async (req, res, next) => {
  try {
    const [u, s, p, a, b, l] = await Promise.all([
      db.User?.count() || 0,
      db.Survey?.count() || 0,
      db.SurveyParticipant?.count() || db.Survey_Participant?.count() || 0,
      db.SurveyAnswer?.count() || db.Survey_Answer?.count() || 0,
      db.SlotBooking?.count() || 0,
      db.AuditLog?.count() || 0
    ]);

    res.send(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Analytics | Survey Premium</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #1e293b; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .tab-active { background: #eff6ff; color: #2563eb; border-bottom: 2px solid #2563eb; }
    .chart-container { position: relative; height: 300px; width: 100%; }
  </style>
</head>
<body class="flex min-h-screen">
  <aside class="w-64 bg-[#0f172a] text-slate-400 hidden lg:flex flex-col sticky top-0 h-screen shadow-2xl">
    <div class="p-6 border-b border-slate-800 flex items-center gap-3">
        <div class="w-8 h-8 bg-blue-600 rounded-lg text-white flex items-center justify-center font-bold">S</div>
        <span class="text-white font-bold tracking-tight">Admin Console</span>
    </div>
    <nav class="flex-1 p-4 space-y-1">
        <button onclick="switchTab('health')" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-semibold text-left">Health Monitor</button>
        <button onclick="switchTab('analytics')" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-semibold text-left">Data Insights</button>
        <a href="/admin/logout" class="flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all mt-auto">Logout</a>
    </nav>
  </aside>

  <main class="flex-1 p-8 overflow-y-auto">
    <div class="max-w-7xl mx-auto">
        <header class="flex justify-between items-end mb-10">
            <div>
                <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight" id="main-title">System Overview</h1>
                <p class="text-slate-500 font-medium mt-1">Real-time database and service analytics.</p>
            </div>
            <div class="flex bg-white p-1.5 border border-slate-200 rounded-2xl shadow-sm">
                <button onclick="switchTab('health')" id="tab-health" class="px-6 py-2.5 text-sm font-bold rounded-xl transition-all tab-active">Health</button>
                <button onclick="switchTab('analytics')" id="tab-analytics" class="px-6 py-2.5 text-sm font-bold text-slate-500 rounded-xl transition-all">Analytics</button>
            </div>
        </header>

        <div class="grid grid-cols-2 lg:grid-cols-6 gap-6 mb-10">
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <p class="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-1">Users</p>
                <p class="text-3xl font-extrabold text-slate-900">${u}</p>
            </div>
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <p class="text-[11px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Surveys</p>
                <p class="text-3xl font-extrabold text-slate-900">${s}</p>
            </div>
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <p class="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Participants</p>
                <p class="text-3xl font-extrabold text-slate-900">${p}</p>
            </div>
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <p class="text-[11px] font-bold text-amber-500 uppercase tracking-widest mb-1">Answers</p>
                <p class="text-3xl font-extrabold text-slate-900">${a}</p>
            </div>
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <p class="text-[11px] font-bold text-rose-500 uppercase tracking-widest mb-1">Bookings</p>
                <p class="text-3xl font-extrabold text-slate-900">${b}</p>
            </div>
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <p class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Audit Logs</p>
                <p class="text-3xl font-extrabold text-slate-900">${l}</p>
            </div>
        </div>

        <section id="view-health">
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50">
                    <div class="flex items-center gap-4 w-full md:w-auto">
                        <h3 class="font-bold text-slate-800">API Surveillance Grid</h3>
                        <span id="apiCount" class="text-sm text-slate-500 hidden md:inline">(0)</span>
                    </div>
                    <div class="flex items-center gap-3 w-full md:w-auto">
                        <input type="text" id="apiSearch" placeholder="Search endpoints..." aria-label="Search API endpoints"
                               class="flex-1 md:w-72 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                        <button id="refreshApis" class="px-3 py-2 bg-white border rounded-xl text-sm hover:bg-slate-100">Refresh</button>
                        <label class="flex items-center gap-2 text-sm text-slate-500">
                            <input type="checkbox" id="autoRefresh" /> Auto
                        </label>
                        <div id="lastUpdated" class="text-xs text-slate-400 ml-2">-</div>
                    </div>
                </div>
                <div class="h-[600px] overflow-y-auto custom-scrollbar p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="apiGrid" role="list"></div>
                </div>
            </div>

            <!-- Quick API Builder -->
            <div class="mt-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 class="font-bold text-slate-800 mb-3">Quick API Builder</h4>
                <p class="text-sm text-slate-500 mb-4">Create full CRUD endpoints for an existing DB model with one click. Endpoints are admin-only and mounted under <code>/admin/generated/:model</code>.</p>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input id="genModel" list="modelList" placeholder="Model name (e.g. User)" class="col-span-2 p-3 border rounded-lg" />
                        <datalist id="modelList"></datalist>
                    <button id="createApiBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg">Create API</button>
                </div>
                    <div id="modelPreview" class="mt-3 text-sm text-slate-600"></div>
                    <div id="genResult" class="mt-4 text-sm text-slate-600"></div>
            </div>
        </section>

        <section id="view-analytics" class="hidden space-y-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div class="mb-6">
                        <h3 class="text-xl font-bold text-slate-900">User Engagement</h3>
                        <p class="text-sm text-slate-500">Distribution of Users vs Surveys and Bookings</p>
                    </div>
                    <div class="chart-container">
                        <canvas id="distChart"></canvas>
                    </div>
                </div>
                <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div class="mb-6">
                        <h3 class="text-xl font-bold text-slate-900">Data Volume Ratio</h3>
                        <p class="text-sm text-slate-500">Comparing Answer entries to System Logs</p>
                    </div>
                    <div class="chart-container">
                        <canvas id="ratioChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="bg-slate-900 text-white p-10 rounded-[2rem] shadow-xl">
                <h3 class="text-2xl font-bold mb-6">Service Intelligence</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="space-y-2">
                        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Active Ratio</p>
                        <p class="text-3xl font-light"><span class="font-bold text-blue-400">${((p / (u || 1)) * 100).toFixed(1)}%</span></p>
                        <p class="text-sm text-slate-500">Participation per user</p>
                    </div>
                    <div class="space-y-2">
                        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Database Density</p>
                        <p class="text-3xl font-light"><span class="font-bold text-emerald-400">${(a + l + b).toLocaleString()}</span></p>
                        <p class="text-sm text-slate-500">Total stored records</p>
                    </div>
                    <div class="space-y-2">
                        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Answer Rate</p>
                        <p class="text-3xl font-light"><span class="font-bold text-amber-400">${(a / (s || 1)).toFixed(1)}</span></p>
                        <p class="text-sm text-slate-500">Answers per survey</p>
                    </div>
                </div>
            </div>
        </section>
    </div>
  </main>

  <script>
    const apis = [
        "/api/users", "/api/groups", "/api/relay-stage-actions", "/api/relay-workflows",
        "/api/action-plan-items", "/api/action-plans", "/api/audit-events", "/api/audit-logs",
        "/api/auth-tokens", "/api/calendar-slots", "/api/enums", "/api/group-members",
        "/api/relay-instances", "/api/relay-stages", "/api/slot-bookings",
        "/api/survey-answer-selections", "/api/survey_answers", "/api/survey_options",
        "/api/survey_participants", "/api/survey-questions", "/api/survey-releases",
        "/api/surveys", "/api/approvals", "/api/roles", "/api/permissions",
        "/api/role-permissions", "/api/option-capacities", "/api/option-quota-buckets",
        "/api/survey-sessions",, 
       
    ];

    let charts = {};
    let apiFlags = {};
    let apiAutoRefreshTimer = null;

    function safeId(input) {
        return 'st_' + String(input).replace(/[^a-z0-9]/gi, '_');
    }

    function switchTab(tab) {
        document.getElementById('view-health').classList.toggle('hidden', tab !== 'health');
        document.getElementById('view-analytics').classList.toggle('hidden', tab !== 'analytics');
        document.getElementById('tab-health').className = tab === 'health' ? 'px-6 py-2.5 text-sm font-bold rounded-xl transition-all tab-active' : 'px-6 py-2.5 text-sm font-bold text-slate-500 rounded-xl transition-all';
        document.getElementById('tab-analytics').className = tab === 'analytics' ? 'px-6 py-2.5 text-sm font-bold rounded-xl transition-all tab-active' : 'px-6 py-2.5 text-sm font-bold text-slate-500 rounded-xl transition-all';
        document.getElementById('main-title').innerText = tab === 'health' ? 'System Health' : 'Data Insights';
        if(tab === 'analytics') setTimeout(renderCharts, 100);
    }

    function renderCharts() {
        if (charts.dist) charts.dist.destroy();
        if (charts.ratio) charts.ratio.destroy();

        const ctxDist = document.getElementById('distChart').getContext('2d');
        charts.dist = new Chart(ctxDist, {
            type: 'bar',
            data: {
                labels: ['User Base', 'Live Surveys', 'Booked Slots'],
                datasets: [{
                    label: 'Count',
                    data: [${u}, ${s}, ${b}],
                    backgroundColor: ['#3b82f6', '#10b981', '#f43f5e'],
                    borderRadius: 12,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false }, border: { display: false } },
                    x: { grid: { display: false }, border: { display: false } }
                }
            }
        });

        const ctxRatio = document.getElementById('ratioChart').getContext('2d');
        charts.ratio = new Chart(ctxRatio, {
            type: 'doughnut',
            data: {
                labels: ['Answers Provided', 'Audit Activity'],
                datasets: [{
                    data: [${a}, ${l}],
                    backgroundColor: ['#f59e0b', '#64748b'],
                    borderWidth: 0,
                    hoverOffset: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
                }
            }
        });
    }

    // Fetch flags from server and render API grid with enable/disable controls
    async function checkApiStatus() {
        const grid = document.getElementById("apiGrid");
        grid.innerHTML = '';

        // Get persisted feature flags and disabled routes from the admin endpoints
        apiFlags = {};
        try {
            const r = await fetch('/admin/api/flags', { credentials: 'same-origin' });
            if (r.ok) apiFlags = await r.json();
        } catch (e) { /* ignore, we'll fallback to defaults */ }

        // Build the grid
        grid.innerHTML = apis.map(function(api){
            const id = safeId(api);
            const isGenerated = String(api).toLowerCase().includes('/generated/');
            const genBadge = isGenerated ? '<span class="ml-2 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">Generated</span>' : '';
            return '<div class="api-item flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all" data-api="' + api + '" role="listitem">'
                + '<div class="flex flex-col truncate mr-4">'
                    + '<span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Endpoint</span>'
                    + '<div class="flex items-center">'
                        + '<span class="text-xs font-mono font-semibold text-slate-700 truncate">' + api + '</span>'
                        + genBadge
                    + '</div>'
                + '</div>'
                + '<div class="flex items-center gap-3">'
                    + '<span id="' + id + '" class="text-[9px] font-black px-3 py-1.5 rounded-lg bg-slate-200 text-slate-500 uppercase" aria-live="polite">Ping</span>'
                    + '<button data-api="' + api + '" class="toggle-btn text-sm font-semibold px-3 py-1 rounded-xl border" aria-pressed="false">Toggle</button>'
                + '</div>'
            + '</div>';
        }).join('');

        const now = () => new Date().toISOString();
        document.getElementById('lastUpdated').innerText = 'Last: ' + now();
        document.getElementById('apiCount').innerText = '(' + apis.length + ')';

        // Update status badges by pinging endpoints, and set button labels from flags
        apis.forEach(api => {
            const id = safeId(api);
            const el = document.getElementById(id);
            // Measure latency and handle timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            fetch(api, { signal: controller.signal, credentials: 'same-origin' }).then(r => {
                clearTimeout(timeout);
                const took = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - start);
                if(el) {
                    el.innerText = r.ok ? ('Active · ' + took + 'ms') : ('Locked · ' + took + 'ms');
                    el.className = r.ok ? "text-[9px] font-black px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-200" : "text-[9px] font-black px-3 py-1.5 rounded-lg bg-amber-100 text-amber-600 shadow-sm shadow-amber-200";
                    el.title = 'Last checked ' + new Date().toLocaleString() + ' - ' + took + 'ms';
                }
            }).catch(() => {
                clearTimeout(timeout);
                if(el) {
                    el.innerText = "Error";
                    el.className = "text-[9px] font-black px-3 py-1.5 rounded-lg bg-red-100 text-red-600";
                    el.title = 'Failed to reach ' + api;
                }
            });
        });

        // Hook up toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            const apiPath = btn.getAttribute('data-api');
            const currentState = apiFlags[apiPath] !== undefined ? !!apiFlags[apiPath] : true;
            btn.innerText = currentState ? 'Disable' : 'Enable';
            btn.setAttribute('aria-pressed', (!currentState).toString());
            btn.onclick = async () => {
                const newState = !(apiFlags[apiPath] !== undefined ? !!apiFlags[apiPath] : true);
                try {
                    const resp = await fetch('/admin/api/flags/toggle', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ path: apiPath, enabled: newState })
                    });
                    if (resp.ok) {
                        btn.innerText = newState ? 'Disable' : 'Enable';
                        apiFlags[apiPath] = newState;
                        // refresh status badge quickly
                        const st = document.getElementById(safeId(apiPath));
                        if (st) {
                            st.innerText = newState ? 'Active' : 'Locked';
                            st.className = newState ? "text-[9px] font-black px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-200" : "text-[9px] font-black px-3 py-1.5 rounded-lg bg-amber-100 text-amber-600 shadow-sm shadow-amber-200";
                        }
                    } else {
                        alert('Failed to update flag');
                    }
                } catch (e) {
                    alert('Failed to update flag');
                }
            };
        });

        // Wire up refresh and auto-refresh controls
        const refreshBtn = document.getElementById('refreshApis');
        if (refreshBtn) {
            refreshBtn.onclick = () => {
                checkApiStatus();
            };
        }
        const autoBox = document.getElementById('autoRefresh');
        if (autoBox) {
            autoBox.onchange = () => {
                if (autoBox.checked) {
                    apiAutoRefreshTimer = setInterval(checkApiStatus, 60 * 1000);
                } else if (apiAutoRefreshTimer) {
                    clearInterval(apiAutoRefreshTimer);
                    apiAutoRefreshTimer = null;
                }
            };
        }
    }

        document.getElementById('apiSearch').addEventListener('input', (e) => {
        const t = e.target.value.toLowerCase();
        let visible = 0;
        document.querySelectorAll('.api-item').forEach(i => {
            const ok = i.getAttribute('data-api').toLowerCase().includes(t);
            i.style.display = ok ? 'flex' : 'none';
            if (ok) visible++;
        });
        const countEl = document.getElementById('apiCount');
        if (countEl) countEl.innerText = '(' + visible + ')';
    });

        // Auto-logout client-side after 1 hour as a user-friendly fallback
        setTimeout(() => {
                window.location.href = '/admin/logout';
        }, 1000 * 60 * 60);

        // Ensure persisted generated routes are mounted server-side and add them to the client apis list
        (async function ensureGeneratedMounted(){
            try {
                // Best-effort: ask server to reload/mount persisted generated routes
                await fetch('/admin/api/generated-reload', { method: 'POST', credentials: 'same-origin' });
            } catch (e) { /* ignore */ }

            try {
                const r = await fetch('/admin/api/generated-list', { credentials: 'same-origin' });
                if (r.ok) {
                    const body = await r.json();
                    const manifest = body.manifest || body || {};
                    Object.keys(manifest).forEach(k => {
                        const lower = String(k).toLowerCase();
                        const base = '/admin/generated/' + lower + '/';
                        const idPath = '/admin/generated/' + lower + '/:id';
                        if (!apis.includes(base)) apis.push(base);
                        if (!apis.includes(idPath)) apis.push(idPath);
                    });
                }
            } catch (e) { /* ignore */ }

            // now run the usual status check
            checkApiStatus();
        })();

        // Quick API Builder wiring (creates admin-only CRUD endpoints mounted under /admin/generated/:model)
        const createApiBtn = document.getElementById('createApiBtn');
        const genModelInput = document.getElementById('genModel');
        const genResult = document.getElementById('genResult');
        if (createApiBtn && genModelInput) {
            // load available model names for the datalist
            (async function loadModels(){
                try {
                    const r = await fetch('/admin/api/models', { credentials: 'same-origin' });
                    if (!r.ok) return;
                    const body = await r.json();
                    const list = document.getElementById('modelList');
                    if (!list || !body || !body.models) return;
                    list.innerHTML = body.models.map(m => '<option value="' + m + '"></option>').join('');
                } catch (e) { /* ignore */ }
            })();
            // debounce preview calls
            let previewTimer = null;
            const modelPreviewEl = document.getElementById('modelPreview');

            const renderPreview = (data) => {
                if (!modelPreviewEl) return;
                if (!data || !data.attributes) {
                    modelPreviewEl.innerText = 'No preview available';
                    return;
                }
                const attrs = data.attributes;
                if (!attrs.length) {
                    modelPreviewEl.innerText = 'Model has no attributes or preview unavailable.';
                    return;
                }
                let html = '<div class="mb-2"><label class="inline-flex items-center gap-2"><input type="checkbox" id="attr_select_all" checked /> <span class="text-sm">Select all</span></label></div>';
                html += '<div class="grid grid-cols-2 gap-2">';
                attrs.forEach(a => {
                    html += '<label class="inline-flex items-center gap-2"><input type="checkbox" class="attr-checkbox" data-attr="' + a + '" checked /> <span class="text-xs font-mono">' + a + '</span></label>';
                });
                html += '</div>';
                modelPreviewEl.innerHTML = html;

                const selectAll = document.getElementById('attr_select_all');
                selectAll.addEventListener('change', (e) => {
                    document.querySelectorAll('.attr-checkbox').forEach(cb => cb.checked = selectAll.checked);
                });
            };

            const fetchPreview = async (name) => {
                if (!name) { modelPreviewEl.innerText = ''; return; }
                try {
                    const r = await fetch('/admin/api/generate-model/preview?modelName=' + encodeURIComponent(name), { credentials: 'same-origin' });
                    if (!r.ok) {
                        modelPreviewEl.innerText = 'Preview error: ' + r.statusText;
                        return;
                    }
                    const body = await r.json();
                    renderPreview(body);
                } catch (e) {
                    modelPreviewEl.innerText = 'Preview failed: ' + e.message;
                }
            };

            genModelInput.addEventListener('input', (e) => {
                clearTimeout(previewTimer);
                previewTimer = setTimeout(() => fetchPreview(e.target.value.trim()), 350);
            });

            createApiBtn.onclick = async () => {
                const modelName = (genModelInput.value || '').trim();
                if (!modelName) {
                    genResult.innerText = 'Enter a model name (as exported in src/models, e.g. User).';
                    return;
                }
                // collect selected attributes
                const selected = [];
                document.querySelectorAll('.attr-checkbox').forEach(cb => {
                    if (cb.checked) selected.push(cb.getAttribute('data-attr'));
                });

                genResult.innerText = 'Creating...';
                try {
                    const resp = await fetch('/admin/api/generate-model', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ modelName, allowedFields: selected })
                    });
                    const body = await resp.json();
                    if (!resp.ok) {
                        genResult.innerText = 'Error: ' + (body.error || JSON.stringify(body));
                    } else {
                        genResult.innerHTML = '<div class="text-slate-700">Created endpoints:</div><ul class="list-disc ml-6 mt-2 text-slate-600">' +
                            body.paths.map(p => '<li><code>' + p + '</code></li>').join('') + '</ul>' +
                            (body.allowedFields ? ('<div class="mt-2 text-xs text-slate-500">Allowed fields: ' + body.allowedFields.join(', ') + '</div>') : '');

                        // Add created endpoints to the surveillance list and refresh status
                        try {
                            (body.paths || []).forEach(p => {
                                // use same format as apis array (relative paths)
                                if (typeof p === 'string') {
                                    // strip host if present - keep path-only
                                    const url = new URL(p, window.location.origin);
                                    const path = url.pathname + (url.search || '');
                                    if (!apis.includes(path)) apis.push(path);
                                }
                            });
                        } catch (e) {
                            // fallback: push raw strings
                            (body.paths || []).forEach(p => { if (p && !apis.includes(p)) apis.push(p); });
                        }

                        // refresh the API grid immediately to show new endpoints
                        try { checkApiStatus(); } catch (e) { /* ignore */ }
                    }
                } catch (e) {
                    genResult.innerText = 'Failed to create API: ' + e.message;
                }
            };
        }
  </script>
</body>
</html>
    `);
  } catch (err) {
    next(err);
  }
});

/* =========================================================
     ADMIN: Feature Flags API
     - GET /admin/api/flags  -> returns current flags (object)
     - POST /admin/api/flags/toggle -> body { path, enabled }
         toggles both the persistent feature flag and the in-memory apiControl
========================================================= */
router.get('/api/flags', requireAdmin, (req, res) => {
    try {
        const flags = featureFlags.getFlags();
        res.json(flags || {});
    } catch (err) {
        res.status(500).json({ error: 'Failed to read flags' });
    }
});

router.post('/api/flags/toggle', express.json(), requireAdmin, (req, res) => {
    try {
        const { path, enabled } = req.body || {};
        if (!path) return res.status(400).json({ error: 'Missing path' });

        // Persist the flag (featureFlags determines default behavior)
        featureFlags.setFlag(path, !!enabled);

        // Also toggle in-memory API gatekeeper for immediate effect
        // Note: apiControl.toggle expects isOff boolean (true to disable)
        apiControl.toggle(path, enabled === false);

        return res.json({ path, enabled: !!enabled });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to toggle flag' });
    }
});

/**
 * ADMIN: Generate CRUD endpoints for an existing Sequelize model (admin-only, in-memory).
 * POST /admin/api/generate-model  { modelName }
 * Creates endpoints mounted under /admin/generated/:modelName
 */
router.post('/api/generate-model', express.json(), requireAdmin, async (req, res) => {
    try {
        const { modelName, allowedFields } = req.body || {};
        if (!modelName) return res.status(400).json({ error: 'Missing modelName' });

        // find model key in db (case-insensitive)
        const modelKey = Object.keys(db).find(k => k.toLowerCase() === String(modelName).toLowerCase());
        if (!modelKey) return res.status(404).json({ error: 'Model not found: ' + modelName });

        if (_generatedModels[modelKey]) {
            const base = '/admin/generated/' + modelKey.toLowerCase();
            return res.json({ ok: true, paths: [base + '/', base + '/:id'] });
        }

        // Delegate to controller which writes a persisted route file + manifest
        const result = await genController.createGeneratedApi(modelKey, allowedFields);

        // Attempt to require the generated route file and mount on this router so it's live immediately
        try {
            const path = require('path');
            const genFile = path.join(__dirname, '..', 'routes', 'generated-' + modelKey.toLowerCase() + '.js');
            // require by absolute path, clear cache if present
            try { delete require.cache[require.resolve(genFile)]; } catch (e) {}
            const genMod = require(genFile);
            // If module exports a router, mount it on the admin router
            if (genMod && (typeof genMod === 'function' || genMod.stack)) {
                try { router.use(genMod); } catch (e) { console.error('Failed to router.use generated module:', e && e.message ? e.message : e); }
            }
        } catch (e) {
            // non-fatal: can't require/mount immediately
            console.error('Failed to mount generated route immediately:', e && e.message ? e.message : e);
        }

        // Fallback: attempt to mount all persisted generated routes (best-effort, non-fatal)
        try {
            const manifest = genController.listGenerated();
            const p = require('path');
            Object.keys(manifest || {}).forEach(k => {
                try {
                    const rel = manifest[k].file; // e.g., routes/generated-xxx.js
                    const genFile = p.join(__dirname, '..', rel);
                    try { delete require.cache[require.resolve(genFile)]; } catch (e) {}
                    const m = require(genFile);
                    if (m && (typeof m === 'function' || m.stack)) {
                        try { router.use(m); } catch (e) { /* ignore per-file mount errors */ }
                    }
                    _generatedModels[k] = { allowedFields: manifest[k].allowedFields || [] };
                } catch (e) {
                    // ignore file-level errors
                }
            });
        } catch (e) {
            // ignore fallback errors
        }

        _generatedModels[modelKey] = { allowedFields: result.allowedFields };
        return res.json(result);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// List available models (useful for the UI dropdown)
router.get('/api/models', requireAdmin, (req, res) => {
    try {
        const keys = Object.keys(db).filter(k => {
            const m = db[k];
            return m && (m.rawAttributes || typeof m.findAll === 'function');
        });
        res.json({ models: keys });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Preview model attributes before generating API
router.get('/api/generate-model/preview', requireAdmin, (req, res) => {
    try {
        const modelName = String(req.query.modelName || '').trim();
        if (!modelName) return res.status(400).json({ error: 'Missing modelName' });
        const modelKey = Object.keys(db).find(k => k.toLowerCase() === modelName.toLowerCase());
        if (!modelKey) return res.status(404).json({ error: 'Model not found' });
        const Model = db[modelKey];
        const attrs = Model && Model.rawAttributes ? Object.keys(Model.rawAttributes) : [];
        const pk = Model && Model.primaryKeyAttribute ? Model.primaryKeyAttribute : null;
        return res.json({ modelKey, attributes: attrs, primaryKey: pk });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Diagnostic: list in-memory generated models and routes (admin-only)
router.get('/api/generated-list', requireAdmin, (req, res) => {
    try {
        const generatedKeys = Object.keys(_generatedModels || {});
        // extract mounted routes from this router for inspection
        const mounted = (router.stack || []).map(layer => {
            try {
                if (layer && layer.route && layer.route.path) {
                    return { path: layer.route.path, methods: layer.route.methods };
                }
                if (layer && layer.name && layer.regexp) {
                    return { name: layer.name, regexp: String(layer.regexp) };
                }
                return null;
            } catch (e) { return null; }
        }).filter(Boolean);

    return res.json({ generated: generatedKeys, routes: mounted, manifest: (function(){ try { return genController.listGenerated(); } catch(e){ return {}; } })() });
    } catch (err) {
        return res.status(500).json({ error: err && err.message ? err.message : 'Failed' });
    }
});

// Reload all persisted generated route files and mount them on the admin router (admin-only)
router.post('/api/generated-reload', requireAdmin, (req, res) => {
    try {
        const manifest = genController.listGenerated();
        const path = require('path');
        const mounted = [];
        Object.keys(manifest || {}).forEach(key => {
            try {
                const fileRel = manifest[key].file; // e.g., routes/generated-xxx.js
                const genFile = path.join(__dirname, '..', fileRel);
                // clear cache and require
                try { delete require.cache[require.resolve(genFile)]; } catch (e) {}
                const mod = require(genFile);
                if (mod && (typeof mod === 'function' || mod.stack)) {
                    try { router.use(mod); } catch (e) { /* ignore mount errors for individual files */ }
                }
                // mark as mounted
                _generatedModels[key] = { allowedFields: manifest[key].allowedFields || [] };
                mounted.push(key);
            } catch (e) {
                // per-file load error, continue
            }
        });
        return res.json({ ok: true, mounted });
    } catch (e) {
        return res.status(500).json({ error: e && e.message ? e.message : 'Failed to reload' });
    }
});

module.exports = router;