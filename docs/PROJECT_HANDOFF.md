# AutoCare Pro — Project Handoff & Developer Continuation Guide

> **Target Audience:** Incoming Full-Stack Developers & Collaborators  
> **Repository:** AutoCare Pro (Vehicle Service & Workshop Management System)  
> **Status:** **Active Development / Incomplete — Must Be Continued**

---

## 1. Project Objectives

**AutoCare Pro** is an enterprise-grade vehicle service and workshop management system designed to streamline day-to-day operations for automotive service centres, independent garages, and multi-bay repair facilities.

The core objectives of the system are:
1. **Customer & Fleet Management:** Centralize customer profiles, contact info, and multiple vehicle ownership records.
2. **Vehicle Maintenance Tracking:** Maintain comprehensive service history logs, mileage records, and inspection notes per vehicle.
3. **Appointment Scheduling:** Allow service advisors to schedule service appointments, allocate service bays, and manage workload calendars.
4. **Job Cards & Work Orders:** Enable technicians and workshop managers to track repair tasks, labour hours, and assigned parts in real time.
5. **Inventory & Spare Parts Control:** Monitor inventory stock levels, unit costs, low-stock thresholds, and purchase orders.
6. **Invoicing & Billing:** Generate transparent invoices from completed work orders with tax breakdowns, discounts, and payment tracking.
7. **Operational Analytics:** Provide business owners with visibility into revenue metrics, appointment volume, parts consumption, and technician efficiency.

---

## 2. Permanent Architectural Decisions & Strict Constraints

The incoming developer **MUST** adhere to the following non-negotiable architectural rules:

### 🚫 1. JavaScript and JSX ONLY (No TypeScript)
- The entire application (both frontend and backend) is written in pure **JavaScript (ES Modules)** and **JSX**.
- **Do NOT introduce TypeScript** (`.ts`, `.tsx`, `tsconfig.json`, or `@types/*` dependencies).
- Use clear JSDoc annotations where type documentation is beneficial.

### 🚫 2. MongoDB is the ONLY Database
- **MongoDB** is the single database technology for this project.
- Object data modeling is performed exclusively through **Mongoose 8+**.
- **Do NOT introduce SQL databases** (MySQL, PostgreSQL, SQLite, Prisma) or PHP.

### 🚫 3. No AI-Model API Keys Required
- The current development scope and assignment requirements **do not require any AI or LLM API keys** (OpenAI, Gemini, Anthropic, etc.).
- Do not add paid third-party AI APIs or external AI dependencies to the repository.

### ⚠️ 4. Project is NOT Complete and MUST Be Continued
- The project has completed architectural scaffolding, the UI design system, and the application shell.
- Business logic, MongoDB collections, authentication, and CRUD modules remain to be implemented.

### 🎨 5. Established Design System & UI Consistency
- The UI palette and tokens are locked in `tailwind.config.js` and `client/src/index.css`:
  - **Electric Lime (`#C6F135`)**: Primary accent, active states, key CTAs, highlights.
  - **Charcoal (`#1A1D23`)**: Main sidebar, navigation background.
  - **Charcoal Soft (`#22262F`)**: Cards, panels, dropdown menus, dark surfaces.
  - **Surface Page (`#F4F5F7`)**: Light application background.
  - **Border (`#E2E5EC`)**: Standard border stroke.
- **Do NOT install external UI component libraries** (such as Material UI, Ant Design, Chakra UI, or Shadcn).
- **Use the pre-built components** in `client/src/components/ui/` (`Button`, `Card`, `Badge`, `Dialog`, `Dropdown`, `Form`, `Pagination`, `Skeleton`, `States`, `Tabs`, `Toast`, `Tooltip`, `Breadcrumbs`).

---

## 3. Implemented Functionality & Current Milestones

### ✅ Phase 1: Scaffolding & Monorepo Infrastructure (Complete)
- Dual-directory monorepo: `client/` (React + Vite) and `server/` (Express 5).
- Shared design tokens in Tailwind CSS v3 and PostCSS.
- Express server configured with CORS, Helmet, Morgan, and graceful shutdown handling.
- Validated environment loader (`server/src/config/env.js`) with fail-safe defaults.
- Working health check API (`GET /api/v1/health`) and MongoDB readiness probe (`GET /api/v1/health/ready`).
- Socket.IO HTTP server attachment initialized.

