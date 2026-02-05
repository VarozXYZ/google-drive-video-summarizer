# Drive Video Summarizer Web

Next.js app for authentication, subjects/units, and file uploads.

## Local setup

1) Install dependencies:
```bash
npm install
```

2) Ensure the root `.env` includes:
```bash
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
SUPABASE_SITE_URL=http://localhost:3000
SUPABASE_BUCKET_NAME=subject-files
```

3) Run the dev server:
```bash
npm run dev
```

The app reads the root `.env` via `dotenv` in `next.config.ts`.

## Supabase schema

Apply `web/supabase/schema.sql` in the Supabase SQL editor to create
subjects, units, files, videos, and summaries with RLS policies.
