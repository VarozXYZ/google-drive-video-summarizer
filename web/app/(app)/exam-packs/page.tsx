const examPacks = [
  {
    title: "Midterm Pack",
    course: "Data Structures",
    sessions: "Weeks 1-6",
    status: "Ready",
    confidence: "High",
  },
  {
    title: "Quiz Review",
    course: "Operating Systems",
    sessions: "Weeks 1-3",
    status: "Processing",
    confidence: "Medium",
  },
];

export default function ExamPacksPage() {
  return (
    <div className="space-y-8">
      <section className="journal-card p-6">
        <p className="journal-kicker">Exam packs</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl">
          All exam preparation packs
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Combine multiple recaps and files to build a full exam guide.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="journal-button" type="button">
            Create exam pack
          </button>
          <button className="journal-button-outline" type="button">
            Export selected
          </button>
        </div>
        <div className="mt-6 journal-highlight">
          <p className="journal-kicker text-white/80">Coverage target</p>
          <p className="mt-2 text-sm text-white">
            Reach 90 percent coverage before the exam. Missing items are flagged
            automatically.
          </p>
        </div>
      </section>

      <section className="journal-card p-6">
        <div className="flex items-center justify-between">
          <p className="journal-kicker">Exam pack library</p>
          <span className="journal-chip">2 packs</span>
        </div>
        <div className="mt-6 space-y-3">
          {examPacks.map((pack) => (
            <div
              key={pack.title}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold text-[color:var(--foreground)]">
                  {pack.title}
                </p>
                <p className="text-xs text-[color:var(--ink-muted)]">
                  {pack.course} - {pack.sessions}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-alt)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[color:var(--accent)]">
                  {pack.status}
                </span>
                <span className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">
                  {pack.confidence} confidence
                </span>
                <button className="journal-button-outline" type="button">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
