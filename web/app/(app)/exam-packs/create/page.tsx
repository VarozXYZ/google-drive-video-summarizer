export default function ExamPackCreatePage() {
  return (
    <div className="space-y-8">
      <section className="journal-card p-6">
        <p className="journal-kicker">Create exam pack</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl">
          Build a complete exam preparation pack
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Choose the sessions that will appear on the exam, then confirm all
          supporting files.
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
            Select sessions
          </h2>
          <div className="mt-4 grid gap-2">
            <label className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
              <input type="checkbox" className="mr-3" defaultChecked />
              Week 1 - Arrays
            </label>
            <label className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
              <input type="checkbox" className="mr-3" defaultChecked />
              Week 2 - Linked Lists
            </label>
            <label className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
              <input type="checkbox" className="mr-3" />
              Week 3 - Trees
            </label>
          </div>
        </div>
      </section>

      <section className="journal-card p-6">
        <p className="journal-kicker">Step 3</p>
        <h2 className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
          Confirm materials and recaps
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
            <p className="font-semibold">Recaps included</p>
            <p className="text-xs text-[color:var(--ink-muted)]">3 recaps ready</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
            <p className="font-semibold">Files included</p>
            <p className="text-xs text-[color:var(--ink-muted)]">12 files synced</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
            <p className="font-semibold">Missing items</p>
            <p className="text-xs text-[color:var(--ink-muted)]">Week 3 transcript</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="journal-button" type="button">
            Generate exam pack
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
            <span>Collecting recaps</span>
            <span className="journal-mono">In progress</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-2">
            <span>Parsing files</span>
            <span className="journal-mono">Queued</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-2">
            <span>Building exam pack</span>
            <span className="journal-mono">Pending</span>
          </div>
        </div>
      </section>
    </div>
  );
}
