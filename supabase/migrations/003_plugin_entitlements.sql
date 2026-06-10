-- Plugin entitlements (Modern Writer)

CREATE TABLE plugin_entitlements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plugin_slug TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  revoked_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, plugin_slug)
);

CREATE INDEX plugin_entitlements_user_id_idx ON plugin_entitlements (user_id);

CREATE TRIGGER plugin_entitlements_set_updated_at
  BEFORE UPDATE ON plugin_entitlements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
