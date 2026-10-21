# AutoCare Pro — Vehicle Service & Workshop Management System

> **Comprehensive Full-Stack Automotive Workshop Management Platform**  
> Built with React (Vite) and Node.js (Express), powered exclusively by MongoDB.

---

## ⚠️ Important Developer Notice & Project Status

- **Status:** **In Active Development (Work-in-Progress)** — The project is not yet complete and must be continued.
- **Language Constraint:** **JavaScript and JSX ONLY**. Do **NOT** introduce TypeScript (`.ts`/`.tsx`).
- **Database Constraint:** **MongoDB is the ONLY permitted database**. Persistence is handled through Mongoose models. Do **NOT** introduce SQL (MySQL, PostgreSQL, SQLite) or PHP.
- **AI Integrations:** **NO AI-model API keys are required** for the current development scope. Do not add external LLM dependencies.
- **Architecture Integrity:** Monorepo architecture (`client/`, `server/`, `docs/`) must be preserved.

---

## 📖 Project Overview

AutoCare Pro is a full-featured workshop management system designed for vehicle service centres, garages, and automotive repair shops. It provides an end-to-end operational platform spanning customer intake, vehicle maintenance tracking, scheduling, technician job cards, spare parts inventory control, and customer invoicing.

---

## 🛠️ Technology Stack

| Layer | Technology | Details / Notes |
|---|---|---|
| **Frontend Framework** | **React 19** | Built with **JavaScript (JSX) only** (No TypeScript) |
| **Bundler & Tooling** | **Vite 6** | Ultra-fast HMR and build pipeline |
| **Routing** | **React Router v7** | Client-side routing with nested layouts |
| **Styling** | **Tailwind CSS v3** & Custom CSS | Custom tokens: Electric Lime (`#C6F135`), Charcoal (`#1A1D23`) |
| **Icons** | **Lucide React** | Consistent SVG iconography |
| **Forms & Validation** | **React Hook Form + Zod** | Schema-driven form handling and validation |
| **Charts** | **Recharts** | Interactive SVG charting library |
| **Backend Framework** | **Node.js (≥ 20) + Express 5** | RESTful API using native ES Modules (`type: module`) |
| **Database** | **MongoDB (ONLY)** | Document store with **Mongoose 8** ODM |
| **Real-time Engine** | **Socket.IO 4** | WebSocket server stub for live workshop status updates |
| **Backend Validation** | **Zod** | Runtime request body and parameter validation schemas |
| **Testing Tools** | **Vitest**, **Supertest**, **RTL** | Unit and API integration test runners |

---

## 📁 Project Structure

