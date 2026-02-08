const notifications = [
  {
    title: "Recap ready",
    body: "Week 4 - Linked Lists is ready to review.",
    time: "10 minutes ago",
  },
  {
    title: "Missing file access",
    body: "Assignment PDF could not be accessed. Reconnect Drive.",
    time: "1 hour ago",
  },
  {
    title: "Exam pack updated",
    body: "Midterm pack now includes Week 5 content.",
    time: "Yesterday",
  },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      <section className="journal-card p-6">
        <p className="journal-kicker">Notifications</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl">
          Recap updates and alerts
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Stay on top of missing data, ready summaries, and sync issues.
        </p>
      </section>

      <section className="journal-card p-6">
        <div className="space-y-4">
          {notifications.map((note) => (
            <div
              key={note.title}
              className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[color:var(--foreground)]">
                  {note.title}
                </p>
                <span className="journal-mono">{note.time}</span>
              </div>
              <p className="mt-2 text-[color:var(--ink-muted)]">{note.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
