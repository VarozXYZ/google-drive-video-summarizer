import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGoogleAccessToken } from "@/lib/google/tokens";

const CLASSROOM_BASE = "https://classroom.googleapis.com/v1";
const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";

type DriveMaterial = {
  driveFile?: {
    driveFile?: {
      id?: string;
      title?: string;
      alternateLink?: string;
    };
  };
};

type ClassroomCourseWork = {
  materials?: DriveMaterial[];
};

type ClassroomMaterialResponse = {
  courseWorkMaterials?: ClassroomCourseWork[];
  nextPageToken?: string;
};

type ClassroomCourseWorkResponse = {
  courseWork?: ClassroomCourseWork[];
  nextPageToken?: string;
};

async function listCourseWorkMaterials(accessToken: string, courseId: string) {
  const materials: ClassroomCourseWork[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      pageSize: "100",
      fields: "nextPageToken,courseWorkMaterials(materials)",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await fetch(
      `${CLASSROOM_BASE}/courses/${courseId}/courseWorkMaterials?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to fetch course materials.");
    }

    const payload = (await response.json()) as ClassroomMaterialResponse;
    materials.push(...(payload.courseWorkMaterials || []));
    pageToken = payload.nextPageToken;
  } while (pageToken);

  return materials;
}

async function listCourseWork(accessToken: string, courseId: string) {
  const work: ClassroomCourseWork[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      pageSize: "100",
      fields: "nextPageToken,courseWork(materials)",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await fetch(
      `${CLASSROOM_BASE}/courses/${courseId}/courseWork?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to fetch coursework.");
    }

    const payload = (await response.json()) as ClassroomCourseWorkResponse;
    work.push(...(payload.courseWork || []));
    pageToken = payload.nextPageToken;
  } while (pageToken);

  return work;
}

function extractDriveFileIds(items: ClassroomCourseWork[]) {
  const ids = new Set<string>();

  for (const item of items) {
    for (const material of item.materials || []) {
      const id = material.driveFile?.driveFile?.id;
      if (id) ids.add(id);
    }
  }

  return Array.from(ids);
}

async function fetchParents(accessToken: string, fileId: string) {
  const params = new URLSearchParams({
    fields: "parents",
    supportsAllDrives: "true",
  });

  const response = await fetch(`${DRIVE_FILES_ENDPOINT}/${fileId}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { parents?: string[] };
  return payload.parents || [];
}

async function fetchFolderMeta(accessToken: string, folderId: string) {
  const params = new URLSearchParams({
    fields: "id,name,modifiedTime,webViewLink",
    supportsAllDrives: "true",
  });
  const response = await fetch(`${DRIVE_FILES_ENDPOINT}/${folderId}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;
  return (await response.json()) as {
    id: string;
    name?: string;
    modifiedTime?: string;
    webViewLink?: string;
  };
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
  const subjectId = searchParams.get("subjectId");

  if (!subjectId) {
    return NextResponse.json({ error: "subjectId is required." }, { status: 400 });
  }

  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .select("id,classroom_id")
    .eq("id", subjectId)
    .single();

  if (subjectError || !subject?.classroom_id) {
    return NextResponse.json(
      { error: "Subject not found or missing classroom id." },
      { status: 400 }
    );
  }

  try {
    const { accessToken } = await getGoogleAccessToken(user.id);

    const materials = await listCourseWorkMaterials(
      accessToken,
      subject.classroom_id
    );

    let courseWork: ClassroomCourseWork[] = [];
    try {
      courseWork = await listCourseWork(accessToken, subject.classroom_id);
    } catch {
      courseWork = [];
    }

    const fileIds = [
      ...extractDriveFileIds(materials),
      ...extractDriveFileIds(courseWork),
    ];

    const uniqueFileIds = Array.from(new Set(fileIds)).slice(0, 50);
    if (!uniqueFileIds.length) {
      return NextResponse.json({ data: { folders: [], fileCount: 0 } });
    }

    const folderCounts = new Map<string, number>();
    for (const fileId of uniqueFileIds) {
      const parents = await fetchParents(accessToken, fileId);
      for (const parentId of parents) {
        folderCounts.set(parentId, (folderCounts.get(parentId) || 0) + 1);
      }
    }

    const topFolders = Array.from(folderCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const folders = await Promise.all(
      topFolders.map(async ([folderId, count]) => {
        const meta = await fetchFolderMeta(accessToken, folderId);
        return {
          id: folderId,
          name: meta?.name || "Untitled folder",
          webViewLink: meta?.webViewLink || null,
          count,
        };
      })
    );

    return NextResponse.json({
      data: {
        folders,
        fileCount: uniqueFileIds.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Suggestion failed." },
      { status: 400 }
    );
  }
}
