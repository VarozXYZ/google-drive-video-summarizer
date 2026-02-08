"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button, Card, CardContent, CardHeader, Checkbox } from "@heroui/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const checklist = [
  "Classroom courses and rosters",
  "Drive recordings and transcripts",
  "Teacher files (PDFs, slides, docs)",
  "Session metadata for timelines",
];

type UserSummary = {
  email?: string | null;
  name?: string | null;
};

type DriveStatus = "loading" | "connected" | "disconnected";

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [driveStatus, setDriveStatus] = useState<DriveStatus>("disconnected");

  const refreshDriveStatus = async () => {
    setDriveStatus("loading");
    const { data, error: driveError } = await supabase
      .from("google_connections")
      .select("user_id")
      .limit(1);

    if (driveError) {
      setDriveStatus("disconnected");
      return;
    }

    setDriveStatus(data && data.length > 0 ? "connected" : "disconnected");
  };

  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      const { data, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError) {
        setError(authError.message);
        return;
      }
      if (data?.user) {
        setUser({
          email: data.user.email,
          name: data.user.user_metadata?.full_name,
        });
        await refreshDriveStatus();
      } else {
        setDriveStatus("disconnected");
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name,
        });
        refreshDriveStatus();
      } else {
        setUser(null);
        setDriveStatus("disconnected");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const onSignIn = () => {
    setError(null);
    startTransition(async () => {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/subjects`,
        },
      });
      if (authError) {
        setError(authError.message);
      }
    });
  };

  const onSignOut = () => {
    setError(null);
    startTransition(async () => {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) {
        setError(authError.message);
      }
    });
  };

  const onConnectDrive = () => {
    setError(null);
    if (!user) {
      setError("Sign in first to connect Google Drive.");
      return;
    }
    setIsConnectingDrive(true);
    window.location.href = "/api/google/connect";
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-10 px-6 py-16 lg:flex-row lg:items-center">
      <section className="flex-1 space-y-6">
        <h1 className="font-[var(--font-display)] text-4xl leading-tight text-[color:var(--foreground)] md:text-5xl">
          Connect Google to unlock your subjects workspace.
        </h1>
        <p className="max-w-xl text-lg text-[color:var(--ink-muted)]">
          We only request the access required to read your classes, recordings,
          and files. You control retention in settings.
        </p>
        <div className="flex flex-wrap gap-3">
          {!user ? (
            <Button color="primary" radius="full" onPress={onSignIn} isLoading={isPending}>
              Continue with Google
            </Button>
          ) : (
            <Button variant="bordered" radius="full" onPress={onSignOut} isLoading={isPending}>
              Sign out
            </Button>
          )}
          {user && driveStatus !== "connected" && (
            <Button
              variant="bordered"
              radius="full"
              onPress={onConnectDrive}
              isLoading={isConnectingDrive}
            >
              Connect Drive
            </Button>
          )}
          {user && driveStatus === "connected" && (
            <a className="app-link-outline" href="/subjects">
              Drive connected
            </a>
          )}
        </div>
        {user && (
          <div className="app-card p-4 text-sm">
            <p className="app-kicker">Signed in</p>
            <p className="mt-2 text-[color:var(--foreground)]">
              {user.name || user.email}
            </p>
          </div>
        )}
        {error && (
          <div className="app-card border border-[color:var(--accent-red)] bg-white p-4 text-sm text-[color:var(--accent-red)]">
            {error}
          </div>
        )}
      </section>

      <section className="w-full max-w-md space-y-4">
        <Card className="app-card" shadow="none">
          <CardHeader>
            <div>
              <p className="app-kicker">Permissions</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                We will access
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklist.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Checkbox defaultSelected />
                <span className="text-sm text-[color:var(--ink-muted)]">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="app-card" shadow="none">
          <CardContent className="space-y-2">
            <p className="app-kicker">Privacy</p>
            <p className="text-sm text-[color:var(--ink-muted)]">
              You can export data or delete everything any time. We never invent
              information beyond your sources.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
