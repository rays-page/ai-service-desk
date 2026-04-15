# Test Plan

Run these after installing Node.js and applying the Supabase migration/seed.

## Static Checks

```powershell
npm install
npm run typecheck
npm run lint
npm run build
```

## Core Flow Checks

1. Sign in with `owner@demo-service.co` and `demo-password`.
2. Confirm dashboard metrics, inbox rows, pipeline columns, tasks, and settings render.
3. Submit `POST /api/leads/form` with the README payload and confirm a new lead, contact, conversation, and inbound message are created.
4. Send a Twilio webhook test payload to `POST /api/twilio/inbound`; confirm signature validation passes when `TWILIO_AUTH_TOKEN` and `TWILIO_WEBHOOK_URL` match.
5. Open the lead detail page and confirm extracted fields, AI summary, suggested reply, notes, and timeline appear.
6. Move a lead between stages from the lead detail page and pipeline board.
7. Call `POST /api/ai/summarize` and `POST /api/ai/suggest-reply` for a lead.
8. Call `POST /api/tasks/run-followups` with `x-cron-secret` and confirm stale New and Contacted leads get one open follow-up task each.

## Security Checks

1. Sign in as a user without a membership and confirm no business data is returned.
2. Attempt to update a lead into another business's stage and confirm the server rejects it.
3. Confirm browser bundles only use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Confirm public form intake accepts only `business_slug`, never trusted `business_id`.
