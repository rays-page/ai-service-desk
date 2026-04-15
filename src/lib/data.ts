import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { demoMessages, demoNotes, demoWorkspace } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Business,
  Conversation,
  Lead,
  Message,
  Note,
  PipelineStage,
  Task,
  WorkspaceData
} from "@/lib/types";

type SupabaseAny = Awaited<ReturnType<typeof createServerSupabaseClient>>;

async function getCurrentBusiness(supabase: SupabaseAny): Promise<Business> {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { data, error } = await supabase
    .from("business_memberships")
    .select("businesses(*)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const business = Array.isArray(data?.businesses) ? data.businesses[0] : data?.businesses;

  if (error || !business) {
    throw new Error("No business membership found for the current user.");
  }

  return business as Business;
}

export async function getWorkspaceData(): Promise<WorkspaceData> {
  noStore();

  if (isDemoMode) {
    return demoWorkspace;
  }

  const supabase = await createServerSupabaseClient();
  const business = await getCurrentBusiness(supabase);

  const [stagesResult, leadsResult, tasksResult, templatesResult, integrationsResult] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("*")
      .eq("business_id", business.id)
      .order("position", { ascending: true }),
    supabase
      .from("leads")
      .select("*, contact:contacts(*), stage:pipeline_stages(*)")
      .eq("business_id", business.id)
      .order("last_activity_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*, lead:leads(id,title,urgency)")
      .eq("business_id", business.id)
      .order("due_at", { ascending: true }),
    supabase
      .from("canned_templates")
      .select("*")
      .eq("business_id", business.id)
      .order("name", { ascending: true }),
    supabase
      .from("integration_settings")
      .select("*")
      .eq("business_id", business.id)
      .order("provider", { ascending: true })
  ]);

  for (const result of [stagesResult, leadsResult, tasksResult, templatesResult, integrationsResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    business,
    stages: (stagesResult.data ?? []) as PipelineStage[],
    leads: (leadsResult.data ?? []) as Lead[],
    tasks: (tasksResult.data ?? []) as Task[],
    templates: templatesResult.data ?? [],
    integrations: integrationsResult.data ?? []
  };
}

export async function getLeadDetail(leadId: string): Promise<{
  workspace: WorkspaceData;
  lead: Lead | null;
  conversation: Conversation | null;
  messages: Message[];
  notes: Note[];
}> {
  noStore();

  if (isDemoMode) {
    const lead = demoWorkspace.leads.find((item) => item.id === leadId) ?? demoWorkspace.leads[0] ?? null;
    const conversationId = lead ? `conv-${lead.id.replace("lead-", "")}` : "";
    const conversation = lead
      ? {
          id: conversationId,
          business_id: lead.business_id,
          lead_id: lead.id,
          subject: lead.title
        }
      : null;

    return {
      workspace: demoWorkspace,
      lead,
      conversation,
      messages: demoMessages.filter((message) => message.conversation_id === conversation?.id),
      notes: demoNotes.filter((note) => note.lead_id === lead?.id)
    };
  }

  const workspace = await getWorkspaceData();
  const lead = workspace.leads.find((item) => item.id === leadId) ?? null;

  if (!lead) {
    return { workspace, lead: null, conversation: null, messages: [], notes: [] };
  }

  const supabase = await createServerSupabaseClient();
  const [conversationResult, notesResult] = await Promise.all([
    supabase
      .from("conversations")
      .select("*")
      .eq("business_id", workspace.business.id)
      .eq("lead_id", lead.id)
      .maybeSingle(),
    supabase
      .from("notes")
      .select("*")
      .eq("business_id", workspace.business.id)
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false })
  ]);

  if (conversationResult.error) throw new Error(conversationResult.error.message);
  if (notesResult.error) throw new Error(notesResult.error.message);

  const conversation = conversationResult.data as Conversation | null;
  let messages: Message[] = [];

  if (conversation) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("business_id", workspace.business.id)
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    messages = (data ?? []) as Message[];
  }

  return {
    workspace,
    lead,
    conversation,
    messages,
    notes: (notesResult.data ?? []) as Note[]
  };
}

export function getDashboardStats(workspace: WorkspaceData) {
  const today = new Date();
  const sameDay = (value: string) => {
    const date = new Date(value);
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  };

  const bookedStage = workspace.stages.find((stage) => stage.name === "Booked");
  const newLeadsToday = workspace.leads.filter((lead) => sameDay(lead.created_at)).length;
  const overdueFollowups = workspace.tasks.filter((task) => task.status === "open" && new Date(task.due_at) < today).length;
  const bookedCount = workspace.leads.filter((lead) => lead.stage_id === bookedStage?.id).length;
  const respondedLeads = workspace.leads.filter((lead) => lead.last_inbound_at && lead.last_outbound_at);
  const responseMinutes = respondedLeads.map((lead) => {
    const inbound = new Date(lead.last_inbound_at!).getTime();
    const outbound = new Date(lead.last_outbound_at!).getTime();
    return Math.max(0, Math.round((outbound - inbound) / 60_000));
  });

  const avgFirstResponseMinutes = responseMinutes.length
    ? Math.round(responseMinutes.reduce((sum, item) => sum + item, 0) / responseMinutes.length)
    : null;

  return {
    newLeadsToday,
    overdueFollowups,
    bookedCount,
    avgFirstResponseMinutes
  };
}
