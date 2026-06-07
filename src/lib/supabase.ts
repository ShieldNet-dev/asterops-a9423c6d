import { createClient } from "@supabase/supabase-js";

function createBrowserSupabaseClient() {
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);
  const supabasePublishableKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== "undefined"
      ? process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY
      : undefined);

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing backend environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      storage:
        typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let client: ReturnType<typeof createBrowserSupabaseClient> | undefined;

export const supabase = new Proxy(
  {} as ReturnType<typeof createBrowserSupabaseClient>,
  {
    get(_, prop, receiver) {
      if (!client) client = createBrowserSupabaseClient();
      return Reflect.get(client, prop, receiver);
    },
  },
);