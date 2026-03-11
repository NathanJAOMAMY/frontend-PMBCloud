import { createClient } from '@supabase/supabase-js'

// @ts-ignore - Vite provides import.meta.env
// Choose supabase configuration from environment or fall back for local dev
// (the fallback should **not** be used in production; Render must supply the env vars)
// @ts-ignore - Vite provides import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''; // intentionally empty
// @ts-ignore - Vite provides import.meta.env
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  // environment variables must be provided at build time (Render, Vite, etc.)
  // throw instead of silently creating a bad client; the app will crash early
  const msg = '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY environment variable';
  console.error(msg);
  throw new Error(msg);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction utilitaire pour vérifier la connectivité Supabase
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    return !error;
  } catch (error) {
    console.warn('[Supabase] Connection check failed:', error);
    return false;
  }
};
