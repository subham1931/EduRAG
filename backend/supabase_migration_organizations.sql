-- Run once on existing EduRAG databases (after initial supabase_schema.sql without organizations).
-- Creates organizations, links subjects, enables RLS.

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_teacher ON public.organizations(teacher_id);

ALTER TABLE public.subjects
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- One default organization per teacher that already has subjects
INSERT INTO public.organizations (teacher_id, name, description)
SELECT DISTINCT s.teacher_id, 'Default organization', 'Migrated — create new orgs from the Organization page'
FROM public.subjects s
WHERE NOT EXISTS (
    SELECT 1 FROM public.organizations o WHERE o.teacher_id = s.teacher_id
);

UPDATE public.subjects s
SET organization_id = o.id
FROM public.organizations o
WHERE s.teacher_id = o.teacher_id
  AND o.name = 'Default organization'
  AND s.organization_id IS NULL;

ALTER TABLE public.subjects
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access organizations" ON public.organizations;
CREATE POLICY "Service role full access organizations" ON public.organizations
    FOR ALL USING (true) WITH CHECK (true);

-- Refresh PostgREST schema cache (helps clear PGRST205 after new tables)
NOTIFY pgrst, 'reload schema';
