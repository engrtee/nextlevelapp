import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabaseConfigMissing = !supabaseUrl || !supabaseAnonKey;

if (supabaseConfigMissing) {
  // eslint-disable-next-line no-console
  console.error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Locally: copy web/.env.example to " +
      "web/.env.local. On Netlify/Vercel: set them as build environment variables and redeploy " +
      "- Vite bakes them in at build time, so adding them after a deploy requires a new build.",
  );
}

// Placeholder values let the client construct without throwing so the app can render a real
// error screen (see App.tsx) instead of a blank page when config is missing.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
);
