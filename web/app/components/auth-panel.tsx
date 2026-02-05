"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type UserSummary = {
  email?: string | null;
  name?: string | null;
};

type AuthPanelProps = {
  user: UserSummary | null;
};

export default function AuthPanel({ user }: AuthPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const onSignIn = () => {
    setError(null);
    startTransition(async () => {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="rounded-3xl border border-orange-100 bg-white/80 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-500">
            Account
          </p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl">
            {user ? "Welcome back" : "Get started"}
          </h2>
        </div>
        <span className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700">
          Beta
        </span>
      </div>

      <div className="mt-6 space-y-4 text-sm text-[#4a4237]">
        <p>
          {user
            ? "You are signed in and ready to organize classes by subject and unit."
            : "Sign in to create subjects, upload context files, and connect Drive videos."}
        </p>
        {user && (
          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.25em] text-orange-400">
              Signed in as
            </p>
            <p className="mt-1 text-sm font-semibold text-[#2c261f]">
              {user.name || user.email || "Supabase user"}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-3">
        {!user ? (
          <button
            type="button"
            onClick={onSignIn}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#1c1b16] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2b241c] hover:shadow-[0_10px_30px_-16px_rgba(0,0,0,0.8)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Continue with Google
          </button>
        ) : (
          <button
            type="button"
            onClick={onSignOut}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-[#1c1b16]/10 bg-white px-6 py-3 text-sm font-semibold text-[#1c1b16] transition hover:-translate-y-0.5 hover:border-[#1c1b16]/40 hover:bg-[#f4ede4] hover:shadow-[0_10px_30px_-18px_rgba(0,0,0,0.45)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Sign out
          </button>
        )}
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="mt-8 border-t border-orange-100 pt-6 text-xs text-[#6d6256]">
        <p className="font-semibold text-[#3a332b]">Next up</p>
        <p className="mt-2">
          Create your first subject, add units, and upload lecture slides or
          PDFs to enrich the summaries.
        </p>
      </div>
    </div>
  );
}
