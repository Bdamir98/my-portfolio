"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Create a singleton Supabase client for admin operations.
// We use the service role key if available to bypass RLS for incrementing views.
// If it's not available, it safely falls back to the public anon key.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseKey);

export async function incrementProjectView(projectId: string) {
  try {
    // 1. Fetch current view count
    const { data, error } = await supabase
      .from("projects")
      .select("view_count")
      .eq("id", projectId)
      .single();

    if (error || !data) {
      return;
    }

    // 2. Increment by 1
    await supabase
      .from("projects")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", projectId);
      
  } catch (err) {
    console.error("Failed to increment view count", err);
  }
}
