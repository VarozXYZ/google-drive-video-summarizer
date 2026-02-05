import { NextResponse } from "next/server";
import crypto from "crypto";
import { resolveGoogleRedirectUri } from "@/lib/google/oauth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const runtime = "nodejs";

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createCodeVerifier() {
  return base64UrlEncode(crypto.randomBytes(32));
}

function createCodeChallenge(verifier: string) {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return base64UrlEncode(hash);
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
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

  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth is not configured." },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: stateError } = await supabase.from("oauth_states").insert({
    state,
    user_id: user.id,
    code_verifier: codeVerifier,
    expires_at: expiresAt,
  });

  if (stateError) {
    return NextResponse.json({ error: stateError.message }, { status: 400 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    scope: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
    ].join(" "),
    state,
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params}`);
}
