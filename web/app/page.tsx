import AuthPanel from "@/app/components/auth-panel";
import SubjectsPanel from "@/app/components/subjects-panel";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-500 shadow-sm">
            Drive Summaries
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          </div>
          <div className="space-y-6">
            <h1 className="font-[var(--font-display)] text-5xl leading-tight text-[#1c1b16] md:text-6xl">
              Turn Drive lectures into structured class notes.
            </h1>
            <p className="max-w-xl text-lg text-[#5b5247]">
              Organize your courses by subject and unit, enrich transcripts with
              PDFs and slides, and get AI summaries that actually match the
              class materials.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Subjects & units",
                body: "Organize each class by topic and keep every file attached to its unit.",
              },
              {
                title: "Context-aware summaries",
                body: "PDFs, docs, and slide decks become searchable context for better notes.",
              },
              {
                title: "Drive captions sync",
                body: "Extract captions once and combine them with your curated resources.",
              },
              {
                title: "Production-ready",
                body: "Supabase Auth, Postgres, and storage built for real usage.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-orange-100 bg-[color:var(--surface)] p-5 shadow-[0_12px_35px_-25px_rgba(15,23,42,0.5)]"
              >
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-[#61584c]">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-orange-100 bg-white/70 p-6 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.6)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
              Pipeline
            </p>
            <ol className="mt-4 space-y-3 text-sm text-[#4f473e]">
              <li className="flex items-center justify-between border-b border-orange-100 pb-3">
                <span>Capture Drive captions</span>
                <span className="text-orange-500">01</span>
              </li>
              <li className="flex items-center justify-between border-b border-orange-100 pb-3">
                <span>Upload PDFs and slides</span>
                <span className="text-orange-500">02</span>
              </li>
              <li className="flex items-center justify-between border-b border-orange-100 pb-3">
                <span>Embed and retrieve context</span>
                <span className="text-orange-500">03</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Generate lesson notes</span>
                <span className="text-orange-500">04</span>
              </li>
            </ol>
          </div>
        </section>

        <aside className="space-y-6">
          <AuthPanel
            user={
              user
                ? { email: user.email, name: user.user_metadata?.full_name }
                : null
            }
          />
          {user && <SubjectsPanel />}
          <div className="rounded-2xl border border-orange-100 bg-[color:var(--surface-alt)] p-6 text-sm text-[#4f473e]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
              Status
            </p>
            <p className="mt-3">
              Extension integration and file processing will land next. You can
              already sign in and prep your Supabase project.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
