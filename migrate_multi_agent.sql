-- 1. Update Agents Table
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS is_pm BOOLEAN DEFAULT false;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS managed_project TEXT; -- Name of project this PM manages
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS parent_agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE;

-- 2. Update Tasks Table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS requires_agent BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS executing_agent_name TEXT; -- Name of the spawned mini-agent

-- 3. Update Indexes (Optional but good)
CREATE INDEX IF NOT EXISTS idx_agents_pm ON public.agents(is_pm) WHERE is_pm = true;
CREATE INDEX IF NOT EXISTS idx_tasks_req_agent ON public.tasks(requires_agent) WHERE requires_agent = true;
