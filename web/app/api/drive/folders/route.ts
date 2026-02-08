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

const FOLDER_MIME = "application/vnd.google-apps.folder";
const MAX_FILES = 2000;
const MAX_FOLDERS = 200;

async function listFolderChildren(accessToken: string, folderId: string) {
  let pageToken: string | undefined;
  const files: DriveFile[] = [];

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "nextPageToken,files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink,videoMediaMetadata)",
      pageSize: "200",
      includeItemsFromAllDrives: "true",
      supportsAllDrives: "true",
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(`${DRIVE_FILES_ENDPOINT}?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const payload = (await response.json()) as {
      files?: DriveFile[];
      nextPageToken?: string;
    };

    files.push(...(payload.files || []));
    pageToken = payload.nextPageToken;
  } while (pageToken);

  return files;
}

async function fetchFolderFiles(
  accessToken: string,
  folderId: string,
  recursive = true
) {
  const collected: DriveFile[] = [];
  const queue = [folderId];
  const visited = new Set<string>();

  while (queue.length) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);

    const children = await listFolderChildren(accessToken, currentId);
    for (const item of children) {
      collected.push(item);
      if (recursive && item.mimeType === FOLDER_MIME) {
        if (visited.size < MAX_FOLDERS) {
          queue.push(item.id);
        }
      }
      if (collected.length >= MAX_FILES) {
        return collected;
      }
    }

    if (!recursive) {
      break;
    }
  }

  return collected;
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
  const folderIdsParam = searchParams.get("folderIds");
  const recursive = searchParams.get("recursive") !== "false";

  if (!folderIdsParam) {
    return NextResponse.json({ error: "folderIds is required." }, { status: 400 });
  }

  const folderIds = folderIdsParam
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!folderIds.length) {
    return NextResponse.json({ error: "No folder IDs supplied." }, { status: 400 });
  }

  try {
    const { accessToken } = await getGoogleAccessToken(user.id);
    const filesByFolder = await Promise.all(
      folderIds.map((folderId) =>
        fetchFolderFiles(accessToken, folderId, recursive).catch(() => [])
      )
    );

    const files = filesByFolder.flat();
    const seen = new Set<string>();
    const uniqueFiles = files.filter((file) => {
      if (seen.has(file.id)) return false;
      seen.add(file.id);
      return true;
    });

    const nonFolderFiles = uniqueFiles.filter(
      (file) => file.mimeType !== FOLDER_MIME
    );
    const videos = nonFolderFiles.filter((file) =>
      file.mimeType?.startsWith("video/")
    );
    const docs = nonFolderFiles.filter(
      (file) => !file.mimeType?.startsWith("video/")
    );

    return NextResponse.json({ data: { files: docs, videos } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Drive fetch failed." },
      { status: 400 }
    );
  }
}
