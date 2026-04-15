# AI Service Desk Agent Notes

- Build only the intake, response, tracking, and follow-up MVP described in `PLAN.md`.
- Keep secret-bearing code in server routes, server actions, or backend-only libraries.
- Never trust a client-provided `business_id`; resolve business scope from the authenticated membership, public business slug, or Twilio integration settings.
- Use Supabase RLS for every exposed table and the service-role client only for trusted jobs, public intake, and webhooks.
- Keep prompts centralized in `src/lib/ai/prompts.ts` and validate all AI output before writing to Postgres.
- Prefer boring, typed implementations over broad abstractions.
