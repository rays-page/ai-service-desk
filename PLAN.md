# AI Service Desk Plan

## Product Thesis

AI Service Desk is a focused operator console for small home-service businesses. It captures inbound leads from web forms and SMS, summarizes and extracts useful fields with AI, suggests a first reply, tracks lead stage, and creates follow-up tasks when leads go stale.

## MVP Phases

1. Foundation: Next.js App Router, Tailwind, Supabase clients, protected workspace layout, product docs.
2. Data: Postgres schema, RLS policies, seed data, business-scoped access model.
3. Screens: dashboard, inbox, lead detail, pipeline, task queue, settings.
4. Intake: public form endpoint, Twilio inbound webhook, email adapter stub.
5. AI: structured lead extraction, summary, suggested reply, failure logging.
6. Automation: configurable stale-lead follow-up task creation.
7. Polish: empty/loading/error states, README setup, local verification notes.

## Narrow Scope Guardrails

- No quote engine, payment processing, calendar sync, voice AI, full email sync, mobile app, or general chatbot surface.
- All customer-facing workflow should map to capture, organize, respond, track, or follow up.
- Use demo data when Supabase environment variables are absent so the UI can still be reviewed locally.

## Visual Thesis

Operational, steady, and fast to scan: muted field-service colors, dense status surfaces, clear next actions, and restrained motion through hover and focus states.

## Content Plan

- Dashboard: business health and response metrics.
- Inbox: unified inbound lead queue with source, stage, urgency, and suggested next action.
- Lead detail: contact, extracted fields, timeline, summary, suggested reply, notes, ownership.
- Pipeline: stage board from New to Lost.
- Tasks: due, overdue, and completed follow-ups.
- Settings: business profile, timing rules, templates, integration health.

## Interaction Thesis

- Navigation keeps the current workspace visible and compact.
- Lead rows and stage cards use subtle hover states to sharpen scanning.
- Forms and server actions use explicit status copy for empty and error states.
