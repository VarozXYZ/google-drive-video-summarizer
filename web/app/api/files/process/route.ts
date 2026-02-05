import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const fileId = typeof payload?.fileId === "string" ? payload.fileId : "";

  if (!fileId) {
    return NextResponse.json({ error: "fileId is required." }, { status: 400 });
  }

  const { data: fileRow, error: fileError } = await supabase
    .from("files")
    .select("id,status")
    .eq("id", fileId)
    .eq("user_id", user.id)
    .single();

  if (fileError || !fileRow) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  if (fileRow.status === "queued" || fileRow.status === "processing") {
    return NextResponse.json({ data: fileRow });
  }

  const { error: jobError } = await supabase.from("file_jobs").insert({
    file_id: fileRow.id,
    user_id: user.id,
    status: "queued",
  });

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 400 });
  }

  const { data: updatedFile, error: updateError } = await supabase
    .from("files")
    .update({ status: "queued" })
    .eq("id", fileRow.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ data: updatedFile }, { status: 201 });
}
