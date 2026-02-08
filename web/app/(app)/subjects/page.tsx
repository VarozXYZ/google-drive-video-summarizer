"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Input,
  Tab,
  TabList,
  TabListContainer,
  TabPanel,
  Tabs,
} from "@heroui/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Subject = {
  id: string;
  name: string;
  classroom_id: string | null;
  created_at: string;
};

type DriveFile = {
  id: string;
  name?: string;
  mimeType?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  videoMediaMetadata?: {
    durationMillis?: string;
  };
};

type SubjectDriveFolder = {
  id: string;
  subject_id: string;
  drive_folder_id: string;
  label: string | null;
  source: string;
  created_at: string;
};

const initialRecaps = [
  { title: "Week 4 - Linked Lists", status: "Ready", confidence: "High" },
  { title: "Week 3 - Arrays", status: "Processing", confidence: "Medium" },
];

const initialExamPacks = [
  { title: "Midterm Pack", scope: "Weeks 1-6", status: "Ready" },
  { title: "Quiz Prep", scope: "Weeks 1-3", status: "Needs attention" },
];

type DriveStatus = "loading" | "connected" | "disconnected";

const formatDuration = (durationMillis?: string) => {
  if (!durationMillis) return "Unknown";
  const totalSeconds = Math.max(0, Math.round(Number(durationMillis) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  parts.push(`${minutes || 0}m`);
  return parts.join(" ");
};

const formatDate = (iso?: string) => {
  if (!iso) return "Unknown date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const parseDurationInMinutes = (duration: string) => {
  const hourMatch = duration.match(/(\d+)\s*h/);
  const minuteMatch = duration.match(/(\d+)\s*m/);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  return hours * 60 + minutes;
};

const parseDriveFolderId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const folderMatch = url.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch?.[1]) return folderMatch[1];
    const idParam = url.searchParams.get("id");
    if (idParam) return idParam;
  } catch {
    return null;
  }

  return null;
};

