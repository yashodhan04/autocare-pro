# AutoCare Pro — Vehicle Service & Workshop Management System

Full-stack workshop platform: **React 19 + Vite + Tailwind** frontend, **Node.js + Express 5** REST API, **MySQL 8 (Sequelize ORM)**, Socket.IO for live notifications. JavaScript/JSX only — no TypeScript, no PHP, no AI APIs.

## Features (all backed by the API and database)

Auth & RBAC (7 roles, httpOnly-cookie JWT sessions, password reset) · Dashboards (customer / mechanic / staff / revenue) · Customers · Vehicles (+ service history, odometer) · Service catalogue · Appointments (slot availability, bay capacity, conflict prevention, reschedule/cancel rules) · Job cards with a guarded status lifecycle · Digital inspections · Estimates with server-calculated totals, customer approval, revisions & re-approval · Mechanic workspace (tasks, labour time, part requests, quality check) · Inventory with a stock-movement ledger and atomic stock deduction · Suppliers & purchase orders (receive → stock-in) · Invoices (printable) & manual/test payments · In-app (live) notifications · Maintenance reminders (date / odometer) · Reviews with moderation · Reports with date ranges · Audit log.

Workflow: `Register → Vehicle → Appointment → Check-in/Job card → Inspection → Estimate → Customer approval → Mechanic assigned → Repair + parts → Quality check → Invoice → Payment → Delivery → History & reminders`. The backend enforces each transition (e.g. work cannot start until an estimate is approved; delivery requires a fully-paid invoice).

## Quick start

Prerequisites: Node ≥ 20 and a MySQL 8 server with an empty database (e.g. `CREATE DATABASE autocare_pro;` and a user with rights on it).

```bash
# 1. API
cd server
cp .env.example .env          # set JWT_SECRET (see comment inside) and DATABASE_URL (mysql://user:pass@host:3306/autocare_pro)
npm install
npm run seed                  # DEV FIXTURES: one account per role, services, parts (password: Password123)
npm run dev                   # http://localhost:5000/api/v1/health

# 2. Web app (new terminal)
cd client
npm install
npm run dev                   # http://localhost:5173  (Vite proxies /api and /socket.io to :5000)
```

Demo accounts (after `npm run seed`, dev only): `super@`, `admin@`, `advisor@`, `mechanic@`, `inventory@`, `cashier@`, `customer@` `autocare.dev` — password `Password123`. The login page offers one-click fill in dev builds.

## Tests

```bash
cd server && npm test         # 45 integration tests (Vitest + Supertest) against DATABASE_URL_TEST (all tables DROPPED and recreated on each run)
cd client && npm run build    # production build check
```

Covered: auth + cookie sessions + CSRF origin check, role permissions, appointment conflicts/hours/capacity, the full job → estimate → approval → parts → invoice → payment → delivery workflow, estimate revisions, inventory concurrency (stock can never go negative), PO receiving, invoice maths, reports. A Postman collection is in `docs/postman/` (see `docs/DEPLOYMENT_AND_DEMO.md`).

## Project structure

```
client/src   components/{ui,layout,common}  context/  hooks/  pages/  features/  services/  config/  utils/
server/src   config/ controllers/ middleware/ models/ (Sequelize) routes/ services/ validation/ utils/ scripts/ tests/
docs/        PROJECT_PLAN · PROJECT_HANDOFF · ASSIGNMENT_COVERAGE · DEPLOYMENT_AND_DEMO · postman/
```

API: everything under `/api/v1/` — `auth users customers vehicles services appointments jobs inspections estimates inventory suppliers purchase-orders invoices payments notifications maintenance-plans reviews audit-logs reports`. Responses are `{ success, data, pagination? }`; errors are `{ success:false, status, message, details? }`.

## Security notes

Passwords: scrypt. Sessions: signed JWT in an **httpOnly** cookie (Bearer header also accepted for API clients). Zod validation on every write; parameterised SQL only (Sequelize / bound replacements), strict integer ids; role checks per route; customers are confined to their own records; Origin check on state-changing requests; rate limiting on auth routes; helmet; no secrets in git (`.env` is ignored — only `.env.example` is committed). Payments are **manual/simulated** — no payment gateway.
