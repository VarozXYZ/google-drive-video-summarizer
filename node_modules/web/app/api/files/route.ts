import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bucketName = process.env.SUPABASE_BUCKET_NAME;

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
    .from("files")
    .select("*")
    .eq("unit_id", unitId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  if (!bucketName) {
    return NextResponse.json(
      { error: "Storage bucket is not configured." },
      { status: 500 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const unitId = formData.get("unitId");
  const file = formData.get("file");

  if (typeof unitId !== "string" || !unitId.trim()) {
    return NextResponse.json({ error: "unitId is required." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required." }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const filePath = `${user.id}/${unitId}/${Date.now()}-${safeName}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: storageError } = await admin.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (storageError) {
    return NextResponse.json(
      { error: storageError.message },
      { status: 400 }
    );
  }

  const { data: fileRow, error: fileError } = await supabase
    .from("files")
    .insert({
      unit_id: unitId,
      user_id: user.id,
      name: file.name,
      mime: file.type || "application/octet-stream",
      storage_path: filePath,
      status: "queued",
    })
    .select()
    .single();

  if (fileError || !fileRow) {
    await admin.storage.from(bucketName).remove([filePath]);
    return NextResponse.json(
      { error: fileError?.message || "File record failed." },
      { status: 400 }
    );
  }

  const { error: jobError } = await supabase.from("file_jobs").insert({
    file_id: fileRow.id,
    user_id: user.id,
    status: "queued",
  });

  if (jobError) {
    await supabase
      .from("files")
      .update({ status: "failed" })
      .eq("id", fileRow.id);
    return NextResponse.json({ error: jobError.message }, { status: 400 });
  }

  return NextResponse.json({ data: fileRow }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!bucketName) {
    return NextResponse.json(
      { error: "Storage bucket is not configured." },
      { status: 500 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json({ error: "fileId is required." }, { status: 400 });
  }

  const { data: fileRow, error: fileError } = await supabase
    .from("files")
    .select("id,storage_path,user_id")
    .eq("id", fileId)
    .eq("user_id", user.id)
    .single();

  if (fileError || !fileRow) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const { error: storageError } = await admin.storage
    .from(bucketName)
    .remove([fileRow.storage_path]);

  if (storageError) {
    return NextResponse.json(
      { error: storageError.message },
      { status: 400 }
    );
  }

  const { error: deleteError } = await supabase
    .from("files")
    .delete()
    .eq("id", fileRow.id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ data: { id: fileRow.id } });
}
