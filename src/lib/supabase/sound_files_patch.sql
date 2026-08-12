-- Apply this in the Supabase SQL Editor for existing PeakHours projects.
-- It is safe to run more than once.

-- 1. Public storage bucket for user-uploaded sounds
INSERT INTO storage.buckets (id, name, public)
VALUES ('sound-files', 'sound-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS: users can only manage files inside their own folder
DROP POLICY IF EXISTS "sound-files select own" ON storage.objects;
CREATE POLICY "sound-files select own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'sound-files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "sound-files insert own" ON storage.objects;
CREATE POLICY "sound-files insert own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sound-files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "sound-files delete own" ON storage.objects;
CREATE POLICY "sound-files delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'sound-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Track uploaded sound files with friendly names
CREATE TABLE IF NOT EXISTS sound_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sound_files_user ON sound_files(user_id, created_at);

ALTER TABLE sound_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sound files" ON sound_files;
CREATE POLICY "Users can view own sound files"
  ON sound_files FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sound files" ON sound_files;
CREATE POLICY "Users can insert own sound files"
  ON sound_files FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sound files" ON sound_files;
CREATE POLICY "Users can delete own sound files"
  ON sound_files FOR DELETE USING (auth.uid() = user_id);

-- 4. Per-user sound selection (NULL = use bundled default sound)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS complete_sound_path TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS break_sound_path TEXT;

NOTIFY pgrst, 'reload schema';
