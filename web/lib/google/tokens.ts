import { createSupabaseServerClient } from "@/lib/supabase/server";

type GoogleConnectionRow = {
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_type: string | null;
  scope: string | null;
  expires_at: string | null;
};

type GoogleTokenResult = {
  accessToken: string;
  connection: GoogleConnectionRow;
};

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const EXPIRY_BUFFER_MS = 60_000;

export async function getGoogleAccessToken(
  userId: string
): Promise<GoogleTokenResult> {
  const supabase = await createSupabaseServerClient();

  const { data: connection, error } = await supabase
    .from("google_connections")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !connection?.access_token) {
    throw new Error("Google Drive not connected.");
  }

  const expiresAt = connection.expires_at
    ? new Date(connection.expires_at).getTime()
    : null;

  const shouldRefresh =
    expiresAt !== null && expiresAt - Date.now() <= EXPIRY_BUFFER_MS;

  if (!shouldRefresh) {
    return { accessToken: connection.access_token, connection };
  }

  if (!connection.refresh_token) {
    throw new Error("Google connection expired. Please reconnect.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured.");
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to refresh Google token: ${text}`);
  }

  const refreshed = (await response.json()) as {
    access_token: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  const nextExpiresAt = refreshed.expires_in
    ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
    : null;

  const { error: updateError } = await supabase
    .from("google_connections")
    .update({
      access_token: refreshed.access_token,
      scope: refreshed.scope ?? connection.scope,
      token_type: refreshed.token_type ?? connection.token_type,
      expires_at: nextExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    accessToken: refreshed.access_token,
    connection: {
      ...connection,
      access_token: refreshed.access_token,
      scope: refreshed.scope ?? connection.scope,
      token_type: refreshed.token_type ?? connection.token_type,
      expires_at: nextExpiresAt,
    },
  };
}
