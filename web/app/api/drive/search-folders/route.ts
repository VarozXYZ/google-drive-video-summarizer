import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGoogleAccessToken } from "@/lib/google/tokens";

const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";

type DriveFolder = {
  id: string;
  name?: string;
  modifiedTime?: string;
  webViewLink?: string;
};

function escapeDriveQuery(value: string) {
  return value.replace(/'/g, "\\'");
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

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "q is required." }, { status: 400 });
  }

  try {
    const { accessToken } = await getGoogleAccessToken(user.id);
    const escaped = escapeDriveQuery(query);
    const driveQuery = `mimeType='application/vnd.google-apps.folder' and trashed=false and name contains '${escaped}'`;
    const params = new URLSearchParams({
      q: driveQuery,
      fields: "files(id,name,modifiedTime,webViewLink)",
      pageSize: "25",
      includeItemsFromAllDrives: "true",
      supportsAllDrives: "true",
    });

    const response = await fetch(`${DRIVE_FILES_ENDPOINT}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: text }, { status: 400 });
    }

    const payload = (await response.json()) as { files?: DriveFolder[] };
    return NextResponse.json({ data: payload.files || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed." },
      { status: 400 }
    );
  }
}
