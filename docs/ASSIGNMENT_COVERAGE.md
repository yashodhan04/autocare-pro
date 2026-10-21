# AutoCare Pro — Assignment Coverage (Assignments 1–16)

> **Course:** Web Technologies
> **Project:** AutoCare Pro — Vehicle Service & Workshop Management System
> **Language:** JavaScript (React frontend, Node.js/Express backend)
> **Database:** MongoDB with Mongoose

---

## Implementation Note — Technology Differences

The course assignments reference **PHP** and **MySQL**. This project uses equivalent but more industry-current technologies:

| Course Specification | This Project's Implementation      | Justification                                      |
|----------------------|-------------------------------------|----------------------------------------------------|
| PHP server-side      | Node.js + Express.js (JavaScript)   | Same server-side web role; more current technology |
| MySQL relational DB  | MongoDB + Mongoose (NoSQL)          | Demonstrates document-based DB skills              |
| PHP sessions         | JWT-based stateless auth (planned)  | Industry-standard alternative                      |

All topics are covered in spirit. No claim is made that PHP/MySQL has been implemented — it has not.

---

## Status Key

| Status        | Meaning                                                   |
|---------------|-----------------------------------------------------------|
| `Planned`     | Identified in project plan; not yet started               |
| `In Progress` | Currently being implemented                               |
| `Implemented` | Code complete; not yet formally tested                    |
| `Tested`      | Covered by automated or manual tests                      |

---

## Assignment 1 — Basic HTML: Headings, Lists, Images, Attributes

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | HTML document structure, headings (h1–h6), ordered/unordered lists, images, `alt`, `href`, `src`, semantic attributes |
| **Planned Feature**  | AutoCare Pro marketing / public landing page; invoice HTML structure; vehicle detail page |
| **Implementation Area** | `client/src/pages/LandingPage.jsx`, `client/src/features/invoices/InvoiceView.jsx` |
| **Status**           | Planned                                                                |

**Coverage notes:**
- Headings are used throughout all page components (h1 per page, h2–h4 for sections).
- Lists appear in navigation menus, service item lists, part lists.
- Images used in vehicle cards, user avatars, logo.
- All `<img>` elements will carry descriptive `alt` attributes.

---

