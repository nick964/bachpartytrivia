# Schema changes

`schema.sql` (repo root) is the base schema and was applied to Supabase
before this build started. The spec anticipates a few small extensions
("extend if needed, note in MIGRATIONS.md") — they are listed here in order.

## 2026-07-06 — playback tally, redo notes, email-send tracking

Run in the Supabase SQL editor:

```sql
-- Party-night tally ("she got it right/wrong"), keyed by question id.
alter table playback_state
  add column if not exists tally jsonb not null default '{}'::jsonb;

-- Optional note the MOH attaches when requesting a redo.
alter table questions
  add column if not exists redo_note text;

-- Send-once tracking for the reminder cron and the pre-deletion warning
-- email (simpler than an email log table for one email of each kind).
alter table events
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists deletion_warning_sent_at timestamptz;
```

Why:

- `playback_state.tally` — the spec's right/wrong drinking tally must survive
  TV reloads and sync over Realtime; a jsonb map keyed by question id.
- `questions.redo_note` — "Request redo" offers an optional short note.
- `events.reminder_sent_at` / `deletion_warning_sent_at` — both cron emails
  must send exactly once per event.

## 2026-07-07 — host greeting video

Run in the Supabase SQL editor:

```sql
-- Optional short hello the host records; shown to the responder before
-- the questions. One Cloudflare Stream video UID per event.
alter table events
  add column if not exists greeting_video_uid text;
```

Why:

- `events.greeting_video_uid` — the MOH/best man can record a greeting the
  groom/bride watches on the respond page intro. Stored on the event (one
  per event); deleted with the rest of the event's videos on expiry/delete.
