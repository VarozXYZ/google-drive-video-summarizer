const recaps = [
  {
    title: "Week 4 - Linked Lists",
    course: "Data Structures",
    status: "Ready",
    confidence: "High",
  },
  {
    title: "Week 3 - Scheduling",
    course: "Operating Systems",
    status: "Processing",
    confidence: "Medium",
  },
  {
    title: "Week 2 - Past Tense",
    course: "Spanish 201",
    status: "Needs attention",
    confidence: "Low",
  },
];

export default function RecapsPage() {
  return (
    <div className="space-y-8">
      <section className="journal-card p-6">
        <p className="journal-kicker">Recaps</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl">
          All single class recaps
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Each recap is saved as a canonical source for exam preparation.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className="journal-button" type="button">
            Create recap
          </button>
          <button className="journal-button-outline" type="button">
            Add to exam pack
          </button>
          <div className="flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-xs">
            <span className="text-[color:var(--ink-muted)]">Filter</span>
            <select className="bg-transparent text-xs text-[color:var(--foreground)] outline-none">
              <option>All courses</option>
              <option>Data Structures</option>
              <option>Operating Systems</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-xs">
            <span className="text-[color:var(--ink-muted)]">Status</span>
            <select className="bg-transparent text-xs text-[color:var(--foreground)] outline-none">
              <option>Any</option>
              <option>Ready</option>
              <option>Processing</option>
              <option>Needs attention</option>
            </select>
          </div>
        </div>
        <div className="mt-6 journal-highlight">
          <p className="journal-kicker text-white/80">Exam coverage</p>
          <p className="mt-2 text-sm text-white">
            Save every recap. Exam packs are built directly from these records.
          </p>
        </div>
      </section>

      <section className="journal-card p-6">
        <div className="flex items-center justify-between">
          <p className="journal-kicker">Recap library</p>
          <span className="journal-chip">3 recaps</span>
        </div>
        <div className="mt-6 space-y-3">
          {recaps.map((recap) => (
            <div
              key={recap.title}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold text-[color:var(--foreground)]">
                  {recap.title}
                </p>
                <p className="text-xs text-[color:var(--ink-muted)]">
                  {recap.course}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-alt)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[color:var(--accent)]">
                  {recap.status}
                </span>
                <span className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">
                  {recap.confidence} confidence
                </span>
                <button className="journal-button-outline" type="button">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-[color:var(--border)] bg-white/60 p-6 text-sm text-[color:var(--ink-muted)]">
        <p className="font-semibold text-[color:var(--foreground)]">Empty state</p>
        <p className="mt-2">
          No recaps yet for the selected course. Create your first recap to start
          building exam packs.
        </p>
      </section>
    </div>
  );
}
