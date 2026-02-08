import { Card, CardContent, CardHeader, Chip } from "@heroui/react";

const quickPoints = [
  "Select a recording, choose recap or exam pack",
  "Every claim is tied to a timestamp or file",
  "Exam packs are built from saved recaps",
];

export default function MarketingHome() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-white">
            <span className="font-[var(--font-display)] text-xl">CR</span>
          </div>
          <div>
            <p className="app-kicker">Class Replacement</p>
            <p className="text-sm font-semibold text-[color:var(--foreground)]">
              Built for Classroom + Drive
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a className="app-link-outline" href="/login">
            Sign in
          </a>
          <a className="app-link-primary" href="/login">
            Connect Google
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-16 px-6 pb-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Chip
              size="sm"
              variant="flat"
              className="bg-[color:var(--surface-alt)] text-[color:var(--accent)]"
            >
              Apple-clean, Drive-native
            </Chip>
            <h1 className="font-[var(--font-display)] text-5xl leading-tight text-[color:var(--foreground)]">
              Replace missed classes with a single, trusted study pack.
            </h1>
            <p className="max-w-xl text-lg text-[color:var(--ink-muted)]">
              Connect Google Classroom and Drive, then turn class recordings and
              files into complete recaps and exam packs with traceable evidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <a className="app-link-primary" href="/login">
                Start with Google
              </a>
              <a className="app-link-outline" href="/subjects">
                View workspace
              </a>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-[color:var(--ink-muted)]">
              <span className="app-pill">Classroom sync</span>
              <span className="app-pill">Drive files</span>
              <span className="app-pill">Timestamped sources</span>
            </div>
          </div>
          <Card className="app-card" shadow="none">
            <CardHeader>
              <div>
                <p className="app-kicker">Preview</p>
                <h2 className="mt-2 font-[var(--font-display)] text-2xl">
                  Week 4: Linked Lists
                </h2>
                <p className="app-muted mt-1">
                  Single class recap with exam focus and sources.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
                >
                  {point}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card className="app-card" shadow="none">
            <CardContent className="space-y-2">
              <p className="app-kicker">Step 1</p>
              <p className="text-base font-semibold text-[color:var(--foreground)]">
                Choose a subject
              </p>
              <p className="app-muted">
                Subjects group all recordings and files for a course.
              </p>
            </CardContent>
          </Card>
          <Card className="app-card" shadow="none">
            <CardContent className="space-y-2">
              <p className="app-kicker">Step 2</p>
              <p className="text-base font-semibold text-[color:var(--foreground)]">
                Select recordings
              </p>
              <p className="app-muted">
                Pick the sessions that matter for your exam.
              </p>
            </CardContent>
          </Card>
          <Card className="app-card" shadow="none">
            <CardContent className="space-y-2">
              <p className="app-kicker">Step 3</p>
              <p className="text-base font-semibold text-[color:var(--foreground)]">
                Generate artifacts
              </p>
              <p className="app-muted">
                Recaps for each class, exam packs for complete preparation.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