```
autocare-pro/
├── client/                               # Frontend application (React 19 + Vite)
│   ├── public/                           # Static assets
│   ├── src/
│   │   ├── assets/                       # Image assets and logos
│   │   ├── components/
│   │   │   ├── layout/                   # App shell components (Sidebar, TopNav)
│   │   │   └── ui/                       # Reusable UI component library (14 components)
│   │   │       ├── Badge.jsx             # Status and count indicators
│   │   │       ├── Breadcrumbs.jsx       # Dynamic route breadcrumb trail
│   │   │       ├── Button.jsx            # Primary, secondary, outline, ghost buttons
│   │   │       ├── Card.jsx              # Surface cards and headers
│   │   │       ├── Dialog.jsx            # Modal dialogs & confirmation modals
│   │   │       ├── Dropdown.jsx          # Context menus and select dropdowns
│   │   │       ├── Form.jsx              # Inputs, textareas, selects with Zod integration
│   │   │       ├── Pagination.jsx        # Data pagination with ellipsis logic
│   │   │       ├── Skeleton.jsx          # Shimmer loading placeholders
│   │   │       ├── States.jsx            # Empty, error, and success states
│   │   │       ├── Tabs.jsx              # Underline and pill tab switches
│   │   │       ├── Toast.jsx             # Auto-dismissing toast notifications
│   │   │       ├── Tooltip.jsx           # Accessible hover tooltips
│   │   │       └── index.js              # Central barrel export for UI components
│   │   ├── config/
│   │   │   └── nav.config.js             # Centralized sidebar navigation definition
│   │   ├── hooks/
│   │   │   └── useMediaQuery.js          # Viewport width detection hook
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx             # Main dashboard shell wrapper
│   │   ├── pages/
│   │   │   ├── DesignSystemPage.jsx      # Design system interactive showcase
│   │   │   └── PlaceholderPage.jsx       # Initial scaffold fallback page
│   │   ├── utils/
│   │   │   └── cn.js                     # Tailwind class merge helper
│   │   ├── App.jsx                       # Root React router definition
│   │   ├── index.css                     # Design tokens and custom styles
│   │   └── main.jsx                      # DOM mount entry point
│   ├── .env.example                      # Client environment template
│   ├── index.html                        # HTML entry
│   ├── package.json                      # Client dependencies and scripts
│   ├── postcss.config.js                 # PostCSS config
│   ├── tailwind.config.js                # Custom AutoCare Pro theme config
│   └── vite.config.js                    # Vite bundler configuration
│
├── server/                               # Backend application (Express 5 + ES Modules)
│   ├── src/
│   │   ├── config/
│   │   │   └── env.js                    # Validated environment configuration
│   │   ├── middleware/
│   │   │   ├── errorHandler.js           # Centralized JSON error handler
│   │   │   └── notFound.js               # 404 Route catch-all handler
│   │   ├── routes/
│   │   │   └── health.route.js           # Liveness and readiness endpoints
│   │   ├── controllers/                  # Controller handlers (to be expanded)
│   │   ├── models/                       # Mongoose schemas (to be implemented)
│   │   ├── services/                     # Business logic layer
│   │   ├── validation/                   # Zod request validation schemas
│   │   ├── utils/                        # Server utilities
│   │   ├── app.js                        # Express app factory with middleware
│   │   └── server.js                     # HTTP server entry point & Socket.IO
│   ├── .env.example                      # Server environment template (safe placeholders)
│   └── package.json                      # Server dependencies and scripts
│
├── docs/                                 # Architectural and handoff documentation
│   ├── PROJECT_HANDOFF.md                # Developer onboarding & continuation guide
│   ├── PROJECT_PLAN.md                   # Module-by-module feature roadmap
│   └── ASSIGNMENT_COVERAGE.md            # Course curriculum mapping tracker
│
├── .gitignore                            # Root version control exclusions
└── README.md                             # This documentation file
```

---

## ⚡ Prerequisites

Before running the application, make sure you have installed:

