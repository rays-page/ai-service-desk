import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const DEFAULT_PIPELINE_STAGES = [
  { name: "New", position: 1, is_terminal: false },
  { name: "Contacted", position: 2, is_terminal: false },
  { name: "Quote Sent", position: 3, is_terminal: false },
  { name: "Booked", position: 4, is_terminal: true },
  { name: "Lost", position: 5, is_terminal: true }
] as const;

const DEFAULT_CANNED_TEMPLATES = [
  {
    name: "First reply",
    body: "Hi {{contact_name}}, thanks for reaching out. We can help with {{service_requested}}. What time window works best?"
  },
  {
    name: "Follow-up",
    body: "Hi {{contact_name}}, just checking in to see if you still need help with {{service_requested}}."
  },
  {
    name: "Booked confirmation",
    body: "You are booked for {{appointment_window}}. Reply here if anything changes."
  }
] as const;

function slugifyBusinessName(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "service-desk";
}

async function buildUniqueBusinessSlug(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  businessName: string
) {
  const baseSlug = slugifyBusinessName(businessName);
  let attempt = baseSlug;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("public_slug", attempt)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return attempt;

    attempt = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function getExistingWorkspace(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string
) {
  const { data, error } = await supabase
    .from("business_memberships")
    .select("businesses(*)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const business = Array.isArray(data?.businesses) ? data.businesses[0] : data?.businesses;
  return business ?? null;
}

export async function userHasWorkspace(userId: string) {
  const supabase = createAdminSupabaseClient();
  return Boolean(await getExistingWorkspace(supabase, userId));
}

export async function provisionWorkspaceForUser(input: {
  userId: string;
  fullName: string;
  email: string;
  businessName: string;
  serviceCategory: string;
}) {
  const supabase = createAdminSupabaseClient();
  const existingBusiness = await getExistingWorkspace(supabase, input.userId);

  if (existingBusiness) {
    return {
      business: existingBusiness,
      created: false
    };
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: input.userId,
      full_name: input.fullName
    },
    { onConflict: "id" }
  );

  if (profileError) throw new Error(profileError.message);

  const publicSlug = await buildUniqueBusinessSlug(supabase, input.businessName);
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      name: input.businessName,
      public_slug: publicSlug,
      service_category: input.serviceCategory,
      primary_email: input.email
    })
    .select("*")
    .single();

  if (businessError) throw new Error(businessError.message);

  const { error: membershipError } = await supabase.from("business_memberships").upsert(
    {
      business_id: business.id,
      user_id: input.userId,
      role: "owner"
    },
    { onConflict: "business_id,user_id" }
  );

  if (membershipError) throw new Error(membershipError.message);

  const { error: stageError } = await supabase.from("pipeline_stages").upsert(
    DEFAULT_PIPELINE_STAGES.map((stage) => ({
      business_id: business.id,
      name: stage.name,
      position: stage.position,
      is_terminal: stage.is_terminal
    })),
    { onConflict: "business_id,name" }
  );

  if (stageError) throw new Error(stageError.message);

  const { error: templateError } = await supabase.from("canned_templates").upsert(
    DEFAULT_CANNED_TEMPLATES.map((template) => ({
      business_id: business.id,
      name: template.name,
      body: template.body
    })),
    { onConflict: "business_id,name" }
  );

  if (templateError) throw new Error(templateError.message);

  const { error: integrationError } = await supabase.from("integration_settings").upsert(
    [
      {
        business_id: business.id,
        provider: "web_form",
        status: "healthy",
        config: { public_slug: business.public_slug }
      },
      {
        business_id: business.id,
        provider: "twilio_sms",
        status: "needs_configuration",
        config: {}
      },
      {
        business_id: business.id,
        provider: "email_stub",
        status: "stub_only",
        config: { forwarding_address: `leads@${business.public_slug}.example.com` }
      }
    ],
    { onConflict: "business_id,provider" }
  );

  if (integrationError) throw new Error(integrationError.message);

  return {
    business,
    created: true
  };
}
