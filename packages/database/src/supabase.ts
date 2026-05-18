import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createBrowserSupabaseClient(url: string, anonKey: string) {
  return createClient<Database>(url, anonKey);
}
