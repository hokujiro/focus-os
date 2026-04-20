-- FOCUS OS SUPABASE MIGRATION
-- Run this in the Supabase SQL Editor

-- 1. AGENTS
CREATE TABLE public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    emoji TEXT,
    photo_url TEXT,
    daily_salary NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TASKS
CREATE TABLE public.tasks (
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

-- 3. TEMPLATES (Recurring)
CREATE TABLE public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    topic TEXT,
    project TEXT,
    priority TEXT DEFAULT 'medium',
    assigned_agent UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    notes TEXT,
    days INTEGER[] DEFAULT '{}'::integer[], -- e.g. [1,3,5]
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PENALTIES
CREATE TABLE public.penalties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    amount NUMERIC DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    topic TEXT,
    project TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SETTINGS
CREATE TABLE public.settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    topics JSONB DEFAULT '[]'::jsonb,
    topic_meta JSONB DEFAULT '{}'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    proj_meta JSONB DEFAULT '{}'::jsonb,
    last_recurring_check TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES for performance
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_agent ON public.tasks(assigned_agent);
CREATE INDEX idx_tasks_date ON public.tasks(scheduled_date);
