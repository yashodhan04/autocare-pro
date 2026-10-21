# AutoCare Pro — Project Plan

> Module-by-module feature roadmap. Each module will be implemented in a separate development step after scaffolding is complete.

---

## Status Key

| Symbol | Meaning      |
|--------|--------------|
| 🔲     | Planned      |
| 🔄     | In Progress  |
| ✅     | Implemented  |
| 🧪     | Tested       |

---

## Module 0 — Scaffolding & Infrastructure ✅

**Status:** Implemented (Step 1)

- Monorepo structure (`client/`, `server/`, `docs/`)
- Vite + React + JavaScript frontend
- Express 5 + JavaScript ES-module backend
- Tailwind CSS v3 with AutoCare Pro design tokens
- React Router v7
- Health and readiness endpoints (`/api/v1/health`, `/api/v1/health/ready`)
- Socket.IO stub
- `.gitignore`, `README.md`, documentation

---

## Module 1 — Authentication & User Management 🔲

**Planned features:**
- User registration and login
- JWT-based authentication (access + refresh tokens)
- Password hashing (bcrypt)
- Role-based access control: `customer`, `advisor`, `mechanic`, `inventory_manager`, `admin`
- Protected route middleware

**Planned API routes:**
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
PATCH  /api/v1/auth/change-password
```

**Planned Mongoose models:**
- `User` — name, email, passwordHash, role, isActive, createdAt

**Planned React features:**
- `features/auth/` — LoginPage, RegisterPage, AuthContext, useAuth hook, ProtectedRoute wrapper

---

## Module 2 — Customer Management 🔲

**Planned features:**
- Customer profiles (CRUD)
- Search and filter customers
- Link vehicles to customers
- Customer activity history

**Planned API routes:**
```
GET    /api/v1/customers
GET    /api/v1/customers/:id
POST   /api/v1/customers
PATCH  /api/v1/customers/:id
DELETE /api/v1/customers/:id
GET    /api/v1/customers/:id/vehicles
```

**Planned Mongoose models:**
- `Customer` — firstName, lastName, email, phone, address, notes, createdAt

**Planned React features:**
- `features/customers/` — CustomerListPage, CustomerDetailPage, CustomerForm

---

## Module 3 — Vehicle Records 🔲

**Planned features:**
- Vehicle registration and management
- Link vehicles to customers
- Maintenance history per vehicle
- VIN/registration lookup (manual entry)

**Planned API routes:**
```
GET    /api/v1/vehicles
GET    /api/v1/vehicles/:id
POST   /api/v1/vehicles
PATCH  /api/v1/vehicles/:id
DELETE /api/v1/vehicles/:id
GET    /api/v1/vehicles/:id/service-history
```

**Planned Mongoose models:**
- `Vehicle` — make, model, year, vin, registration, colour, owner (ref: Customer), mileage

**Planned React features:**
- `features/vehicles/` — VehicleListPage, VehicleDetailPage, VehicleForm

---

## Module 4 — Appointments 🔲

**Planned features:**
- Schedule service appointments
- Calendar view and list view
- Appointment statuses: `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`
- Assign advisor

**Planned API routes:**
```
GET    /api/v1/appointments
GET    /api/v1/appointments/:id
POST   /api/v1/appointments
PATCH  /api/v1/appointments/:id
DELETE /api/v1/appointments/:id
```

**Planned Mongoose models:**
- `Appointment` — vehicle, customer, advisor, scheduledAt, status, notes

**Planned React features:**
- `features/appointments/` — AppointmentCalendar, AppointmentListPage, AppointmentForm

---

## Module 5 — Work Orders (Job Cards) 🔲

**Planned features:**
- Create work orders from appointments
- Add labour tasks and parts to a job
- Technician assignment
- Work order statuses: `open`, `in_progress`, `awaiting_parts`, `completed`
- Time tracking

**Planned API routes:**
```
GET    /api/v1/work-orders
GET    /api/v1/work-orders/:id
POST   /api/v1/work-orders
PATCH  /api/v1/work-orders/:id
POST   /api/v1/work-orders/:id/tasks
PATCH  /api/v1/work-orders/:id/tasks/:taskId
```

**Planned Mongoose models:**
- `WorkOrder` — appointment, vehicle, technician, tasks[], parts[], status, totalLabour, totalParts

---

## Module 6 — Inventory Management 🔲

**Planned features:**
- Parts catalogue (CRUD)
- Stock level tracking
- Low-stock alerts
- Parts usage per work order

**Planned API routes:**
```
GET    /api/v1/inventory
GET    /api/v1/inventory/:id
POST   /api/v1/inventory
PATCH  /api/v1/inventory/:id
DELETE /api/v1/inventory/:id
GET    /api/v1/inventory/low-stock
```

**Planned Mongoose models:**
- `Part` — name, sku, category, quantity, reorderLevel, unitCost, supplier

---

## Module 7 — Invoicing & Payments 🔲

**Planned features:**
- Generate invoice from completed work order
- Invoice statuses: `draft`, `sent`, `paid`, `overdue`
- PDF generation (future)
- Payment recording (no real gateway in this phase)

**Planned API routes:**
```
GET    /api/v1/invoices
GET    /api/v1/invoices/:id
POST   /api/v1/invoices
PATCH  /api/v1/invoices/:id
POST   /api/v1/invoices/:id/mark-paid
```

**Planned Mongoose models:**
- `Invoice` — workOrder, customer, lineItems[], subtotal, tax, total, status, dueDate

---

## Module 8 — Dashboard & Reports 🔲

**Planned features:**
- Admin dashboard with KPI cards
- Revenue over time (Recharts line chart)
- Appointments by status (Recharts bar/pie chart)
- Inventory health
- Recent activity feed

**Planned API routes:**
```
GET /api/v1/reports/summary
GET /api/v1/reports/revenue?period=monthly
GET /api/v1/reports/appointments?period=weekly
```

---

## Module 9 — Notifications & Real-time Updates 🔲

**Planned features:**
- In-app notifications for appointment confirmations, work order status changes
- Socket.IO push for real-time status updates
- Notification mark-as-read

**Planned API routes:**
```
GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
DELETE /api/v1/notifications/:id
```

**Planned Mongoose models:**
- `Notification` — recipient, type, message, isRead, relatedEntity

---

## Module 10 — Admin Panel 🔲

**Planned features:**
- User management (list, activate/deactivate, change role)
- System settings
- Audit logs

---

## Frontend Architecture

```
client/src/
├── components/         # Reusable: Button, Card, Modal, Table, Badge, Input…
├── layouts/            # AppShell (sidebar + topbar), AuthLayout, PublicLayout
├── pages/              # Top-level route components
├── features/           # Feature slices: auth/, customers/, vehicles/…
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       └── services/
├── hooks/              # Global hooks: useApi, useToast, useAuth
├── services/           # Axios instances and API call functions
├── utils/              # formatDate, formatCurrency, cn() etc.
├── types/              # JSDoc @typedef shapes shared across features
└── styles/             # Additional global CSS
```

---

## Backend Architecture

```
server/src/
├── config/             # env.js, db.js (future), constants.js
├── controllers/        # Request/response; call service layer
├── middleware/         # auth, errorHandler, notFound, validate, rateLimit
├── models/             # Mongoose schemas with indexes and validators
├── routes/             # Express routers; bind paths to controllers
├── services/           # Business logic; call models
├── validation/         # Zod schemas for request bodies and params
├── utils/              # asyncHandler, ApiError, helpers
└── tests/              # Supertest integration tests
```
