-- Apply this in the Supabase SQL Editor for existing PeakHours projects.
-- It is safe to run more than once.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_a_id < user_b_id),
  UNIQUE(user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_a ON friendships(user_a_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_b ON friendships(user_b_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;
CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE OR REPLACE FUNCTION search_profiles_by_display_name(search_query TEXT)
RETURNS TABLE (
  id UUID,
  display_name TEXT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name
  FROM profiles p
  WHERE auth.uid() IS NOT NULL
    AND length(trim(search_query)) >= 2
    AND p.id <> auth.uid()
    AND p.display_name ILIKE '%' || trim(search_query) || '%'
    AND NOT EXISTS (
      SELECT 1
      FROM friendships f
      WHERE f.user_a_id = LEAST(auth.uid(), p.id)
        AND f.user_b_id = GREATEST(auth.uid(), p.id)
    )
  ORDER BY p.display_name ASC, p.id ASC
  LIMIT 12;
$$;

CREATE OR REPLACE FUNCTION list_friends()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  friends_since TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, f.created_at AS friends_since
  FROM friendships f
  JOIN profiles p ON p.id = CASE
    WHEN f.user_a_id = auth.uid() THEN f.user_b_id
    ELSE f.user_a_id
  END
  WHERE auth.uid() IS NOT NULL
    AND (f.user_a_id = auth.uid() OR f.user_b_id = auth.uid())
  ORDER BY f.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION add_friend(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to add friends';
  END IF;

  IF target_user_id IS NULL OR target_user_id = current_user_id THEN
    RAISE EXCEPTION 'Choose another user to add as a friend';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = target_user_id) THEN
    RAISE EXCEPTION 'That user was not found';
  END IF;

  INSERT INTO friendships (user_a_id, user_b_id)
  VALUES (LEAST(current_user_id, target_user_id), GREATEST(current_user_id, target_user_id))
  ON CONFLICT (user_a_id, user_b_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION remove_friend(target_user_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM friendships
  WHERE auth.uid() IS NOT NULL
    AND user_a_id = LEAST(auth.uid(), target_user_id)
    AND user_b_id = GREATEST(auth.uid(), target_user_id);
$$;

CREATE OR REPLACE FUNCTION get_rankings(
  ranking_scope TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  total_minutes BIGINT,
  total_hours NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH visible_users AS (
    SELECT auth.uid() AS id
    WHERE auth.uid() IS NOT NULL
      AND ranking_scope = 'friends'

    UNION

    SELECT CASE
      WHEN f.user_a_id = auth.uid() THEN f.user_b_id
      ELSE f.user_a_id
    END AS id
    FROM friendships f
    WHERE auth.uid() IS NOT NULL
      AND ranking_scope = 'friends'
      AND (f.user_a_id = auth.uid() OR f.user_b_id = auth.uid())

    UNION

    SELECT p.id
    FROM profiles p
    WHERE auth.uid() IS NOT NULL
      AND ranking_scope = 'global'
  ),
  totals AS (
    SELECT
      p.id AS user_id,
      p.display_name,
      COALESCE(SUM(s.duration_minutes), 0)::BIGINT AS total_minutes
    FROM visible_users vu
    JOIN profiles p ON p.id = vu.id
    LEFT JOIN study_sessions s
      ON s.user_id = p.id
      AND s.started_at >= period_start
      AND s.started_at < period_end
    GROUP BY p.id, p.display_name
  )
  SELECT
    DENSE_RANK() OVER (ORDER BY totals.total_minutes DESC) AS rank,
    totals.user_id,
    totals.display_name,
    totals.total_minutes,
    ROUND((totals.total_minutes::NUMERIC / 60), 1) AS total_hours
  FROM totals
  WHERE ranking_scope IN ('friends', 'global')
  ORDER BY rank ASC, totals.display_name ASC
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION search_profiles_by_display_name(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION list_friends() TO authenticated;
GRANT EXECUTE ON FUNCTION add_friend(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_friend(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_rankings(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

NOTIFY pgrst, 'reload schema';
