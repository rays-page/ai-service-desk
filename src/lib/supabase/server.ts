import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr/dist/main/types";
import { hasSupabaseEnv } from "@/lib/env";
import { AppConfigError } from "@/lib/errors";

export async function createServerSupabaseClient() {
  if (!hasSupabaseEnv) {
    throw new AppConfigError("Supabase environment variables are not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server components cannot always mutate cookies. Route handlers and
            // server actions will still write refreshed auth cookies correctly.
          }
        }
      }
    }
  );
}
