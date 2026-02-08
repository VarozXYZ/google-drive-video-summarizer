export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <section className="journal-card p-6">
        <p className="journal-kicker">Settings</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl">
          Account and data preferences
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Control how your data is stored, exported, and summarized.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="journal-card p-6">
          <p className="journal-kicker">Profile</p>
          <div className="mt-4 space-y-3 text-sm">
            <label className="block">
              <span className="text-xs text-[color:var(--ink-muted)]">Name</span>
              <input className="journal-input mt-2" defaultValue="Student" />
            </label>
            <label className="block">
              <span className="text-xs text-[color:var(--ink-muted)]">Email</span>
              <input className="journal-input mt-2" defaultValue="student@school.edu" />
            </label>
            <button className="journal-button" type="button">
              Save profile
            </button>
          </div>
        </div>

        <div className="journal-card p-6">
          <p className="journal-kicker">Google connections</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              <span>Google Classroom</span>
              <span className="journal-chip">Connected</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              <span>Google Drive</span>
              <span className="journal-chip">Connected</span>
            </div>
            <button className="journal-button-outline" type="button">
              Reconnect
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="journal-card p-6">
          <p className="journal-kicker">Data retention</p>
          <div className="mt-4 space-y-3 text-sm">
            <label className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              <span>Store transcripts</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
              <span>Store generated recaps</span>
              <input type="checkbox" defaultChecked />
            </label>
            <button className="journal-button-outline" type="button">
              Export data
            </button>
            <button className="journal-button" type="button">
              Delete all data
            </button>
          </div>
        </div>

        <div className="journal-card p-6">
          <p className="journal-kicker">Summary preferences</p>
          <div className="mt-4 space-y-3 text-sm">
            <label className="block">
              <span className="text-xs text-[color:var(--ink-muted)]">Default detail</span>
              <select className="journal-input mt-2">
                <option>Exam-ready (detailed)</option>
                <option>Balanced</option>
                <option>Quick review</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-[color:var(--ink-muted)]">Language</span>
              <select className="journal-input mt-2">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
