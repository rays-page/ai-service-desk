import "server-only";

import { subDays, subHours } from "date-fns";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function hasOpenFollowup(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  businessId: string,
  leadId: string,
  title: string
) {
  const { data, error } = await supabase
    .from("tasks")
    .select("id")
    .eq("business_id", businessId)
    .eq("lead_id", leadId)
    .eq("status", "open")
    .eq("title", title)
    .limit(1);

  if (error) throw new Error(error.message);
  return Boolean(data?.length);
}

export async function runFollowupAutomation() {
  const supabase = createAdminSupabaseClient();
  const { data: businesses, error: businessError } = await supabase.from("businesses").select("*");
  if (businessError) throw new Error(businessError.message);

  let created = 0;
  const inspected: string[] = [];

  for (const business of businesses ?? []) {
    inspected.push(business.id);
    const { data: stages, error: stagesError } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("business_id", business.id)
      .in("name", ["New", "Contacted"]);

    if (stagesError) throw new Error(stagesError.message);

    const newStage = stages?.find((stage) => stage.name === "New");
    const contactedStage = stages?.find((stage) => stage.name === "Contacted");

    if (newStage) {
      const cutoff = subHours(new Date(), business.follow_up_new_hours).toISOString();
      const { data: staleNew, error } = await supabase
        .from("leads")
        .select("id,title,business_id,owner_id")
        .eq("business_id", business.id)
        .eq("stage_id", newStage.id)
        .is("last_outbound_at", null)
        .lt("created_at", cutoff);

      if (error) throw new Error(error.message);

      for (const lead of staleNew ?? []) {
        const title = "Send first reply";
        if (await hasOpenFollowup(supabase, business.id, lead.id, title)) continue;

        const { error: insertError } = await supabase.from("tasks").insert({
          business_id: business.id,
          lead_id: lead.id,
          assigned_to: lead.owner_id,
          title,
          description: "New lead has not received an outbound reply.",
          due_at: new Date().toISOString(),
          status: "open"
        });

        if (insertError) throw new Error(insertError.message);
        created += 1;
      }
    }

    if (contactedStage) {
      const cutoff = subDays(new Date(), business.follow_up_contacted_days).toISOString();
      const { data: staleContacted, error } = await supabase
        .from("leads")
        .select("id,title,business_id,owner_id")
        .eq("business_id", business.id)
        .eq("stage_id", contactedStage.id)
        .lt("last_activity_at", cutoff);

      if (error) throw new Error(error.message);

      for (const lead of staleContacted ?? []) {
        const title = "Follow up after contact";
        if (await hasOpenFollowup(supabase, business.id, lead.id, title)) continue;

        const { error: insertError } = await supabase.from("tasks").insert({
          business_id: business.id,
          lead_id: lead.id,
          assigned_to: lead.owner_id,
          title,
          description: "Contacted lead has had no new activity within the configured window.",
          due_at: new Date().toISOString(),
          status: "open"
        });

        if (insertError) throw new Error(insertError.message);
        created += 1;
      }
    }
  }

  return { created, inspected_businesses: inspected.length };
}
