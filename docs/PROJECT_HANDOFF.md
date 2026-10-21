# AutoCare Pro — Project Handoff (current state)

**Status: feature-complete v1.** All 18 modules in the brief are implemented end-to-end (UI → REST API → MySQL). See `README.md` for setup and `docs/DEPLOYMENT_AND_DEMO.md` for deployment, Postman and a demo script.

## Architecture in one page
- **Server** (`server/src`): `routes/` (role guards + Zod validation) → `controllers/` → `services/` (business rules shared across controllers: job transitions, inventory movements, appointment slots, notifications, audit) → `models/index.js` (Sequelize models + associations, MySQL). Centralised error handler maps Zod/Sequelize/JWT/duplicate-key errors to clean JSON; unexpected errors never leak internals.
- **Client** (`client/src`): `pages/` (one per route), `features/` (multi-page widgets), `components/common` (DataTable, FieldsForm, FormDialog, FilterBar, RequireAuth…), `context/` (auth, toast, notifications), `hooks/` (`useFetch`, `useList`…). Route permissions come from `config/nav.config.js`, the same table that builds the sidebar.
- **Sessions:** JWT in an httpOnly cookie; Origin check guards state-changing requests.

## Key business rules (all server-side)
- Appointments: future, 30-min slots, Mon–Sat 08–18 (env-configurable), max `WORKSHOP_BAYS` concurrent, one booking per vehicle per time; customers can change/cancel ≥2 h before.
- Job lifecycle: `checked_in → inspection → awaiting_estimate → awaiting_approval → approved → in_progress → quality_check → completed → invoiced → delivered` (+`cancelled`). Work needs an approved estimate; QC pass needed to invoice; delivery needs a fully paid invoice.
- Estimates: totals always recomputed on the server (tax after discount); revisions pause work until re-approved; every decision is timestamped (and flagged if recorded on a customer's behalf).
- Inventory: quantity only changes through `services/inventory.service.js` — a transaction that row-locks the item (`SELECT … FOR UPDATE`), updates the quantity and writes the ledger row; never below zero (also enforced by an `UNSIGNED` column), even concurrently.
- Payments: manual or `TEST`-labelled simulated entries; the invoice row is locked in a transaction so concurrent payments cannot over-collect.

## Known limitations / next steps
- No email/SMS (in-app + Socket.IO only); password-reset link is logged server-side (and returned outside production).
- Schema is created by `sequelize.sync()` (creates missing tables only). For evolving production schemas, introduce Sequelize migrations.
- API ids are integers; every record also carries `_id` (string copy of `id`) so the client contract from the first build is unchanged.
- Inspection photos, PDF invoice export, and branch/employee tables (employees are users with staff roles) are not implemented.
- Dev fixtures live only in `server/src/scripts/seed.js` (refuses to run in production).
- Client tests: only the production build is verified automatically; UI flows were verified manually in a browser (see demo script). Adding Playwright E2E is the natural next step.
