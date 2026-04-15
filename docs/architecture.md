# Architecture

## Runtime

- Next.js App Router for pages, route handlers, and server actions.
- Supabase Auth as the identity source.
- Supabase Postgres with RLS for multi-tenant data isolation.
- Service-role Supabase client only in trusted server code for public intake, Twilio webhooks, AI writes, and follow-up jobs.
- OpenAI Responses API for schema-constrained extraction and reply generation.
- Twilio webhook route for inbound SMS.

## Business Scope

`auth.users` maps to `profiles`. A user can belong to many `businesses` through `business_memberships`. Every business-facing table carries `business_id`; RLS policies check membership with `public.is_business_member(business_id)`.

## Lead Flow

1. `/api/leads/form` receives a public web form payload with `business_slug`.
2. `/api/twilio/inbound` receives a signed Twilio form-encoded webhook and resolves the business from integration settings.
3. Trusted intake code upserts a contact, creates or finds a lead, creates a conversation, and stores an inbound message.
4. AI runs server-side. Valid structured output updates the lead; failures are logged to `audit_log` and the workflow still completes.
5. Operators review the lead, move stages, send or copy replies, and add notes.
6. `/api/tasks/run-followups` creates follow-up tasks for stale New or Contacted leads based on business settings.

## AI Contract

The AI layer returns one validated object:

- `contact_name`
- `phone`
- `email`
- `location_text`
- `service_requested`
- `urgency`
- `preferred_contact_method`
- `budget_hint`
- `sentiment`
- `concise_summary`
- `suggested_reply`

Prompts live in `src/lib/ai/prompts.ts`; schema and validation live in `src/lib/ai/schema.ts`.

## Failure Behavior

- Missing OpenAI key: deterministic heuristic fallback, tagged in audit logs.
- Invalid AI output: log failure, keep the lead, show manual fields as empty or pending.
- Twilio signature failure: reject with `403`.
- Duplicate follow-up job runs: guarded by existing open task checks.
