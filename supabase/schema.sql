-- Ejecutar en Supabase SQL Editor.
-- Cada persona solo ve y edita sus propios intentos y borradores.
create table if not exists public.attempts(
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 mode text not null check (char_length(mode) between 1 and 100),
 category text not null check (char_length(category) between 1 and 100),
 score integer not null check(score between 0 and 100),
 correct integer not null check(correct >= 0),
 total integer not null check(total > 0),
 duration_seconds integer not null check(duration_seconds >= 0),
 completed_at timestamptz not null default now(),
 breakdown jsonb not null default '{}'::jsonb,
 review jsonb not null default '[]'::jsonb
);
create index if not exists attempts_user_date_idx on public.attempts(user_id,completed_at desc);
alter table public.attempts enable row level security;
drop policy if exists "Select own attempts" on public.attempts;
create policy "Select own attempts" on public.attempts for select to authenticated using (auth.uid()=user_id);
drop policy if exists "Insert own attempts" on public.attempts;
create policy "Insert own attempts" on public.attempts for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "Update own attempts" on public.attempts;
create policy "Update own attempts" on public.attempts for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "Delete own attempts" on public.attempts;
create policy "Delete own attempts" on public.attempts for delete to authenticated using (auth.uid()=user_id);
create table if not exists public.drafts(
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.drafts enable row level security;
drop policy if exists "Select own drafts" on public.drafts;
create policy "Select own drafts" on public.drafts for select to authenticated using (auth.uid()=user_id);
drop policy if exists "Insert own drafts" on public.drafts;
create policy "Insert own drafts" on public.drafts for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "Update own drafts" on public.drafts;
create policy "Update own drafts" on public.drafts for update to authenticated using (auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "Delete own drafts" on public.drafts;
create policy "Delete own drafts" on public.drafts for delete to authenticated using (auth.uid()=user_id);
revoke all on public.attempts,public.drafts from anon;
grant select,insert,update,delete on public.attempts,public.drafts to authenticated;
