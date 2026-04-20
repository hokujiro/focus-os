-- REFACTOR: SPLIT TOPICS AND PROJECTS INTO SEPARATE TABLES

-- 1. TOPICS TABLE
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY, -- e.g. 'social-media'
    label TEXT NOT NULL,
    color TEXT,
    dot TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY, -- Using TEXT to keep compatibility with existing IDs like 'twitter'
    name TEXT NOT NULL,
    topic TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
    grad TEXT,
    emoji TEXT,
    pat TEXT,
    color TEXT,
    photo_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. MIGRATION LOGIC (INTERNAL DATA)
-- This section migrates data from the JSON context in 'settings'
-- Note: 'settings' table contains 'topics', 'topic_meta', 'projects', and 'proj_meta'

-- Migrate Topics
INSERT INTO public.topics (id, label, color, dot)
SELECT 
    t as id,
    COALESCE(s.topic_meta->t->>'label', t) as label,
    s.topic_meta->t->>'color' as color,
    s.topic_meta->t->>'dot' as dot
FROM public.settings s, jsonb_array_elements_text(s.topics) as t
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    color = EXCLUDED.color,
    dot = EXCLUDED.dot;

-- Migrate Projects
-- We need to join the projects array and the proj_meta map
WITH project_data AS (
    SELECT 
        p->>'id' as id,
        p->>'name' as name,
        p->>'topic' as topic
    FROM public.settings, jsonb_array_elements(projects) as p
)
INSERT INTO public.projects (id, name, topic, grad, emoji, pat, color, photo_url)
SELECT 
    pd.id,
    pd.name,
    pd.topic,
    pm.value->>'grad' as grad,
    pm.value->>'emoji' as emoji,
    pm.value->>'pat' as pat,
    pm.value->>'color' as color,
    pm.value->>'photo_url' as photo_url
FROM project_data pd
LEFT JOIN (SELECT key, value FROM public.settings, jsonb_each(proj_meta)) pm ON pd.id = pm.key
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    topic = EXCLUDED.topic,
    grad = EXCLUDED.grad,
    emoji = EXCLUDED.emoji,
    pat = EXCLUDED.pat,
    color = EXCLUDED.color,
    photo_url = EXCLUDED.photo_url;

-- 4. CLEANUP (Optional - keep for safety until confirmed)
-- ALTER TABLE public.settings DROP COLUMN topics;
-- ALTER TABLE public.settings DROP COLUMN topic_meta;
-- ALTER TABLE public.settings DROP COLUMN projects;
-- ALTER TABLE public.settings DROP COLUMN proj_meta;
