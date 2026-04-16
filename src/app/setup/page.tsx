import { AlertCircle, Building2, Hammer, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { completeWorkspaceSetupAction } from "@/app/actions";
import { hasSupabaseAdminEnv, isDemoMode } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SetupPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }> | { error?: string };
}) {
  if (isDemoMode) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : {};
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("business_memberships")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membership) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-field px-5 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl overflow-hidden rounded-lg border border-line bg-white shadow-soft lg:grid-cols-[1fr_0.9fr]">
        <section className="flex flex-col justify-between bg-ink p-8 text-white lg:p-10">
          <div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white text-ink">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="mt-8 max-w-xl text-4xl font-semibold lg:text-5xl">Finish your workspace</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/70">
              We have your account. Add the business details once, and we will create the pipeline, templates, and intake settings for you.
            </p>
          </div>

          <div className="mt-10 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
            <p>Owner workspace</p>
            <p>Default pipeline</p>
            <p>Ready-to-edit templates</p>
          </div>
        </section>

        <section className="flex items-center p-6 lg:p-10">
          <div className="w-full">
            <p className="text-sm font-medium text-moss">Workspace setup</p>
            <h2 className="mt-2 text-2xl font-semibold">Create your first business</h2>
            <p className="mt-2 text-sm text-ink/58">
              This assigns you as the owner and prepares the dashboard for live intake.
            </p>

            {params?.error ? (
              <div className="mt-5 flex gap-2 rounded-md border border-rust/30 bg-rust/10 p-3 text-sm text-rust">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {params.error}
              </div>
            ) : null}

            {!hasSupabaseAdminEnv ? (
              <div className="mt-5 rounded-md border border-amber/30 bg-amber/10 p-3 text-sm text-amber">
                Workspace provisioning needs `SUPABASE_SERVICE_ROLE_KEY` on the server before this form can finish setup.
              </div>
            ) : null}

            <form action={completeWorkspaceSetupAction} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">
                Business name
                <div className="relative mt-2">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" aria-hidden="true" />
                  <input
                    className="field pl-10"
                    name="business_name"
                    placeholder="Northside HVAC"
                    defaultValue={user.user_metadata.full_name ? `${user.user_metadata.full_name}'s Service Co.` : ""}
                    required
                  />
                </div>
              </label>
              <label className="block text-sm font-medium">
                Service category
                <div className="relative mt-2">
                  <Hammer className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" aria-hidden="true" />
                  <input
                    className="field pl-10"
                    name="service_category"
                    placeholder="HVAC and plumbing"
                    defaultValue="Home services"
                    required
                  />
                </div>
              </label>
              <button className="button-primary w-full" disabled={!hasSupabaseAdminEnv}>
                Create workspace
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
