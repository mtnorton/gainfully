-- Run this in the Supabase SQL editor.
-- Drops the old blob table and creates normalized tables with RLS.

DROP TABLE IF EXISTS user_profiles;

-- ── tasks ────────────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id          text        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  category    text        NOT NULL,
  xp          integer     NOT NULL,
  completed   boolean     NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at  timestamptz NOT NULL,
  company     text,
  job_title   text,
  activity_date date,
  ats         text
);
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their tasks"
  ON tasks FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── outcomes ─────────────────────────────────────────────────────────────────
CREATE TABLE outcomes (
  id          text        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     text        NOT NULL,
  type        text        NOT NULL,
  date        date        NOT NULL,
  notes       text,
  xp_awarded  integer     NOT NULL,
  created_at  timestamptz NOT NULL
);
CREATE INDEX outcomes_user_id_idx ON outcomes(user_id);
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their outcomes"
  ON outcomes FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── user_badges ───────────────────────────────────────────────────────────────
-- Only stores earned badges; the full badge list is derived from app code.
CREATE TABLE user_badges (
  user_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id  text        NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their badges"
  ON user_badges FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── custom_activities ─────────────────────────────────────────────────────────
CREATE TABLE custom_activities (
  id         text        PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  category   text        NOT NULL,
  xp         integer     NOT NULL,
  created_at timestamptz NOT NULL
);
CREATE INDEX custom_activities_user_id_idx ON custom_activities(user_id);
ALTER TABLE custom_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their custom activities"
  ON custom_activities FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── user_settings ─────────────────────────────────────────────────────────────
-- Stores xp_overrides (and a home for future per-user preferences).
CREATE TABLE user_settings (
  user_id      uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_overrides jsonb   NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their settings"
  ON user_settings FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
