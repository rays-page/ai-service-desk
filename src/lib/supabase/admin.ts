import "server-only";

import { createClient } from "@supabase/supabase-js";
import { hasSupabaseAdminEnv } from "@/lib/env";

export function createAdminSupabaseClient() {
  if (!hasSupabaseAdminEnv) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