### ✅ Phase 2: Design System Component Library (Complete)
- **14 Reusable UI Components** implemented in `client/src/components/ui/`:
  - `Button.jsx` — Primary, Secondary, Outline, Ghost, Danger variants with loading spinners and icon slots.
  - `Badge.jsx` — Status badges with dot indicators and counter pills.
  - `Card.jsx` — Surface containers with Header, Title, Description, Content, and Footer subcomponents.
  - `Dialog.jsx` — Accessible modal dialogs, confirm dialogs, and success dialogs.
  - `Dropdown.jsx` — Context menus and select dropdowns with keyboard navigation and click-outside listeners.
  - `Form.jsx` — Form fields, TextInput, Select, Textarea, Checkbox with error message rendering.
  - `Pagination.jsx` — Full-featured pagination with first/last, page jump, and ellipsis calculation.
  - `Skeleton.jsx` — Shimmer loading shapes for cards, text blocks, and table rows.
  - `States.jsx` — Reusable EmptyState, ErrorState, and SuccessState components.
  - `Tabs.jsx` — Underline and Pill tab navigation components with keyboard controls.
  - `Toast.jsx` — Toast notification system with auto-dismiss timers, action buttons, and `useToast` hook.
  - `Tooltip.jsx` — Hover and focus tooltips with configurable positioning (`top`, `bottom`, `left`, `right`).
  - `Breadcrumbs.jsx` — Breadcrumb navigation bar with chevron separators.
  - `index.js` — Clean barrel export for all UI components.
- Interactive showcase available at route **`/design-system`** via `client/src/pages/DesignSystemPage.jsx`.

### ✅ Phase 3: Application Shell & Layout (Complete)
- `Sidebar.jsx` — Collapsible dark left sidebar, icon-only desktop mode with tooltips, mobile off-canvas drawer.
- `TopNav.jsx` — Top bar with breadcrumb tracking, route-filtering search modal (Ctrl+K / /), notifications empty state, and dev-mode user profile menu.
- `AppLayout.jsx` — Master layout shell wrapping the sidebar, top navigation, main `<Outlet />`, and global toast container.
- `PageHeader.jsx` — Standardized page header component with title, badge, and action slots.
- `DashboardPage.jsx` — Workshop operations dashboard with page header, 4 navigable quick actions, and structured empty states without fake data.
- `ModulePlaceholderPage.jsx` — Reusable, roadmap-mapped placeholder page for all 15 business modules.
- `NotFoundPage.jsx` — Branded 404 page with navigation to dashboard and design system.
- `nav.config.js` — Navigation tree grouping all 6 core categories (OVERVIEW, CUSTOMERS, WORKSHOP, INVENTORY, FINANCE, MANAGEMENT).
- `useMediaQuery.js` — Responsive viewport hook.

---

## 4. Current Project Structure

```
autocare-pro/
├── client/                               # Frontend client application
│   ├── public/
│   ├── src/
│   │   ├── assets/                       # Static SVGs and branding images
│   │   ├── components/
│   │   │   ├── layout/                   # Layout-specific components
│   │   │   │   ├── PageHeader.jsx        # Reusable page title & actions banner
│   │   │   │   ├── Sidebar.jsx           # Dark navigation drawer & collapsible panel
│   │   │   │   └── TopNav.jsx            # Top bar, breadcrumbs, search, profile
│   │   │   └── ui/                       # 14 custom UI components (see section 3)
│   │   │       └── index.js              # Barrel export
│   │   ├── config/
│   │   │   └── nav.config.js             # Nav structure, route paths, icons
│   │   ├── hooks/
│   │   │   └── useMediaQuery.js          # Responsive hook
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx             # Shell wrapper with Outlet
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx         # Workshop operations landing page
│   │   │   ├── DesignSystemPage.jsx      # Living component library preview
│   │   │   ├── ModulePlaceholderPage.jsx # Feature roadmap placeholders for modules
│   │   │   ├── NotFoundPage.jsx          # Branded 404 error page
│   │   │   └── PlaceholderPage.jsx       # Public landing screen
│   │   ├── utils/
│   │   │   └── cn.js                     # Classnames join utility
│   │   ├── App.jsx                       # React Router configuration
│   │   ├── index.css                     # Tailwind layers & custom design tokens
│   │   └── main.jsx                      # React 19 entry

│   ├── .env.example                      # Safe placeholder client env
│   ├── package.json                      # Client packages & scripts
│   ├── tailwind.config.js                # Theme colors and typography
│   └── vite.config.js                    # Vite configuration
│
├── server/                               # Backend API server
│   ├── src/
│   │   ├── config/
│   │   │   └── env.js                    # Configuration reader & validator
│   │   ├── middleware/
│   │   │   ├── errorHandler.js           # Global error handling middleware
│   │   │   └── notFound.js               # Route 404 handler
│   │   ├── routes/
│   │   │   └── health.route.js           # /api/v1/health & /api/v1/health/ready
│   │   ├── controllers/                  # Controller handlers (ready for implementation)
│   │   ├── models/                       # Mongoose model schemas (ready for implementation)
│   │   ├── services/                     # Business logic services (ready for implementation)
│   │   ├── validation/                   # Zod schemas (ready for implementation)
│   │   ├── utils/                        # Server utilities
│   │   ├── app.js                        # Express setup with JSON parser, CORS, helmet
│   │   └── server.js                     # Server bootstrap with Socket.IO & port listen
│   ├── .env.example                      # Safe placeholder server env
│   └── package.json                      # Server packages & scripts
│
├── docs/                                 # Documentation directory
│   ├── PROJECT_HANDOFF.md                # This handoff guide
│   ├── PROJECT_PLAN.md                   # Complete module breakdown
│   └── ASSIGNMENT_COVERAGE.md            # Academic requirement mapping
│
├── .gitignore                            # Root gitignore excluding secrets & dependencies
└── README.md                             # High-level repository README
```

