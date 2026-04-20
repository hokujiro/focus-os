-- FOCUS OS — PER-USER ISOLATION MIGRATION
-- Run this in the Supabase SQL Editor

-- 1. Add user_id to topics and projects
ALTER TABLE public.topics  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Disable RLS so the anon key can read/write
ALTER TABLE public.topics   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_topics_user   ON public.topics(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);
