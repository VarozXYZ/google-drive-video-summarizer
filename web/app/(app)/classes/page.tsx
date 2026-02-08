const classCards = [
  {
    name: "Data Structures",
    teacher: "Dr. Lee",
    nextSession: "Thu 10:00",
    lastRecap: "Week 4",
  },
  {
    name: "Operating Systems",
    teacher: "Prof. Nguyen",
    nextSession: "Mon 14:00",
    lastRecap: "Week 3",
  },
  {
    name: "Spanish 201",
    teacher: "Ms. Torres",
    nextSession: "Tue 11:00",
    lastRecap: "Week 2",
  },
];

export default function ClassesPage() {
  return (
    <div className="space-y-8">
      <section className="journal-card p-6">
        <p className="journal-kicker">Classes</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl">
          Manage your courses and sync sources
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Choose which classes to sync from Classroom and Drive, and control how
          often we refresh transcripts and files.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="journal-button" type="button">
            Add course
          </button>
          <button className="journal-button-outline" type="button">
            Refresh sync
          </button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {classCards.map((course) => (
          <div key={course.name} className="journal-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-[var(--font-display)] text-2xl">
                  {course.name}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--ink-muted)]">
                  {course.teacher}
                </p>
              </div>
              <span className="journal-chip">Synced</span>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <p>
                <span className="text-[color:var(--ink-muted)]">
                  Next session:
                </span>{" "}
                {course.nextSession}
              </p>
              <p>
                <span className="text-[color:var(--ink-muted)]">Last recap:</span>{" "}
                {course.lastRecap}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="journal-button-outline" type="button">
                View recaps
              </button>
              <button className="journal-button-outline" type="button">
                Exam packs
              </button>
              <button className="journal-button" type="button">
                Create recap
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
