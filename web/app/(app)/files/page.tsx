const files = [
  { name: "Week4_Slides.pdf", course: "Data Structures", status: "Used" },
  { name: "Week4_Exercises.docx", course: "Data Structures", status: "Used" },
  { name: "Quiz_Guide.pdf", course: "Operating Systems", status: "Unused" },
];

export default function FilesPage() {
  return (
    <div className="space-y-8">
      <section className="journal-card p-6">
        <p className="journal-kicker">Files</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl">
          Manage Drive and Classroom files
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Attach files to recaps or exam packs to provide additional context.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="journal-button" type="button">
            Sync files
          </button>
          <button className="journal-button-outline" type="button">
            Upload file
          </button>
          <div className="flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-xs">
            <span className="text-[color:var(--ink-muted)]">Filter</span>
            <select className="bg-transparent text-xs text-[color:var(--foreground)] outline-none">
              <option>All courses</option>
              <option>Data Structures</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="journal-card p-6">
          <p className="journal-kicker">File list</p>
          <div className="mt-4 space-y-3">
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-[color:var(--foreground)]">
                    {file.name}
                  </p>
                  <p className="text-xs text-[color:var(--ink-muted)]">
                    {file.course}
                  </p>
                </div>
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-alt)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[color:var(--accent)]">
                  {file.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="journal-card p-6">
          <p className="journal-kicker">Preview</p>
          <h2 className="mt-3 font-[var(--font-display)] text-2xl">
            Week4_Slides.pdf
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            24 pages - Last updated Feb 5, 2026
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              Preview snippet: Big-O analysis for dynamic arrays.
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              Preview snippet: Exercise list and solutions.
            </div>
          </div>
          <button className="mt-4 journal-button" type="button">
            Attach to recap
          </button>
        </div>
      </section>
    </div>
  );
}
