# AI Service Desk

A narrow, sellable MVP for small home-service businesses: capture inbound leads, organize the conversation, extract useful AI fields, suggest the first reply, track stages, and generate follow-up tasks for stale leads.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, and RLS
- OpenAI Responses API with Structured Outputs
- Twilio inbound SMS webhook

## Local Setup

1. Install Node.js 20.9+.
2. Copy `.env.example` to `.env.local` and fill in Supabase, OpenAI, and Twilio values.
3. Start Supabase locally or create a hosted Supabase project.
4. Run the SQL in `supabase/migrations/001_initial_schema.sql`.
5. Run `supabase/seed.sql` for demo data.
6. Install and run:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo Mode

If Supabase environment variables are missing, the app renders the operator console with built-in demo data. API routes that write data require Supabase service-role credentials.

## Required Endpoints

- `POST /api/leads/form`
- `POST /api/twilio/inbound`
- `POST /api/ai/summarize`
- `POST /api/ai/suggest-reply`
- `POST /api/tasks/run-followups`

## Example Web Form Payload

```json
{
  "business_slug": "demo-service-co",
  "contact_name": "Maya Ortiz",
  "phone": "+13125550144",
  "email": "maya@example.com",
  "location_text": "Oak Park, IL",
  "service_requested": "AC repair",
  "message": "The upstairs AC stopped cooling and we need help today.",
  "preferred_contact_method": "sms"
}
```

## Twilio Setup

Configure your Twilio Messaging webhook to `POST` to:

```text
https://your-domain.com/api/twilio/inbound
```

The route expects `application/x-www-form-urlencoded`, validates the Twilio request signature when `TWILIO_AUTH_TOKEN` is set, and returns valid TwiML.

## Follow-Up Job

For local testing:

```powershell
curl -X POST http://localhost:3000/api/tasks/run-followups -H "x-cron-secret: $env:CRON_SECRET"
```

In production, call the same route from Supabase Cron, a scheduled Edge Function, or Vercel Cron. Keep `CRON_SECRET` set.
