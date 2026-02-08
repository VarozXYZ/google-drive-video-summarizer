import type { ReactNode } from "react";
import { Chip, Input } from "@heroui/react";
import AppUserStatus from "@/app/components/app-user-status";

export default function AppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="app-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-6 px-4 py-6 lg:px-8">
        <header className="app-glass flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-white">
              <span className="font-[var(--font-display)] text-xl">CR</span>
            </div>
            <div>
              <p className="app-kicker">Class Replacement</p>
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                Subjects workspace
              </p>
            </div>
            <Chip
              color="primary"
              variant="flat"
              className="ml-3 bg-[color:var(--surface-alt)] text-[color:var(--accent)]"
            >
              Drive sync: OK
            </Chip>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              size="sm"
              placeholder="Search subjects, recordings, files"
              className="min-w-[220px]"
            />
            <a className="app-link-primary font-semibold" href="/subjects?action=recap">
              New recap
            </a>
            <a className="app-link-outline" href="/subjects?action=exam">
              New exam pack
            </a>
            <AppUserStatus />
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
