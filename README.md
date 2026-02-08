# Survey Premium Project Backend

A **production‑ready Node.js + Express + Sequelize backend** for managing surveys, workflows, approvals, capacity/waitlist logic, calendars, and role‑based access control.

This backend is designed for **enterprise‑grade survey orchestration**, supporting complex flows such as:

* Multi‑stage surveys
* Capacity‑limited options with waitlists
* Approval workflows
* Calendar slot booking
* Role‑based permissions
* Audit logging

---

## 🧱 Tech Stack

* **Node.js** (v18+ / v22 tested)
* **Express.js**
* **Sequelize ORM**
* **MySQL / MariaDB**
* **dotenv** (environment configuration)
* **nodemon** (development)

---

## 📁 Project Structure

```
Survey-Premium_Project_Backend/
├── server.js
├── .env
├── package.json
└── src/
    ├── config/
    │   └── database.js
    ├── models/
    │   ├── index.js
    │   ├── user.js
    │   ├── user_role.js
    │   ├── group.js
    │   ├── survey.js
    │   ├── survey_question.js
    │   ├── survey_answer.js
    │   ├── calendar_slot.js
    │   ├── action_plan.js
    │   └── ...
    ├── controllers/
    │   ├── user.controller.js
    │   ├── userRole.controller.js
    │   ├── survey.controller.js
    │   └── ...
    ├── routes/
    │   ├── user.routes.js
    │   ├── userRole.routes.js
    │   ├── survey.routes.js
    │   └── ...
    └── middlewares/
```

---

## ⚙️ Environment Setup

### 1️⃣ Clone the repository

```bash
git clone <repo-url>
cd Survey-Premium_Project_Backend
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Configure environment variables

Create a `.env` file in the root directory:

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=survey_premium
DB_DIALECT=mysql
```

---

## ▶️ Running the Server

### Development mode (recommended)

```bash
npx nodemon server.js
```

### Production mode

```bash
node server.js
```

Server will start at:

```
http://localhost:3000
```

---

## 🔐 Authentication & Authorization

* Role‑based access control using `user_roles`
* Token‑based authentication (`auth_tokens`)
* Extendable for OTP / challenge‑based login

---

## 📌 API Modules Overview

### 👤 User & Access Management

* `/api/users`
* `/api/user-roles`
* `/api/groups`
* `/api/group-members`

### 📊 Survey Engine

* `/api/surveys`
* `/api/survey-questions`
* `/api/survey-options`
* `/api/survey-answers`
* `/api/survey-participants`
* `/api/survey-selections`
* `/api/survey-releases`

### ⏳ Capacity & Waitlist

* `/api/option-capacities`
* `/api/option-holds`
* `/api/option-waitlist`
* `/api/option-counters`

### ✅ Approval Workflow

* `/api/approval-workflows`
* `/api/approval-steps`
* `/api/approval-items`
* `/api/approval-actions`

### 📅 Calendar & Scheduling

* `/api/calendar-slots`
* `/api/slot-bookings`
* `/api/slot-quota-buckets`

### 🧩 Relay Automation

* `/api/relay-workflows`
* `/api/relay-stages`
* `/api/relay-stage-actions`

### 📑 Documents & Audit

* `/api/documents`
* `/api/document-requirements`
* `/api/audit-logs`

---

## 🧪 API Testing

Use **Postman / Insomnia**:

```http
GET http://localhost:3000/api/users
```

All APIs return JSON responses with proper HTTP status codes.

---

## 🛠 Sequelize Notes (IMPORTANT)

* All models must export a **function**, not a class
* Models are registered via `src/models/index.js`
* Associations are defined after all models are loaded

Example pattern:

```js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', { ... });
  return User;
};
```

---

## 🧠 Best Practices Followed

* UUID primary keys
* Foreign key constraints
* Soft‑extensible enums
* Transaction‑safe design (capacity & approvals)
* Audit‑ready logging

---



## 📄 License

MIT License

---

### 💡 Maintained as a **production‑grade backend**, not a demo project.
