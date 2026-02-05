import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const bucketName = process.env.SUPABASE_BUCKET_NAME;

type FileRow = {
  id: string;
  name: string;
  mime: string;
  storage_path: string;
  status: string;
  user_id: string;
};

type JobRow = {
  id: string;
  file_id: string;
  status: string;
  error_message: string | null;
};

function isTextMime(mime: string) {
  return (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/xml" ||
    mime === "application/csv" ||
    mime === "text/csv"
  );
}

function isZipMime(mime: string) {
  return (
    mime === "application/zip" ||
    mime === "application/x-zip-compressed" ||
    mime === "multipart/x-zip"
  );
}

const ZIP_BINARY_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".ico",
  ".svgz",
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".bz2",
  ".xz",
  ".mp3",
  ".wav",
  ".ogg",
  ".flac",
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".webm",
  ".exe",
  ".dll",
  ".bin",
  ".dmg",
  ".iso",
  ".class",
  ".jar",
  ".wasm",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
]);

const ZIP_IGNORE_FOLDERS = [
  "node_modules/",
  ".git/",
  ".next/",
  "dist/",
  "build/",
  "out/",
  "coverage/",
  ".cache/",
  ".turbo/",
  ".vercel/",
  "vendor/",
  ".idea/",
  ".vscode/",
];

const ZIP_IGNORE_FILES = new Set([
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "package-lock.json",
]);

const MAX_BYTES_PER_FILE = 1_000_000;
const MAX_BYTES_TOTAL = 5_000_000;

function hasBinaryExtension(pathname: string) {
  const lower = pathname.toLowerCase();
  for (const ext of ZIP_BINARY_EXTENSIONS) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}

function looksLikeText(buffer: Buffer) {
  if (!buffer || buffer.length === 0) return false;
  const sampleSize = Math.min(buffer.length, 8000);
  let nullCount = 0;
  for (let i = 0; i < sampleSize; i += 1) {
    if (buffer[i] === 0) nullCount += 1;
  }
  return nullCount / sampleSize < 0.01;
}

function shouldIgnorePath(pathname: string) {
  const normalized = pathname.replace(/\\/g, "/").toLowerCase();
  return ZIP_IGNORE_FOLDERS.some((folder) =>
    normalized.includes(`/${folder}`)
  ) || ZIP_IGNORE_FOLDERS.some((folder) => normalized.startsWith(folder));
}

type ZipStats = {
  scanned: number;
  included: number;
  skipped: number;
  skipped_noisy: number;
  skipped_extension: number;
  skipped_lockfile: number;
  skipped_size: number;
  skipped_total_limit: number;
};

