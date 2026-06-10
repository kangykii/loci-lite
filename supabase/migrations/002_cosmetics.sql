-- Cosmetics unlocked per user

CREATE TABLE cosmetics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

CREATE INDEX cosmetics_user_id_idx ON cosmetics (user_id);

CREATE TRIGGER cosmetics_set_updated_at
  BEFORE UPDATE ON cosmetics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
