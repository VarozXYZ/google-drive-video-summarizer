const focusItems = [
  { level: "High", text: "Tree traversal and time complexity" },
  { level: "Medium", text: "Linked list edge cases" },
  { level: "Low", text: "History of arrays" },
];

const focusStyles: Record<string, string> = {
  High: "border-[color:var(--accent)]",
  Medium: "border-[color:var(--gold)]",
  Low: "border-[color:var(--border)] bg-[color:var(--surface-alt)]",
};

const deepDives = [
  { title: "Binary Trees", detail: "Preorder, inorder, and postorder" },
  { title: "Hash Tables", detail: "Collision strategies and Big-O" },
];

export default function ExamPackDetailPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
      <div className="space-y-6">
        <section className="journal-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="journal-kicker">Exam preparation pack</p>
              <h1 className="mt-2 font-[var(--font-display)] text-3xl">
                Midterm Pack - Weeks 1 to 6
              </h1>
              <p className="mt-1 text-sm text-[color:var(--ink-muted)]">
                Data Structures - 6 sessions - 18 files
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="journal-chip">Confidence: High</span>
              <span className="journal-chip">Coverage: 92 percent</span>
            </div>
          </div>
          <div className="mt-4 journal-note">
            Gaps: Week 3 transcript missing. Use files only for that session.
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="journal-button" type="button">
              Export
            </button>
            <button className="journal-button-outline" type="button">
              Print
            </button>
            <button className="journal-button-outline" type="button">
              Ask a question
            </button>
          </div>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Executive summary</p>
          <p className="mt-4 text-sm text-[color:var(--ink-muted)]">
            This pack combines weeks 1 through 6 into a single study guide,
            emphasizing Big-O tradeoffs, data structure selection, and the exact
            exercises most likely to appear on the exam.
          </p>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Syllabus revamp</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              Arrays and dynamic arrays - constraints, amortized cost
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              Linked lists - insertion vs traversal tradeoffs
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              Trees and graph traversal - order and complexity
            </div>
          </div>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Exam focus map</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {focusItems.map((item) => (
              <div
                key={item.text}
                className={`rounded-2xl border bg-white px-4 py-3 text-sm ${focusStyles[item.level] || "border-[color:var(--border)]"}`}
              >
                <p className="journal-mono">{item.level}</p>
                <p className="mt-2 text-[color:var(--foreground)]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Concept deep dives</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {deepDives.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
              >
                <p className="font-semibold text-[color:var(--foreground)]">
                  {item.title}
                </p>
                <p className="text-xs text-[color:var(--ink-muted)]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Consolidated exercises</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              Binary search, rotate array, and two-pointer patterns
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              Tree traversal practice and complexity analysis
            </div>
          </div>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Glossary</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
              <p className="font-semibold">Amortized</p>
              <p className="text-xs text-[color:var(--ink-muted)]">Average cost over a sequence</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
              <p className="font-semibold">Traversal</p>
              <p className="text-xs text-[color:var(--ink-muted)]">Visiting every node in a structure</p>
            </div>
          </div>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Common mistakes and fixes</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              Off-by-one errors in loops - check bounds before accessing
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              Misstating complexity - always cite worst case and amortized
            </div>
          </div>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Study plan and tips</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              Day 1: Arrays and linked lists, solve all practice problems
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              Day 2: Trees and graphs, review traversal proofs
            </div>
          </div>
        </section>

        <section className="journal-note">
          <p className="journal-kicker">Sources and traceability</p>
          <p className="mt-3">
            All conclusions are linked to specific recaps and files, with timeline
            references for every key claim.
          </p>
        </section>
      </div>

      <aside className="space-y-6">
        <div className="journal-card p-6">
          <p className="journal-kicker">Sources</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              <p className="journal-mono">Recap: Week 1</p>
              <p>Arrays and amortized cost</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              <p className="journal-mono">File: Midterm Guide</p>
              <p>Teacher emphasis and tips</p>
            </div>
          </div>
        </div>

        <div className="journal-card p-6">
          <p className="journal-kicker">Confidence</p>
          <div className="mt-4 space-y-2 text-sm text-[color:var(--ink-muted)]">
            <div className="flex items-center justify-between">
              <span>Recap coverage</span>
              <span className="journal-mono">92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>File coverage</span>
              <span className="journal-mono">18 of 20</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--border)] bg-white/80 p-6 text-sm text-[color:var(--ink-muted)]">
          <p className="journal-kicker">Ask a question</p>
          <p className="mt-3">Need a deeper explanation? Ask the pack directly.</p>
          <button className="mt-4 journal-button" type="button">
            Ask now
          </button>
        </div>
      </aside>
    </div>
  );
}
