-- FOCUS OS SUPABASE COMPLETE SETUP
-- Run this ENTIRE script in the Supabase SQL Editor

-- 1. DROP EXISTING (Clean start if needed)
-- DROP TABLE IF EXISTS public.penalties;
-- DROP TABLE IF EXISTS public.tasks;
-- DROP TABLE IF EXISTS public.templates;
-- DROP TABLE IF EXISTS public.agents;
-- DROP TABLE IF EXISTS public.settings;

-- 2. CREATE TABLES
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    emoji TEXT,
    photo_url TEXT,
    daily_salary NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    topic TEXT,
    project TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    difficulty TEXT DEFAULT 'medium-easy',
    due_date DATE,
    scheduled_date DATE,
    scheduled_week DATE,
    assigned_agent UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    completed_date DATE,
    notes TEXT,
    penalized BOOLEAN DEFAULT false,
    salary_credited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    topic TEXT,
    project TEXT,
    priority TEXT DEFAULT 'medium',
    assigned_agent UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    notes TEXT,
    days INTEGER[] DEFAULT '{}'::integer[],
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.penalties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    amount NUMERIC DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    topic TEXT,
    project TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    topics JSONB DEFAULT '[]'::jsonb,
    topic_meta JSONB DEFAULT '{}'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    proj_meta JSONB DEFAULT '{}'::jsonb,
    last_recurring_check TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON public.tasks(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON public.tasks(scheduled_date);

-- 4. PERMISSIONS & RLS
ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.agents TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tasks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.templates TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.penalties TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.settings TO anon, authenticated, service_role;

-- 5. INITIAL DATA
INSERT INTO public.settings (id, topics, projects) 
VALUES ('global', '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;
