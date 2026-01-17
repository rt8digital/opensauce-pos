# OpenSauce P.O.S. — Implementation Plan

This document outlines prioritized implementation work to address the codebase improvements and platform concerns discovered during analysis. The plan focuses on data model improvements, input validation, offline sync, code hygiene, packaging, testing, and developer experience. Per your instruction, authentication and external security concerns are not addressed here (assume local network-only usage).

**Goal:** Incrementally improve reliability, maintainability, and correctness across the backend, frontend, and packaging flows.

Summary of main objectives
- Normalize order storage and DB models
- Change monetary representation for precision and consistency
- Add request validation using Zod schemas from `shared/schema.ts`
- Improve offline sync to handle normalized orders and conflict resolution
- Improve code hygiene and enforce formatting/linting rules
- Expand tests and CI
- Improve packaging and native module handling
- Add documentation + migration guides

---

## Prioritized Implementation Tasks (High → Low)

### 1. Normalize Orders (High)
Problem: `orders.items` are stored as a JSON string even though `order_items` exists. This prevents efficient reporting and updates and adds complexity for sync and inventory operations.

What to do:
- Update `shared/schema.ts` to ensure `order_items` is linked to `orders` via `order_id` foreign key (already created in table). Verify appropriate `references` usage and ensure `orderItems` relationship is defined for ORM convenience.
- Add a database migration that copies `orders.items` JSON into `order_items` rows and drops the `items` column (or make it optional/legacy) with a reversible migration. Use Drizzle Kit for migration scripts.
- Update server endpoints:
  - POST /api/orders: accept a normalized `items: {productId, quantity, price}[]` array and insert into `orders` and `order_items` (created via new insert queries). Ensure `total` is computed and stored consistently.
  - GET /api/orders: join `order_items` and return structured order with items (flattened or nested depending on API contract).
  - Update PATCH/DELETE endpoints if present to operate on `order_items`.
- Update `server/whatsapp.ts` and any other server scripts that write `orders` to use the new normalized form.
- Update client: modify order creation code to send `items` as array (e.g., `client/src/lib/offline-sync.ts` sync queue should send `order` objects with items array and have logic to create both order and items in server if necessary).

Acceptance criteria:
- After migration, no new `orders` rows with `items` JSON are created; all new orders use `order_items` rows.
- All APIs return `orderItems` in GET /api/orders responses; tests updated accordingly.
- No data inconsistency in sample seed data post-migration.

Files to edit:
- `shared/schema.ts`
- Drizzle migration file(s): `migrations/*` (create new migration)
- `server/routes.ts` — `/api/orders` endpoints
- `server/whatsapp.ts` — order creation handling
- `client/src/lib/offline-sync.ts` — sync queue actions for orders
- `tests/*` — update tests that check order structure

Estimated effort: 8–16 hours

---

### 2. Monetization: Represent Price as Integer (High)
Problem: `price` and `total` are stored as `text` in DB and used as strings in code. Floating calculations or string operations can cause correctness issues across locales.

What to do:
- Convert `price` and `total` fields to `integer` representing cents (or minor currency unit). If you prefer `numeric`, pick `real` carefully but integer cents is preferred.
- Add helpers in `client/<util>` and server: `formatMoney(cents)` and `parseToCents(value)` to standardize conversion.
- Add Drizzle migration to convert existing string price values to cents (if existing values are e.g. '10.50', convert to `1050`). This must be reversible and tested.
- Update all endpoints that read or write `price` or `total` to send/expect integer cents. Update client UIs to show user-friendly format and convert to raw cents on submit.

Acceptance criteria:
- No UI regressions; price display is unchanged visually.
- All DB `price` and `total` columns are integer cents and there are no string price columns in the active schema.
- Tests confirm arithmetic correctness across APIs and in receipts.

Files to edit:
- `shared/schema.ts` (change `price`, `total` types)
- `migrations/*` conversions
- `client/src/lib/<formatting|utils>.ts` (format & parse helpers)
- `client/pages` forms that create or edit product or order (convert to cents on submit)
- `server/routes.ts` to ensure conversions and type expectations
- Tests for prices

Estimated effort: 4–8 hours

---

### 3. Validation using Zod (Medium)
Problem: Server routes assume the request payload has the correct shape. This leads to possible runtime errors or malformed DB entries.

What to do:
- Use `createInsertSchema(...)` exported in `shared/schema.ts` to validate insert requests.
- Add `validateMiddleware` or per-route validation to `server/routes.ts`. Example: For POST /api/products, validate using `insertProductSchema` and return 4xx responses on invalid input.
- Add Zod validation for `PATCH` payloads with partial/partial schemas or custom validators.

