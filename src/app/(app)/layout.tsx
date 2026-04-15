import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { getWorkspaceData } from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isDemoMode) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }
  }

  const workspace = await getWorkspaceData();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
      <div className="md:sticky md:top-0 md:h-screen">
        <AppSidebar businessName={workspace.business.name} demoMode={isDemoMode} />
      </div>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
