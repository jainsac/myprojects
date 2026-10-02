CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
 CREATE TYPE account_status AS ENUM ('active','paused','deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
 CREATE TYPE spark_status AS ENUM ('pending','accepted','declined','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
 CREATE TYPE room_type AS ENUM ('activity','game','music','social');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
 CREATE TYPE room_role AS ENUM ('host','participant','spectator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
 CREATE TYPE request_status AS ENUM ('pending','accepted','declined','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
 CREATE TYPE report_status AS ENUM ('open','reviewing','resolved','dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 auth_user_id text NOT NULL UNIQUE,
 email text UNIQUE,
 phone text,
 status account_status NOT NULL DEFAULT 'active',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS profiles (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 display_name text NOT NULL,
 date_of_birth date,
 city text,
 bio text,
 avatar_url text,
 voice_intro_url text,
 relationship_goals jsonb NOT NULL DEFAULT '[]'::jsonb,
 communication_style text,
 lifestyle_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
 family_expectations jsonb NOT NULL DEFAULT '{}'::jsonb,
 privacy_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
 verification jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS interests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE,
 name text NOT NULL,
 category text
);
CREATE TABLE IF NOT EXISTS user_interests (
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 interest_id uuid NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, interest_id)
);
CREATE TABLE IF NOT EXISTS activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,
 category text NOT NULL,
 description text,
 city text,
 capacity integer,
 is_public boolean NOT NULL DEFAULT true,
 starts_at timestamptz,
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS activity_participants (
 activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role text NOT NULL DEFAULT 'participant',
 joined_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (activity_id, user_id)
);
CREATE TABLE IF NOT EXISTS rooms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,
 type room_type NOT NULL,
 city text,
 description text,
 activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
 host_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 capacity integer,
 camera_default boolean NOT NULL DEFAULT false,
 mic_default boolean NOT NULL DEFAULT false,
 is_live boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS room_members (
 room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role room_role NOT NULL DEFAULT 'participant',
 joined_at timestamptz NOT NULL DEFAULT now(),
 left_at timestamptz,
 PRIMARY KEY (room_id, user_id)
);
CREATE TABLE IF NOT EXISTS sparks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 status spark_status NOT NULL DEFAULT 'pending',
 message text,
 created_at timestamptz NOT NULL DEFAULT now(),
 responded_at timestamptz
);
CREATE TABLE IF NOT EXISTS matches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_a_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 user_b_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 source text NOT NULL DEFAULT 'spark',
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_a_id, user_b_id)
);
CREATE TABLE IF NOT EXISTS messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
 sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 body text NOT NULL,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 deleted_at timestamptz
);
CREATE TABLE IF NOT EXISTS memories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 other_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 fact text NOT NULL,
 source_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
 confirmed boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS compass_responses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 category text NOT NULL,
 response jsonb NOT NULL,
 visibility text NOT NULL DEFAULT 'match',
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, category)
);
CREATE TABLE IF NOT EXISTS missions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,
 description text NOT NULL,
 type text NOT NULL,
 config jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mission_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
 score real,
 result jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS connection_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_a_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 user_b_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 event_type text NOT NULL,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS date_plans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
 title text NOT NULL,
 city text,
 venue text,
 starts_at timestamptz,
 budget_min integer,
 budget_max integer,
 safety_plan jsonb NOT NULL DEFAULT '{}'::jsonb,
 status text NOT NULL DEFAULT 'draft',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 reported_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 category text NOT NULL,
 details text,
 status report_status NOT NULL DEFAULT 'open',
 created_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz
);
CREATE TABLE IF NOT EXISTS blocks (
 blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (blocker_id, blocked_id)
);
CREATE TABLE IF NOT EXISTS cheers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
 reaction text NOT NULL DEFAULT '👏',
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activities_city_idx ON activities(city);
CREATE INDEX IF NOT EXISTS rooms_city_idx ON rooms(city);
CREATE INDEX IF NOT EXISTS sparks_to_user_idx ON sparks(to_user_id, status);
CREATE INDEX IF NOT EXISTS matches_user_a_idx ON matches(user_a_id);
CREATE INDEX IF NOT EXISTS matches_user_b_idx ON matches(user_b_id);
CREATE INDEX IF NOT EXISTS messages_match_idx ON messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS connection_events_pair_idx ON connection_events(user_a_id, user_b_id, occurred_at);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