---

## 5. Technology Stack Summary

| Package | Version | Purpose |
|---|---|---|
| `react` / `react-dom` | `^19.1.0` | UI Library (JavaScript / JSX) |
| `vite` | `^6.3.5` | Bundler & Dev Server |
| `react-router-dom` | `^7.6.0` | Client Navigation & Routing |
| `tailwindcss` | `^3.4.17` | Utility-first CSS styling |
| `lucide-react` | `^0.511.0` | Iconography |
| `react-hook-form` | `^7.56.4` | Form State Management |
| `zod` | `^3.24.3` | Schema validation (client + server) |
| `recharts` | `^2.15.3` | Analytics charts |
| `express` | `^5.1.0` | Web framework (Node.js ES Modules) |
| `mongoose` | `^8.14.1` | MongoDB Object Modeling |
| `socket.io` | `^4.8.1` | Real-time WebSocket connectivity |
| `cors` | `^2.8.5` | Cross-Origin Resource Sharing |
| `helmet` | `^8.1.0` | Security headers |
| `dotenv` | `^16.5.0` | Environment variable parsing |

---

## 6. Environment Setup & Configuration

### Step A: Prerequisites
- **Node.js**: `v20.0.0` or higher
- **MongoDB**: A running MongoDB instance:
  - Local MongoDB Community Server running at `mongodb://localhost:27017`
  - OR a MongoDB Atlas cluster URI.

### Step B: Environment Variables
Create the actual environment files from the provided `.env.example` templates:

```bash
# 1. Server configuration
cd server
cp .env.example .env

# 2. Client configuration (optional)
cd ../client
cp .env.example .env
```

**`server/.env` template:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/autocare_pro
CLIENT_URL=http://localhost:5173
```

> **Security Reminder:**
> - Never commit `.env` or `.env.local` files to git.
> - The root `.gitignore` is pre-configured to exclude all `.env`, `.env.local`, `server/.env`, and `client/.env.local` files.
> - Only placeholder example files (`.env.example`) should be committed.

---

## 7. Commands to Run & Validate the Application

### 1. Install Dependencies
```bash
# In client/
cd client && npm install

# In server/
cd ../server && npm install
```

### 2. Run Development Servers
Open two terminals:

```bash
# Terminal 1 — Backend API
cd server
npm run dev
# Running on http://localhost:5000

# Terminal 2 — Frontend Client
cd client
npm run dev
# Running on http://localhost:5173
```

### 3. Verify Health Checks
```bash
# Check if Express is alive
curl http://localhost:5000/api/v1/health

# Check database connection readiness
curl http://localhost:5000/api/v1/health/ready
```

### 4. Build & Production Check
```bash
# Build frontend for production
cd client
npm run build

