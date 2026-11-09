-- ============================================================================
-- PromptVault — Phase 2: monetization + audience segmentation
-- Run AFTER schema.sql. Safe to re-run (idempotent).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Plans: 'free' | 'pro' (flipped by the Stripe webhook, read by RLS)
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists plan text not null default 'free' check (plan in ('free', 'pro'));

-- ----------------------------------------------------------------------------
-- Audience dimension — who a prompt is FOR (orthogonal to skill category)
-- ----------------------------------------------------------------------------
alter table public.prompts
  add column if not exists audience text not null default 'General';

create index if not exists prompts_audience_idx on public.prompts(audience);

-- ----------------------------------------------------------------------------
-- Subscriptions (written by the Stripe webhook via service role)
-- ----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                   bigint generated always as identity primary key,
  user_id              uuid not null unique references public.profiles(id) on delete cascade,
  stripe_customer_id   text not null unique,
  stripe_subscription_id text unique,
  status               text not null default 'incomplete',
  price_id             text,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "users read own subscription" on public.subscriptions;
create policy "users read own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Recreate the feed view to expose audience
-- ----------------------------------------------------------------------------
drop view if exists public.prompt_details;
create view public.prompt_details
with (security_invoker = on) as
select
  p.id, p.user_id, p.title, p.content, p.category, p.audience, p.tags,
  p.is_public, p.copy_count, p.created_at, p.updated_at,
  pr.username, pr.avatar_url,
  (select count(*) from public.likes l where l.prompt_id = p.id) as like_count
from public.prompts p
join public.profiles pr on pr.id = p.user_id;

-- ----------------------------------------------------------------------------
-- Free plan limit: 50 saved prompts — enforced by the DATABASE, not the UI
-- ----------------------------------------------------------------------------
drop policy if exists "users insert own prompts" on public.prompts;
create policy "users insert own prompts" on public.prompts
  for insert with check (
    auth.uid() = user_id
    and (
      (select plan from public.profiles where id = auth.uid()) = 'pro'
      or (select count(*) from public.prompts where user_id = auth.uid()) < 50
    )
  );

-- ----------------------------------------------------------------------------
-- Seed: assign audiences to the demo prompts
-- ----------------------------------------------------------------------------
update public.prompts set audience = 'Developers'     where id in ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002');
update public.prompts set audience = 'Marketers'      where id = 'aaaaaaaa-0000-0000-0000-000000000003';
update public.prompts set audience = 'Founders & CEOs' where id in ('aaaaaaaa-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000005');
update public.prompts set audience = 'Students'       where id = 'aaaaaaaa-0000-0000-0000-000000000006';
update public.prompts set audience = 'Designers'      where id in ('aaaaaaaa-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000008');
