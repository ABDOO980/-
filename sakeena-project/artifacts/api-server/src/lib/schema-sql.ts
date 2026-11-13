// Generated from lib/db/schema.sql — idempotent (CREATE TABLE IF NOT EXISTS).
export const SCHEMA_SQL = `-- سَكينة — Complete database schema
-- Hand-written to mirror lib/db/src/schema/index.ts exactly. If you have
-- drizzle-kit available, \`pnpm --filter @workspace/db drizzle-kit push\` is
-- the source of truth; this file is a plain-SQL equivalent for anyone
-- setting up the database directly (e.g. via psql or a hosting provider's
-- SQL console) without running the Node toolchain first.
-- Safe to re-run: every statement is IF NOT EXISTS / idempotent-friendly.

-- ============================================================================
-- dua_requests / dua_ameens — "دعاء لمن تحب" rotating dua wall
-- ============================================================================
CREATE TABLE IF NOT EXISTS dua_requests (
  id SERIAL PRIMARY KEY,
  kind VARCHAR(16) NOT NULL,
  beneficiary_name VARCHAR(120),
  prayer_text TEXT NOT NULL,
  normalized_key VARCHAR(500) NOT NULL,
  supporter_count INTEGER NOT NULL DEFAULT 1,
  ameen_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  turn_start_at TIMESTAMPTZ NOT NULL,
  turn_end_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT dua_requests_normalized_key_unique UNIQUE (normalized_key)
);

CREATE TABLE IF NOT EXISTS dua_ameens (
  id SERIAL PRIMARY KEY,
  dua_id INTEGER NOT NULL,
  visitor_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dua_ameens_dua_visitor_unique UNIQUE (dua_id, visitor_id)
);

-- ============================================================================
-- users — one anonymous row per device (deviceId), optionally later
-- "claimed" with a real email/password.
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  password_hash VARCHAR(255),
  display_name VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  CONSTRAINT users_device_id_unique UNIQUE (device_id),
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- ============================================================================
-- bookmarks — Quran verse bookmarks
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  note VARCHAR(250),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bookmarks_user_surah_ayah_unique UNIQUE (user_id, surah_number, ayah_number)
);

-- ============================================================================
-- khatmah — personal Quran read-through tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS khatmah (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL DEFAULT 'ختمتي',
  last_surah_number INTEGER NOT NULL DEFAULT 1,
  last_ayah_number INTEGER NOT NULL DEFAULT 1,
  completed_juz_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- user_preferences — one row per user (reciter, theme, prayer location)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_reciter VARCHAR(80) NOT NULL DEFAULT 'mishary',
  theme VARCHAR(10) NOT NULL DEFAULT 'dark',
  prayer_city VARCHAR(120),
  prayer_country VARCHAR(120),
  prayer_lat VARCHAR(32),
  prayer_lng VARCHAR(32),
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- favorite_hadiths — per-user saved hadiths
-- ============================================================================
CREATE TABLE IF NOT EXISTS favorite_hadiths (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hadith_id VARCHAR(80) NOT NULL,
  hadith_text TEXT NOT NULL,
  source VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT favorite_hadiths_user_hadith_unique UNIQUE (user_id, hadith_id)
);

-- ============================================================================
-- quiz_progress — cumulative per-user, per-category quiz stats
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(60) NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quiz_progress_user_category_unique UNIQUE (user_id, category)
);

-- ============================================================================
-- completed_adhkar — daily dhikr-session completion log
-- ============================================================================
CREATE TABLE IF NOT EXISTS completed_adhkar (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id VARCHAR(60) NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- hadiths — admin-managed hadith bank ("general" + "neglected-sunnah")
-- ============================================================================
CREATE TABLE IF NOT EXISTS hadiths (
  id SERIAL PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  text TEXT NOT NULL,
  source VARCHAR(160) NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  category VARCHAR(40) NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- fatwas — admin-managed fatwa bank (seeded with a small Ibn Baz starter set)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fatwas (
  id SERIAL PRIMARY KEY,
  category VARCHAR(60) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- quiz_questions — admin-managed MCQ bank (fiqh/seerah/quran/names/aqeedah)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  category VARCHAR(40) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  question TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- push_subscriptions — Web Push subscriptions (one or more per user/device)
-- ============================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh VARCHAR(200) NOT NULL,
  auth VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint)
);

-- ============================================================================
-- weekly_challenges / weekly_challenge_results — Friday competition
-- ============================================================================
CREATE TABLE IF NOT EXISTS weekly_challenges (
  id SERIAL PRIMARY KEY,
  week_key VARCHAR(10) NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT weekly_challenges_week_key_unique UNIQUE (week_key)
);

CREATE TABLE IF NOT EXISTS weekly_challenge_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_key VARCHAR(10) NOT NULL,
  score INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT weekly_challenge_results_user_week_unique UNIQUE (user_id, week_key)
);

-- ============================================================================
-- quiz_rooms / quiz_room_participants — family/group real-time battles
-- (live round state lives only in the Socket.io server's memory, not here)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_rooms (
  id SERIAL PRIMARY KEY,
  code VARCHAR(6) NOT NULL,
  host_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(60) NOT NULL DEFAULT 'fiqh',
  status VARCHAR(20) NOT NULL DEFAULT 'lobby',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quiz_rooms_code_unique UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS quiz_room_participants (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES quiz_rooms(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname VARCHAR(60) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quiz_room_participants_room_user_unique UNIQUE (room_id, user_id)
);

-- ============================================================================
-- group_counters — shared real-time dhikr counters (Hawqala, Friday salawat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_counters (
  id SERIAL PRIMARY KEY,
  key VARCHAR(40) NOT NULL,
  label VARCHAR(120) NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  target INTEGER,
  period_key VARCHAR(20),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT group_counters_key_unique UNIQUE (key)
);

-- ============================================================================
-- group_duas — durable moderation log of every dua-wall submission
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_duas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind VARCHAR(16) NOT NULL,
  beneficiary_name VARCHAR(120),
  prayer_text TEXT NOT NULL,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- group_khatmah / group_khatmah_claims — shared family/group Quran read-through
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_khatmah (
  id SERIAL PRIMARY KEY,
  code VARCHAR(8) NOT NULL,
  title VARCHAR(120) NOT NULL,
  creator_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT group_khatmah_code_unique UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS group_khatmah_claims (
  id SERIAL PRIMARY KEY,
  group_khatmah_id INTEGER NOT NULL REFERENCES group_khatmah(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname VARCHAR(60) NOT NULL,
  juz_number INTEGER NOT NULL,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT group_khatmah_claims_khatmah_juz_unique UNIQUE (group_khatmah_id, juz_number)
);
`;
