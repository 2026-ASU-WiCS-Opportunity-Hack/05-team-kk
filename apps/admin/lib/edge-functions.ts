import type { createClient } from "@repo/supabase/client";

type BrowserSupabaseClient = ReturnType<typeof createClient>;

export async function getFreshAccessToken(
  supabase: BrowserSupabaseClient
): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isSessionValid =
    !!session?.access_token &&
    (!session.expires_at || session.expires_at * 1000 > Date.now() + 60_000);

  if (isSessionValid) {
    return session!.access_token;
  }

  const { data, error } = await supabase.auth.refreshSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}

export async function invokeEdgeFunctionWithAuth<TData = any>(
  supabase: BrowserSupabaseClient,
  functionName: string,
  body?: Record<string, unknown>
) {
  const accessToken = await getFreshAccessToken(supabase);
  if (!accessToken) {
    return {
      data: null,
      error: new Error("Session expired. Please sign in again."),
    };
  }

  return supabase.functions.invoke<TData>(functionName, {
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
