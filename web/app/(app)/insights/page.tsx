export default function InsightsPage() {
  return (
    <div className="space-y-8">
      <section className="journal-card p-6">
        <p className="journal-kicker">Insights</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl">
          Track recap coverage and exam readiness
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          See which courses need more data, and which topics students review most.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="journal-card p-6">
          <p className="journal-kicker">Recap usage</p>
          <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
            128 views
          </p>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Most viewed: Week 3 - Arrays
          </p>
        </div>
        <div className="journal-card p-6">
          <p className="journal-kicker">Coverage gaps</p>
          <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
            4 missing items
          </p>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            2 transcripts, 2 files
          </p>
        </div>
        <div className="journal-card p-6">
          <p className="journal-kicker">Confidence trend</p>
          <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
            86 percent
          </p>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Avg across all recaps
          </p>
        </div>
      </section>

      <section className="journal-card p-6">
        <p className="journal-kicker">Exam readiness</p>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
            <span>Data Structures</span>
            <span className="journal-mono">4 of 5</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
            <span>Operating Systems</span>
            <span className="journal-mono">3 of 5</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
            <span>Spanish 201</span>
            <span className="journal-mono">5 of 5</span>
          </div>
        </div>
      </section>
    </div>
  );
}
