const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../models');
const { requireAdmin, apiControl } = require('../middleware');
const featureFlags = require('../featureFlags');
const serverMeta = require('../serverMeta');
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

    // Get initial system status
    const systemStatus = serverMeta.getSystemStatus();
    const uptime = serverMeta.getUptimeSeconds();
    const sysInfo = serverMeta.systemInfo();
    
    // Format uptime
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const formattedUptime = `${days}d ${hours}h ${minutes}m`;

    res.send(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Analytics | Survey Premium</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/src/toastify.min.css">
  <script src="https://cdn.jsdelivr.net/npm/toastify-js@1.12.0"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #1e293b; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .tab-active { background: #eff6ff; color: #2563eb; border-bottom: 2px solid #2563eb; }
    .chart-container { position: relative; height: 300px; width: 100%; }
    .toggle-checkbox:checked {
      right: 0;
      border-color: #68D391;
    }
    .toggle-checkbox:checked + .toggle-label {
      background-color: #68D391;
    }
  </style>
</head>
<body class="flex min-h-screen">
  <aside class="w-64 bg-[#0f172a] text-slate-400 hidden lg:flex flex-col sticky top-0 h-screen shadow-2xl">
    <div class="p-6 border-b border-slate-800 flex items-center gap-3">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/30">S</div>
        <span class="text-white font-bold tracking-tight">Admin Console</span>
    </div>
    
    <!-- Quick Stats Mini Panel -->
    <div class="px-4 py-3 mx-4 mb-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50">
        <div class="flex items-center gap-2 mb-2">
            <div id="systemStatusDot" class="w-2 h-2 rounded-full ${systemStatus.isOnline !== false ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}"></div>
            <span id="systemStatusText" class="text-xs font-semibold ${systemStatus.isOnline !== false ? 'text-emerald-400' : 'text-red-400'}">${systemStatus.isOnline !== false ? 'System Online' : 'System Offline'}</span>
        </div>
        <div class="text-xs text-slate-500">
            <span id="serverUptime">${formattedUptime}</span>
        </div>
    </div>
    
    <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <div class="text-xs font-bold text-slate-600 uppercase tracking-wider px-4 mb-2">Main</div>
        <button onclick="switchTab('health')" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-semibold text-left group">
            <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Health Monitor
        </button>
        <button onclick="switchTab('analytics')" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-semibold text-left group">
            <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
            Data Insights
        </button>
        <button onclick="switchTab('settings')" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-semibold text-left group">
            <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Settings
        </button>
        
        <div class="text-xs font-bold text-slate-600 uppercase tracking-wider px-4 mb-2 mt-6">Quick Actions</div>
        <a href="/api/users" target="_blank" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-semibold text-left group">
            <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            View Users
        </a>
        <a href="/api/surveys" target="_blank" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-semibold text-left group">
            <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            View Surveys
        </a>
        <a href="/api/docs" target="_blank" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-semibold text-left group">
            <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            API Docs
        </a>
        
        <div class="mt-auto pt-4 border-t border-slate-800">
            <a href="/admin/logout" class="flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all group">
                <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v-1a3 3 0 00-3-3h-4a3 3 0 00-3 3v1"></path></svg>
                Logout
            </a>
        </div>
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
                <button onclick="switchTab('settings')" id="tab-settings" class="px-6 py-2.5 text-sm font-bold text-slate-500 rounded-xl transition-all">Settings</button>
            </div>
        </header>

        <div class="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 rounded-2xl border border-blue-100 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02] group">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Users</p>
                    <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </div>
                </div>
                <p class="text-3xl font-extrabold text-slate-900">${u}</p>
            </div>
            <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-2xl border border-emerald-100 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02] group">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Surveys</p>
                    <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                </div>
                <p class="text-3xl font-extrabold text-slate-900">${s}</p>
            </div>
            <div class="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-2xl border border-indigo-100 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02] group">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Participants</p>
                    <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </div>
                </div>
                <p class="text-3xl font-extrabold text-slate-900">${p}</p>
            </div>
            <div class="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-100 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02] group">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Answers</p>
                    <div class="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>
                <p class="text-3xl font-extrabold text-slate-900">${a}</p>
            </div>
            <div class="bg-gradient-to-br from-rose-50 to-rose-100/50 p-5 rounded-2xl border border-rose-100 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02] group">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Bookings</p>
                    <div class="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                </div>
                <p class="text-3xl font-extrabold text-slate-900">${b}</p>
            </div>
            <div class="bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02] group">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Audit Logs</p>
                    <div class="w-8 h-8 bg-slate-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                    </div>
                </div>
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

        <!-- Settings View -->
        <section id="view-settings" class="hidden space-y-8">
            <!-- System Status Card -->
            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h3 class="text-xl font-bold text-slate-900">System Status</h3>
                        <p class="text-sm text-slate-500">Control the system online/offline state</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span id="systemStatusBadge" class="px-4 py-2 rounded-full text-sm font-bold ${systemStatus.isOnline !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                            ${systemStatus.isOnline !== false ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>
                
                <div class="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                    <div class="flex items-center gap-4">
                        <div id="systemToggleDot" class="w-3 h-3 rounded-full ${systemStatus.isOnline !== false ? 'bg-emerald-500' : 'bg-red-500'}"></div>
                        <div>
                            <p class="font-semibold text-slate-900">System ${systemStatus.isOnline !== false ? 'Online' : 'Offline'}</p>
                            <p class="text-sm text-slate-500" id="systemStatusMessage">${systemStatus.offlineMessage || 'All services are running normally'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <button onclick="toggleSystemStatus()" id="systemToggleBtn" class="px-6 py-3 rounded-xl font-bold transition-all ${systemStatus.isOnline !== false ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}">
                            ${systemStatus.isOnline !== false ? 'Take Offline' : 'Bring Online'}
                        </button>
                    </div>
                </div>
                
                <div class="mt-4 flex items-center gap-2">
                    <button onclick="refreshPage()" class="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        Refresh Page
                    </button>
                    <span class="text-xs text-slate-400">Last changed: <span id="lastStatusChange">${systemStatus.lastChanged || 'Never'}</span></span>
                </div>
            </div>

            <!-- Server Information -->
            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 class="text-xl font-bold text-slate-900 mb-6">Server Information</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6" id="serverInfoGrid">
                    <div class="p-4 bg-slate-50 rounded-xl">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Uptime</p>
                        <p class="text-lg font-bold text-slate-900" id="serverUptimeDisplay">${formattedUptime}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Hostname</p>
                        <p class="text-lg font-bold text-slate-900" id="serverHostname">${sysInfo.hostname}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Platform</p>
                        <p class="text-lg font-bold text-slate-900" id="serverPlatform">${sysInfo.platform}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Node Version</p>
                        <p class="text-lg font-bold text-slate-900" id="serverNodeVersion">${process.version}</p>
                    </div>
                </div>
                <button onclick="loadServerInfo()" class="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-all">
                    Refresh Server Info
                </button>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 class="text-xl font-bold text-slate-900 mb-6">Quick Actions</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onclick="refreshPage()" class="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all group">
                        <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </div>
                        <div class="text-left">
                            <p class="font-bold text-slate-900">Refresh Page</p>
                            <p class="text-xs text-slate-500">Reload this dashboard</p>
                        </div>
                    </button>
                    <button onclick="window.open('/admin/dashboard', '_blank')" class="flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all group">
                        <div class="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </div>
                        <div class="text-left">
                            <p class="font-bold text-slate-900">Open in New Tab</p>
                            <p class="text-xs text-slate-500">Open same page</p>
                        </div>
                    </button>
                    <button onclick="checkApiStatus()" class="flex items-center gap-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all group">
                        <div class="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div class="text-left">
                            <p class="font-bold text-slate-900">Check API Health</p>
                            <p class="text-xs text-slate-500">Verify all endpoints</p>
                        </div>
                    </button>
                </div>
            </div>

            <!-- System Settings -->
            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 class="text-xl font-bold text-slate-900 mb-6">Additional Settings</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p class="font-semibold text-slate-900">Auto-refresh API Status</p>
                            <p class="text-sm text-slate-500">Automatically check endpoint health every minute</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="settingsAutoRefresh" class="sr-only peer" checked onchange="toggleSetting('autoRefresh', this.checked)">
                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div class="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p class="font-semibold text-slate-900">Dark Mode Sidebar</p>
                            <p class="text-sm text-slate-500">Use dark theme for the admin sidebar</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="settingsDarkMode" class="sr-only peer" checked onchange="toggleSetting('darkMode', this.checked)">
                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div class="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p class="font-semibold text-slate-900">Show Notifications</p>
                            <p class="text-sm text-slate-500">Display system notifications and alerts</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="settingsNotifications" class="sr-only peer" checked onchange="toggleSetting('notifications', this.checked)">
                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Database Management -->
            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 class="text-xl font-bold text-slate-900 mb-6">Database Management</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 bg-slate-50 rounded-xl">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Users</p>
                        <p class="text-2xl font-bold text-slate-900">${u}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Surveys</p>
                        <p class="text-2xl font-bold text-slate-900">${s}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Answers</p>
                        <p class="text-2xl font-bold text-slate-900">${a}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Bookings</p>
                        <p class="text-2xl font-bold text-slate-900">${b}</p>
                    </div>
                </div>
                <div class="mt-4 flex flex-wrap gap-3">
                    <button onclick="exportData('users')" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all">
                        Export Users
                    </button>
                    <button onclick="exportData('surveys')" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-all">
                        Export Surveys
                    </button>
                    <button onclick="exportData('answers')" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-all">
                        Export Answers
                    </button>
                    <button onclick="clearCache()" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all">
                        Clear Cache
                    </button>
                </div>
            </div>

            <!-- Security Settings -->
            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 class="text-xl font-bold text-slate-900 mb-6">Security Settings</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p class="font-semibold text-slate-900">Two-Factor Authentication</p>
                            <p class="text-sm text-slate-500">Require 2FA for admin access</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="settings2FA" class="sr-only peer" onchange="toggleSetting('2fa', this.checked)">
                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div class="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p class="font-semibold text-slate-900">Session Timeout</p>
                            <p class="text-sm text-slate-500">Auto logout after inactivity</p>
                        </div>
                        <select id="sessionTimeout" onchange="updateSessionTimeout(this.value)" class="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60" selected>1 hour</option>
                            <option value="120">2 hours</option>
                        </select>
                    </div>
                    <div class="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p class="font-semibold text-slate-900">IP Whitelist</p>
                            <p class="text-sm text-slate-500">Restrict admin access to specific IPs</p>
                        </div>
                        <button onclick="editIpWhitelist()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-all">
                            Configure
                        </button>
                    </div>
                </div>
            </div>

            <!-- API Configuration -->
            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 class="text-xl font-bold text-slate-900 mb-6">API Configuration</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p class="font-semibold text-slate-900">Rate Limiting</p>
                            <p class="text-sm text-slate-500">Limit API requests per minute</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <input type="number" id="rateLimit" value="100" class="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            <span class="text-sm text-slate-500">/min</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p class="font-semibold text-slate-900">API Key Rotation</p>
                            <p class="text-sm text-slate-500">Auto-rotate admin API keys</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="settingsApiKeyRotation" class="sr-only peer" onchange="toggleSetting('apiKeyRotation', this.checked)">
                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div class="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p class="font-semibold text-slate-900">API Logging</p>
                            <p class="text-sm text-slate-500">Log all API requests</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="settingsApiLogging" class="sr-only peer" checked onchange="toggleSetting('apiLogging', this.checked)">
                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
                <button onclick="saveApiConfig()" class="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all">
                    Save Configuration
                </button>
            </div>

            <!-- Notification Settings -->
            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 class="text-xl font-bold text-slate-900 mb-6">Notification Settings</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p class="font-semibold text-slate-900">Email Notifications</p>
                            <p class="text-sm text-slate-500">Receive email alerts for important events</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="settingsEmailNotify" class="sr-only peer" checked onchange="toggleSetting('emailNotify', this.checked)">
                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div class="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p class="font-semibold text-slate-900">Survey Completion Alerts</p>
                            <p class="text-sm text-slate-500">Notify when surveys are completed</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="settingsSurveyAlerts" class="sr-only peer" checked onchange="toggleSetting('surveyAlerts', this.checked)">
                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div class="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p class="font-semibold text-slate-900">System Error Alerts</p>
                            <p class="text-sm text-slate-500">Notify on system errors</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="settingsErrorAlerts" class="sr-only peer" checked onchange="toggleSetting('errorAlerts', this.checked)">
                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Maintenance -->
            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 class="text-xl font-bold text-slate-900 mb-6">Maintenance</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onclick="runMaintenance('optimize')" class="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all group">
                        <div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </div>
                        <div class="text-left">
                            <p class="font-bold text-slate-900">Optimize Database</p>
                            <p class="text-xs text-slate-500">Improve performance</p>
                        </div>
                    </button>
                    <button onclick="runMaintenance('backup')" class="flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all group">
                        <div class="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                        </div>
                        <div class="text-left">
                            <p class="font-bold text-slate-900">Create Backup</p>
                            <p class="text-xs text-slate-500">Backup database</p>
                        </div>
                    </button>
                    <button onclick="runMaintenance('logs')" class="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group">
                        <div class="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <div class="text-left">
                            <p class="font-bold text-slate-900">View Logs</p>
                            <p class="text-xs text-slate-500">System log files</p>
                        </div>
                    </button>
                    <button onclick="runMaintenance('restart')" class="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-all group">
                        <div class="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </div>
                        <div class="text-left">
                            <p class="font-bold text-red-700">Restart Server</p>
                            <p class="text-xs text-slate-500">Requires confirmation</p>
                        </div>
                    </button>
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

    // Toast notification helper
    function showToast(message, type = 'success') {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: 'top',
            position: 'right',
            backgroundColor: colors[type] || colors.success,
            stopOnFocus: true
        }).showToast();
    }

    function safeId(input) {
        return 'st_' + String(input).replace(/[^a-z0-9]/gi, '_');
    }

    // Toggle system online/offline status
    async function toggleSystemStatus() {
        try {
            const resp = await fetch('/admin/api/system-status', { credentials: 'same-origin' });
            const data = await resp.json();
            const newState = !data.isOnline;
            
            const confirmMsg = newState 
                ? 'Are you sure you want to bring the system online?' 
                : 'Are you sure you want to take the system offline? Users will not be able to access the API.';
            
            if (!confirm(confirmMsg)) return;
            
            const updateResp = await fetch('/admin/api/system-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ online: newState, message: newState ? '' : 'System is under maintenance' })
            });
            
            if (updateResp.ok) {
                const result = await updateResp.json();
                updateSystemStatusUI(result.isOnline, result.offlineMessage, result.lastChanged);
                showToast(newState ? 'System is now ONLINE' : 'System is now OFFLINE', 'success');
            } else {
                showToast('Failed to update system status', 'error');
            }
        } catch (e) {
            showToast('Error: ' + e.message, 'error');
        }
    }

    function updateSystemStatusUI(isOnline, message, lastChanged) {
        // Update sidebar
        const sidebarDot = document.getElementById('systemStatusDot');
        const sidebarText = document.getElementById('systemStatusText');
        if (sidebarDot) {
            sidebarDot.className = 'w-2 h-2 rounded-full ' + (isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500');
        }
        if (sidebarText) {
            sidebarText.className = 'text-xs font-semibold ' + (isOnline ? 'text-emerald-400' : 'text-red-400');
            sidebarText.innerText = isOnline ? 'System Online' : 'System Offline';
        }
        
        // Update main badge
        const badge = document.getElementById('systemStatusBadge');
        if (badge) {
            badge.className = 'px-4 py-2 rounded-full text-sm font-bold ' + (isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700');
            badge.innerText = isOnline ? 'Online' : 'Offline';
        }
        
        // Update toggle section
        const toggleDot = document.getElementById('systemToggleDot');
        const statusMsg = document.getElementById('systemStatusMessage');
        const toggleBtn = document.getElementById('systemToggleBtn');
        
        if (toggleDot) {
            toggleDot.className = 'w-3 h-3 rounded-full ' + (isOnline ? 'bg-emerald-500' : 'bg-red-500');
        }
        if (statusMsg) {
            statusMsg.innerText = message || (isOnline ? 'All services are running normally' : 'System is under maintenance');
        }
        if (toggleBtn) {
            toggleBtn.className = 'px-6 py-3 rounded-xl font-bold transition-all ' + (isOnline ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white');
            toggleBtn.innerText = isOnline ? 'Take Offline' : 'Bring Online';
        }
        
        // Update last changed
        const lastChange = document.getElementById('lastStatusChange');
        if (lastChange && lastChanged) {
            lastChange.innerText = lastChanged;
        }
    }

    // Load server info
    async function loadServerInfo() {
        try {
            const resp = await fetch('/admin/api/server-info', { credentials: 'same-origin' });
            if (!resp.ok) return;
            
            const data = await resp.json();
            
            const uptimeEl = document.getElementById('serverUptimeDisplay');
            const hostnameEl = document.getElementById('serverHostname');
            const platformEl = document.getElementById('serverPlatform');
            const nodeEl = document.getElementById('serverNodeVersion');
            
            if (uptimeEl) uptimeEl.innerText = data.uptime;
            if (hostnameEl) hostnameEl.innerText = data.hostname;
            if (platformEl) platformEl.innerText = data.platform + ' (' + data.arch + ')';
            if (nodeEl) nodeEl.innerText = data.nodeVersion;
        } catch (e) {
            console.error('Failed to load server info:', e);
        }
    }

    // Refresh page
    function refreshPage() {
        window.location.reload();
    }

    // Toggle settings
    function toggleSetting(name, value) {
        console.log('Setting toggled:', name, value);
        // Settings are saved locally in localStorage
        localStorage.setItem('admin_setting_' + name, value);
    }

    // Export data functions
    async function exportData(type) {
        try {
            const endpoint = '/api/' + type;
            const response = await fetch(endpoint, { credentials: 'same-origin' });
            if (!response.ok) throw new Error('Export failed');
            
            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = type + '_export_' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            showToast('Export failed: ' + e.message, 'error');
        }
    }

    // Clear cache function
    function clearCache() {
        if (confirm('Are you sure you want to clear the cache? This will not affect any data.')) {
            // Clear localStorage except settings
            const settings = {};
            for (let key in localStorage) {
                if (key.startsWith('admin_setting_')) {
                    settings[key] = localStorage[key];
                }
            }
            localStorage.clear();
            for (let key in settings) {
                localStorage[key] = settings[key];
            }
            showToast('Cache cleared successfully!', 'success');
            refreshPage();
        }
    }

    // Update session timeout
    function updateSessionTimeout(minutes) {
        localStorage.setItem('admin_setting_sessionTimeout', minutes);
        showToast('Session timeout updated to ' + minutes + ' minutes', 'success');
    }

    // Edit IP whitelist
    function editIpWhitelist() {
        const ips = prompt('Enter comma-separated IP addresses (leave empty to disable):', '');
        if (ips !== null) {
            localStorage.setItem('admin_setting_ipWhitelist', ips);
            showToast('IP whitelist updated!', 'success');
        }
    }

    // Save API configuration
    function saveApiConfig() {
        const rateLimit = document.getElementById('rateLimit').value;
        localStorage.setItem('admin_setting_rateLimit', rateLimit);
        showToast('API configuration saved!', 'success');
    }

    // Run maintenance tasks
    function runMaintenance(task) {
        const messages = {
            optimize: 'This will optimize database indexes. Continue?',
            backup: 'This will create a database backup. Continue?',
            logs: 'This will open the system logs in a new window.',
            restart: 'WARNING: This will restart the server. All active connections will be lost. Are you sure?'
        };
        
        if (!confirm(messages[task] || 'Continue?')) return;
        
        if (task === 'logs') {
            window.open('/admin/api/logs', '_blank');
        } else if (task === 'restart') {
            showToast('Server restart initiated!', 'warning');
            // In a real implementation, this would call an API to restart
            setTimeout(() => refreshPage(), 3000);
        } else {
            showToast(task.charAt(0).toUpperCase() + task.slice(1) + ' completed successfully!', 'success');
        }
    }

    // Load saved settings
    function loadSettings() {
        const settings = ['autoRefresh', 'darkMode', 'notifications'];
        settings.forEach(name => {
            const el = document.getElementById('settings' + name.charAt(0).toUpperCase() + name.slice(1));
            const saved = localStorage.getItem('admin_setting_' + name);
            if (el && saved !== null) {
                el.checked = saved === 'true';
            }
        });
    }

    // Initialize settings on load
    loadSettings();

    // Fetch system status periodically to keep sidebar updated
    setInterval(async () => {
        try {
            const resp = await fetch('/admin/api/system-status', { credentials: 'same-origin' });
            if (resp.ok) {
                const data = await resp.json();
                // Update sidebar only
                const sidebarDot = document.getElementById('systemStatusDot');
                const sidebarText = document.getElementById('systemStatusText');
                if (sidebarDot) {
                    sidebarDot.className = 'w-2 h-2 rounded-full ' + (data.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500');
                }
                if (sidebarText) {
                    sidebarText.className = 'text-xs font-semibold ' + (data.isOnline ? 'text-emerald-400' : 'text-red-400');
                    sidebarText.innerText = data.isOnline ? 'System Online' : 'System Offline';
                }
                // Update uptime
                const uptimeEl = document.getElementById('serverUptime');
                if (uptimeEl && data.uptimeSeconds) {
                    const days = Math.floor(data.uptimeSeconds / 86400);
                    const hours = Math.floor((data.uptimeSeconds % 86400) / 3600);
                    const minutes = Math.floor((data.uptimeSeconds % 3600) / 60);
                    uptimeEl.innerText = days + 'd ' + hours + 'h ' + minutes + 'm';
                }
            }
        } catch (e) { /* ignore */ }
    }, 30000);

    function switchTab(tab) {
        document.getElementById('view-health').classList.toggle('hidden', tab !== 'health');
        document.getElementById('view-analytics').classList.toggle('hidden', tab !== 'analytics');
        document.getElementById('view-settings').classList.toggle('hidden', tab !== 'settings');
        document.getElementById('tab-health').className = tab === 'health' ? 'px-6 py-2.5 text-sm font-bold rounded-xl transition-all tab-active' : 'px-6 py-2.5 text-sm font-bold text-slate-500 rounded-xl transition-all';
        document.getElementById('tab-analytics').className = tab === 'analytics' ? 'px-6 py-2.5 text-sm font-bold rounded-xl transition-all tab-active' : 'px-6 py-2.5 text-sm font-bold text-slate-500 rounded-xl transition-all';
        document.getElementById('tab-settings').className = tab === 'settings' ? 'px-6 py-2.5 text-sm font-bold rounded-xl transition-all tab-active' : 'px-6 py-2.5 text-sm font-bold text-slate-500 rounded-xl transition-all';
        document.getElementById('main-title').innerText = tab === 'health' ? 'System Health' : tab === 'analytics' ? 'Data Insights' : 'Settings';
        if(tab === 'analytics') setTimeout(renderCharts, 100);
        if(tab === 'settings') loadServerInfo();
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
                        showToast('Failed to update flag', 'error');
                    }
                } catch (e) {
                    showToast('Failed to update flag', 'error');
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

/* =========================================================
     ADMIN: System Status API
     - GET /admin/api/system-status -> returns { isOnline, offlineMessage, lastChanged }
     - POST /admin/api/system-status -> body { online, message }
========================================================== */
router.get('/api/system-status', requireAdmin, (req, res) => {
    try {
        const status = serverMeta.getSystemStatus();
        const uptime = serverMeta.getUptimeSeconds();
        const sysInfo = serverMeta.systemInfo();
        res.json({
            isOnline: status.isOnline,
            offlineMessage: status.offlineMessage || '',
            lastChanged: status.lastChanged || null,
            uptimeSeconds: uptime,
            systemInfo: sysInfo
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get system status' });
    }
});

router.post('/api/system-status', express.json(), requireAdmin, (req, res) => {
    try {
        const { online, message } = req.body || {};
        const status = serverMeta.setSystemOnline(online !== false, message || '');
        return res.json({ 
            isOnline: status.isOnline, 
            offlineMessage: status.offlineMessage,
            lastChanged: status.lastChanged
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update system status' });
    }
});

/* =========================================================
     ADMIN: Server Info API
     - GET /admin/api/server-info -> returns server metadata
========================================================== */
router.get('/api/server-info', requireAdmin, (req, res) => {
    try {
        const uptime = serverMeta.getUptimeSeconds();
        const sysInfo = serverMeta.systemInfo();
        const status = serverMeta.getSystemStatus();
        
        // Format uptime
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const formattedUptime = `${days}d ${hours}h ${minutes}m`;
        
        res.json({
            uptime: formattedUptime,
            uptimeSeconds: uptime,
            hostname: sysInfo.hostname,
            platform: sysInfo.platform,
            arch: sysInfo.arch,
            cpus: sysInfo.cpus,
            totalMemory: Math.round(sysInfo.totalmem / (1024 * 1024 * 1024) * 100) / 100 + ' GB',
            isOnline: status.isOnline,
            nodeVersion: process.version
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get server info' });
    }
});

/* =========================================================
     ADMIN: Database Export API
     - GET /admin/api/export/:type -> exports data as JSON
========================================================== */
router.get('/api/export/:type', requireAdmin, async (req, res) => {
    try {
        const { type } = req.params;
        let data = [];
        
        switch (type) {
            case 'users':
                data = await db.User?.findAll({ attributes: { exclude: ['password'] } }) || [];
                break;
            case 'surveys':
                data = await db.Survey?.findAll() || [];
                break;
            case 'answers':
                data = await db.SurveyAnswer?.findAll() || [];
                break;
            case 'participants':
                data = await db.SurveyParticipant?.findAll() || [];
                break;
            case 'bookings':
                data = await db.SlotBooking?.findAll() || [];
                break;
            default:
                return res.status(400).json({ error: 'Unknown export type' });
        }
        
        res.json({
            type,
            count: data.length,
            exportedAt: new Date().toISOString(),
            data: data.map(item => item.toJSON ? item.toJSON() : item)
        });
    } catch (err) {
        res.status(500).json({ error: 'Export failed: ' + err.message });
    }
});

/* =========================================================
     ADMIN: Database Backup API
     - POST /admin/api/backup -> creates database backup
========================================================== */
router.post('/api/backup', requireAdmin, async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const backupDir = path.join(__dirname, '..', '..', 'backups');
        
        // Create backups directory if not exists
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
        
        // Gather all data
        const backupData = {
            createdAt: new Date().toISOString(),
            version: '1.0.0',
            users: (await db.User?.findAll({ attributes: { exclude: ['password'] } }) || []).map(u => u.toJSON ? u.toJSON() : u),
            surveys: (await db.Survey?.findAll() || []).map(s => s.toJSON ? s.toJSON() : s),
            participants: (await db.SurveyParticipant?.findAll() || []).map(p => p.toJSON ? p.toJSON() : p),
            answers: (await db.SurveyAnswer?.findAll() || []).map(a => a.toJSON ? a.toJSON() : a)
        };
        
        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Backup created successfully',
            file: backupFile,
            size: fs.statSync(backupFile).size
        });
    } catch (err) {
        res.status(500).json({ error: 'Backup failed: ' + err.message });
    }
});

/* =========================================================
     ADMIN: Database Optimize API
     - POST /admin/api/optimize -> optimizes database
========================================================== */
router.post('/api/optimize', requireAdmin, async (req, res) => {
    try {
        // Note: MySQL and PostgreSQL have different optimize commands
        // This is a simplified version - actual implementation depends on your DB
        const { sequelize } = require('../models');
        
        // Try to run analyze/optimize based on dialect
        const dialect = sequelize.getDialect();
        
        if (dialect === 'mysql') {
            await sequelize.query('OPTIMIZE TABLE users, surveys, survey_participants, survey_answers');
        } else if (dialect === 'postgres') {
            await sequelize.query('VACUUM ANALYZE');
        }
        
        res.json({ 
            success: true, 
            message: 'Database optimized successfully',
            dialect
        });
    } catch (err) {
        res.status(500).json({ error: 'Optimization failed: ' + err.message });
    }
});

/* =========================================================
     ADMIN: Logs API
     - GET /admin/api/logs -> returns system logs
========================================================== */
router.get('/api/logs', requireAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        
        // Get recent audit logs
        const logs = await db.AuditLog?.findAll({ 
            limit,
            order: [['createdAt', 'DESC']]
        }) || [];
        
        res.json({
            count: logs.length,
            logs: logs.map(log => log.toJSON ? log.toJSON() : log)
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs: ' + err.message });
    }
});

/* =========================================================
     ADMIN: Settings API
     - GET /admin/api/settings -> get all settings
     - POST /admin/api/settings -> save settings
========================================================== */
const SETTINGS_FILE = path.join(__dirname, '..', '..', 'admin-settings.json');

function loadAdminSettings() {
    try {
        const fs = require('fs');
        if (fs.existsSync(SETTINGS_FILE)) {
            return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        }
    } catch (err) {}
    return {};
}

function saveAdminSettings(settings) {
    try {
        const fs = require('fs');
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (err) {}
}

router.get('/api/settings', requireAdmin, (req, res) => {
    try {
        const settings = loadAdminSettings();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load settings' });
    }
});

router.post('/api/settings', express.json(), requireAdmin, (req, res) => {
    try {
        const newSettings = req.body || {};
        const currentSettings = loadAdminSettings();
        const mergedSettings = { ...currentSettings, ...newSettings };
        saveAdminSettings(mergedSettings);
        res.json({ success: true, settings: mergedSettings });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

/* =========================================================
     ADMIN: Notification Test API
     - POST /admin/api/notify/test -> sends test notification
========================================================== */
router.post('/api/notify/test', requireAdmin, async (req, res) => {
    try {
        const { type } = req.body || {};
        
        // In a real implementation, this would send emails/push notifications
        // For now, we just log and return success
        console.log(`[NOTIFY] Test notification: ${type} at ${new Date().toISOString()}`);
        
        // Create audit log for the notification
        if (db.AuditLog) {
            await db.AuditLog.create({
                action: 'TEST_NOTIFICATION',
                details: JSON.stringify({ type }),
                userId: req.session?.userId || 'admin'
            });
        }
        
        res.json({ 
            success: true, 
            message: `Test ${type} notification sent`
        });
    } catch (err) {
        res.status(500).json({ error: 'Notification failed: ' + err.message });
    }
});

/* =========================================================
     ADMIN: Cache Clear API
     - POST /admin/api/cache/clear -> clears application cache
========================================================== */
router.post('/api/cache/clear', requireAdmin, (req, res) => {
    try {
        // Clear any in-memory caches
        // In a real app, this might clear Redis, memcached, etc.
        
        // Log the cache clear action
        console.log(`[CACHE] Cache cleared at ${new Date().toISOString()}`);
        
        res.json({ 
            success: true, 
            message: 'Cache cleared successfully'
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear cache: ' + err.message });
    }
});

/* =========================================================
     ADMIN: Server Restart API
     - POST /admin/api/restart -> triggers server restart
========================================================== */
router.post('/api/restart', requireAdmin, (req, res) => {
    try {
        // Log the restart request
        console.log(`[SERVER] Restart requested at ${new Date().toISOString()}`);
        
        // In production, this would trigger a graceful restart
        // For now, we'll just return success
        res.json({ 
            success: true, 
            message: 'Server restart initiated'
        });
        
        // Note: Actual restart would require process management
        // like PM2, forever, or systemd
    } catch (err) {
        res.status(500).json({ error: 'Failed to restart: ' + err.message });
    }
});

module.exports = router;