1. **Node.js**: Version **`>= 20.0.0`** (check via `node -v`)
2. **npm**: Version **`>= 10.0.0`** (bundled with Node.js)
3. **MongoDB**:
   - **Local instance:** [MongoDB Community Server](https://www.mongodb.com/try/download/community) running on default port `27017`
   - **OR Cloud cluster:** [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

---

## 🚀 Installation & Getting Started

### 1. Clone or Open the Repository

```bash
cd autocare-pro
```

### 2. Configure Environment Variables

The repository does **not** commit real `.env` files. You must create them from the provided `.env.example` templates:

#### Backend Configuration:
```bash
cd server
copy .env.example .env     # On Windows PowerShell: cp .env.example .env
```

Open `server/.env` and review the values:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/autocare_pro
CLIENT_URL=http://localhost:5173
```
> **Note:** If using MongoDB Atlas, replace `MONGODB_URI` with your connection string:  
> `MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/autocare_pro?retryWrites=true&w=majority`

#### Frontend Configuration (Optional):
```bash
cd ../client
copy .env.example .env     # On Windows PowerShell: cp .env.example .env
```
Default points to `VITE_API_BASE_URL=http://localhost:5000/api/v1`.

---

### 3. Install Dependencies

#### Install Backend Dependencies:
```bash
cd server
npm install
```

#### Install Frontend Dependencies:
```bash
cd ../client
npm install
```

---

### 4. Running the Application

Open two separate terminal windows or tabs:

#### Terminal 1 — Start Backend Server:
```bash
cd server
npm run dev
```
- Starts Express API with native `--watch` reloading on **`http://localhost:5000`**
- Outputs server banner and active health check endpoints.

#### Terminal 2 — Start Frontend Client:
```bash
cd client
npm run dev
```
- Starts Vite development server with Hot Module Replacement on **`http://localhost:5173`**
- Open your browser at:
  - **`http://localhost:5173`** — Main application
  - **`http://localhost:5173/design-system`** — Comprehensive Design System Component Showcase

---

## 🧪 Verification & Health Checks

Once both servers are running, test the endpoints using `curl` or your browser:

```bash
# 1. API Liveness Check (Confirms Express is running)
curl http://localhost:5000/api/v1/health

# Output:
# {"success":true,"status":"ok","message":"AutoCare Pro API is running","version":"0.1.0","environment":"development"}

# 2. Database Readiness Check (Reflects Mongoose connection status)
curl http://localhost:5000/api/v1/health/ready
```
*Note: `/api/v1/health/ready` returns `503 not_ready` when MongoDB is not connected, and `200 ready` once connected.*

---

## 📦 Actual npm Scripts (package.json)

### Frontend (`client/package.json`):
| Command | Actual Script | Description |
|---|---|---|
| `npm run dev` | `vite` | Starts local development server at `http://localhost:5173` |
| `npm run build` | `vite build` | Compiles production assets into `client/dist/` |
| `npm run preview` | `vite preview` | Previews production build locally |
| `npm run lint` | `eslint src --ext .js,.jsx` | Runs ESLint *(Note: requires eslint devDependency)* |

### Backend (`server/package.json`):
| Command | Actual Script | Description |
|---|---|---|
| `npm run dev` | `node --watch src/server.js` | Starts server with automatic file watching |
| `npm start` | `node src/server.js` | Runs server in standard production mode |
| `npm run lint` | `eslint src --ext .js` | Runs ESLint *(Note: requires eslint devDependency)* |

---

## 📊 Current Implementation Status

| Milestone | Status | Description |
|---|---|---|
| **Step 1: Scaffolding & Setup** | ✅ **Complete** | Monorepo structure, Express server, Vite client, Tailwind tokens, Health checks |
| **Step 2: UI Design System** | ✅ **Complete** | 14 production-grade UI components, barrel export, `/design-system` interactive showcase |
| **Step 3: Application Shell & Layout** | ✅ **Complete** | Sidebar, TopNav, AppLayout, PageHeader, Dashboard, Module Placeholders, 404 Page |
| **Step 4+: Business Modules** | 🔲 **Unfinished** | Business logic, MongoDB schemas, and feature screens (see below) |


---

## 🚧 Unfinished Features & Remaining Work

The following modules remain to be implemented by subsequent developers:

1. **Authentication & Authorization (Module 1)**:
   - User schema (`User.model.js`) with password hashing (`bcrypt`)
   - JWT token issuance (access + refresh tokens) and auth middleware
   - Role-Based Access Control (`admin`, `advisor`, `mechanic`, `customer`)
   - Login, registration, and profile management screens

2. **Customer Management (Module 2)**:
   - `Customer.model.js` schema and CRUD API endpoints (`/api/v1/customers`)
   - Customer list table with pagination, search, filter, and modal forms

3. **Vehicle Records (Module 3)**:
   - `Vehicle.model.js` linked to customer records
   - Service history timeline, VIN lookup, and odometer log

4. **Appointments & Scheduling (Module 4)**:
   - `Appointment.model.js` with calendar/list views and status progression

5. **Work Orders & Job Cards (Module 5)**:
   - `WorkOrder.model.js` for shop-floor job tracking, tasks, and technician assignments

6. **Inventory & Spare Parts (Module 6)**:
   - `Part.model.js` stock management, low-stock threshold triggers, supplier catalog

7. **Invoicing & Billing (Module 7)**:
   - `Invoice.model.js` auto-generated from completed work orders with tax and line items

8. **Analytics Dashboard (Module 8)**:
   - KPI metrics, Recharts revenue trends, appointment charts, and workshop productivity

9. **Real-time Notifications (Module 9)**:
   - Wire Socket.IO client to server events for immediate job state alerts

---

## 🤝 Instructions for Continuing Development

For detailed architecture explanations, Mongoose data models, route definitions, and step-by-step tasks, refer to:
👉 [**`docs/PROJECT_HANDOFF.md`**](docs/PROJECT_HANDOFF.md)
👉 [**`docs/PROJECT_PLAN.md`**](docs/PROJECT_PLAN.md)

### Key Rules to Follow:
1. Keep the code strictly in **JavaScript (`.js`, `.jsx`)**. Do **not** convert to TypeScript.
2. Use **MongoDB** via Mongoose for all models. Do **not** add SQL or alternate databases.
3. Reuse the existing UI components in `client/src/components/ui/` rather than adding third-party UI libraries.
4. Keep secrets and API keys inside `.env` files. **Never commit `.env` to GitHub**.
