-- Bach Game App — Supabase schema
-- Auth is handled by Clerk; these tables are accessed server-side only
-- (service role key in Next.js route handlers). RLS locked down to deny
-- anon/authed access since no client ever talks to Supabase directly,
-- EXCEPT realtime subscriptions on playback_state / responses.

create type honoree_role as enum ('bride', 'groom');
create type event_status as enum ('draft', 'awaiting_responses', 'ready', 'completed', 'expired');
create type response_status as enum ('pending', 'uploading', 'ready', 'errored');
create type question_source as enum ('sample', 'custom');
create type playback_phase as enum ('question', 'reveal');

create table events (
  id                uuid primary key default gen_random_uuid(),
  owner_clerk_id    text not null,
  title             text not null,
  honoree_name      text not null,                -- who records: "Mike"
  honoree_role      honoree_role not null,        -- groom records for bachelorette, bride for bachelor
  theme             text not null default 'blush',
  party_date        date not null,
  status            event_status not null default 'draft',
  respond_token     text not null unique default replace(gen_random_uuid()::text, '-', ''),
  playback_token    text not null unique default replace(gen_random_uuid()::text, '-', ''),
  is_premium        boolean not null default false,
  stripe_payment_id text,
  videos_deleted_at timestamptz,                  -- set by lifecycle cron after Stream cleanup
  created_at        timestamptz not null default now()
);

create index idx_events_owner on events (owner_clerk_id);
create index idx_events_respond_token on events (respond_token);
create index idx_events_playback_token on events (playback_token);
-- lifecycle cron: where status != 'expired' and party_date + 30 < current_date
create index idx_events_party_date on events (party_date) where videos_deleted_at is null;

create table questions (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  text        text not null,
  sort_order  int not null,
  is_hidden   boolean not null default false,     -- MOH hides from party playback
  source      question_source not null default 'custom',
  needs_redo  boolean not null default false,     -- MOH re-requested this recording
  created_at  timestamptz not null default now(),
  unique (event_id, sort_order)
);

create index idx_questions_event on questions (event_id);
-- Free tier limit (3 questions) enforced in the route handler on insert,
-- checked against events.is_premium.

create table responses (
  id               uuid primary key default gen_random_uuid(),
  question_id      uuid not null references questions(id) on delete cascade,
  stream_video_uid text,                          -- Cloudflare Stream UID only; sign playback URLs at watch time
  status           response_status not null default 'pending',
  duration_seconds int,
  recorded_at      timestamptz,
  unique (question_id)                            -- one active response per question; re-record overwrites
);

create index idx_responses_question on responses (question_id);

-- One row per event, driven by the MOH's phone-as-remote, subscribed to by TV mode
create table playback_state (
  event_id               uuid primary key references events(id) on delete cascade,
  current_question_index int not null default 0,
  phase                  playback_phase not null default 'question',
  updated_at             timestamptz not null default now()
);

create table sample_questions (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  role       honoree_role,                        -- null = works for both editions
  sort_hint  int not null default 0
);

insert into sample_questions (text, role, sort_hint) values
  ('Where was your first date?', null, 1),
  ('Who said "I love you" first?', null, 2),
  ('What was your first impression of them?', null, 3),
  ('What''s their most annoying habit?', null, 4),
  ('Who''s the better cook?', null, 5),
  ('What''s their go-to drink order?', null, 6),
  ('Who takes longer to get ready?', null, 7),
  ('What song reminds you of them?', null, 8),
  ('Who''s more likely to get lost without GPS?', null, 9),
  ('Describe their family in three words. Choose wisely.', null, 10),
  ('What were you thinking the first time you saw her in her wedding dress inspiration?', 'groom', 11),
  ('What did you tell your friends after the first date?', null, 12),
  ('Who wears the pants in the relationship?', null, 13),
  ('What''s one thing they''d grab in a fire (besides you)?', null, 14),
  ('Impersonate them ordering at a restaurant.', null, 15);

-- Realtime: enable on the two tables clients subscribe to
alter publication supabase_realtime add table playback_state;
alter publication supabase_realtime add table responses;

-- RLS: deny-by-default for anon/authenticated (all app access uses service role).
alter table events enable row level security;
alter table questions enable row level security;
alter table responses enable row level security;
alter table sample_questions enable row level security;
alter table playback_state enable row level security;

-- Read-only policies for the realtime-subscribed tables.
-- NOTE: for MVP this allows any anon client with the event UUID to read
-- playback/response status rows (no video URLs — those are signed server-side).
-- Tighten later by minting Supabase JWTs scoped per event if desired.
create policy "anon read playback_state" on playback_state for select using (true);
create policy "anon read responses" on responses for select using (true);
