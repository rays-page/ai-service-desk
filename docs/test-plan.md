# Test Plan

This runbook is ordered to prove happy-path functionality first, then move into integration behavior, and only after that into deeper edge-case work.

## Baseline Validation

Run these before manual testing:

```powershell
npm install
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-local.ps1
npm run dev
```

Current local expectations:

- `npm run dev` uses webpack for stability on this Windows machine.
- `npm run typecheck` generates Next route/types metadata before running `tsc`.
- `scripts/check-local.ps1` uses the bundled Node runtime automatically when a global install is unavailable.
- If `.env.local` is absent or Supabase env vars are missing, the app runs in demo mode.
- Demo mode is valid for the operator UI pass, but API routes that require service-role access will not complete their success paths.

## Smoke Checklist

Use this pass to confirm the operator console works as a product, not just as a set of isolated pages.

### 1. App Boot and Routing

1. Open `/`, `/dashboard`, `/inbox`, `/pipeline`, `/tasks`, `/settings`, and `/login`.
2. Confirm each route renders without a server or client runtime error.
3. Confirm the sidebar navigation moves between pages cleanly.
4. Confirm obvious empty states or not-found states render intentionally.

Expected results:

- `/` redirects into the app shell.
- Core routes either render successfully or redirect intentionally.
- The shell stays intact while content changes by route.

### 2. Dashboard

1. Confirm the four top-line metrics render.
2. Open a lead from the active lead queue.
3. Confirm the urgent task panel matches the visible task state.

Expected results:

- Metrics render without placeholder errors.
- Lead links open the correct detail page.
- Task counts feel internally consistent with the Tasks page.

### 3. Inbox

1. Toggle source filters.
2. Toggle stage filters.
3. Toggle urgency filters.
4. Clear back to the unfiltered view.
5. Open multiple lead rows.

Expected results:

- Each filter changes the visible list.
- The unfiltered route restores the full set.
- Lead links remain stable across filtered and unfiltered views.

### 4. Lead Detail

1. Confirm AI summary, suggested reply, notes, timeline, contact block, extracted fields, and tags all render.
2. Record an outbound reply.
3. Add an internal note.
4. Change the stage from the detail page.

Expected results:

- The page renders complete lead context with no missing-section crashes.
- Reply and note actions persist in the current mode.
- Stage changes are reflected back in Inbox, Pipeline, and Dashboard.

### 5. Pipeline

1. Confirm each stage column renders.
2. Open leads from the board.
3. Change a lead stage from the board control.

Expected results:

- Leads appear in the correct columns.
- Stage movement updates both the board and lead detail view.

### 6. Tasks

1. Open Due, Overdue, and Completed views.
2. Complete an open task.
3. Refresh the page and confirm the task remains completed.

Expected results:

- Each view shows the correct filtered task subset.
- Completing a task updates task status and downstream dashboard counts.

### 7. Settings

1. Save business profile changes.
2. Save a Twilio number.
3. Review integration health and canned templates.

Expected results:

- Business fields re-render with updated values.
- Twilio save path succeeds or fails clearly based on environment.
- Integration and template sections render consistently.

## API Verification

Run these after the UI smoke pass. In demo mode, treat success-path failures caused by missing service-role env as environment limitations, not product regressions.

### `POST /api/leads/form`

Success criteria:

- Valid payload creates a lead, contact, conversation, inbound message, AI attempt, and stage history.

Failure criteria:

- Invalid payload returns `400`.
- Missing admin env returns a configuration-driven failure response.

### `POST /api/twilio/inbound`

Success criteria:

- Valid form-encoded payload returns TwiML and creates or appends to the correct lead flow.

Failure criteria:

- Invalid body still returns TwiML with a graceful fallback message.
- Invalid signature returns `403` when `TWILIO_AUTH_TOKEN` is configured.

### `POST /api/ai/summarize`

Success criteria:

- Valid `lead_id` updates `ai_summary` and `extracted_fields`.

Failure criteria:

- Invalid payload returns `400`.
- Missing lead returns `404`.
- AI failure returns `502` and logs to `audit_log`.
- Database read or write failure returns a non-2xx response.

### `POST /api/ai/suggest-reply`

Success criteria:

- Valid `lead_id` updates `suggested_reply`.

Failure criteria:

- Invalid payload returns `400`.
- Missing lead returns `404`.
- AI failure returns `502` and logs to `audit_log`.

### `POST /api/tasks/run-followups`

Success criteria:

- Valid cron secret creates only the expected stale-lead tasks.
- Re-running does not create duplicates.

Failure criteria:

- Missing `CRON_SECRET` returns `503`.
- Wrong secret returns `401`.

## Live-Stack Pass

Repeat the critical flows below after Supabase, service-role, OpenAI, and Twilio values are configured:

1. Sign up a user and create a workspace.
2. Sign in and confirm routing behaves correctly for users with and without memberships.
3. Repeat note, reply, stage, task, and settings write actions and confirm persistence after refresh.
4. Submit a web-form lead and confirm all expected records are written.
5. Send a Twilio webhook and confirm business resolution, signature handling, and lead creation.
6. Call both AI routes and confirm useful lead enrichment is stored.
7. Run the follow-up job twice and confirm the second run is deduplicated.

Expected results:

- Writes survive refresh and reload.
- Business scoping remains correct.
- External integrations succeed without manual data repair.

## Security and Isolation Checks

Run this pass after the live-stack flow so auth, RLS, and trust boundaries are checked deliberately instead of being inferred from happy-path behavior.

1. Sign in as a user without a membership and confirm no business data is returned.
2. Attempt to move a lead into another business's stage and confirm the server rejects it.
3. Confirm browser bundles only use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Confirm public intake accepts only `business_slug` and never trusts a client-supplied `business_id`.

Expected results:

- Unauthorized or out-of-scope reads return an empty/blocked experience instead of cross-business data.
- Cross-business stage updates are rejected by the server.
- Browser bundles do not expose service-role credentials.
- Public intake boundaries stay on external identifiers only.

## Findings Triage

Classify issues found during this pass into two buckets:

### Fix Now

- Anything blocking a happy-path workflow.
- Anything breaking data integrity, auth boundaries, or external integrations.
- Any issue that prevents lint, typecheck, or stable local boot.

### Defer

- Visual polish problems.
- Developer-only tooling confusion.
- Edge-case behavior that does not threaten core workflow correctness.
