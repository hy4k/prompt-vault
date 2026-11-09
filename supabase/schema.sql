-- ============================================================================
-- PromptVault — Supabase database schema
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Safe to re-run (idempotent).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text not null unique check (char_length(username) between 3 and 30),
  avatar_url      text,
  bio             text not null default '',
  follower_count  integer not null default 0,
  following_count integer not null default 0,
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Prompts (private by default; owner can publish)
-- ----------------------------------------------------------------------------
create table if not exists public.prompts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 120),
  content    text not null,
  category   text not null default 'Other'
             check (category in ('Coding','Copywriting','Marketing','Productivity','Art/Midjourney','Other')),
  tags       text[] not null default '{}',
  is_public  boolean not null default false,
  copy_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prompts_user_idx     on public.prompts(user_id);
create index if not exists prompts_category_idx on public.prompts(category);
create index if not exists prompts_public_idx   on public.prompts(created_at desc) where is_public;

-- ----------------------------------------------------------------------------
-- Likes
-- ----------------------------------------------------------------------------
create table if not exists public.likes (
  prompt_id  uuid not null references public.prompts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (prompt_id, user_id)
);

-- ----------------------------------------------------------------------------
-- Follows (creator follow system)
-- ----------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists follows_followee_idx on public.follows(followee_id);

-- ----------------------------------------------------------------------------
-- Trigger: auto-create a profile when a user signs up
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: any users who signed up before this schema was applied still get a profile
insert into public.profiles (id, username)
select id, coalesce(raw_user_meta_data->>'username', 'user_' || substr(id::text, 1, 8))
from auth.users
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Trigger: keep prompts.updated_at fresh
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prompts_touch on public.prompts;
create trigger prompts_touch
  before update on public.prompts
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Trigger: maintain follower_count / following_count on profiles
-- ----------------------------------------------------------------------------
create or replace function public.sync_follow_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set follower_count  = follower_count + 1 where id = new.followee_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    return new;
  else
    update public.profiles set follower_count  = greatest(follower_count - 1, 0) where id = old.followee_id;
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    return old;
  end if;
end;
$$;

drop trigger if exists follows_sync on public.follows;
create trigger follows_sync
  after insert or delete on public.follows
  for each row execute function public.sync_follow_counts();

-- ----------------------------------------------------------------------------
-- Read model: prompts joined with author + like count (used by the feed)
-- ----------------------------------------------------------------------------
create or replace view public.prompt_details
with (security_invoker = on) as
select
  p.id, p.user_id, p.title, p.content, p.category, p.tags,
  p.is_public, p.copy_count, p.created_at, p.updated_at,
  pr.username, pr.avatar_url,
  (select count(*) from public.likes l where l.prompt_id = p.id) as like_count
from public.prompts p
join public.profiles pr on pr.id = p.user_id;

-- ----------------------------------------------------------------------------
-- RPC: bump the copy counter from the client
-- ----------------------------------------------------------------------------
create or replace function public.increment_copy_count(prompt_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.prompts set copy_count = copy_count + 1 where id = prompt_id;
$$;

-- Total copies across the platform (used by the Express /api/stats endpoint)
create or replace function public.platform_copy_total()
returns bigint
language sql
security definer
set search_path = public
as $$
  select coalesce(sum(copy_count), 0) from public.prompts;
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.prompts  enable row level security;
alter table public.likes    enable row level security;
alter table public.follows  enable row level security;

-- profiles: public read, users manage only their own
drop policy if exists "profiles readable by everyone" on public.profiles;
create policy "profiles readable by everyone"
  on public.profiles for select using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- prompts: public prompts readable by anyone, owner has full access
drop policy if exists "public prompts readable owners read all" on public.prompts;
create policy "public prompts readable owners read all"
  on public.prompts for select using (is_public or auth.uid() = user_id);

drop policy if exists "users insert own prompts" on public.prompts;
create policy "users insert own prompts"
  on public.prompts for insert with check (auth.uid() = user_id);

drop policy if exists "users update own prompts" on public.prompts;
create policy "users update own prompts"
  on public.prompts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users delete own prompts" on public.prompts;
create policy "users delete own prompts"
  on public.prompts for delete using (auth.uid() = user_id);

-- likes
drop policy if exists "likes readable by everyone" on public.likes;
create policy "likes readable by everyone"
  on public.likes for select using (true);

drop policy if exists "users like as themselves" on public.likes;
create policy "users like as themselves"
  on public.likes for insert with check (auth.uid() = user_id);

drop policy if exists "users unlike as themselves" on public.likes;
create policy "users unlike as themselves"
  on public.likes for delete using (auth.uid() = user_id);

-- follows
drop policy if exists "follows readable by everyone" on public.follows;
create policy "follows readable by everyone"
  on public.follows for select using (true);

drop policy if exists "users follow as themselves" on public.follows;
create policy "users follow as themselves"
  on public.follows for insert with check (auth.uid() = follower_id);

drop policy if exists "users unfollow as themselves" on public.follows;
create policy "users unfollow as themselves"
  on public.follows for delete using (auth.uid() = follower_id);
