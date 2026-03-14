-- ============================================================
-- PLATEFORME CGI - Schéma de base de données
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE : Profils consultants
-- ============================================================
CREATE TABLE IF NOT EXISTS consultant_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name   TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : Sessions d'upload/génération
-- ============================================================
CREATE TABLE IF NOT EXISTS cv_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_cv_path    TEXT NOT NULL,
  skills_sheet_path   TEXT,
  job_title           TEXT,
  status              TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'error')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : Versions de CV générées
-- ============================================================
CREATE TABLE IF NOT EXISTS cv_versions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID REFERENCES cv_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  version_number   INTEGER NOT NULL CHECK (version_number BETWEEN 1 AND 3),
  version_type     TEXT NOT NULL CHECK (version_type IN ('technique', 'experience', 'equilibre')),
  title            TEXT NOT NULL DEFAULT '',
  angle            TEXT DEFAULT '',
  cv_data          JSONB NOT NULL DEFAULT '{}',
  pdf_path         TEXT,
  is_selected      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cv_sessions_user_id ON cv_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_sessions_created_at ON cv_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cv_versions_session_id ON cv_versions(session_id);
CREATE INDEX IF NOT EXISTS idx_cv_versions_user_id ON cv_versions(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE consultant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_versions ENABLE ROW LEVEL SECURITY;

-- Politiques consultant_profiles
CREATE POLICY "Users can view their own profile"
  ON consultant_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON consultant_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON consultant_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Politiques cv_sessions
CREATE POLICY "Users can view their own sessions"
  ON cv_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON cv_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON cv_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Politiques cv_versions
CREATE POLICY "Users can view their own versions"
  ON cv_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own versions"
  ON cv_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own versions"
  ON cv_versions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own versions"
  ON cv_versions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- (À créer manuellement dans Supabase > Storage OU via ce SQL)
-- ============================================================

-- Bucket pour les CV uploadés
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-uploads',
  'cv-uploads',
  false,
  20971520,  -- 20 MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
) ON CONFLICT (id) DO NOTHING;

-- Bucket pour les fiches de compétences
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'skills-sheets',
  'skills-sheets',
  false,
  20971520,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
) ON CONFLICT (id) DO NOTHING;

-- Bucket pour les CV générés (PDF)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-generated',
  'cv-generated',
  false,
  20971520,
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================

-- cv-uploads: chaque user ne voit que son dossier
CREATE POLICY "cv-uploads: users access own folder"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'cv-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'cv-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- skills-sheets: idem
CREATE POLICY "skills-sheets: users access own folder"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'skills-sheets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'skills-sheets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- cv-generated: idem
CREATE POLICY "cv-generated: users access own folder"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'cv-generated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'cv-generated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role bypass (pour le backend)
CREATE POLICY "Service role bypass cv-uploads"
  ON storage.objects FOR ALL
  USING (bucket_id = 'cv-uploads')
  WITH CHECK (bucket_id = 'cv-uploads');

CREATE POLICY "Service role bypass skills-sheets"
  ON storage.objects FOR ALL
  USING (bucket_id = 'skills-sheets')
  WITH CHECK (bucket_id = 'skills-sheets');

CREATE POLICY "Service role bypass cv-generated"
  ON storage.objects FOR ALL
  USING (bucket_id = 'cv-generated')
  WITH CHECK (bucket_id = 'cv-generated');