# Preview production build
npm run preview
```

---

## 8. Remaining Development Tasks (Roadmap for Incoming Developer)

The following steps outline how to pick up development sequentially:

### Immediate Next Step: Module 1 (Authentication) or Module 2 (Customer Management)
The Application Shell, routes (`/app/*`), dashboard (`/app/dashboard`), and module placeholder pages (`ModulePlaceholderPage.jsx`) are now fully wired and verified. Development can proceed directly to backend Mongoose models and business logic:


### Module 1: Authentication & Role-Based Access Control
1. **Connect MongoDB:** In `server/src/server.js`, initialize `mongoose.connect(config.mongodbUri)`.
2. **User Model:** Create `server/src/models/User.model.js` with fields: `name`, `email`, `passwordHash`, `role` (`admin`, `advisor`, `mechanic`, `customer`), `isActive`, `createdAt`.
3. **Password Security:** Use `bcrypt` for password hashing on save.
4. **JWT Service:** Implement JWT generation and verification in `server/src/services/jwt.service.js`.
5. **Auth Middleware:** Implement `protect` and `restrictTo(...roles)` in `server/src/middleware/auth.js`.
6. **Frontend Auth:** Create `client/src/features/auth/` containing `LoginPage.jsx`, `RegisterPage.jsx`, and `AuthContext.jsx`.

### Module 2: Customer Management
1. **Model:** `Customer.model.js` (`firstName`, `lastName`, `email`, `phone`, `address`, `vehicles`, `notes`).
2. **API Routes:** `GET /api/v1/customers`, `POST /api/v1/customers`, `GET /api/v1/customers/:id`, `PATCH /api/v1/customers/:id`.
3. **Frontend:** Customer table using `Card`, `Badge`, `Form`, and `Pagination` components.

### Module 3: Vehicle Records
1. **Model:** `Vehicle.model.js` (`make`, `model`, `year`, `vin`, `registrationNumber`, `owner` [ref Customer], `mileage`).
2. **API Routes:** CRUD routes under `/api/v1/vehicles`.
3. **Frontend:** Vehicle details screen showing service history.

### Module 4: Appointments
1. **Model:** `Appointment.model.js` (`customer`, `vehicle`, `advisor`, `scheduledAt`, `status`, `notes`).
2. **API Routes:** CRUD routes under `/api/v1/appointments`.
3. **Frontend:** Calendar and list view for workshop booking.

### Module 5: Work Orders & Job Cards
1. **Model:** `WorkOrder.model.js` (`appointment`, `vehicle`, `technician`, `tasks`, `partsUsed`, `status`, `labourCost`, `partsCost`).
2. **API Routes:** Routes under `/api/v1/work-orders`.
3. **Frontend:** Workshop floor view with task checkboxes.

### Module 6: Inventory & Spare Parts
1. **Model:** `Part.model.js` (`name`, `sku`, `category`, `unitPrice`, `unitCost`, `quantityInStock`, `reorderLevel`).
2. **API Routes:** Stock tracking and low-stock alerts under `/api/v1/inventory`.

### Module 7: Invoicing & Billing
1. **Model:** `Invoice.model.js` (`workOrder`, `customer`, `lineItems`, `subtotal`, `taxRate`, `taxAmount`, `totalAmount`, `paymentStatus`).
2. **API Routes:** Invoicing routes under `/api/v1/invoices`.

### Module 8: Analytics & Reporting
1. **Backend:** Aggregation pipelines for monthly revenue, appointment volume, and popular services.
2. **Frontend:** Dashboard charts utilizing the installed `recharts` library.

### Module 9: Real-Time Event System
1. Hook `Socket.IO` in `server/src/server.js` to emit events on appointment updates and work order status changes.
2. In frontend, subscribe to notifications and render toast alerts.

---

## 9. GitHub Sharing & Collaboration Checklist

Before pushing this repository to a remote Git host (GitHub, GitLab, etc.):

- [x] **No Secrets in Repo:** No real API keys, passwords, or database credentials are committed.
- [x] **Safe `.env.example` Files:** Both `server/.env.example` and `client/.env.example` exist with placeholder values only.
- [x] **Root `.gitignore` Updated:** Strictly ignores `node_modules/`, `dist/`, `build/`, `.env`, `.env.local`, `server/.env`, `client/.env.local`, `*.log`, and OS files.
- [x] **Frontend Builds Cleanly:** `npm run build` in `client/` succeeds with exit code 0.
- [x] **Backend Syntax Verified:** All backend `.js` files pass Node.js syntax checks (`node --check`).
- [x] **Health Check Tested:** `/api/v1/health` verified working.
- [x] **Documentation Complete:** `README.md` and `docs/PROJECT_HANDOFF.md` updated with exact startup instructions, architectural rules, and roadmap.
