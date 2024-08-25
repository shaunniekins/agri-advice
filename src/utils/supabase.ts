// src/utils/supabase.ts
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase Problem!");

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
