"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { getErrorMessage } from "@/lib/errors";
import { provisionWorkspaceForUser } from "@/lib/onboarding";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { signUpSchema, workspaceSetupSchema } from "@/lib/validation";

function firstValidationMessage(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  for (const messages of Object.values(error.flatten().fieldErrors)) {
    if (messages?.[0]) return messages[0];
  }

  return "Please review the highlighted fields and try again.";
}

export async function signInAction(formData: FormData) {
  if (isDemoMode) {
    redirect("/dashboard");
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const { data: membership } = user
    ? await supabase
        .from("business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()
    : { data: null };

  if (user && !membership) {
    redirect("/setup");
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  if (isDemoMode) {
    redirect("/dashboard");
  }

  const parsed = signUpSchema.safeParse({
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    business_name: String(formData.get("business_name") ?? ""),
    service_category: String(formData.get("service_category") ?? "")
  });

  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(firstValidationMessage(parsed.error))}`);
  }

  const { email, password, full_name: fullName, business_name: businessName, service_category: serviceCategory } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.user) {
    redirect("/login?error=Account creation did not return a user record.");
  }

  try {
    await provisionWorkspaceForUser({
      userId: data.user.id,
      fullName,
      email,
      businessName,
      serviceCategory
    });
  } catch (error) {
    const message = getErrorMessage(error, "Workspace setup failed.");

    if (data.session) {
      redirect(`/setup?error=${encodeURIComponent(message)}`);
    }

    redirect(
      `/login?error=${encodeURIComponent("Account created, but workspace setup did not finish. Sign in and complete setup.")}`
    );
  }

  if (data.session) {
    redirect("/dashboard");
  }

  redirect("/login?message=Account created. Check your email, then sign in to open your workspace.");
}

export async function signOutAction() {
  if (!isDemoMode) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}

export async function updateLeadStageAction(formData: FormData) {
  if (isDemoMode) {
    revalidatePath("/");
    return;
  }

  const leadId = String(formData.get("lead_id") ?? "");
  const stageId = String(formData.get("stage_id") ?? "");
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id,business_id,stage_id")
    .eq("id", leadId)
    .single();

  if (leadError) throw new Error(leadError.message);

  const { data: stage, error: stageError } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("id", stageId)
    .eq("business_id", lead.business_id)
    .single();

  if (stageError || !stage) {
    throw new Error("Target stage does not belong to this business.");
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({ stage_id: stageId, last_activity_at: new Date().toISOString() })
    .eq("id", leadId);

  if (updateError) throw new Error(updateError.message);

  await supabase.from("lead_stage_history").insert({
    business_id: lead.business_id,
    lead_id: lead.id,
    from_stage_id: lead.stage_id,
    to_stage_id: stageId,
    changed_by: user?.id ?? null
  });

  revalidatePath("/dashboard");
  revalidatePath("/inbox");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
}

export async function completeTaskAction(formData: FormData) {
  if (isDemoMode) {
    revalidatePath("/tasks");
    return;
  }

  const taskId = String(formData.get("task_id") ?? "");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function addNoteAction(formData: FormData) {
  if (isDemoMode) {
    revalidatePath(`/leads/${String(formData.get("lead_id") ?? "")}`);
    return;
  }

  const leadId = String(formData.get("lead_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id,business_id")
    .eq("id", leadId)
    .single();

  if (leadError) throw new Error(leadError.message);

  const { error } = await supabase.from("notes").insert({
    business_id: lead.business_id,
    lead_id: lead.id,
    author_id: user?.id ?? null,
    body
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/inbox");
}

export async function recordOutboundReplyAction(formData: FormData) {
  if (isDemoMode) {
    revalidatePath(`/leads/${String(formData.get("lead_id") ?? "")}`);
    revalidatePath("/dashboard");
    return;
  }

  const leadId = String(formData.get("lead_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id,business_id,stage_id,source,title")
    .eq("id", leadId)
    .single();

  if (leadError) throw new Error(leadError.message);

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("lead_id", lead.id)
    .single();

  if (conversationError) throw new Error(conversationError.message);

  const now = new Date().toISOString();
  const { error: messageError } = await supabase.from("messages").insert({
    business_id: lead.business_id,
    conversation_id: conversation.id,
    direction: "outbound",
    source: lead.source,
    body,
    sender_name: "Office"
  });

  if (messageError) throw new Error(messageError.message);

  const { data: contactedStage } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("business_id", lead.business_id)
    .eq("name", "Contacted")
    .maybeSingle();

  const patch: Record<string, unknown> = {
    last_outbound_at: now,
    last_activity_at: now
  };

  if (contactedStage?.id && contactedStage.id !== lead.stage_id) {
    patch.stage_id = contactedStage.id;
  }

  const { error: updateError } = await supabase.from("leads").update(patch).eq("id", lead.id);
  if (updateError) throw new Error(updateError.message);

  if (patch.stage_id) {
    await supabase.from("lead_stage_history").insert({
      business_id: lead.business_id,
      lead_id: lead.id,
      from_stage_id: lead.stage_id,
      to_stage_id: patch.stage_id,
      changed_by: user?.id ?? null
    });
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
  revalidatePath("/inbox");
  revalidatePath("/pipeline");
}

export async function updateSettingsAction(formData: FormData) {
  if (isDemoMode) {
    revalidatePath("/settings");
    return;
  }

  const businessId = String(formData.get("business_id") ?? "");
  const name = String(formData.get("name") ?? "");
  const primaryPhone = String(formData.get("primary_phone") ?? "");
  const primaryEmail = String(formData.get("primary_email") ?? "");
  const followUpNewHours = Number(formData.get("follow_up_new_hours") ?? 2);
  const followUpContactedDays = Number(formData.get("follow_up_contacted_days") ?? 3);
  const businessHoursText = String(formData.get("business_hours_json") ?? "{}");
  let businessHours: Record<string, string>;

  try {
    businessHours = JSON.parse(businessHoursText) as Record<string, string>;
  } catch {
    throw new Error("Business hours must be valid JSON.");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("business_memberships")
    .select("business_id")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    throw new Error("Current user is not a member of this business.");
  }

  if (!Number.isFinite(followUpNewHours) || followUpNewHours < 1 || followUpNewHours > 168) {
    throw new Error("New lead follow-up hours must be between 1 and 168.");
  }

  if (!Number.isFinite(followUpContactedDays) || followUpContactedDays < 1 || followUpContactedDays > 30) {
    throw new Error("Contacted follow-up days must be between 1 and 30.");
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      primary_phone: primaryPhone,
      primary_email: primaryEmail,
      business_hours: businessHours,
      follow_up_new_hours: followUpNewHours,
      follow_up_contacted_days: followUpContactedDays
    })
    .eq("id", businessId);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function completeWorkspaceSetupAction(formData: FormData) {
  if (isDemoMode) {
    redirect("/dashboard");
  }

  const parsed = workspaceSetupSchema.safeParse({
    business_name: String(formData.get("business_name") ?? ""),
    service_category: String(formData.get("service_category") ?? "")
  });

  if (!parsed.success) {
    redirect(`/setup?error=${encodeURIComponent(firstValidationMessage(parsed.error))}`);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    await provisionWorkspaceForUser({
      userId: user.id,
      fullName: String(user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "Owner"),
      email: user.email ?? "",
      businessName: parsed.data.business_name,
      serviceCategory: parsed.data.service_category
    });
  } catch (error) {
    redirect(`/setup?error=${encodeURIComponent(getErrorMessage(error, "Workspace setup failed."))}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/dashboard");
}