## Assignment 2 — Semantic HTML

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`, `<figure>`, `<time>`, ARIA roles |
| **Planned Feature**  | App shell layout; invoice document structure; dashboard page           |
| **Implementation Area** | `client/src/layouts/AppShell.jsx`, `client/src/layouts/AuthLayout.jsx`, all page components |
| **Status**           | In Progress (scaffolding complete; semantic layout planned for Step 2) |

**Coverage notes:**
- `<header>` / `<nav>` in top bar and sidebar.
- `<main>` wraps page content.
- `<section>` / `<article>` in dashboard cards and work order details.
- `<time datetime="...">` on all date displays.
- ARIA labels on icon-only buttons; `role="alert"` on error messages.

---

## Assignment 3 — Inline, Internal, and External CSS

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | All three CSS application methods; selectors; the cascade; specificity |
| **Planned Feature**  | Design system CSS; component styles; inline status badge colours       |
| **Implementation Area** | `client/src/index.css` (external, global), component `<style>` blocks (internal per component pattern), inline `style` props (dynamic colours) |
| **Status**           | In Progress (`index.css` implemented; component styles planned)        |

**Coverage notes:**
- **External CSS:** `index.css` — Tailwind directives, CSS custom properties, global base styles.
- **Internal / scoped:** Per-component CSS classes via Tailwind utility composition.
- **Inline:** Dynamic colours on status badges (e.g., appointment status colour is set via `style={{ color: ... }}`).

---

## Assignment 4 — Responsive Design: Flexbox, Grid, Media Queries

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | Flexbox layout, CSS Grid, responsive breakpoints, media queries, mobile-first |
| **Planned Feature**  | App shell sidebar + main area; dashboard KPI grid; data table responsive behaviour |
| **Implementation Area** | `client/src/layouts/AppShell.jsx`, `client/src/pages/DashboardPage.jsx`, `client/src/components/` |
| **Status**           | Planned                                                                |

**Coverage notes:**
- Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) map directly to media queries.
- Dashboard uses `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4` KPI layout.
- Sidebar collapses to bottom nav on mobile.
- Tables scroll horizontally on small screens.

---

## Assignment 5 — CSS Positioning and Other CSS Properties

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | `position: static/relative/absolute/fixed/sticky`, `z-index`, `overflow`, `transform`, `transition`, `opacity`, `box-shadow`, `border-radius` |
| **Planned Feature**  | Dropdown menus; modal overlays; sticky table headers; sidebar fixed position; toast notifications |
| **Implementation Area** | `client/src/components/Modal.jsx`, `client/src/components/Dropdown.jsx`, `client/src/components/Toast.jsx` |
| **Status**           | Planned                                                                |

**Coverage notes:**
- Modal uses `position: fixed` with backdrop.
- Sidebar uses `position: fixed` on desktop.
- Toast stack uses `position: fixed; bottom: 1rem; right: 1rem`.
- Sticky table header: `position: sticky; top: 0`.
- Custom design tokens define `box-shadow`, `border-radius` values.

---

## Assignment 6 — JavaScript: File Integration, Events, Array Functions

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | External `.js` files, DOM events, `addEventListener`, `map`, `filter`, `reduce`, `find`, `sort`, `forEach` |
| **Planned Feature**  | Client-side filtering and sorting of appointment lists, inventory search, work order task arrays |
| **Implementation Area** | `client/src/utils/`, `client/src/features/appointments/`, `client/src/features/inventory/` |
| **Status**           | Planned                                                                |

**Coverage notes:**
- Array `.filter()` for client-side search on lists.
- Array `.map()` for rendering lists and transforming API responses.
- Array `.reduce()` for invoice totals.
- Array `.sort()` for sortable table columns.
- Event handling via React synthetic events (onClick, onChange, onSubmit).
- Utility functions extracted to separate `.js` files in `utils/`.

---

## Assignment 7 — Frontend Functionality and Form Validation

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | Client-side form validation, error messages, user feedback, `required`, pattern matching, custom validation rules |
| **Planned Feature**  | All forms: login, register, appointment booking, customer creation, vehicle entry, work order |
| **Implementation Area** | `client/src/features/auth/`, `client/src/features/appointments/`, all form components; React Hook Form + Zod |
| **Status**           | Planned                                                                |

**Coverage notes:**
- React Hook Form handles field registration and error state.
- Zod schemas define validation rules (min length, email format, phone regex, required fields).
- Inline field-level error messages below inputs.
- Form submission disabled while invalid or loading.
- Success and error feedback via toast notifications.

---

## Assignment 8 — React SPA: Functional Components and JSX

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | React functional components, JSX syntax, component composition, `key` props, fragments |
| **Planned Feature**  | Entire frontend — every page, layout, and component is a React functional component |
| **Implementation Area** | `client/src/` — all `.jsx` files                                   |
| **Status**           | In Progress (scaffold complete; real components planned from Step 2)   |

**Coverage notes:**
- `App.jsx` — root component with routing.
- `PlaceholderPage.jsx` — demonstrates functional component and JSX.
- Every list renders using `.map()` with unique `key` props.
- `<>` fragments used to avoid unnecessary wrapper divs.

---

## Assignment 9 — React: Props, State, Hooks, Events, Conditional Rendering

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | `props`, `useState`, `useEffect`, `useContext`, `useRef`, event handlers, conditional rendering (`&&`, ternary, early return) |
| **Planned Feature**  | All interactive components: appointment status toggle, vehicle detail expand/collapse, modal open/close, form submission states |
| **Implementation Area** | `client/src/components/`, `client/src/hooks/`, `client/src/features/` |
| **Status**           | Planned                                                                |

**Coverage notes:**
- `useState` — loading, error, modal open, selected items.
- `useEffect` — data fetching on mount, cleanup subscriptions.
- `useContext` — AuthContext for user state.
- `useRef` — focus management in modals and forms.
- Custom hooks: `useApi`, `useAuth`, `useToast`, `usePagination`.
- Conditional rendering: loading spinners, empty states, error banners.

---

## Assignment 10 — Fetch API: API Responses and JSON

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | `fetch()` or equivalent, HTTP methods, JSON parsing, `async/await`, error handling |
| **Planned Feature**  | All API calls from frontend to Express backend; Axios service layer    |
| **Implementation Area** | `client/src/services/api.js` (Axios instance), `client/src/services/*.js` |
| **Status**           | Planned                                                                |

**Coverage notes:**
- Axios (a `fetch`-based HTTP client) used for all API calls.
- Centralised Axios instance with base URL, auth header interceptor, error interceptor.
- All API calls are `async/await` with `try/catch`.
- Responses typed via JSDoc for editor support.
- Error responses standardised to `{ success, status, message }`.

---

## Assignment 11 — DOM Manipulation and Event Handling

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | Direct DOM access, `document.querySelector`, `createElement`, `appendChild`, `classList`, event delegation |
| **Planned Feature**  | Focus management in modals; dynamic form fields (add/remove tasks on work orders); print invoice |
| **Implementation Area** | `client/src/components/Modal.jsx` (focus trap via `useRef`), `client/src/features/work-orders/TaskList.jsx` |
| **Status**           | Planned                                                                |

**Coverage notes:**
- React's `useRef` + `.focus()` for programmatic DOM focus.
- `window.print()` triggered by button for invoice printing.
- Dynamic list manipulation (add/remove work order tasks) using React state — equivalent outcome to direct DOM manipulation but via the virtual DOM.

---

## Assignment 12 — Form Processing, Validation, String Manipulation, Session Management

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | Server-side form processing, string functions, session/cookie management |
| **Planned Feature**  | Express form handling; input sanitisation; JWT session simulation; search string manipulation |
| **Implementation Area** | `server/src/controllers/`, `server/src/validation/`, `server/src/middleware/auth.js` |
| **Status**           | Planned                                                                |

**Coverage notes:**
- Express reads `req.body` (JSON-parsed form data).
- Zod validates and sanitises all inputs server-side.
- String manipulation: name trimming, email lowercasing, phone normalisation.
- **Session management implementation difference:** Course specifies PHP sessions / cookies; this project uses JWT (JSON Web Tokens) stored in `httpOnly` cookies — a stateless, industry-standard equivalent.

---

## Assignment 13 — Database Connectivity and CRUD

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | Database connection, Create / Read / Update / Delete operations        |
| **Planned Feature**  | All backend modules: Customers, Vehicles, Appointments, Work Orders, Inventory, Invoices |
| **Implementation Area** | `server/src/models/`, `server/src/services/`, `server/src/controllers/` |
| **Status**           | Planned                                                                |

**Coverage notes:**
- **Implementation difference:** Course specifies MySQL; this project uses MongoDB + Mongoose.
- Mongoose `Model.create()` — Create.
- Mongoose `Model.find()`, `Model.findById()` — Read.
- Mongoose `Model.findByIdAndUpdate()` — Update.
- Mongoose `Model.findByIdAndDelete()` — Delete.
- Mongoose schemas define types, required fields, defaults, and indexes.
- No raw SQL is used anywhere.

---

## Assignment 14 — Node.js, Express, Routing, Middleware, Static Resources

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | Node.js modules, Express application setup, routing, middleware chain, serving static files |
| **Planned Feature**  | Express API server — all routes, middleware stack, static file serving for production build |
| **Implementation Area** | `server/src/app.js`, `server/src/server.js`, `server/src/routes/`, `server/src/middleware/` |
| **Status**           | In Progress (Express app, routes, middleware, health endpoints implemented in Step 1) |

**Coverage notes:**
- `express()` app created and configured in `app.js`.
- Middleware chain: `helmet` → `cors` → `morgan` → `express.json()` → routes → 404 → error handler.
- Modular routers using `express.Router()`.
- Error-handling middleware (4-argument signature).
- Static file serving: in production, Express will serve the Vite build output from `client/dist/`.

---

## Assignment 15 — REST APIs, JSON, Database Connectivity and CRUD

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | RESTful API design, HTTP verbs, JSON responses, API + database integration |
| **Planned Feature**  | Complete REST API for all AutoCare Pro resources                        |
| **Implementation Area** | `server/src/routes/`, `server/src/controllers/`, `server/src/services/`, `server/src/models/` |
| **Status**           | In Progress (`/api/v1/health` implemented; resource APIs planned)      |

**Coverage notes:**
- REST conventions: `GET` (read), `POST` (create), `PATCH` (partial update), `DELETE` (remove).
- URL patterns: `/api/v1/resources`, `/api/v1/resources/:id`.
- All responses: `{ success, data, message, timestamp }`.
- Zod middleware validates request body before controller runs.
- Controller calls service; service calls Mongoose model.
- MongoDB/Mongoose provides the persistence layer.

---

## Assignment 16 — Complete Integrated Web Technologies Project

| Field                | Detail                                                                 |
|----------------------|------------------------------------------------------------------------|
| **Topics**           | Full-stack integration of all course topics; complete working application |
| **Planned Feature**  | AutoCare Pro — fully functional Vehicle Service & Workshop Management System |
| **Implementation Area** | Entire `autocare-pro/` monorepo                                    |
| **Status**           | In Progress (Step 1 scaffold complete; modules 1–10 planned)           |

**Integration checklist:**

| Concept                          | Covered By                                        |
|----------------------------------|---------------------------------------------------|
| HTML structure & semantics       | All JSX components render semantic HTML           |
| CSS styling & responsiveness     | Tailwind CSS v3 + custom `index.css`              |
| JavaScript logic                 | React components, hooks, utilities                |
| Form validation (client)         | React Hook Form + Zod                             |
| React SPA                        | Vite + React 19 + React Router v7                |
| Fetch / HTTP client              | Axios service layer                               |
| DOM events                       | React synthetic event handlers                    |
| Node.js server                   | Express 5 on Node.js ≥ 20                         |
| Express routing & middleware     | Modular routers, helmet, cors, morgan, errorHandler |
| REST API                         | `/api/v1/` routes with JSON responses             |
| Database CRUD                    | MongoDB + Mongoose (all resource modules)         |
| Real-time updates                | Socket.IO (stub ready, handlers planned)          |
| Charts & reporting               | Recharts on dashboard                             |
| Authentication                   | JWT (planned Module 1)                            |
| Deployment readiness             | Health + readiness endpoints, graceful shutdown   |

---

*Last updated: Step 1 — Scaffolding & Initialization*
