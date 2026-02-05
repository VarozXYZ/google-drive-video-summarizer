import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function extractDriveId(url: string) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match?.[1]) return match[1];

  const idParam = new URL(url).searchParams.get("id");
  if (idParam) return idParam;

  return null;
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
  const unitId = searchParams.get("unitId");

  if (!unitId) {
    return NextResponse.json({ error: "unitId is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("unit_id", unitId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const unitId = typeof payload?.unitId === "string" ? payload.unitId : null;
  const videoUrl = typeof payload?.url === "string" ? payload.url : null;

  if (!unitId || !videoUrl) {
    return NextResponse.json(
      { error: "unitId and url are required." },
      { status: 400 }
    );
  }

  let driveId: string | null = null;
  try {
    driveId = extractDriveId(videoUrl);
  } catch {
    driveId = null;
  }

  if (!driveId) {
    return NextResponse.json(
      { error: "Could not extract Drive file ID." },
      { status: 400 }
    );
  }

  const { data: videoRow, error: videoError } = await supabase
    .from("videos")
    .insert({
      unit_id: unitId,
      user_id: user.id,
      drive_id: driveId,
      source_url: videoUrl,
      status: "queued",
    })
    .select()
    .single();

  if (videoError || !videoRow) {
    return NextResponse.json(
      { error: videoError?.message || "Video insert failed." },
      { status: 400 }
    );
  }

  const { error: jobError } = await supabase.from("video_jobs").insert({
    video_id: videoRow.id,
    user_id: user.id,
    status: "queued",
  });

  if (jobError) {
    await supabase
      .from("videos")
      .update({ status: "failed" })
      .eq("id", videoRow.id);
    return NextResponse.json({ error: jobError.message }, { status: 400 });
  }

  return NextResponse.json({ data: videoRow }, { status: 201 });
}
