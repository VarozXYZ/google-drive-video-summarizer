import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getEnv() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return { url, anonKey };
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = getEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

export async function createSupabaseServerComponentClient() {
  const { url, anonKey } = getEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server Components cannot set cookies; no-op to avoid runtime error.
      },
    },
  });
}
