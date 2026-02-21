-- ============================================================
-- EduRAG — Supabase SQL Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subjects_teacher ON public.subjects(teacher_id);

-- 3. Documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    page_count INTEGER NOT NULL DEFAULT 0,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_subject ON public.documents(subject_id);
CREATE INDEX IF NOT EXISTS idx_documents_teacher ON public.documents(teacher_id);

-- 4. Document chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768),
    page_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chunks_subject ON public.document_chunks(subject_id);
CREATE INDEX IF NOT EXISTS idx_chunks_teacher ON public.document_chunks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document ON public.document_chunks(document_id);

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON public.document_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 5. Quizzes table (optional storage)
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON public.quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher ON public.quizzes(teacher_id);

-- 6. Similarity search function used by the backend
CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(768),
    match_count INTEGER DEFAULT 5,
    filter_subject_id UUID DEFAULT NULL,
    filter_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    teacher_id UUID,
    subject_id UUID,
    document_id UUID,
    content TEXT,
    page_number INTEGER,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.teacher_id,
        dc.subject_id,
        dc.document_id,
        dc.content,
        dc.page_number,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM public.document_chunks dc
    WHERE
        (filter_subject_id IS NULL OR dc.subject_id = filter_subject_id)
        AND (filter_teacher_id IS NULL OR dc.teacher_id = filter_teacher_id)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 7. Row Level Security
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Service role bypass (backend uses service_role key)
CREATE POLICY "Service role full access subjects" ON public.subjects
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access documents" ON public.documents
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access chunks" ON public.document_chunks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access quizzes" ON public.quizzes
    FOR ALL USING (true) WITH CHECK (true);
