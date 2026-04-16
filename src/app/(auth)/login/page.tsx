import { AlertCircle, LogIn, UserPlus } from "lucide-react";
import { signInAction, signUpAction } from "@/app/actions";
import { isDemoMode } from "@/lib/env";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; message?: string }> | { error?: string; message?: string };
}) {
  const params = searchParams ? await searchParams : {};

  return (
    <main className="min-h-screen bg-field px-5 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-lg border border-line bg-white shadow-soft lg:grid-cols-[1fr_0.85fr]">
        <section className="flex flex-col justify-between bg-ink p-8 text-white lg:p-10">
          <div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white text-ink">
              <LogIn className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="mt-8 max-w-xl text-4xl font-semibold lg:text-5xl">AI Service Desk</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/70">
              A small-business console for lead intake, response, pipeline tracking, and follow-up.
            </p>
          </div>

          <div className="mt-10 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
            <p>Unified inbox</p>
            <p>Structured AI fields</p>
            <p>Stale-lead tasks</p>
          </div>
        </section>

        <section className="flex items-center p-6 lg:p-10">
          <div className="w-full">
            <div>
              <p className="text-sm font-medium text-moss">{isDemoMode ? "Demo mode" : "Workspace sign in"}</p>
              <h2 className="mt-2 text-2xl font-semibold">Open the operator console</h2>
              {isDemoMode ? (
                <p className="mt-2 text-sm text-ink/58">Supabase is not configured, so any credentials will open demo data.</p>
              ) : null}
            </div>

            {params?.error ? (
              <div className="mt-5 flex gap-2 rounded-md border border-rust/30 bg-rust/10 p-3 text-sm text-rust">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {params.error}
              </div>
            ) : null}

            {params?.message ? (
              <div className="mt-5 flex gap-2 rounded-md border border-moss/25 bg-moss/10 p-3 text-sm text-moss">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {params.message}
              </div>
            ) : null}

            <form action={signInAction} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">
                Email
                <input className="field mt-2" name="email" type="email" defaultValue="owner@demo-service.co" required />
              </label>
              <label className="block text-sm font-medium">
                Password
                <input className="field mt-2" name="password" type="password" defaultValue="demo-password" required />
              </label>
              <button className="button-primary w-full">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign in
              </button>
            </form>

            <form action={signUpAction} className="mt-8 border-t border-line pt-6">
              <p className="text-sm font-medium">Create first account</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input className="field" name="full_name" placeholder="Full name" required />
                <input className="field" name="email" type="email" placeholder="Email" required />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input className="field" name="business_name" placeholder="Business name" required />
                <input className="field" name="service_category" placeholder="Service category" defaultValue="Home services" required />
              </div>
              <input className="field mt-3" name="password" type="password" placeholder="Password" minLength={8} required />
              <button className="button-secondary mt-3 w-full">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Sign up
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
