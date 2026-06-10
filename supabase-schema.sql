-- ═══════════════════════════════════════════════════════════════
--  ICTU Football Madness — Supabase Database Schema
--  Run this in your Supabase project: SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════

-- 1. COMPETITIONS
--    One row per tournament (World Cup 2026, UCL 2026/27, Euros 2028…)
create table if not exists competitions (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,          -- e.g. "wc2026"
  name        text not null,                 -- e.g. "World Cup 2026"
  sport       text not null default 'football',
  logo_url    text,
  start_date  date,
  end_date    date,
  is_active   boolean not null default true,
  scoring     jsonb not null default '{
    "exact_score": 5,
    "correct_result": 3,
    "tournament_winner": 10,
    "golden_boot": 10
  }',
  created_at  timestamptz default now()
);

-- 2. PARTICIPANTS
--    People who enter the competition
create table if not exists participants (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid references competitions(id) on delete cascade,
  name           text not null,
  email          text,
  avatar_url     text,                       -- uploaded photo or null for initials
  avatar_initials text,                      -- e.g. "JD" — auto-generated
  avatar_color   text,                       -- hex colour for initials avatar
  paid_jackpot   boolean default false,
  created_at     timestamptz default now()
);

-- 3. MATCHES
--    All fixtures for a competition (auto-populated from Excel or API)
create table if not exists matches (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid references competitions(id) on delete cascade,
  match_date     date,
  match_time     time,
  stage          text not null default 'group', -- group | r32 | r16 | qf | sf | final
  home_team      text not null,
  away_team      text not null,
  home_score     int,                           -- null until played
  away_score     int,                           -- null until played
  status         text default 'scheduled',      -- scheduled | live | finished
  api_match_id   text,                          -- ID from api-football for syncing
  created_at     timestamptz default now()
);

-- 4. PREDICTIONS
--    Each participant's predicted score per match
create table if not exists predictions (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid references competitions(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  match_id       uuid references matches(id) on delete cascade,
  home_score     int,
  away_score     int,
  created_at     timestamptz default now(),
  unique(participant_id, match_id)
);

-- 5. SPECIAL_PREDICTIONS
--    Tournament winner + golden boot (one row per participant per competition)
create table if not exists special_predictions (
  id                    uuid primary key default gen_random_uuid(),
  competition_id        uuid references competitions(id) on delete cascade,
  participant_id        uuid references participants(id) on delete cascade,
  tournament_winner     text,
  golden_boot_player    text,
  created_at            timestamptz default now(),
  unique(participant_id, competition_id)
);

-- 6. SCORES (materialised — recalculated after each match result comes in)
create table if not exists scores (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid references competitions(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  total_points   int not null default 0,
  exact_scores   int not null default 0,
  correct_results int not null default 0,
  accuracy_pct   numeric(5,2) default 0,
  last_updated   timestamptz default now(),
  unique(participant_id, competition_id)
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_matches_competition on matches(competition_id);
create index if not exists idx_predictions_participant on predictions(participant_id);
create index if not exists idx_scores_competition on scores(competition_id, total_points desc);

-- ── Row-Level Security (public read for dashboard, write needs service key) ──
alter table competitions enable row level security;
alter table participants enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;
alter table special_predictions enable row level security;
alter table scores enable row level security;

-- Public can read everything (for the live dashboard)
create policy "public read competitions"  on competitions  for select using (true);
create policy "public read participants"  on participants  for select using (true);
create policy "public read matches"       on matches       for select using (true);
create policy "public read predictions"   on predictions   for select using (true);
create policy "public read specials"      on special_predictions for select using (true);
create policy "public read scores"        on scores        for select using (true);

-- ── Storage bucket for avatars ───────────────────────────────────────────────
-- Run this separately in Supabase Storage settings, or via:
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
