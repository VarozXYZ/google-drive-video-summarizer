"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, Button, Chip } from "@heroui/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type UserSummary = {
  email?: string | null;
  name?: string | null;
};

type DriveStatus = "loading" | "connected" | "disconnected";

export default function AppUserStatus() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [driveStatus, setDriveStatus] = useState<DriveStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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
      if (authError || !data?.user) {
        setUser(null);
        setDriveStatus("disconnected");
        return;
      }
      setUser({
        email: data.user.email,
        name: data.user.user_metadata?.full_name,
      });
      await refreshDriveStatus();
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

  const onSignOut = async () => {
    setIsPending(true);
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    }
    setIsPending(false);
  };

  const onConnectDrive = () => {
    if (!user) {
      setError("Sign in first to connect Drive.");
      return;
    }
    window.location.href = "/api/google/connect";
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {driveStatus !== "loading" && (
        <Chip
          size="sm"
          variant="flat"
          className={
            driveStatus === "connected"
              ? "bg-[color:var(--surface-alt)] text-[color:var(--accent-green)]"
              : "bg-[color:var(--surface-alt)] text-[color:var(--accent-red)]"
          }
        >
          Drive {driveStatus === "connected" ? "connected" : "not connected"}
        </Chip>
      )}
      {!user ? (
        <a className="app-link-outline text-xs" href="/login">
          Sign in
        </a>
      ) : (
        <div className="flex items-center gap-2">
          <Avatar
            name={user.name || user.email || "User"}
            size="sm"
            className="bg-[color:var(--accent)] text-white"
          />
          <span className="text-xs text-[color:var(--ink-muted)]">
            {user.name || user.email}
          </span>
          {driveStatus === "disconnected" && (
            <Button
              size="sm"
              radius="full"
              variant="bordered"
              onPress={onConnectDrive}
            >
              Connect Drive
            </Button>
          )}
          <Button
            size="sm"
            radius="full"
            variant="bordered"
            onPress={onSignOut}
            isLoading={isPending}
          >
            Sign out
          </Button>
        </div>
      )}
      {error && <span className="text-xs text-[color:var(--accent-red)]">{error}</span>}
    </div>
  );
}
