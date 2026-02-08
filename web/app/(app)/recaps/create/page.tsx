export default function RecapCreatePage() {
  return (
    <div className="space-y-8">
      <section className="journal-card p-6">
        <p className="journal-kicker">Create recap</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl">
          Generate a single class recap
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Select a course, choose a session, and confirm the materials that will be
          used for the summary.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="journal-card p-6">
          <p className="journal-kicker">Step 1</p>
          <h2 className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
            Select course
          </h2>
          <div className="mt-4 grid gap-2">
            <label className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
              <input type="radio" name="course" className="mr-3" defaultChecked />
              Data Structures
            </label>
            <label className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
              <input type="radio" name="course" className="mr-3" />
              Operating Systems
            </label>
          </div>
        </div>

        <div className="journal-card p-6">
          <p className="journal-kicker">Step 2</p>
          <h2 className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
            Select session video
          </h2>
          <div className="mt-4 grid gap-2">
            <label className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
              <input type="radio" name="session" className="mr-3" defaultChecked />
              Week 4 - Linked Lists (1h 12m)
            </label>
            <label className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
              <input type="radio" name="session" className="mr-3" />
              Week 3 - Arrays (58m)
            </label>
          </div>
        </div>
      </section>

      <section className="journal-card p-6">
        <p className="journal-kicker">Step 3</p>
        <h2 className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
          Confirm materials
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
            <p className="font-semibold">Week 4 Slides</p>
            <p className="text-xs text-[color:var(--ink-muted)]">PDF - 24 pages</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
            <p className="font-semibold">Practice Problems</p>
            <p className="text-xs text-[color:var(--ink-muted)]">Doc - 14 questions</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
            <p className="font-semibold">Assignment Brief</p>
            <p className="text-xs text-[color:var(--ink-muted)]">Missing file access</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="journal-button" type="button">
            Generate recap
          </button>
          <button className="journal-button-outline" type="button">
            Save draft
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-alt)] p-6 text-sm text-[color:var(--ink-muted)]">
        <p className="journal-kicker">Processing view</p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-2">
            <span>Extracting transcript</span>
            <span className="journal-mono">In progress</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-2">
            <span>Parsing files</span>
            <span className="journal-mono">Queued</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-2">
            <span>Generating recap</span>
            <span className="journal-mono">Pending</span>
          </div>
        </div>
      </section>
    </div>
  );
}
