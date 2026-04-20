-- CREATE AGENT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    agent_emoji TEXT,
    content TEXT NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for live performance
CREATE INDEX IF NOT EXISTS idx_agent_messages_created_at ON public.agent_messages(created_at);
