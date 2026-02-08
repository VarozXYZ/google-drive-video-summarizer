import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGoogleAccessToken } from "@/lib/google/tokens";

const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";

type DriveFile = {
  id: string;
  name?: string;
  mimeType?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  videoMediaMetadata?: {
    durationMillis?: string;
  };
};

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
  const folderId = searchParams.get("folderId");

  if (!folderId) {
    return NextResponse.json({ error: "folderId is required." }, { status: 400 });
  }

  try {
    const { accessToken } = await getGoogleAccessToken(user.id);
    const query = `'${folderId}' in parents and trashed = false`;
    const params = new URLSearchParams({
      q: query,
      fields:
        "files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink,videoMediaMetadata)",
      pageSize: "200",
      includeItemsFromAllDrives: "true",
      supportsAllDrives: "true",
    });

    const response = await fetch(`${DRIVE_FILES_ENDPOINT}?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: text }, { status: 400 });
    }

    const payload = (await response.json()) as { files?: DriveFile[] };
    const files = payload.files || [];
    const videos = files.filter((file) =>
      file.mimeType?.startsWith("video/")
    );
    const docs = files.filter((file) => !file.mimeType?.startsWith("video/"));

    return NextResponse.json({ data: { files: docs, videos } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Drive fetch failed." },
      { status: 400 }
    );
  }
}