function extractZipEntries(buffer: Buffer) {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const files: Array<{ name: string; content: string }> = [];
  let totalBytes = 0;
  let hasPackageJson = false;
  const stats: ZipStats = {
    scanned: 0,
    included: 0,
    skipped: 0,
    skipped_noisy: 0,
    skipped_extension: 0,
    skipped_lockfile: 0,
    skipped_size: 0,
    skipped_total_limit: 0,
  };

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const entryName = entry.entryName.replace(/\\/g, "/");
    if (entryName.toLowerCase().endsWith("package.json")) {
      hasPackageJson = true;
    }
  }

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    stats.scanned += 1;
    const entryName = entry.entryName.replace(/\\/g, "/");
    const entryLower = entryName.toLowerCase();
    if (shouldIgnorePath(entryName)) {
      stats.skipped += 1;
      stats.skipped_noisy += 1;
      continue;
    }
    const baseName = entryLower.split("/").pop() || entryLower;
    if (hasPackageJson && baseName === "package-lock.json") {
      stats.skipped += 1;
      stats.skipped_lockfile += 1;
      continue;
    }
    if (ZIP_IGNORE_FILES.has(baseName)) {
      stats.skipped += 1;
      stats.skipped_lockfile += 1;
      continue;
    }

    if (hasBinaryExtension(entryLower)) {
      stats.skipped += 1;
      stats.skipped_extension += 1;
      continue;
    }

    const data = entry.getData();
    if (!data || data.length === 0) continue;
    if (data.length > MAX_BYTES_PER_FILE) {
      stats.skipped += 1;
      stats.skipped_size += 1;
      continue;
    }
    if (totalBytes + data.length > MAX_BYTES_TOTAL) {
      stats.skipped += 1;
      stats.skipped_total_limit += 1;
      break;
    }
    if (!looksLikeText(data)) {
      stats.skipped += 1;
      stats.skipped_extension += 1;
      continue;
    }

    const content = data.toString("utf-8").trim();
    if (!content) continue;
    totalBytes += data.length;
    stats.included += 1;
    files.push({ name: entryName, content });
  }

  return { files, stats };
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

  const payload = await request.json().catch(() => null);
  const fileId = typeof payload?.fileId === "string" ? payload.fileId : null;

  let jobQuery = supabase
    .from("file_jobs")
    .select("id,file_id,status,error_message")
    .eq("user_id", user.id)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1);

  if (fileId) {
    jobQuery = jobQuery.eq("file_id", fileId);
  }

  const { data: jobs, error: jobError } = await jobQuery;
  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 400 });
  }

  const job = jobs?.[0] as JobRow | undefined;
  if (!job) {
    return NextResponse.json({ data: null, message: "No queued jobs." });
  }

  const { data: fileRow, error: fileError } = await supabase
    .from("files")
    .select("id,name,mime,storage_path,status,user_id")
    .eq("id", job.file_id)
    .single();

  if (fileError || !fileRow) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const { error: updateJobError } = await supabase
    .from("file_jobs")
    .update({ status: "processing", error_message: null })
    .eq("id", job.id);

  if (updateJobError) {
    return NextResponse.json({ error: updateJobError.message }, { status: 400 });
  }

  await supabase
    .from("files")
    .update({ status: "processing" })
    .eq("id", fileRow.id);

  const { data: fileBlob, error: downloadError } = await admin.storage
    .from(bucketName)
    .download(fileRow.storage_path);

  if (downloadError || !fileBlob) {
    await supabase
      .from("file_jobs")
      .update({ status: "failed", error_message: downloadError?.message })
      .eq("id", job.id);
    await supabase
      .from("files")
      .update({ status: "failed" })
      .eq("id", fileRow.id);

    return NextResponse.json(
      { error: downloadError?.message || "Download failed." },
      { status: 400 }
    );
  }

  const arrayBuffer = await fileBlob.arrayBuffer();
  const isZip = isZipMime(fileRow.mime) || fileRow.name.toLowerCase().endsWith(".zip");
  const isText = isTextMime(fileRow.mime);

  if (!isZip && !isText) {
    const message = `Unsupported file type: ${fileRow.mime || "unknown"}`;
    await supabase
      .from("file_jobs")
      .update({ status: "failed", error_message: message })
      .eq("id", job.id);
    await supabase
      .from("files")
      .update({ status: "failed" })
      .eq("id", fileRow.id);

    return NextResponse.json({ error: message }, { status: 415 });
  }

  let extractedText = "";
  let extractedEntries: Array<{ name: string; content: string }> = [];
  let zipStats: ZipStats | null = null;
  if (isZip) {
    const zipResult = extractZipEntries(Buffer.from(arrayBuffer));
    extractedEntries = zipResult.files;
    zipStats = zipResult.stats;
  } else {
    extractedText = Buffer.from(arrayBuffer).toString("utf-8");
  }

  const trimmed = extractedText.trim();

  if (isZip) {
    if (extractedEntries.length === 0) {
      const message = "Zip has no supported text files.";
      await supabase
        .from("file_jobs")
        .update({ status: "failed", error_message: message, stats: zipStats })
        .eq("id", job.id);
      await supabase
        .from("files")
        .update({ status: "failed" })
        .eq("id", fileRow.id);

      return NextResponse.json({ error: message }, { status: 415 });
    }

    const rows = extractedEntries.map((entry) => ({
      file_id: fileRow.id,
      user_id: user.id,
      content: `--- ${entry.name} ---\n${entry.content}`,
    }));

    const { error: insertError } = await supabase
      .from("file_texts")
      .insert(rows);
    if (insertError) {
      await supabase
        .from("file_jobs")
        .update({
          status: "failed",
          error_message: insertError.message,
          stats: zipStats,
        })
        .eq("id", job.id);
      await supabase
        .from("files")
        .update({ status: "failed" })
        .eq("id", fileRow.id);
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }
  } else if (trimmed) {
    await supabase.from("file_texts").insert({
      file_id: fileRow.id,
      user_id: user.id,
      content: trimmed,
    });
  } else {
    const message = isZip
      ? "Zip has no supported text files."
      : "File contained no readable text.";
    await supabase
      .from("file_jobs")
      .update({ status: "failed", error_message: message, stats: zipStats })
      .eq("id", job.id);
    await supabase
      .from("files")
      .update({ status: "failed" })
      .eq("id", fileRow.id);

    return NextResponse.json({ error: message }, { status: 415 });
  }

  await supabase
    .from("file_jobs")
    .update({ status: "done", error_message: null, stats: zipStats })
    .eq("id", job.id);

  const { data: updatedFile } = await supabase
    .from("files")
    .update({ status: "done" })
    .eq("id", fileRow.id)
    .select()
    .single();

  return NextResponse.json({ data: { file: updatedFile } });
}
