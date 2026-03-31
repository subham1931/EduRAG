-- Add storage path for PDF preview (Supabase Storage). Run in SQL Editor after creating bucket "documents".

ALTER TABLE public.documents
    ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Optional: create private bucket (if not created in Dashboard → Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
