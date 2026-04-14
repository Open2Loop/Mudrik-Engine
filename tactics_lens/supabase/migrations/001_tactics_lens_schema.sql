-- Tactics Lens Schema
-- All tables prefixed with tl_ to avoid collisions with existing Mudrik schema

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===== Categories =====
CREATE TABLE tl_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('qudurat', 'tahsili')),
  icon_name TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== Tactics =====
CREATE TABLE tl_tactics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES tl_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  duration_seconds INT DEFAULT 30,
  difficulty INT CHECK (difficulty BETWEEN 1 AND 5),
  view_count INT DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== Keywords =====
CREATE TABLE tl_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tactic_id UUID REFERENCES tl_tactics(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  weight FLOAT DEFAULT 1.0,
  UNIQUE(tactic_id, keyword)
);
CREATE INDEX idx_tl_keywords_keyword ON tl_keywords USING gin (keyword gin_trgm_ops);
CREATE INDEX idx_tl_keywords_tactic ON tl_keywords(tactic_id);

-- ===== User Profiles =====
CREATE TABLE tl_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  exam_type TEXT DEFAULT 'qudurat',
  total_scans INT DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'monthly', 'zanqa')),
  subscription_expires_at TIMESTAMPTZ,
  revenuecat_id TEXT,
  exam_date DATE,
  notifications_enabled BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'Asia/Riyadh',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== Scan History =====
CREATE TABLE tl_scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  matched_tactic_id UUID REFERENCES tl_tactics(id),
  match_score FLOAT,
  match_method TEXT DEFAULT 'keyword' CHECK (match_method IN ('keyword', 'fuzzy', 'ai_fallback', 'none')),
  ai_suggested_category_id UUID REFERENCES tl_categories(id),
  ai_confidence FLOAT,
  scanned_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tl_scan_history_user ON tl_scan_history(user_id);

-- ===== Favorites =====
CREATE TABLE tl_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tactic_id UUID REFERENCES tl_tactics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tactic_id)
);

-- ===== Analytics Events =====
CREATE TABLE tl_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== Notification Tokens =====
CREATE TABLE tl_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, fcm_token)
);

-- ===== Notification Log =====
CREATE TABLE tl_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  category_id UUID REFERENCES tl_categories(id),
  title_ar TEXT,
  body_ar TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ
);

-- ===== Video Access Log =====
CREATE TABLE tl_video_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tactic_id UUID REFERENCES tl_tactics(id),
  accessed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tl_video_access_user_date ON tl_video_access_log(user_id, accessed_at);

-- ===== RPC: Match Tactics =====
CREATE OR REPLACE FUNCTION tl_match_tactics(p_keywords TEXT[])
RETURNS TABLE(tactic_id UUID, title TEXT, video_url TEXT, thumbnail_url TEXT, score FLOAT) AS $$
  SELECT t.id, t.title, t.video_url, t.thumbnail_url,
         SUM(k.weight)::FLOAT AS score
  FROM tl_keywords k
  JOIN tl_tactics t ON t.id = k.tactic_id
  WHERE k.keyword = ANY(p_keywords)
  GROUP BY t.id, t.title, t.video_url, t.thumbnail_url
  ORDER BY score DESC
  LIMIT 10;
$$ LANGUAGE sql STABLE;

-- ===== RPC: Fuzzy Match =====
CREATE OR REPLACE FUNCTION tl_fuzzy_match_keywords(p_text TEXT, p_threshold FLOAT DEFAULT 0.3)
RETURNS TABLE(tactic_id UUID, title TEXT, video_url TEXT, thumbnail_url TEXT, similarity FLOAT) AS $$
  SELECT t.id, t.title, t.video_url, t.thumbnail_url,
         MAX(similarity(k.keyword, p_text)) AS similarity
  FROM tl_keywords k
  JOIN tl_tactics t ON t.id = k.tactic_id
  WHERE similarity(k.keyword, p_text) > p_threshold
  GROUP BY t.id, t.title, t.video_url, t.thumbnail_url
  ORDER BY similarity DESC
  LIMIT 5;
$$ LANGUAGE sql STABLE;

-- ===== RPC: Increment View =====
CREATE OR REPLACE FUNCTION tl_increment_view(p_tactic_id UUID)
RETURNS VOID AS $$
  UPDATE tl_tactics SET view_count = view_count + 1 WHERE id = p_tactic_id;
$$ LANGUAGE sql VOLATILE;

-- ===== RPC: Get Unpracticed Categories =====
CREATE OR REPLACE FUNCTION tl_get_unpracticed_categories(p_user_id UUID, p_days INT DEFAULT 3)
RETURNS TABLE(category_id UUID, category_name TEXT) AS $$
  SELECT c.id, c.name FROM tl_categories c
  WHERE c.id NOT IN (
    SELECT DISTINCT t.category_id FROM tl_scan_history sh
    JOIN tl_tactics t ON t.id = sh.matched_tactic_id
    WHERE sh.user_id = p_user_id AND sh.scanned_at > now() - (p_days || ' days')::interval
  );
$$ LANGUAGE sql STABLE;

-- ===== RLS Policies =====
ALTER TABLE tl_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_read" ON tl_categories FOR SELECT USING (true);

ALTER TABLE tl_tactics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tactics_read" ON tl_tactics FOR SELECT USING (true);

ALTER TABLE tl_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "keywords_read" ON tl_keywords FOR SELECT USING (true);

ALTER TABLE tl_user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_own" ON tl_user_profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE tl_scan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scan_own_read" ON tl_scan_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scan_own_insert" ON tl_scan_history FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE tl_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fav_own" ON tl_favorites FOR ALL USING (auth.uid() = user_id);

ALTER TABLE tl_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_insert" ON tl_events FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE tl_notification_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tokens_own" ON tl_notification_tokens FOR ALL USING (auth.uid() = user_id);

ALTER TABLE tl_notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_log_read" ON tl_notification_log FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE tl_video_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "video_log_insert" ON tl_video_access_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== Auto-create profile on signup =====
CREATE OR REPLACE FUNCTION tl_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tl_user_profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_tl
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION tl_handle_new_user();
