-- ============================================================
-- SPARKLEBOX OBSERVATION FEED — Supabase Schema
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- Observations table
create table observations (
  id uuid default gen_random_uuid() primary key,
  post_slug text not null,
  display_name text default 'Anonymous Observer',
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz default now()
);

-- Responses table
create table responses (
  id uuid default gen_random_uuid() primary key,
  observation_id uuid references observations(id) on delete cascade,
  display_name text default 'Anonymous Observer',
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz default now()
);

-- Indexes for fast lookups
create index idx_observations_post_slug on observations(post_slug);
create index idx_observations_created_at on observations(created_at desc);
create index idx_responses_observation_id on responses(observation_id);

-- Row Level Security
alter table observations enable row level security;
alter table responses enable row level security;

-- Anyone can read observations and responses
create policy "Public read observations" on observations
  for select using (true);

create policy "Public read responses" on responses
  for select using (true);

-- Anyone can insert (no auth required)
create policy "Public insert observations" on observations
  for insert with check (true);

create policy "Public insert responses" on responses
  for insert with check (true);

-- Only service role can update/delete (admin only)
create policy "Service delete observations" on observations
  for delete using (auth.role() = 'service_role');

create policy "Service delete responses" on responses
  for delete using (auth.role() = 'service_role');
