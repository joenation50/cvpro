import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Safe to use in client components ("use client").
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton for convenience
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
