import { z } from "zod";

export const leadIntelligenceSchema = z.object({
  contact_name: z.string(),
  phone: z.string(),
  email: z.string(),
  location_text: z.string(),
  service_requested: z.string(),
  urgency: z.enum(["low", "normal", "high", "emergency"]),
  preferred_contact_method: z.string(),
  budget_hint: z.string(),
  sentiment: z.string(),
  concise_summary: z.string().max(500),
  suggested_reply: z.string().max(1200)
});

export type LeadIntelligence = z.infer<typeof leadIntelligenceSchema>;

export const leadIntelligenceJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "contact_name",
    "phone",
    "email",
    "location_text",
    "service_requested",
    "urgency",
    "preferred_contact_method",
    "budget_hint",
    "sentiment",
    "concise_summary",
    "suggested_reply"
  ],
  properties: {
    contact_name: { type: "string" },
    phone: { type: "string" },
    email: { type: "string" },
    location_text: { type: "string" },
    service_requested: { type: "string" },
    urgency: { type: "string", enum: ["low", "normal", "high", "emergency"] },
    preferred_contact_method: { type: "string" },
    budget_hint: { type: "string" },
    sentiment: { type: "string" },
    concise_summary: { type: "string", maxLength: 500 },
    suggested_reply: { type: "string", maxLength: 1200 }
  }
} as const;
