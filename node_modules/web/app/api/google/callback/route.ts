import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveGoogleRedirectUri } from "@/lib/google/oauth";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const googleError = url.searchParams.get("error");
    const googleErrorDescription = url.searchParams.get("error_description");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (googleError) {
      return NextResponse.json(
        {
          error: `Google authorization failed: ${
            googleErrorDescription || googleError
          }`,
        },
        { status: 400 }
      );
    }

    if (!code || !state || !clientId || !clientSecret) {
      const missing: string[] = [];
      if (!code) missing.push("code");
      if (!state) missing.push("state");
      if (!clientId) missing.push("GOOGLE_CLIENT_ID");
      if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET");
      return NextResponse.json(
        { error: `Invalid callback. Missing: ${missing.join(", ")}.` },
        { status: 400 }
      );
    }

    let redirectUri: string;
    try {
      redirectUri = resolveGoogleRedirectUri(request.url);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid Google redirect configuration.",
        },
        { status: 500 }
      );
    }

    let admin: ReturnType<typeof createSupabaseAdminClient>;
    try {
      admin = createSupabaseAdminClient();
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to initialize Supabase admin client.",
        },
        { status: 500 }
      );
    }

    const { data: oauthState, error: stateError } = await admin
      .from("oauth_states")
      .select("*")
      .eq("state", state)
      .single();

    if (stateError || !oauthState) {
      return NextResponse.json({ error: "Invalid state." }, { status: 400 });
    }

    if (new Date(oauthState.expires_at).getTime() < Date.now()) {
      await admin.from("oauth_states").delete().eq("state", state);
      return NextResponse.json({ error: "State expired." }, { status: 400 });
    }

    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: oauthState.code_verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      await admin.from("oauth_states").delete().eq("state", state);
      return NextResponse.json(
        { error: `Token exchange failed: ${text}` },
        { status: 400 }
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      scope?: string;
      expires_in?: number;
    };

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const { error: upsertError } = await admin
      .from("google_connections")
      .upsert(
        {
          user_id: oauthState.user_id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token ?? null,
          token_type: tokenData.token_type ?? null,
          scope: tokenData.scope ?? null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 400 });
    }

    await admin.from("oauth_states").delete().eq("state", state);

    return NextResponse.redirect(new URL("/", url.origin));
  } catch (error) {
    console.error("Google callback failed", error);
    return NextResponse.json(
      { error: "Google callback failed." },
      { status: 500 }
    );
  }
}
