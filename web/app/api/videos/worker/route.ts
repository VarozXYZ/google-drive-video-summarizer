import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";

type JobRow = {
  id: string;
  video_id: string;
};

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: connection, error: connectionError } = await supabase
    .from("google_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (connectionError || !connection?.access_token) {
    return NextResponse.json(
      { error: "Google Drive not connected." },
      { status: 400 }
    );
  }

  const { data: jobs, error: jobError } = await supabase
    .from("video_jobs")
    .select("id,video_id")
    .eq("user_id", user.id)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1);

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 400 });
  }

  const job = jobs?.[0] as JobRow | undefined;
  if (!job) {
    return NextResponse.json({ data: null, message: "No queued jobs." });
  }

  const { data: videoRow, error: videoError } = await supabase
    .from("videos")
    .select("id,drive_id")
    .eq("id", job.video_id)
    .single();

  if (videoError || !videoRow?.drive_id) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  await supabase
    .from("video_jobs")
    .update({ status: "processing", error_message: null })
    .eq("id", job.id);

  await supabase
    .from("videos")
    .update({ status: "processing" })
    .eq("id", videoRow.id);

  const metaResponse = await fetch(
    `${DRIVE_FILES_ENDPOINT}/${videoRow.drive_id}?fields=id,name,mimeType,size`,
    {
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
      },
    }
  );

  if (!metaResponse.ok) {
    const text = await metaResponse.text();
    await supabase
      .from("video_jobs")
      .update({ status: "failed", error_message: text })
      .eq("id", job.id);
    await supabase
      .from("videos")
      .update({ status: "failed" })
      .eq("id", videoRow.id);
    return NextResponse.json({ error: text }, { status: 400 });
  }

  const metadata = (await metaResponse.json()) as {
    name?: string;
    mimeType?: string;
    size?: string;
  };

  await supabase
    .from("videos")
    .update({
      title: metadata.name ?? null,
      status: "metadata_ready",
    })
    .eq("id", videoRow.id);

  await supabase
    .from("video_jobs")
    .update({
      status: "done",
      error_message: null,
      stats: metadata,
    })
    .eq("id", job.id);

  return NextResponse.json({ data: { video_id: videoRow.id, metadata } });
}
