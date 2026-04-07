import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

const customFetch: typeof fetch = async (url, options) => {
  const MAX_RETRIES = 3;
  let lastError: any;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        // Standard timeout for undici/node fetch if applicable, 
        // but browser fetch depends on network.
      });
      return response;
    } catch (err) {
      lastError = err;
      if (i < MAX_RETRIES - 1) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        console.warn(`Supabase fetch failed (attempt ${i + 1}/${MAX_RETRIES}). Retrying...`);
      }
    }
  }
  throw lastError;
};

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: customFetch,
      },
    }
  );
}

