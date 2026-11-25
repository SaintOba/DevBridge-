-- ============================================================================
-- DevBridge Row Level Security (RLS) lockdown
-- ============================================================================
-- Run this in the Supabase SQL Editor for your project
-- (Project → SQL Editor → New query → paste → Run).
--
-- Right now every table is wide open: any request with the anon key
-- (which is public — it's shipped in the browser) can read, write, or
-- delete ANY row. That means anyone can see every applicant's name and
-- email, delete every job, or edit anyone else's profile. These policies
-- restrict each table to what it should actually allow:
--   - jobs:          anyone can read; only admins can write/delete
--   - applications:  you can read/create your own; admins can read/manage all
--   - submissions:   same as applications
--   - skills:        you can only read/write your own
--   - messages:      you can only read messages you sent or received
--   - profiles:      anyone can read (needed for the admin "techies" list
--                     and for matching names to applications); you can only
--                     edit your own row, and only admins can flip is_admin
--
-- This assumes the column names already in your app: applications/
-- submissions/skills have a user_id column, messages has sender_id and
-- recipient_id, profiles has id (= auth.uid()) and is_admin. Adjust names
-- if yours differ.
-- ============================================================================

-- Helper: is the current request from a logged-in admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- JOBS — public can read, only admins can write/delete
-- ---------------------------------------------------------------------------
alter table public.jobs enable row level security;

drop policy if exists "jobs_select_all" on public.jobs;
create policy "jobs_select_all"
  on public.jobs for select
  using (true);

drop policy if exists "jobs_write_admin_only" on public.jobs;
create policy "jobs_write_admin_only"
  on public.jobs for insert
  with check (public.is_admin());

drop policy if exists "jobs_update_admin_only" on public.jobs;
create policy "jobs_update_admin_only"
  on public.jobs for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "jobs_delete_admin_only" on public.jobs;
create policy "jobs_delete_admin_only"
  on public.jobs for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- APPLICATIONS — owner can read/create their own; admins can read/manage all
-- ---------------------------------------------------------------------------
alter table public.applications enable row level security;

drop policy if exists "applications_select_own_or_admin" on public.applications;
create policy "applications_select_own_or_admin"
  on public.applications for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own"
  on public.applications for insert
  with check (auth.uid() = user_id);

-- Only admins change status (accept/reject); applicants can't edit their own.
drop policy if exists "applications_update_admin_only" on public.applications;
create policy "applications_update_admin_only"
  on public.applications for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "applications_delete_admin_only" on public.applications;
create policy "applications_delete_admin_only"
  on public.applications for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- SUBMISSIONS — same shape as applications
-- ---------------------------------------------------------------------------
alter table public.submissions enable row level security;

drop policy if exists "submissions_select_own_or_admin" on public.submissions;
create policy "submissions_select_own_or_admin"
  on public.submissions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "submissions_insert_own" on public.submissions;
create policy "submissions_insert_own"
  on public.submissions for insert
  with check (auth.uid() = user_id);

drop policy if exists "submissions_update_admin_only" on public.submissions;
create policy "submissions_update_admin_only"
  on public.submissions for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "submissions_delete_admin_only" on public.submissions;
create policy "submissions_delete_admin_only"
  on public.submissions for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- SKILLS — strictly your own
-- ---------------------------------------------------------------------------
alter table public.skills enable row level security;

drop policy if exists "skills_select_own_or_admin" on public.skills;
create policy "skills_select_own_or_admin"
  on public.skills for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "skills_insert_own" on public.skills;
create policy "skills_insert_own"
  on public.skills for insert
  with check (auth.uid() = user_id);

drop policy if exists "skills_update_own" on public.skills;
create policy "skills_update_own"
  on public.skills for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "skills_delete_own" on public.skills;
create policy "skills_delete_own"
  on public.skills for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- MESSAGES — only sender and recipient can see a message
-- ---------------------------------------------------------------------------
alter table public.messages enable row level security;

drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Only admins can send messages right now — the only messaging UI that
-- exists is on the admin dashboard (profile.js only reads messages, it has
-- no reply box). Loosen this to "auth.uid() = sender_id" later if/when a
-- techie-side reply feature is built.
drop policy if exists "messages_insert_as_self" on public.messages; -- old name, in case you ran an earlier version of this file
drop policy if exists "messages_insert_admin_only" on public.messages;
create policy "messages_insert_admin_only"
  on public.messages for insert
  with check (auth.uid() = sender_id and public.is_admin());

-- ---------------------------------------------------------------------------
-- PROFILES — readable by anyone (needed for the admin directory and for
-- showing applicant names), but you can only edit your own row, and only
-- an existing admin can grant/revoke is_admin on another row.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (
      is_admin = (select is_admin from public.profiles where id = auth.uid())
      or public.is_admin()
    )
  );

-- Profile rows are created by your signup flow (normally via a trigger on
-- auth.users, or an insert right after signup) — allow a user to insert
-- their own row once.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================================
-- After running this: test as a LOGGED-OUT user that you can still see jobs
-- and sign up, then test as a normal logged-in user that you can see your
-- own applications/submissions/skills but NOT someone else's by changing
-- the id in a request. Finally confirm your admin account still sees
-- everything in the dashboard.
-- ============================================================================
