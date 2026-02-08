const highlightCards = [
  {
    title: "Continue Exam Pack",
    body: "Midterm Pack is 70 percent complete. 2 sessions missing.",
    cta: "Resume",
  },
  {
    title: "Latest Recap",
    body: "Week 4: Linked Lists is ready with 12 timeline points.",
    cta: "Open recap",
  },
  {
    title: "Missing Data",
    body: "One transcript missing for Week 2. Reconnect Drive.",
    cta: "Resolve",
  },
];

const courses = [
  {
    name: "Data Structures",
    teacher: "Dr. Lee",
    lastSession: "Week 4 - Linked Lists",
    status: "Recap ready",
  },
  {
    name: "Operating Systems",
    teacher: "Prof. Nguyen",
    lastSession: "Week 3 - Scheduling",
    status: "Processing",
  },
  {
    name: "Spanish 201",
    teacher: "Ms. Torres",
    lastSession: "Week 2 - Past tense",
    status: "Needs attention",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="journal-card p-6">
        <p className="journal-kicker">Dashboard</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl">
          Welcome back, ready to replace a class?
        </h1>
        <p className="mt-3 text-sm text-[color:var(--ink-muted)]">
          You have 3 courses synced. Keep recaps saved so the exam packs stay complete.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="journal-button" type="button">
            Create recap
          </button>
          <button className="journal-button-outline" type="button">
            Create exam pack
          </button>
          <button className="journal-button-outline" type="button">
            Upload file
          </button>
        </div>
        <div className="mt-6 journal-highlight">
          <p className="journal-kicker text-white/80">Urgent</p>
          <p className="mt-2 text-sm text-white">
            Midterm is in 8 days. Finish 2 missing recaps to unlock a complete exam pack.
          </p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {highlightCards.map((card) => (
          <div key={card.title} className="journal-card p-5">
            <p className="journal-kicker">{card.title}</p>
            <p className="mt-3 text-sm text-[color:var(--ink-muted)]">{card.body}</p>
            <button className="mt-4 journal-button-outline" type="button">
              {card.cta}
            </button>
          </div>
        ))}
      </section>

      <section className="journal-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="journal-kicker">Courses</p>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl">
              Your current classes
            </h2>
          </div>
          <button className="journal-button-outline" type="button">
            Manage classes
          </button>
        </div>
        <div className="mt-6 space-y-3">
          {courses.map((course) => (
            <div
              key={course.name}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold text-[color:var(--foreground)]">
                  {course.name}
                </p>
                <p className="text-xs text-[color:var(--ink-muted)]">
                  {course.teacher} - {course.lastSession}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-alt)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[color:var(--accent)]">
                  {course.status}
                </span>
                <button className="journal-button-outline" type="button">
                  View recaps
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
