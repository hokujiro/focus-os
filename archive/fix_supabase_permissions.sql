-- DISABLE RLS FOR FOCUS OS TABLES
-- Run this in Supabase SQL Editor if you get "Could not find table" or 401/403 errors

ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT ALL ON TABLE public.agents TO anon, authenticated;
GRANT ALL ON TABLE public.tasks TO anon, authenticated;
GRANT ALL ON TABLE public.templates TO anon, authenticated;
GRANT ALL ON TABLE public.penalties TO anon, authenticated;
GRANT ALL ON TABLE public.settings TO anon, authenticated;
GRANT ALL ON TABLE public.topics TO anon, authenticated;
GRANT ALL ON TABLE public.projects TO anon, authenticated;
