# Deployment, Postman & Demo Guide

## Environment
| Variable (server/.env) | Purpose |
|---|---|
| `DATABASE_URL` | `mysql://user:password@host:3306/autocare_pro`. Tables are created automatically on start (`sequelize.sync()` only *creates missing* tables; it never alters or drops). `DATABASE_URL_TEST` is used only by `npm test`: **all its tables are dropped each run** — point it at a throwaway database. |
| `JWT_SECRET` | **Required in production** (app refuses to start without it). `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CLIENT_URL` | Comma-separated allowed origins (CORS + CSRF origin check). |
| `WORKSHOP_OPEN_HOUR / CLOSE_HOUR / BAYS` | Booking rules (default 08–18, 3 bays, closed Sundays). Times are interpreted in the **server's timezone** — run the server in the workshop's timezone. |
| `DEFAULT_TAX_RATE` | Default % on new estimates. |

Client: optional `VITE_API_BASE_URL` / `VITE_SOCKET_URL` (unset in dev — Vite proxies to :5000).

## Deploying
1. **MySQL 8** (managed: PlanetScale/Aiven/RDS/Railway, or self-hosted): create an empty database and a dedicated user; set its URL in `DATABASE_URL`. Use `utf8mb4`.
2. **API** (Render/Railway/Fly/VM): `cd server && npm ci && npm start`, env `NODE_ENV=production`, `JWT_SECRET`, `DATABASE_URL`, `CLIENT_URL=https://your-frontend`. Create the first admin (no seed in production): run `node src/scripts/seed.js` only against a dev DB, or insert a `super_admin` via a one-off script.
3. **Web**: `cd client && VITE_API_BASE_URL=https://your-api/api/v1 VITE_SOCKET_URL=https://your-api npm run build`, host `dist/` on any static host with SPA fallback to `index.html`.
4. Cross-site hosting (API and web on different domains) uses `SameSite=None; Secure` cookies in production — both must be HTTPS. Same-site (e.g. `app.` and `api.` subdomains) is simpler.

Limitations to know: no email/SMS delivery (password-reset links are logged server-side; shown in the UI only outside production); schema changes after first deploy must be applied with SQL (`sync()` does not alter existing tables) — adopt Sequelize migrations if the schema will evolve; inspection photos are not implemented.

## Postman
Import `docs/postman/AutoCare-Pro.postman_collection.json`. Start the API after `npm run seed`. Run the "Login — …" request for the role named in each folder (it stores `{{token}}`), then run the folder. Requests labelled *(expect 4xx)* assert the failure paths (RBAC, conflicts, overpayment).

## Demo script (≈10 min)
1. **Customer** (`customer@autocare.dev`): dashboard → Vehicles (view history) → Appointments → *Book a service* (pick date, time slot).
2. **Advisor**: Appointments → *Confirm* → *Check in* → job card opens. Assign mechanic (Edit).
3. **Mechanic**: My Workspace → open job → *Record inspection* (mark Brake pads "Needs attention").
4. **Advisor**: *Prepare estimate* → add labour + a part → *Save & send*.
5. **Customer**: notification bell → Estimates → *Approve*.
6. **Mechanic**: *Start work* → add task, log time, request a part → **Inventory manager** issues it (stock drops, see Movement history) → Mechanic *Submit for quality check*.
7. **Advisor**: *Review quality check → Pass* → **Cashier**: *Generate invoice* → *Record payment* (use a TEST payment) → *Mark delivered*.
8. **Customer**: vehicle history shows the job, parts and invoice; leave a review. **Admin**: Reports, Audit log, moderate the review.
