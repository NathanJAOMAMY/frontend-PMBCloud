import { createClient } from '@supabase/supabase-js'

// @ts-ignore - Vite provides import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mxbzfekwbvybtxlutkpz.supabase.co'
// @ts-ignore - Vite provides import.meta.env
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14YnpmZWt3YnZ5YnR4bHV0a3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDA5MzgsImV4cCI6MjA2OTk3NjkzOH0.uzpo6Ar5fCylFHcMjoRwWQybMJ3TknzJoSHCGFkmkQs"

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
