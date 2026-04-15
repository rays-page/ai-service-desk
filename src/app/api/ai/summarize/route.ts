import { NextResponse } from "next/server";
import { generateLeadIntelligence } from "@/lib/ai/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { leadAiRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = leadAiRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid AI request", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*, contact:contacts(*), business:businesses(*)")
    .eq("id", parsed.data.lead_id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: leadError?.message ?? "Lead not found" }, { status: 404 });
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("lead_id", lead.id)
    .maybeSingle();

  const { data: messages, error: messageError } = conversation
    ? await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  const ai = await generateLeadIntelligence({
    businessName: lead.business?.name ?? "Service business",
    serviceCategory: lead.business?.service_category,
    contactName: lead.contact?.name,
    phone: lead.contact?.phone,
    email: lead.contact?.email,
    locationText: lead.contact?.location_text,
    serviceRequested: lead.service_requested,
    preferredContactMethod: lead.contact?.preferred_contact_method,
    messages: (messages ?? []).map((message) => message.body)
  });

  if (!ai.ok) {
    await supabase.from("audit_log").insert({
      business_id: lead.business_id,
      event_type: "ai_failure",
      event_payload: { lead_id: lead.id, error: ai.error }
    });

    return NextResponse.json({ error: ai.error }, { status: 502 });
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      ai_summary: ai.data.concise_summary,
      extracted_fields: ai.data,
      service_requested: ai.data.service_requested || lead.service_requested,
      urgency: ai.data.urgency,
      sentiment: ai.data.sentiment,
      budget_hint: ai.data.budget_hint
    })
    .eq("id", lead.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ summary: ai.data.concise_summary, extracted_fields: ai.data });
}