export default function SubjectsPage() {
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
  const [newSubject, setNewSubject] = useState("");
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveVideos, setDriveVideos] = useState<DriveFile[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [linkedFolders, setLinkedFolders] = useState<SubjectDriveFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [foldersError, setFoldersError] = useState<string | null>(null);
  const [folderInput, setFolderInput] = useState("");
  const [folderLabel, setFolderLabel] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ id: string; name: string; webViewLink?: string | null; count: number }>
  >([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; name?: string; modifiedTime?: string; webViewLink?: string }>
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedRecordings, setSelectedRecordings] = useState<Set<string>>(
    new Set()
  );
  const [sortOption, setSortOption] = useState<"recent" | "duration">("recent");
  const [action, setAction] = useState<"recap" | "exam" | null>(
    actionParam === "exam" ? "exam" : actionParam === "recap" ? "recap" : null
  );
  const [recaps, setRecaps] = useState(initialRecaps);
  const [examPacks, setExamPacks] = useState(initialExamPacks);
  const [notice, setNotice] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [driveStatus, setDriveStatus] = useState<DriveStatus>("loading");

  useEffect(() => {
    let active = true;

    const loadDriveStatus = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!active) return;
      if (!authData?.user) {
        setDriveStatus("disconnected");
        return;
      }

      const { data, error } = await supabase
        .from("google_connections")
        .select("user_id")
        .limit(1);

      if (!active) return;

      if (error) {
        setDriveStatus("disconnected");
        return;
      }

      setDriveStatus(data && data.length > 0 ? "connected" : "disconnected");
    };

    loadDriveStatus();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        loadDriveStatus();
      } else {
        setDriveStatus("disconnected");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let active = true;
    const loadSubjects = async () => {
      setSubjectsError(null);
      const response = await fetch("/api/subjects", {
        credentials: "include",
      });
      if (!response.ok) {
        if (active) {
          setSubjectsError("Could not load Classroom subjects.");
        }
        return;
      }
      const json = (await response.json()) as { data: Subject[] };
      if (!active) return;
      setSubjects(json.data || []);
      if (!selectedSubjectIndex && json.data?.length) {
        setSelectedSubjectIndex(0);
      }
    };

    loadSubjects();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedSubjectIndex >= subjects.length) {
      setSelectedSubjectIndex(0);
    }
  }, [subjects, selectedSubjectIndex]);

  const selectedSubject = subjects[selectedSubjectIndex];

  useEffect(() => {
    setSelectedRecordings(new Set());
  }, [selectedSubject?.id]);

  useEffect(() => {
    setDriveFiles([]);
    setDriveVideos([]);
    setDriveError(null);
    setDriveLoading(false);
  }, [selectedSubject?.id]);
  useEffect(() => {
    if (!selectedSubject?.id) {
      setLinkedFolders([]);
      setSuggestions([]);
      setSuggestionsError(null);
      setSearchResults([]);
      setSearchError(null);
      setSearchQuery("");
      setFoldersError(null);
      setFoldersLoading(false);
      return;
    }
    let active = true;
    const loadFolders = async () => {
      setSuggestions([]);
      setSuggestionsError(null);
      setSearchResults([]);
      setSearchError(null);
      setFoldersLoading(true);
      setFoldersError(null);
      const response = await fetch(
        `/api/subjects/drive-folders?subjectId=${selectedSubject.id}`,
        { credentials: "include" }
      );
      if (!response.ok) {
        if (active) {
          let message = "Could not load linked folders.";
          try {
            const payload = (await response.json()) as { error?: string };
            if (payload?.error) message = payload.error;
          } catch {
            const text = await response.text();
            if (text) message = text;
          }
          setFoldersError(message);
        }
        setFoldersLoading(false);
        return;
      }
      const json = (await response.json()) as { data: SubjectDriveFolder[] };
      if (!active) return;
      setLinkedFolders(json.data || []);
      setFoldersLoading(false);
    };

    loadFolders();
    return () => {
      active = false;
    };
  }, [selectedSubject?.id]);

  useEffect(() => {
    if (!linkedFolders.length) {
      setDriveFiles([]);
      setDriveVideos([]);
      setDriveError(null);
      setDriveLoading(false);
      return;
    }
    let active = true;
    const loadDrive = async () => {
      setDriveLoading(true);
      setDriveError(null);
      const folderIds = linkedFolders.map((folder) => folder.drive_folder_id).join(",");
      const response = await fetch(
        `/api/drive/folders?folderIds=${folderIds}&recursive=true`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        if (active) {
          const text = await response.text();
          setDriveError(text || "Could not load Drive files.");
        }
        setDriveLoading(false);
        return;
      }
      const json = (await response.json()) as {
        data?: { files: DriveFile[]; videos: DriveFile[] };
      };
      if (!active) return;
      setDriveFiles(json.data?.files || []);
      setDriveVideos(json.data?.videos || []);
      setDriveLoading(false);
    };

    loadDrive();
    return () => {
      active = false;
    };
  }, [linkedFolders]);

  const recordingItems = useMemo(
    () =>
      driveVideos.map((video) => ({
        id: video.id,
        title: video.name || "Untitled recording",
        date: formatDate(video.modifiedTime),
        modifiedTime: video.modifiedTime ?? null,
        duration: formatDuration(video.videoMediaMetadata?.durationMillis),
        transcript: "Pending",
        webViewLink: video.webViewLink,
      })),
    [driveVideos]
  );

  const selectedRecordingList = recordingItems.filter((item) =>
    selectedRecordings.has(item.id)
  );

  const selectedCount = selectedRecordingList.length;

  const sortedRecordings = useMemo(() => {
    if (sortOption === "recent") {
      return [...recordingItems].sort((a, b) => {
        const aTime = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
        const bTime = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
        return bTime - aTime;
      });
    }
    return [...recordingItems].sort(
      (a, b) => parseDurationInMinutes(b.duration) - parseDurationInMinutes(a.duration)
    );
  }, [recordingItems, sortOption]);

  const toggleRecording = (recordingId: string) => {
    setSelectedRecordings((prev) => {
      const next = new Set(prev);
      if (next.has(recordingId)) {
        next.delete(recordingId);
      } else {
        next.add(recordingId);
      }
      return next;
    });
  };

  const onAddSubject = async () => {
    const name = newSubject.trim();
    if (!name) return;
    setSubjectsError(null);
    const response = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      setSubjectsError("Could not create subject.");
      return;
    }
    const json = (await response.json()) as { data: Subject };
    setSubjects((prev) => [json.data, ...prev]);
    setSelectedSubjectIndex(0);
    setNewSubject("");
  };

  const onSyncClassroom = async () => {
    setIsSyncing(true);
    setSubjectsError(null);
    const response = await fetch("/api/classroom/sync", {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      let message = "Classroom sync failed.";
      try {
        const payload = (await response.json()) as { error?: string };
        if (payload?.error) message = payload.error;
      } catch {
        const text = await response.text();
        if (text) message = text;
      }
      setSubjectsError(message);
      setIsSyncing(false);
      return;
    }
    const json = (await response.json()) as { data: Subject[] };
    setSubjects(json.data || []);
    setSelectedSubjectIndex(0);
    setIsSyncing(false);
  };

  const onLinkFolder = async (folderId: string, label?: string, source?: string) => {
    if (!selectedSubject?.id) return;
    setFoldersError(null);
    const response = await fetch("/api/subjects/drive-folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        subjectId: selectedSubject.id,
        folderId,
        label: label || null,
        source: source || "manual",
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      setFoldersError(text || "Could not link folder.");
      return;
    }
    const json = (await response.json()) as { data: SubjectDriveFolder };
    setLinkedFolders((prev) => [json.data, ...prev]);
  };

  const onRemoveFolder = async (folderRowId: string) => {
    setFoldersError(null);
    const response = await fetch(`/api/subjects/drive-folders?id=${folderRowId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      setFoldersError("Could not remove folder.");
      return;
    }
    setLinkedFolders((prev) => prev.filter((folder) => folder.id !== folderRowId));
  };

  const onSubmitFolder = async () => {
    const folderId = parseDriveFolderId(folderInput);
    if (!folderId) {
      setFoldersError("Paste a Drive folder link or ID.");
      return;
    }
    await onLinkFolder(folderId, folderLabel.trim() || undefined, "manual");
    setFolderInput("");
    setFolderLabel("");
  };

  const onFetchSuggestions = async () => {
    if (!selectedSubject?.id) return;
    setSuggestionsError(null);
    setSuggestionsLoading(true);
    const response = await fetch(
      `/api/classroom/suggestions?subjectId=${selectedSubject.id}`,
      { credentials: "include" }
    );
    if (!response.ok) {
      const text = await response.text();
      setSuggestionsError(text || "Could not load suggestions.");
      setSuggestionsLoading(false);
      return;
    }
    const json = (await response.json()) as {
      data?: { folders: Array<{ id: string; name: string; webViewLink?: string | null; count: number }> };
    };
    setSuggestions(json.data?.folders || []);
    setSuggestionsLoading(false);
  };

  const onSearchFolders = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchError("Enter a folder name to search.");
      return;
    }
    setSearchError(null);
    setSearchLoading(true);
    const response = await fetch(
      `/api/drive/search-folders?q=${encodeURIComponent(query)}`,
      { credentials: "include" }
    );
    if (!response.ok) {
      const text = await response.text();
      setSearchError(text || "Search failed.");
      setSearchLoading(false);
      return;
    }
    const json = (await response.json()) as {
      data?: Array<{ id: string; name?: string; modifiedTime?: string; webViewLink?: string }>;
    };
    setSearchResults(json.data || []);
    setSearchLoading(false);
  };

  const onCreate = () => {
    setNotice(null);
    if (selectedCount === 0) {
      setNotice("Select at least one recording to continue.");
      return;
    }

    if (action === "recap") {
      const title = selectedRecordingList[0]?.title || "New recap";
      setRecaps((prev) => [
        { title, status: "Processing", confidence: "Pending" },
        ...prev,
      ]);
      setNotice(`Recap created for ${title}.`);
      setSelectedRecordings(new Set());
      return;
    }

    if (action === "exam") {
      const scope = selectedCount === 1 ? "1 session" : `${selectedCount} sessions`;
      setExamPacks((prev) => [
        { title: "New Exam Pack", scope, status: "Processing" },
        ...prev,
      ]);
      setNotice(`Exam pack created with ${scope}.`);
      setSelectedRecordings(new Set());
      return;
    }

    setNotice("Choose an action: recap or exam pack.");
  };

  const onConnectDrive = async () => {
    setConnectError(null);
    try {
      const response = await fetch("/api/google/connect", {
        method: "GET",
        credentials: "include",
        redirect: "manual",
      });

      if (response.status === 401) {
        setConnectError("Sign in on the login page before connecting Drive.");
        return;
      }

      const redirectUrl = response.headers.get("Location");
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        setConnectError(data?.error || "Could not start Google connection.");
        return;
      }
    } catch (error) {
      setConnectError(
        error instanceof Error ? error.message : "Could not connect to Google."
      );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
      <aside className="app-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="app-kicker">Subjects</p>
            <h1 className="mt-2 font-[var(--font-display)] text-2xl">
              Your courses
            </h1>
          </div>
          <Button
            size="sm"
            radius="full"
            color="primary"
            isLoading={isSyncing}
            onPress={onSyncClassroom}
          >
            Sync Classroom
          </Button>
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            size="sm"
            placeholder="New subject"
            value={newSubject}
            onChange={(event) => setNewSubject(event.target.value)}
          />
          <Button size="sm" radius="full" variant="bordered" onPress={onAddSubject}>
            Create
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {subjects.length === 0 && (
            <Card className="border border-dashed border-[color:var(--border)] bg-white" shadow="none">
              <CardContent className="text-sm text-[color:var(--ink-muted)]">
                No subjects yet. Sync Classroom or create one manually.
              </CardContent>
            </Card>
          )}
          {subjects.map((subject, index) => (
            <Card
              key={subject.id}
              className={`border border-[color:var(--border)] transition ${
                index === selectedSubjectIndex
                  ? "bg-[color:var(--surface-alt)] shadow-[0_12px_30px_-20px_rgba(32,33,36,0.45)]"
                  : "bg-white"
              }`}
              shadow="sm"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedSubjectIndex(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setSelectedSubjectIndex(index);
                }
              }}
            >
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[color:var(--foreground)]">
                    {subject.name}
                  </p>
                  <Chip
                    size="sm"
                    variant="flat"
                    className="bg-[color:var(--surface-alt)] text-[color:var(--accent)]"
                  >
                    {subject.classroom_id ? "Classroom" : "Manual"}
                  </Chip>
                </div>
                <p className="text-xs text-[color:var(--ink-muted)]">
                  {subject.classroom_id
                    ? "Classroom course"
                    : "Manual subject"}
                </p>
                <div className="flex gap-3 text-xs text-[color:var(--ink-muted)]">
                  <span>
                    {subject.classroom_id ? "Synced from Classroom" : "Local"}
                  </span>
                  <span>Added {formatDate(subject.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {subjectsError && (
          <p className="mt-3 text-xs text-[color:var(--accent-red)]">
            {subjectsError}
          </p>
        )}
      </aside>

      <section className="space-y-6">
        <Card className="app-card" shadow="none">
          <CardHeader className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="app-kicker">Selected subject</p>
              <h2 className="mt-2 font-[var(--font-display)] text-3xl">
                {selectedSubject?.name || "Select a subject"}
              </h2>
              <p className="app-muted mt-1">
                {selectedSubject?.classroom_id
                  ? "Classroom course"
                  : "Manual subject"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                color="primary"
                radius="full"
                onPress={() => setAction("recap")}
              >
                Create recap
              </Button>
              <Button
                variant="bordered"
                radius="full"
                onPress={() => setAction("exam")}
              >
                Create exam pack
              </Button>
              {driveStatus === "connected" ? (
                <Button variant="bordered" radius="full" isDisabled>
                  Drive connected
                </Button>
              ) : (
                <Button
                  variant="bordered"
                  radius="full"
                  onPress={onConnectDrive}
                >
                  Connect Drive
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Chip
                variant="flat"
                className="bg-[color:var(--surface-alt)] text-[color:var(--accent)]"
              >
                Drive files: {driveFiles.length}
              </Chip>
              <Chip
                variant="flat"
                className="bg-[color:var(--surface-alt)] text-[color:var(--accent)]"
              >
                Videos: {driveVideos.length}
              </Chip>
              <Chip
                variant="flat"
                className="bg-[color:var(--surface-alt)] text-[color:var(--accent)]"
              >
                {driveLoading ? "Syncing Drive..." : "Drive ready"}
              </Chip>
            </div>
            {connectError && (
              <p className="mt-3 text-xs text-[color:var(--accent-red)]">
                {connectError}
              </p>
            )}
            {driveError && (
              <p className="mt-3 text-xs text-[color:var(--accent-red)]">
                {driveError}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="app-card" shadow="none">
          <CardHeader className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="app-kicker">Drive folders</p>
              <h3 className="mt-2 font-[var(--font-display)] text-2xl">
                Link course folders
              </h3>
              <p className="app-muted mt-1">
                Add one or more Drive folders for this class.
              </p>
            </div>
            <Button
              size="sm"
              radius="full"
              variant="bordered"
              isLoading={suggestionsLoading}
              onPress={onFetchSuggestions}
            >
              Suggest from Classroom
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Input
                size="sm"
                placeholder="Drive folder link or ID"
                value={folderInput}
                onChange={(event) => setFolderInput(event.target.value)}
                className="min-w-[220px] flex-1"
              />
              <Input
                size="sm"
                placeholder="Label (optional)"
                value={folderLabel}
                onChange={(event) => setFolderLabel(event.target.value)}
                className="min-w-[180px]"
              />
              <Button size="sm" radius="full" color="primary" onPress={onSubmitFolder}>
                Link folder
              </Button>
            </div>

            {foldersError && (
              <p className="text-xs text-[color:var(--accent-red)]">{foldersError}</p>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">
                Linked folders
              </p>
              {foldersLoading ? (
                <p className="text-sm text-[color:var(--ink-muted)]">Loading folders...</p>
              ) : linkedFolders.length ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {linkedFolders.map((folder) => (
                    <Card
                      key={folder.id}
                      shadow="sm"
                      className="border border-[color:var(--border)]"
                    >
                      <CardContent className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[color:var(--foreground)]">
                            {folder.label || "Drive folder"}
                          </p>
                          <p className="text-xs text-[color:var(--ink-muted)]">
                            {folder.drive_folder_id}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="bordered"
                          radius="full"
                          onPress={() => onRemoveFolder(folder.id)}
                        >
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[color:var(--ink-muted)]">
                  No folders linked yet.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">
                Suggested folders
              </p>
              {suggestionsError && (
                <p className="text-xs text-[color:var(--accent-red)]">
                  {suggestionsError}
                </p>
              )}
              {suggestionsLoading ? (
                <p className="text-sm text-[color:var(--ink-muted)]">
                  Scanning Classroom materials...
                </p>
              ) : suggestions.length ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {suggestions.map((folder) => (
                    <Card
                      key={folder.id}
                      shadow="sm"
                      className="border border-[color:var(--border)]"
                    >
                      <CardContent className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[color:var(--foreground)]">
                            {folder.name}
                          </p>
                          <p className="text-xs text-[color:var(--ink-muted)]">
                            {folder.count} linked files
                          </p>
                        </div>
                        <Button
                          size="sm"
                          radius="full"
                          onPress={() =>
                            onLinkFolder(folder.id, folder.name, "suggested")
                          }
                        >
                          Link
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[color:var(--ink-muted)]">
                  No suggestions yet. Click "Suggest from Classroom".
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">
                Search Drive folders
              </p>
              <div className="flex flex-wrap gap-3">
                <Input
                  size="sm"
                  placeholder="Search your Drive folders"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="min-w-[220px] flex-1"
                />
                <Button
                  size="sm"
                  radius="full"
                  variant="bordered"
                  isLoading={searchLoading}
                  onPress={onSearchFolders}
                >
                  Search
                </Button>
              </div>
              {searchError && (
                <p className="text-xs text-[color:var(--accent-red)]">{searchError}</p>
              )}
              {searchLoading ? (
                <p className="text-sm text-[color:var(--ink-muted)]">Searching...</p>
              ) : searchResults.length ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {searchResults.map((folder) => (
                    <Card
                      key={folder.id}
                      shadow="sm"
                      className="border border-[color:var(--border)]"
                    >
                      <CardContent className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[color:var(--foreground)]">
                            {folder.name || "Untitled folder"}
                          </p>
                          <p className="text-xs text-[color:var(--ink-muted)]">
                            Updated {formatDate(folder.modifiedTime)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {folder.webViewLink && (
                            <a className="app-link-outline text-xs" href={folder.webViewLink}>
                              Open
                            </a>
                          )}
                          <Button
                            size="sm"
                            radius="full"
                            onPress={() =>
                              onLinkFolder(folder.id, folder.name || undefined, "search")
                            }
                          >
                            Link
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[color:var(--ink-muted)]">
                  No search results yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {action && (
          <Card className="app-card" shadow="none">
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="app-kicker">Create {action}</p>
                <p className="text-sm text-[color:var(--ink-muted)]">
                  Selected recordings: {selectedCount || "None"}
                </p>
                {notice && (
                  <p className="mt-2 text-xs text-[color:var(--accent-red)]">
                    {notice}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button color="primary" radius="full" onPress={onCreate}>
                  Generate
                </Button>
                <Button
                  variant="bordered"
                  radius="full"
                  onPress={() => {
                    setSelectedRecordings(new Set());
                    setNotice(null);
                  }}
                >
                  Clear selection
                </Button>
                <Button
                  variant="bordered"
                  radius="full"
                  onPress={() => {
                    setAction(null);
                    setNotice(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="app-card" shadow="none">
          <CardContent>
            <Tabs aria-label="Subject sections">
              <TabListContainer>
                <TabList>
                  <Tab id="recordings">Recordings</Tab>
                  <Tab id="files">Files</Tab>
                  <Tab id="recaps">Recaps</Tab>
                  <Tab id="exams">Exam packs</Tab>
                </TabList>
              </TabListContainer>

              <TabPanel id="recordings">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        color="primary"
                        radius="full"
                        size="sm"
                        onPress={() => setAction("recap")}
                      >
                        Create recap
                      </Button>
                      <Button
                        variant="bordered"
                        radius="full"
                        size="sm"
                        onPress={() => setAction("exam")}
                      >
                        Create exam pack
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="recording-sort"
                        className="text-xs font-semibold text-[color:var(--ink-muted)]"
                      >
                        Sort by
                      </label>
                      <select
                        id="recording-sort"
                        className="h-9 rounded-full border border-[color:var(--border)] bg-white px-3 text-xs font-semibold text-[color:var(--foreground)]"
                        value={sortOption}
                        onChange={(event) =>
                          setSortOption(event.target.value as "recent" | "duration")
                        }
                      >
                        <option value="recent">Most recent</option>
                        <option value="duration">Longest</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {sortedRecordings.map((item) => (
                      <Card
                        key={item.id}
                        shadow="sm"
                        className="border border-[color:var(--border)]"
                      >
                        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              isSelected={selectedRecordings.has(item.id)}
                              onValueChange={() => toggleRecording(item.id)}
                            />
                            <div>
                              <p className="font-semibold text-[color:var(--foreground)]">
                                {item.title}
                              </p>
                              <p className="text-xs text-[color:var(--ink-muted)]">
                                {item.date} - {item.duration}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Chip
                              size="sm"
                              variant="flat"
                              className="bg-[color:var(--surface-alt)] text-[color:var(--accent)]"
                            >
                              Transcript {item.transcript}
                            </Chip>
                            <a
                              className="app-link-outline text-xs"
                              href={item.webViewLink || "#"}
                            >
                              View in Drive
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {!sortedRecordings.length && (
                      <Card
                        className="border border-dashed border-[color:var(--border)] bg-white"
                        shadow="none"
                      >
                        <CardContent className="text-sm text-[color:var(--ink-muted)]">
                          No Drive recordings found for this course.
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabPanel>
              <TabPanel id="files">
                <div className="grid gap-3 md:grid-cols-2">
                  {driveFiles.map((file) => (
                    <Card
                      key={file.id}
                      shadow="sm"
                      className="border border-[color:var(--border)]"
                    >
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-[color:var(--foreground)]">
                            {file.name || "Untitled file"}
                          </p>
                          <Chip
                            size="sm"
                            variant="flat"
                            className="bg-[color:var(--surface-alt)] text-[color:var(--accent)]"
                          >
                            {file.mimeType?.split("/").pop()?.toUpperCase() || "FILE"}
                          </Chip>
                        </div>
                        <p className="text-xs text-[color:var(--ink-muted)]">
                          Updated {formatDate(file.modifiedTime)}
                        </p>
                        <div className="flex gap-2">
                          <a
                            className="app-link-outline text-xs"
                            href={file.webViewLink || "#"}
                          >
                            Open
                          </a>
                          <Button size="sm" variant="bordered" radius="full">
                            Attach to recap
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!driveFiles.length && (
                    <Card
                      className="border border-dashed border-[color:var(--border)] bg-white"
                      shadow="none"
                    >
                      <CardContent className="text-sm text-[color:var(--ink-muted)]">
                        No Drive files found for this course.
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabPanel>
              <TabPanel id="recaps">
                <div className="space-y-3">
                  {recaps.map((recap) => (
                    <Card
                      key={recap.title}
                      shadow="sm"
                      className="border border-[color:var(--border)]"
                    >
                      <CardContent className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[color:var(--foreground)]">
                            {recap.title}
                          </p>
                          <p className="text-xs text-[color:var(--ink-muted)]">
                            Confidence: {recap.confidence}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Chip
                            size="sm"
                            variant="flat"
                            className="bg-[color:var(--surface-alt)] text-[color:var(--accent)]"
                          >
                            {recap.status}
                          </Chip>
                          <a
                            className="app-link-primary text-xs"
                            href={`/recaps/${encodeURIComponent(recap.title)}`}
                          >
                            Open
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabPanel>
              <TabPanel id="exams">
                <div className="space-y-3">
                  {examPacks.map((pack) => (
                    <Card
                      key={pack.title}
                      shadow="sm"
                      className="border border-[color:var(--border)]"
                    >
                      <CardContent className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[color:var(--foreground)]">
                            {pack.title}
                          </p>
                          <p className="text-xs text-[color:var(--ink-muted)]">
                            {pack.scope}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Chip
                            size="sm"
                            variant="flat"
                            className="bg-[color:var(--surface-alt)] text-[color:var(--accent)]"
                          >
                            {pack.status}
                          </Chip>
                          <a
                            className="app-link-outline text-xs"
                            href={`/exam-packs/${encodeURIComponent(pack.title)}`}
                          >
                            Open
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabPanel>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
