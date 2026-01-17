# WhatsApp Integration — Implementation Plan

## Overview
This document lays out a pragmatic, phased plan to take the existing WhatsApp integration from its current prototype-grade state to a production-ready service for the POS application. It focuses on reliability, observability, compliance, and testability while keeping the design modular so a future migration to the WhatsApp Business API is low-friction.

## Phases & Step-by-step Tasks

### Phase 1 — Audit & Hardening (Immediate, 1–2 sprints)
- **Objective**: Identify gaps and harden the service so it reliably maintains a connection and correctly interprets user commands.
- **Tasks**:
  - Audit `server/whatsapp.ts`, `tests/bot/whatsapp-bot.test.ts`, and `tests/WHATSAPP_TESTING_SUMMARY.md` to produce a gap analysis and test matrix.
  - **COMPLETED**: Add session persistence for WhatsApp authentication (save session to disk/DB and load on start).
  - **COMPLETED**: Implement reconnect/backoff with exponential backoff and emit explicit socket events: `whatsapp_qr`, `whatsapp_ready`, `whatsapp_auth_failure`, `whatsapp_heartbeat`.
  - **COMPLETED**: Harden command parsing for `order`, `menu`, `help` (quantities, synonyms and fuzzy matches). Added focused unit tests.
- **Acceptance criteria**: gap report created; session is restored after restart in tests; socket events emitted for auth lifecycle; parser unit tests pass.

### Phase 2 — Reliability & Messaging Features (1–3 sprints)
- **Objective**: Make message delivery dependable and support richer interactions.
- **Tasks**:
  - **COMPLETED**: Implement outgoing queue with persistent storage, retry policy and rate-limit handling.
  - **COMPLETED**: Track message statuses (sent/delivered/read) and persist them; emit `whatsapp_message_delivered` and related socket events.
  - **COMPLETED**: Support interactive messages (buttons, lists) and a simple template registry for approved messages.
  - **COMPLETED**: Add support to send receipts as images/PDF and accept incoming media attachments.
- **Acceptance criteria**: queue survives restarts and retries messages; status events reflected in DB and sockets; interactive replies work in tests; sample receipt can be sent and validated.

### Phase 3 — UX, Admin & Compliance (1–2 sprints)
- **Objective**: Provide admin controls, opt-in compliance, and helpful observability for operators.
- **Tasks**:
  - **COMPLETED**: Admin UI page showing connection state, last QR, logs, and tool to send test messages and broadcast.
  - **COMPLETED**: Opt-in/opt-out flows with consent logging; unsubscribe handling and an exportable audit trail.
  - **COMPLETED**: Template manager to create/preview templates and mark approval status.
- **Acceptance criteria**: admin page with Playwright tests; consent flags persisted and queries possible; template manager exists and has tests.

### Phase 4 — Testing, CI & Documentation (1 sprint)
- **Objective**: Ensure deterministic e2e tests and proper runbook documentation.
- **Tasks**:
  - Add Playwright E2E tests for QR lifecycle, auth, ordering flows using a mock WhatsApp client.
  - Integrate these tests into CI with deterministic seeds and mocked external interactions.
  - Update `tests/WHATSAPP_TESTING_SUMMARY.md` and add `docs/WHATSAPP_IMPLEMENTATION_PLAN.md` (this file) with runbook steps: how to repro, regenerate QR, rotate credentials, and troubleshoot.
- **Acceptance criteria**: e2e tests pass in CI; runbook covers common failure modes.

### Phase 5 — Production Readiness & Migration (1–3 sprints)
- **Objective**: Secure secrets, add monitoring and design for a Business API switch.
- **Tasks**:
  - Move session files and keys to a secure secrets store (env, vault); ensure they are not logged.
  - Integrate monitoring (Sentry + metrics), expose operational metrics (queue depth, messages sent/failed, connection uptime) and set alerts.
  - Add an adapter/abstraction layer that isolates the `whatsapp-client` API surface; implement tests enabling a migration path to the WhatsApp Business API.
  - Create a deployment and rollback runbook with backup steps for session/state.
- **Acceptance criteria**: secrets in secure store, alerts firing on simulated failures, adapter layer exists with unit tests, documented rollback plan.

## File Targets & Tests
- Primary server file: `server/whatsapp.ts` (persist session, add retry logic, emit events).
- Tests:
  - Unit tests for message parser and session restore (add to `tests/`)
  - Playwright e2e tests: `tests/bot/whatsapp-bot.test.ts` — add flows for QR, auth, order with mock client.
  - Integration tests for outgoing queue/rate limit and delivery status tracking.
- Client/UI: Add Admin UI under `client/src/pages/` and Playwright tests under `tests/` with `data-testid` attributes.

## Rollout Steps & QA
1. Implement session persistence and tests in a feature branch.
2. Add health checks and socket events; run unit tests and smoke test locally.
3. Add the outgoing queue and retries; verify on staging with simulated rate limits.
4. Add admin UI and Playwright tests; run full E2E suite on CI.
5. Flip feature flags progressively (if available) and monitor metrics/alerts for 48 hours before full release.

## Risks & Mitigations
- Risk: Temporary message loss during migration — mitigate by building a persistent outgoing queue and replay tools.
- Risk: Account bans due to improper templates or rate limits — mitigate with template manager and rate-limit-aware queue.
- Risk: Secrets leakage — mitigate by immediately moving secrets to vault and adding logging checks and audits.

## Estimated Timeline
- Minimal viable hardening (Phase 1 + Phase 4 tests): 2–4 weeks depending on team size.
- Full production readiness with UI, monitoring and migration adapter: 6–12 weeks.

## Quick-start checklist (first 2 weeks)
- [x] Audit and gap report
- [x] Add session persistence and automated test
- [x] Add reconnect/backoff and `whatsapp_heartbeat` event
- [x] Add deterministic Playwright test for QR/auth lifecycle

## Current Status
The implementation has successfully completed the core functionality from Phases 1-3, including:
- WhatsApp session persistence with LocalAuth
- Reconnection with exponential backoff and heartbeat monitoring
- Enhanced command parsing with fuzzy matching
- Message queue with persistence and retry logic
- Message status tracking and delivery confirmation
- Interactive message support with template registry
- Receipt generation and media attachment handling
- Admin UI with connection status, logs and messaging tools
- Consent management with opt-in/opt-out flows
- Template management system with approval workflow

What remains for a full production implementation:
- End-to-end testing with Playwright
- Enhanced security for secrets management
- Production monitoring and alerting
- Abstraction layer for WABA migration
- Comprehensive documentation and runbooks

## References
- Tests: `tests/bot/whatsapp-bot.test.ts`
- Server: `server/whatsapp.ts`
- Testing summary: `tests/WHATSAPP_TESTING_SUMMARY.md`