Acceptance criteria:
- Each POST /api/* has request validation; invalid requests return 400 with useful messages; add tests verifying invalid inputs.

Files to edit:
- `server/routes.ts` — add validation middleware and update handlers
- `server/index.ts` — add global error handler mapping Zod errors to 400 errors
- Tests: add negative tests checking bad input

Estimated effort: 3–6 hours

---

### 4. Offline Sync Improvements (Medium)
Problem: Offline queue uses a simple queue, but with normalization/monetary changes we must ensure sync is reliable and idempotent.

What to do:
- Update `offline-sync.ts` to queue normalized orders (i.e., order with items array) and create an ordered transaction during sync where an order is created and then its items are created in DB.
- Add conflict detection and resolution for: product stock updates, customer updates, and order duplication (e.g., use client-generated temporary IDs or `uuid`s to dedupe).
- Add tests for offline cases: queueing, retries, duplicate records, conflict resolution (server-side behavior intentionally minimal; client resolves conflicts).

Acceptance criteria:
- Offline items queuing works with normalized orders; no duplication observed on repeated sync attempts; stock changes are honored.

Files to edit:
- `client/src/lib/offline-sync.ts` — logic update
- `client/src/lib/db.ts` — add temporary IDs/UUID handling
- Tests: offline sync tests

Estimated effort: 6–8 hours

---

### 5. Linting / Formatting and Code Hygiene (Low)
Problem: Various code hygiene issues exist (parseInt without radix, inconsistent styles). Add consistent tooling to avoid regressions.

What to do:
- Add ESLint (recommended rules: eslint:recommended, @typescript-eslint/recommended) and Prettier; add config file `.eslintrc.js` and `.prettierrc`.
- Add `npm run lint` and `npm run format` scripts.
- Fix parseInt instances by adding `parseInt(value, 10)`.
- Add a rule requiring strict typing for parse and numeric operations.

Acceptance criteria:
- Codebase passes lint rules; no `parseInt` calls without radix; basic formatting consistent.

Files to edit:
- Add `.eslintrc.js`, `.prettierrc` and add scripts to `package.json`
- Fix issues across key files (small PRs recommended)

Estimated effort: 2–4 hours

---

### 6. Tests & CI (High)
Problem: UI and E2E tests exist, but fewer unit or backend tests. No CI found in repo.

What to do:
- Add API-level unit tests using `supertest` or `playwright` HTTP to test backend endpoints without the UI (fast test). Tests should cover:
  - POST/GET products, orders, customers, discounts
  - Error paths, validation failures
  - Migration verification (if possible in test using test DB)
- Expand Playwright tests for the normalized order flow.
- Add GitHub Actions workflows (or other) for:
  - Type Check (npm run check)
  - Lint & Formatting
  - Unit Tests (server tests)
  - Playwright tests (UI) on dev server; only run Playwright on Chromium by default
  - Package build checks (electron build smoke test on a base worker?)

Acceptance criteria:
- CI pipeline configured and runs on PRs; core test suite passes.
- Tests added for normalized order creation, prices, and offline sync behavior.

Files to edit/add:
- Add `./.github/workflows/ci.yml` (CI pipeline), run type/lint/test/build
- Add tests under `tests/server/` (e.g., `server.routes.test.ts`) and unit tests for `offline-sync`

Estimated effort: 8–12 hours

---

### 7. Packaging & Native Modules (Medium)
Problem: Native modules (SerialPort, escpos, puppeteer) require correct packaging and `asarUnpack` for electron builds and sometimes platform-specific build steps.

What to do:
- Add `electron-builder` `extraResources`/`asarUnpack` for `node_modules/serialport` and other native modules.
- Document any extra steps to build native modules on Windows, Linux, and macOS.
- Add tests for packaging: build artifacts for all targeted platforms (or at least for Windows in CI) and verify that the server starts in the packaged artifact.
- Optional: Use electron-rebuild or prebuild CLI steps in `postinstall` scripts for native modules.

Acceptance criteria:
- Packaged installer starts server and app and integrates native libs successfully.

Files to edit:
- `desktop-packager` config (previously `electron-builder.json/yml`) — packager config
- `package.json` — add packaging scripts, `postinstall` steps if necessary

Estimated effort: 4 hours

---

### 8. Dependency Management (Low)
Problem: Some dependencies are optional or legacy; keep dependencies up-to-date and fix CI for `npm audit` runs.

What to do:
- Re-run `npm audit` and evaluate risky packages. Update major versions or adjust code to new APIs.
- Document optional native lib installation for build servers.

Acceptance criteria:
- No critical vulnerabilities in main report; plan for updates.

Files to edit:
- `package.json`, `package-lock.json` (expected only via update process)

Estimated effort: 3–6 hours

---

### 9. Performance & Long-Running Operations (Medium)
Problem: `better-sqlite3` is synchronous and might block the event loop on heavy queries; some operations like backups, bulk imports or downloads can be heavy.

What to do:
- If heavy DB work is expected, move heavy tasks to worker threads or child processes (e.g., `child_process.fork` like `electron.js` uses for server/WhatsApp) to prevent UI or API blocking.
- Add simple queue pattern for heavy tasks.

Acceptance criteria:
- Long tasks run in worker threads or background processes and do not block main server event loop.

Files to edit:
- `server/db.ts` and heavy tasks (backup, reporting) — add worker handler
- `server/index.ts` background tasks handlers

Estimated effort: 4–8 hours

---

### 10. Documentation (Low)
Problem: Good docs exist, but we need more implementation-specific instructions and migration guides.

What to do:
- Update `docs/README.md` or create `docs/DEVELOPER_GUIDE.md` for:
  - Migration steps for order normalization and price conversion
  - Packaging guides for Windows/macOS/Linux
  - Local dev workflows for running server & client, and `npm run dev` with `electron-dev` and test run instructions.
- Document CLI scripts for building & packaging.

Acceptance criteria:
- Developer docs updated with instructions for migrations, build, and packaging.

Files to edit:
- `docs/README.md`, `docs/BUILD_SUMMARY.md`, `docs/CUSTOMIZATION.md` (add migration & packaging details)

Estimated effort: 2–4 hours

---

## Workflow & PR Process
1. Create a branch like `feature/orders-normalize` with smaller PRs for each component (schema migration, routes, client sync updates, tests). Each PR should include:
   - Updated schema (migrations)
   - Tests and test data
   - Small code changes and typings
   - CI updates if required
2. Test migrations: run in local environment and include `--dry-run` steps in docs.
3. After acceptance, merge to `main` and tag releases.

## Recommended PR Sequence (incremental)
1. Add Zod validation to server endpoints (small scope). PR should include route validation for one resource (e.g., `products`) and tests.
2. Implement price conversion (helper functions). PR should include conversions and unit tests for formatting.
3. Normalize `orders` table and `order_items` flow via migration with tests. PR should update server and client code together.
4. Update `offline-sync` once orders normalized with robust tests for offline handling and conflict resolution.
5. Add ESLint/Prettier and code style fixes across repo.
6. Add CI workflow and additional tests.
7. Add packaging notes and adjust `electron-builder` config and test packaging in CI.

---

## Migration Examples & Notes
*Drizzle migration skeleton (example)*
- New migration to create `order_items` if it doesn't exist and to copy data from legacy `orders.items` into `order_items` rows:

1. `migrations/00XX_migrate_orders_to_items.ts`
   - Read all orders with `items` JSON
   - Insert into `order_items` for each item in JSON
   - Optionally alter `orders` table to remove `items` column

2. `migrations/00XX_convert_price_to_cents.ts`
   - Add new column `price_cents` to `products` and `order_items`
   - For each product and order_item, parse old `price` string and compute cents
   - Drop old `price` column and rename `price_cents` to `price`

3. Test migration on a local test DB before production

---

## Tests to Add / Update (Important)
- Unit tests for `server/routes.ts` write & read endpoints (post/get for product, order, customer, discount)
- Unit tests for `shared/schema.ts` insert validations using Zod
- Integration tests for `offline-sync` for creating orders while offline and retrying successfully
- E2E tests for the POS flow: create an order, print receipt, verify stock decrementing
- Upgrade existing Playwright tests to check normalized orders (order items displayed correctly)

---

## Implementation Priority Map
1. Zod validation for routes — low risk, high value
2. Price conversion & helpers — medium risk, high value
3. Normalize orders + migrations — medium/high risk, high value
4. Offline sync updates — medium risk, medium value
5. Lint & CI — low risk, medium value
6. Packaging improvements — low risk, medium value
7. Tests expansion — medium/higher time cost but crucial

---

## Next Steps (if you want me to implement):
- Pick the first task to implement in this repo (I recommend adding Zod validation and tests first as it’s small and reduces future bugs).
- For schema migrations, confirm whether the drizzle migration tooling is in use and whether we should add `drizzle-kit` migration files.

If you want, I can now implement the first step (Zod validation for `products` endpoints) and open a small PR-style patch. Let me know which task you prefer to start with.

---

## Electron Desktop App Improvements (New)
This section contains a focused implementation plan to complete the Electron desktop application, packaging, and native peripheral handling.

### Overview
The application is functional in dev mode but requires several changes and improvements to be fully reliable when packaged for desktop. This plan covers critical gaps that prevent packaged builds from working reliably and securely across platforms.

### Goals
- Fix ESM path issues (`__dirname`, `preload` vs `getAssetPath`) and ensure resources load correctly in packaged mode.
- Add missing IPC handlers required by the renderer (as exposed in `preload.js`).
- Implement peripheral device handlers (printer, cash drawer, scales, customer displays) with graceful fallback when libraries are not available.
- Update `electron-builder` configurations to unpack native modules, add `extraResources`, and include postinstall/electron-rebuild steps.
- Harden main process lifecycle and process management (single instance lock and child process cleanups).
- Validate preload surface and secure IPC channels.
- Add packaging and smoke tests, update CI to build and validate packaged artifacts.

### Implementation Tasks (order + acceptance criteria)

1. **Repo audit** — (TODO #1)
  - Actions: run a quick scan for IPC handlers, any `__dirname` usage, `preload` paths, and `electron-builder` configuration items.
  - Acceptance: Documented list of files needing change and a final checklist to implement.

2. **Fix ESM paths & `__dirname`** — (TODO #2)
  - Actions: Use `fileURLToPath(import.meta.url)` where `__dirname` is referenced; ensure `preload` uses absolute path via `getAssetPath()`.
  - Files: `electron.js`, `src/main.js`, `server/index.ts` (if referencing resources), any `preload` references.
  - Acceptance: Packaged binary can load assets and preload script without `__dirname` errors.

3. **Implement missing IPC handlers** — (TODO #3)
  - Actions: Add handlers for all functions the renderer calls via `preload.js` (e.g., `printer:print-escpos`, `cashdrawer:open`, `scale:connect`, `scale:read-weight`, `customer-display:update`, `peripherals:discover`, `sendWhatsAppMessage`), with input validation and logging.
  - Files: `electron.js`, `preload.js` (verify exposed names remain stable).
  - Acceptance: UI features that rely on these handlers do not fail in electron dev mode and produce clear error objects if not available.

4. **Peripheral device support & discovery** — (TODO #4)
  - Actions: Implement simple cross-platform discovery for serial/USB devices using `serialport` or the built-in scanning capability of each peripheral library; add safe-guards for missing libraries.
  - Acceptance: Basic discovery works on desktop, and functions return structured objects or clear errors when the library is missing.

5. **Packaging & native modules** — (TODO #5)
  - Actions: Update desktop packager config to unpack native modules (`serialport`, `escpos`, `puppeteer`), add extra resources where necessary, and add rebuild steps in `postinstall`.
  - Files: desktop packager config, `package.json` (postinstall, build scripts).
  - Acceptance: Packaged application includes all necessary modules and can start the server and spawn native dependencies successfully.

6. **Auto-update & CI** — (TODO #6)
  - Actions: Configure CI to run packaging on GitHub Actions, configure `GH_TOKEN` and signing keys for release artifacts, and add a test workflow for checking installer runs and the update check.
  - Acceptance: CI produces a packaged artifact, and `autoUpdater` is tested in an internal pre-release flow.

7. **Security & Preload surface** — (TODO #7)
  - Actions: Reduce the `preload.js` exposure to minimal, remove any broad or unsafe APIs, validate inputs on each handler, and add explicit permission checks for critical functions (print, peripheral write).
  - Acceptance: Preload only exposes the APIs used in the renderer and validates parameters on IPC calls.

8. **Single Instance Lock & Lifecycle** — (TODO #8)
  - Actions: Use `app.requestSingleInstanceLock()`, ensure child processes (`server` and `whatsapp`) are killed on exit, and add graceful fallback when restart/quit happens.
  - Acceptance: Only one application instance runs and child processes are cleaned on exit.

9. **Testing & Smoke Tests** — (TODO #9)
  - Actions: Add tests for IPC handlers, peripheral discovery, and simple smoke-tests on the packaged artifact (start app, verify health endpoint and preheat DB). Add CI job to build and run smoke test.
  - Acceptance: Smoke tests pass on CI for at least one OS target; IPC handlers respond correctly in tests.

10. **Docs & Release Notes** — (TODO #10)
  - Actions: Update README; add a section covering packaging, native libs, `electron-builder` config, and `postinstall` caveats; include troubleshooting steps.
  - Acceptance: README includes fully reproducible steps to package and test electron build locally and in CI.

---

### Immediate quick wins (Suggested order)
- Implement ESM `__dirname`/preload path fix (low risk) — can unblock packaging testing.
- Add minimal IPC handlers as stubs with safe defaults (low risk) so the UI doesn’t error.
- Update desktop packager config and add unpack entries for native modules like `serialport` and `escpos` — verify with local pack.

### End