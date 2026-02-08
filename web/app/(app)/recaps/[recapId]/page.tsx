const timelineItems = [
  { time: "00:04:12", text: "Arrays vs lists and contiguous memory" },
  { time: "00:19:30", text: "Big-O for insert and delete operations" },
  { time: "00:35:05", text: "Traversal patterns used in exercises" },
];

const examFocus = [
  { level: "High", text: "Big-O explanations and tradeoffs" },
  { level: "Medium", text: "Index bounds and off-by-one mistakes" },
  { level: "Low", text: "Historical context on arrays" },
];

const focusStyles: Record<string, string> = {
  High: "border-[color:var(--accent)]",
  Medium: "border-[color:var(--gold)]",
  Low: "border-[color:var(--border)] bg-[color:var(--surface-alt)]",
};

const exercises = [
  { title: "Binary search on arrays", detail: "Two-pointer walkthrough" },
  { title: "Rotate array", detail: "In-place vs extra space" },
];

const glossary = [
  { term: "Dynamic array", definition: "Array that resizes by doubling" },
  { term: "Amortized", definition: "Average cost over a sequence" },
  { term: "Index bounds", definition: "Valid index range for arrays" },
];

export default function RecapDetailPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
      <div className="space-y-6">
        <section className="journal-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="journal-kicker">Single class recap</p>
              <h1 className="mt-2 font-[var(--font-display)] text-3xl">
                Week 3 - Arrays
              </h1>
              <p className="mt-1 text-sm text-[color:var(--ink-muted)]">
                Data Structures - Feb 6, 2026 - Dr. Lee - 1h 12m
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="journal-chip">Confidence: High</span>
              <span className="journal-chip">Sources: 1 video, 3 files</span>
            </div>
          </div>
          <div className="mt-4 journal-note">
            Gaps: Assignment PDF missing. Transcript quality 92 percent.
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="journal-button" type="button">
              Add to exam pack
            </button>
            <button className="journal-button-outline" type="button">
              Export PDF
            </button>
            <button className="journal-button-outline" type="button">
              Ask a question
            </button>
          </div>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Executive summary</p>
          <p className="mt-4 text-sm text-[color:var(--ink-muted)]">
            This session introduced arrays, highlighted the difference between
            lists and contiguous memory, and emphasized Big-O tradeoffs for
            insertions and deletions. The teacher focused on traversal patterns
            used in exams and reviewed common pitfalls from the assignment.
          </p>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">What was taught</p>
          <div className="mt-4 space-y-3">
            {timelineItems.map((item) => (
              <div
                key={item.time}
                className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
              >
                <div>
                  <p className="journal-mono">{item.time}</p>
                  <p>{item.text}</p>
                </div>
                <button className="journal-button-outline" type="button">
                  Jump
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Exam focus</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {examFocus.map((focus) => (
              <div
                key={focus.text}
                className={`rounded-2xl border bg-white px-4 py-3 text-sm ${focusStyles[focus.level] || "border-[color:var(--border)]"}`}
              >
                <p className="journal-mono">{focus.level}</p>
                <p className="mt-2 text-[color:var(--foreground)]">
                  {focus.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Exercises solved</p>
          <div className="mt-4 grid gap-3">
            {exercises.map((exercise) => (
              <div
                key={exercise.title}
                className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
              >
                <p className="font-semibold text-[color:var(--foreground)]">
                  {exercise.title}
                </p>
                <p className="text-xs text-[color:var(--ink-muted)]">
                  {exercise.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Vocabulary and definitions</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {glossary.map((item) => (
              <div
                key={item.term}
                className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
              >
                <p className="font-semibold text-[color:var(--foreground)]">
                  {item.term}
                </p>
                <p className="text-xs text-[color:var(--ink-muted)]">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Teacher signals</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              "This will be on the exam, explain Big-O clearly."
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              "Do not forget the index bounds when traversing arrays."
            </div>
          </div>
        </section>

        <section className="journal-card p-6">
          <p className="journal-kicker">Files used</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
              <p className="font-semibold">Week3_Slides.pdf</p>
              <p className="text-xs text-[color:var(--ink-muted)]">24 pages</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm">
              <p className="font-semibold">Exercises.docx</p>
              <p className="text-xs text-[color:var(--ink-muted)]">14 problems</p>
            </div>
          </div>
        </section>

        <section className="journal-note">
          <p className="journal-kicker">Gaps and uncertainties</p>
          <p className="mt-3">
            Assignment brief could not be accessed. Recap uses transcript and
            slides only.
          </p>
        </section>
      </div>

      <aside className="space-y-6">
        <div className="journal-card p-6">
          <p className="journal-kicker">Sources</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              <p className="journal-mono">00:19:30 - 00:21:05</p>
              <p>Big-O tradeoffs for dynamic arrays.</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              <p className="journal-mono">File: Week3_Slides.pdf</p>
              <p>Traversal pattern checklist.</p>
            </div>
          </div>
        </div>

        <div className="journal-card p-6">
          <p className="journal-kicker">Confidence</p>
          <div className="mt-4 space-y-2 text-sm text-[color:var(--ink-muted)]">
            <div className="flex items-center justify-between">
              <span>Transcript quality</span>
              <span className="journal-mono">92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>File coverage</span>
              <span className="journal-mono">3 of 4</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--border)] bg-white/80 p-6 text-sm text-[color:var(--ink-muted)]">
          <p className="journal-kicker">Ask a question</p>
          <p className="mt-3">Ask about any topic or request a deeper explanation.</p>
          <button className="mt-4 journal-button" type="button">
            Ask now
          </button>
        </div>
      </aside>
    </div>
  );
}
