import "server-only";

import OpenAI from "openai";
import { LEAD_INTELLIGENCE_SYSTEM_PROMPT, SUGGESTED_REPLY_INSTRUCTIONS } from "@/lib/ai/prompts";
import {
  leadIntelligenceJsonSchema,
  leadIntelligenceSchema,
  type LeadIntelligence
} from "@/lib/ai/schema";

export type LeadIntelligenceInput = {
  businessName: string;
  serviceCategory?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  locationText?: string | null;
  serviceRequested?: string | null;
  preferredContactMethod?: string | null;
  messages: string[];
};

export type AiResult =
  | { ok: true; data: LeadIntelligence; mode: "openai" | "fallback" }
  | { ok: false; error: string };

function fallbackIntelligence(input: LeadIntelligenceInput): LeadIntelligence {
  const text = input.messages.join("\n");
  const lower = text.toLowerCase();
  const urgency = lower.includes("today") || lower.includes("urgent") || lower.includes("emergency")
    ? "emergency"
    : lower.includes("soon") || lower.includes("leak") || lower.includes("no heat") || lower.includes("not cooling")
      ? "high"
      : "normal";

  const email = input.email || text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = input.phone || text.match(/\+?[0-9][0-9 .()-]{7,}[0-9]/)?.[0] || "";
  const service = input.serviceRequested || (lower.includes("water") ? "Water service" : lower.includes("ac") ? "AC service" : "Service request");
  const summary = `${input.contactName || "A new lead"} asked about ${service}${input.locationText ? ` in ${input.locationText}` : ""}.`;

  return {
    contact_name: input.contactName || "",
    phone,
    email,
    location_text: input.locationText || "",
    service_requested: service,
    urgency,
    preferred_contact_method: input.preferredContactMethod || (phone ? "sms" : email ? "email" : "unknown"),
    budget_hint: lower.includes("quote") || lower.includes("price") || lower.includes("cost") ? "asked about price" : "not mentioned",
    sentiment: urgency === "emergency" ? "stressed" : "neutral",
    concise_summary: summary,
    suggested_reply: `Hi ${input.contactName || "there"}, thanks for reaching out. We can help with ${service}. What time window works best for a quick follow-up?`
  };
}

export async function generateLeadIntelligence(input: LeadIntelligenceInput): Promise<AiResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { ok: true, data: fallbackIntelligence(input), mode: "fallback" };
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `${LEAD_INTELLIGENCE_SYSTEM_PROMPT}\n${SUGGESTED_REPLY_INSTRUCTIONS}`
        },
        {
          role: "user",
          content: JSON.stringify(input, null, 2)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "lead_intelligence",
          strict: true,
          schema: leadIntelligenceJsonSchema
        }
      }
    });

    const parsed = JSON.parse(response.output_text ?? "{}");
    const data = leadIntelligenceSchema.parse(parsed);
    return { ok: true, data, mode: "openai" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown AI failure"
    };
  }
}
