"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Subject = {
  id: string;
  name: string;
  created_at: string;
};

type Unit = {
  id: string;
  name: string;
  subject_id: string;
  created_at: string;
};

type FileRecord = {
  id: string;
  name: string;
  status: string;
  unit_id: string;
  created_at: string;
};

export default function SubjectsPanel() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const workerActiveRef = useRef(false);

  useEffect(() => {
    let active = true;
    const loadSubjects = async () => {
      setError(null);
      const response = await fetch("/api/subjects", {
        credentials: "include",
      });
      if (!response.ok) {
        if (active) {
          setError("Could not load subjects.");
        }
        return;
      }
      const json = (await response.json()) as { data: Subject[] };
      if (!active) return;
      setSubjects(json.data || []);
      if (!selectedSubjectId && json.data?.length) {
        setSelectedSubjectId(json.data[0].id);
      }
    };
    loadSubjects();
    return () => {
      active = false;
    };
  }, [selectedSubjectId]);

  useEffect(() => {
    if (!selectedSubjectId) {
      setUnits([]);
      return;
    }
    let active = true;
    const loadUnits = async () => {
      setError(null);
      const response = await fetch(`/api/units?subjectId=${selectedSubjectId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (active) {
          setError("Could not load units.");
        }
        return;
      }
      const json = (await response.json()) as { data: Unit[] };
      if (!active) return;
      const nextUnits = json.data || [];
      setUnits(nextUnits);
      if (!selectedUnitId && nextUnits.length) {
        setSelectedUnitId(nextUnits[0].id);
      }
    };
    loadUnits();
    return () => {
      active = false;
    };
  }, [selectedSubjectId, selectedUnitId]);

  useEffect(() => {
    if (!selectedUnitId) {
      setFiles([]);
      return;
    }
    let active = true;
    const loadFiles = async () => {
      setError(null);
      const response = await fetch(`/api/files?unitId=${selectedUnitId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (active) {
          setError("Could not load files.");
        }
        return;
      }
      const json = (await response.json()) as { data: FileRecord[] };
      if (!active) return;
      setFiles(json.data || []);
    };
    loadFiles();
    return () => {
      active = false;
    };
  }, [selectedUnitId]);

  const onCreateSubject = () => {
    const name = subjectName.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        setError("Could not create subject.");
        return;
      }
      const json = (await response.json()) as { data: Subject };
      setSubjects((prev) => [json.data, ...prev]);
      setSelectedSubjectId(json.data.id);
      setSubjectName("");
    });
  };

  const onCreateUnit = () => {
    const name = unitName.trim();
    if (!name || !selectedSubjectId) return;
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, subjectId: selectedSubjectId }),
      });
      if (!response.ok) {
        setError("Could not create unit.");
        return;
      }
      const json = (await response.json()) as { data: Unit };
      setUnits((prev) => [json.data, ...prev]);
      setUnitName("");
    });
  };

  const onUploadFiles = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!selectedUnitId) return;
    const fileList = Array.from(event.target.files || []);
    if (!fileList.length) return;

    setIsUploading(true);
    setError(null);
    try {
      for (const file of fileList) {
        const formData = new FormData();
        formData.append("unitId", selectedUnitId);
        formData.append("file", file);

        const response = await fetch("/api/files", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!response.ok) {
          throw new Error("Upload failed.");
        }
        const json = (await response.json()) as { data: FileRecord };
        setFiles((prev) => [json.data, ...prev]);
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed."
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const processNextQueued = async (fileId: string) => {
    const response = await fetch("/api/files/worker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fileId }),
    });
    if (!response.ok) {
      setError("Worker failed.");
      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, status: "failed" } : file
        )
      );
      return;
    }
    const json = (await response.json()) as { data?: { file?: FileRecord } };
    if (json?.data?.file) {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === json.data?.file?.id ? json.data.file : file
        )
      );
    }
  };

  const onQuickSignOut = () => {
    setError(null);
    startTransition(async () => {
      await supabase.auth.signOut();
      window.location.reload();
    });
  };

  useEffect(() => {
    if (!selectedUnitId) return;
    const nextQueued = files.find((file) => file.status === "queued");
    if (!nextQueued || workerActiveRef.current) return;

    workerActiveRef.current = true;
    processNextQueued(nextQueued.id).finally(() => {
      workerActiveRef.current = false;
    });
  }, [files, selectedUnitId]);

  return (
    <div className="rounded-3xl border border-orange-100 bg-white/80 p-6 shadow-[0_26px_70px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-500">
            Workspace
          </p>
          <h3 className="mt-2 font-[var(--font-display)] text-2xl text-[#1c1b16]">
            Subjects & units
          </h3>
        </div>
        <button
          type="button"
          onClick={onQuickSignOut}
          className="rounded-full border border-orange-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-500 transition hover:-translate-y-0.5 hover:bg-orange-50"
        >
          Sign out
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a6f62]">
            Create subject
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder="e.g. Data Structures"
              className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-2 text-sm text-[#3e352a] outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-[var(--ring)]"
            />
            <button
              type="button"
              disabled={!subjectName.trim() || isPending}
              onClick={onCreateSubject}
              className="rounded-2xl bg-[#1c1b16] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a6f62]">
            Subjects
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {subjects.length === 0 && (
              <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs text-[#6b5f52]">
                No subjects yet
              </span>
            )}
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  selectedSubjectId === subject.id
                    ? "border-[#1c1b16] bg-[#1c1b16] text-white shadow-[0_8px_20px_-14px_rgba(0,0,0,0.6)]"
                    : "border-orange-100 bg-white text-[#5b5247] hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedSubjectId(subject.id)}
                  className="flex-1 text-left"
                >
                  {subject.name}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${subject.name}`}
                  onClick={async () => {
                    setError(null);
                    const response = await fetch(
                      `/api/subjects?subjectId=${subject.id}`,
                      { method: "DELETE", credentials: "include" }
                    );
                    if (!response.ok) {
                      setError("Could not delete subject.");
                      return;
                    }
                    setSubjects((prev) =>
                      prev.filter((item) => item.id !== subject.id)
                    );
                    if (selectedSubjectId === subject.id) {
                      setSelectedSubjectId(null);
                      setSelectedUnitId(null);
                    }
                  }}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                    selectedSubjectId === subject.id
                      ? "border border-white/30 text-white/70 hover:text-white"
                      : "border border-orange-200 text-orange-500 hover:bg-orange-50"
                  }`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a6f62]">
            Create unit
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={unitName}
              onChange={(event) => setUnitName(event.target.value)}
              placeholder="e.g. Linked Lists"
              className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-2 text-sm text-[#3e352a] outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-[var(--ring)]"
            />
            <button
              type="button"
              disabled={!unitName.trim() || isPending || !selectedSubjectId}
              onClick={onCreateUnit}
              className="rounded-2xl bg-[#1c1b16] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a6f62]">
            Units in selected subject
          </label>
          <div className="mt-2 grid gap-2">
            {units.length === 0 && (
              <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs text-[#6b5f52]">
                No units yet for this subject.
              </div>
            )}
            {units.map((unit) => (
              <div
                key={unit.id}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                  selectedUnitId === unit.id
                    ? "border-[#1c1b16] bg-[#1c1b16] text-white shadow-[0_10px_28px_-18px_rgba(0,0,0,0.6)]"
                    : "border-orange-100 bg-white text-[#4d4439] hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedUnitId(unit.id)}
                  className="flex-1 text-left"
                >
                  {unit.name}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${unit.name}`}
                  onClick={async () => {
                    setError(null);
                    const response = await fetch(
                      `/api/units?unitId=${unit.id}`,
                      { method: "DELETE", credentials: "include" }
                    );
                    if (!response.ok) {
                      setError("Could not delete unit.");
                      return;
                    }
                    setUnits((prev) =>
                      prev.filter((item) => item.id !== unit.id)
                    );
                    if (selectedUnitId === unit.id) {
                      setSelectedUnitId(null);
                    }
                  }}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                    selectedUnitId === unit.id
                      ? "border border-white/30 text-white/70 hover:text-white"
                      : "border border-orange-200 text-orange-500 hover:bg-orange-50"
                  }`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a6f62]">
            Upload files
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 px-4 py-4">
            <input
              type="file"
              multiple
              disabled={!selectedUnitId || isUploading}
              onChange={onUploadFiles}
              className="w-full text-xs text-[#4d4439] file:mr-4 file:rounded-full file:border-0 file:bg-[#1c1b16] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white file:transition file:hover:bg-[#2b241c] disabled:cursor-not-allowed"
            />
            {isUploading && (
              <span className="text-xs text-orange-500">Uploading...</span>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a6f62]">
            Files in unit
          </label>
          <p className="mt-2 text-xs text-[#7a6f62]">
            Processing happens automatically when files are uploaded.
          </p>
          <div className="mt-2 grid gap-2">
            {files.length === 0 && (
              <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs text-[#6b5f52]">
                No files uploaded yet.
              </div>
            )}
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-[#4d4439]"
              >
                <span className="truncate">{file.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-orange-400">{file.status}</span>
                  <button
                    type="button"
                    disabled={isPending || file.status === "processing"}
                    onClick={async () => {
                      setError(null);
                      const response = await fetch(
                        `/api/files?fileId=${file.id}`,
                        {
                          method: "DELETE",
                          credentials: "include",
                        }
                      );
                      if (!response.ok) {
                        setError("Could not delete file.");
                        return;
                      }
                      setFiles((prev) =>
                        prev.filter((item) => item.id !== file.id)
                      );
                    }}
                    className="rounded-full border border-red-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500 transition hover:-translate-y-0.5 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
