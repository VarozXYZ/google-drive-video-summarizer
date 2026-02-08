create extension if not exists "pgcrypto";

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  classroom_id text,
  drive_folder_id text,
  created_at timestamptz not null default now()
);

alter table public.subjects
  add column if not exists classroom_id text;

alter table public.subjects
  add column if not exists drive_folder_id text;

create unique index if not exists subjects_user_classroom_unique
  on public.subjects(user_id, classroom_id);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  mime text not null,
  storage_path text not null,
  status text not null default 'uploaded',
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  drive_id text,
  source_url text,
  status text not null default 'queued',
  title text,
  duration_seconds integer,
  transcript_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.summaries (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  model text,
  output text,
  created_at timestamptz not null default now()
);

create table if not exists public.file_jobs (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued',
  error_message text,
  stats jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.file_texts (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.google_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text,
  refresh_token text,
  token_type text,
  scope text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subject_drive_folders (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  drive_folder_id text not null,
  label text,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create unique index if not exists subject_drive_folder_unique
  on public.subject_drive_folders(subject_id, drive_folder_id);

create table if not exists public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued',
  error_message text,
  stats jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  code_verifier text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.subjects enable row level security;
alter table public.units enable row level security;
alter table public.files enable row level security;
alter table public.videos enable row level security;
alter table public.summaries enable row level security;
alter table public.file_jobs enable row level security;
alter table public.file_texts enable row level security;
alter table public.google_connections enable row level security;
alter table public.video_jobs enable row level security;
alter table public.oauth_states enable row level security;
alter table public.subject_drive_folders enable row level security;

create policy "subjects_select_own" on public.subjects
  for select using (auth.uid() = user_id);

create policy "subjects_insert_own" on public.subjects
  for insert with check (auth.uid() = user_id);

create policy "subjects_update_own" on public.subjects
  for update using (auth.uid() = user_id);

create policy "subjects_delete_own" on public.subjects
  for delete using (auth.uid() = user_id);

create policy "units_select_own" on public.units
  for select using (exists (
    select 1 from public.subjects
    where public.subjects.id = units.subject_id
      and public.subjects.user_id = auth.uid()
  ));

create policy "units_insert_own" on public.units
  for insert with check (exists (
    select 1 from public.subjects
    where public.subjects.id = units.subject_id
      and public.subjects.user_id = auth.uid()
  ));

create policy "units_update_own" on public.units
  for update using (exists (
    select 1 from public.subjects
    where public.subjects.id = units.subject_id
      and public.subjects.user_id = auth.uid()
  ));

create policy "units_delete_own" on public.units
  for delete using (exists (
    select 1 from public.subjects
    where public.subjects.id = units.subject_id
      and public.subjects.user_id = auth.uid()
  ));

create policy "files_select_own" on public.files
  for select using (auth.uid() = user_id);

create policy "files_insert_own" on public.files
  for insert with check (auth.uid() = user_id);

create policy "files_update_own" on public.files
  for update using (auth.uid() = user_id);

create policy "files_delete_own" on public.files
  for delete using (auth.uid() = user_id);

create policy "videos_select_own" on public.videos
  for select using (auth.uid() = user_id);

create policy "videos_insert_own" on public.videos
  for insert with check (auth.uid() = user_id);

create policy "videos_update_own" on public.videos
  for update using (auth.uid() = user_id);

create policy "videos_delete_own" on public.videos
  for delete using (auth.uid() = user_id);

create policy "summaries_select_own" on public.summaries
  for select using (auth.uid() = user_id);

create policy "summaries_insert_own" on public.summaries
  for insert with check (auth.uid() = user_id);

create policy "summaries_update_own" on public.summaries
  for update using (auth.uid() = user_id);

create policy "summaries_delete_own" on public.summaries
  for delete using (auth.uid() = user_id);

create policy "file_jobs_select_own" on public.file_jobs
  for select using (auth.uid() = user_id);

create policy "file_jobs_insert_own" on public.file_jobs
  for insert with check (auth.uid() = user_id);

create policy "file_jobs_update_own" on public.file_jobs
  for update using (auth.uid() = user_id);

create policy "file_jobs_delete_own" on public.file_jobs
  for delete using (auth.uid() = user_id);

create policy "file_texts_select_own" on public.file_texts
  for select using (auth.uid() = user_id);

create policy "file_texts_insert_own" on public.file_texts
  for insert with check (auth.uid() = user_id);

create policy "file_texts_update_own" on public.file_texts
  for update using (auth.uid() = user_id);

create policy "file_texts_delete_own" on public.file_texts
  for delete using (auth.uid() = user_id);

create policy "google_connections_select_own" on public.google_connections
  for select using (auth.uid() = user_id);

create policy "google_connections_insert_own" on public.google_connections
  for insert with check (auth.uid() = user_id);

create policy "google_connections_update_own" on public.google_connections
  for update using (auth.uid() = user_id);

create policy "google_connections_delete_own" on public.google_connections
  for delete using (auth.uid() = user_id);

create policy "video_jobs_select_own" on public.video_jobs
  for select using (auth.uid() = user_id);

create policy "video_jobs_insert_own" on public.video_jobs
  for insert with check (auth.uid() = user_id);

create policy "video_jobs_update_own" on public.video_jobs
  for update using (auth.uid() = user_id);

create policy "video_jobs_delete_own" on public.video_jobs
  for delete using (auth.uid() = user_id);

create policy "oauth_states_select_own" on public.oauth_states
  for select using (auth.uid() = user_id);

create policy "oauth_states_insert_own" on public.oauth_states
  for insert with check (auth.uid() = user_id);

create policy "oauth_states_update_own" on public.oauth_states
  for update using (auth.uid() = user_id);

create policy "oauth_states_delete_own" on public.oauth_states
  for delete using (auth.uid() = user_id);

create policy "subject_drive_folders_select_own" on public.subject_drive_folders
  for select using (auth.uid() = user_id);

create policy "subject_drive_folders_insert_own" on public.subject_drive_folders
  for insert with check (auth.uid() = user_id);

create policy "subject_drive_folders_update_own" on public.subject_drive_folders
  for update using (auth.uid() = user_id);

create policy "subject_drive_folders_delete_own" on public.subject_drive_folders
  for delete using (auth.uid() = user_id);
