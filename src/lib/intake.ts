import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { generateLeadIntelligence } from "@/lib/ai/service";
import type { LeadFormInput, TwilioInboundInput } from "@/lib/validation";

type InboundSource = "form" | "sms" | "email_stub";

type IntakeInput = {
  businessSlug: string;
  source: InboundSource;
  contactName: string;
  phone?: string;
  email?: string;
  locationText?: string;
  serviceRequested?: string;
  message: string;
  preferredContactMethod?: string;
  providerMessageId?: string;
  providerPayload?: Record<string, unknown>;
};

async function logAudit(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  businessId: string | null,
  eventType: string,
  eventPayload: Record<string, unknown>
) {
  await supabase.from("audit_log").insert({
    business_id: businessId,
    event_type: eventType,
    event_payload: eventPayload
  });
}

async function findOrCreateContact(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  input: IntakeInput,
  businessId: string
) {
  let existing = null;

  if (input.phone) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("business_id", businessId)
      .eq("phone", input.phone)
      .maybeSingle();
    existing = data;
  }

  if (!existing && input.email) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("business_id", businessId)
      .eq("email", input.email)
      .maybeSingle();
    existing = data;
  }

  if (existing) {
    const { data, error } = await supabase
      .from("contacts")
      .update({
        name: input.contactName || existing.name,
        phone: input.phone || existing.phone,
        email: input.email || existing.email,
        location_text: input.locationText || existing.location_text,
        preferred_contact_method: input.preferredContactMethod || existing.preferred_contact_method
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      business_id: businessId,
      name: input.contactName || "Unknown contact",
      phone: input.phone || null,
      email: input.email || null,
      location_text: input.locationText || null,
      preferred_contact_method: input.preferredContactMethod || null
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function findOpenLeadForContact(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  businessId: string,
  contactId: string
) {
  const { data: terminalStages } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("business_id", businessId)
    .eq("is_terminal", true);

  const terminalIds = (terminalStages ?? []).map((stage) => stage.id);
  let query = supabase
    .from("leads")
    .select("*")
    .eq("business_id", businessId)
    .eq("contact_id", contactId)
    .order("last_activity_at", { ascending: false })
    .limit(1);

  if (terminalIds.length) {
    query = query.not("stage_id", "in", `(${terminalIds.join(",")})`);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createLeadFromInbound(input: IntakeInput) {
  const supabase = createAdminSupabaseClient();
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("public_slug", input.businessSlug)
    .single();

  if (businessError || !business) {
    throw new Error("Business not found for intake slug.");
  }

  const { data: newStage, error: stageError } = await supabase
    .from("pipeline_stages")
    .select("*")
    .eq("business_id", business.id)
    .eq("name", "New")
    .single();

  if (stageError || !newStage) {
    throw new Error("New pipeline stage is missing.");
  }

  const contact = await findOrCreateContact(supabase, input, business.id);
  const existingLead = input.source === "sms" ? await findOpenLeadForContact(supabase, business.id, contact.id) : null;
  const now = new Date().toISOString();
  let lead = existingLead;

  if (!lead) {
    const { data, error } = await supabase
      .from("leads")
      .insert({
        business_id: business.id,
        contact_id: contact.id,
        stage_id: newStage.id,
        source: input.source,
        title: input.serviceRequested || input.message.slice(0, 80),
        service_requested: input.serviceRequested || null,
        urgency: "normal",
        last_inbound_at: now,
        last_activity_at: now
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    lead = data;

    await supabase.from("lead_stage_history").insert({
      business_id: business.id,
      lead_id: lead.id,
      from_stage_id: null,
      to_stage_id: newStage.id
    });
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .upsert(
      {
        business_id: business.id,
        lead_id: lead.id,
        subject: lead.title
      },
      { onConflict: "lead_id" }
    )
    .select("*")
    .single();

  if (conversationError) throw new Error(conversationError.message);

  const { error: messageError } = await supabase.from("messages").insert({
    business_id: business.id,
    conversation_id: conversation.id,
    direction: "inbound",
    source: input.source,
    body: input.message,
    sender_name: input.contactName || contact.name,
    sender_phone: input.phone || contact.phone,
    sender_email: input.email || contact.email,
    provider_message_id: input.providerMessageId || null,
    provider_payload: input.providerPayload || {}
  });

  if (messageError) throw new Error(messageError.message);

  const ai = await generateLeadIntelligence({
    businessName: business.name,
    serviceCategory: business.service_category,
    contactName: input.contactName || contact.name,
    phone: input.phone || contact.phone,
    email: input.email || contact.email,
    locationText: input.locationText || contact.location_text,
    serviceRequested: input.serviceRequested || lead.service_requested,
    preferredContactMethod: input.preferredContactMethod || contact.preferred_contact_method,
    messages: [input.message]
  });

  const leadPatch: Record<string, unknown> = {
    last_inbound_at: now,
    last_activity_at: now
  };

  if (ai.ok) {
    leadPatch.ai_summary = ai.data.concise_summary;
    leadPatch.suggested_reply = ai.data.suggested_reply;
    leadPatch.extracted_fields = ai.data;
    leadPatch.service_requested = ai.data.service_requested || lead.service_requested;
    leadPatch.urgency = ai.data.urgency;
    leadPatch.sentiment = ai.data.sentiment;
    leadPatch.budget_hint = ai.data.budget_hint;
    await logAudit(supabase, business.id, `ai_${ai.mode}_success`, { lead_id: lead.id });
  } else {
    await logAudit(supabase, business.id, "ai_failure", { lead_id: lead.id, error: ai.error });
  }

  const { data: updatedLead, error: updateError } = await supabase
    .from("leads")
    .update(leadPatch)
    .eq("id", lead.id)
    .select("*")
    .single();

  if (updateError) throw new Error(updateError.message);

  return {
    business,
    contact,
    lead: updatedLead,
    conversation
  };
}

export function mapFormInputToIntake(input: LeadFormInput): IntakeInput {
  return {
    businessSlug: input.business_slug,
    source: "form",
    contactName: input.contact_name,
    phone: input.phone,
    email: input.email,
    locationText: input.location_text,
    serviceRequested: input.service_requested,
    message: input.message,
    preferredContactMethod: input.preferred_contact_method
  };
}

export async function resolveTwilioBusinessSlug(payload: TwilioInboundInput) {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("integration_settings")
    .select("businesses(public_slug)")
    .eq("provider", "twilio_sms")
    .contains("config", { phone_number: payload.To })
    .maybeSingle();

  const businessRecord = Array.isArray(data?.businesses) ? data.businesses[0] : data?.businesses;
  const business = businessRecord as { public_slug?: string } | null | undefined;
  return business?.public_slug || process.env.TWILIO_DEFAULT_BUSINESS_SLUG || "demo-service-co";
}

export function mapTwilioInputToIntake(input: TwilioInboundInput, businessSlug: string): IntakeInput {
  return {
    businessSlug,
    source: "sms",
    contactName: input.ProfileName || input.From,
    phone: input.From,
    message: input.Body,
    preferredContactMethod: "sms",
    providerMessageId: input.MessageSid,
    providerPayload: input
  };
}
