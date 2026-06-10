-- Row Level Security — users can only see their own data

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile" ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "own cosmetics" ON cosmetics
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own plugins" ON plugin_entitlements
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
