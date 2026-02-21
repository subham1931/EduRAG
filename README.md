# EduRAG — AI-Powered Teacher Knowledge Assistant

AI-powered RAG system for teachers to upload course materials, ask questions, generate quizzes, and create study notes — powered by Ollama, Supabase, FastAPI, and Next.js.

---

## Architecture

```
Frontend (Next.js 14)  →  Backend (FastAPI)  →  Ollama (LLM + Embeddings)
                                              →  Supabase (Postgres + pgvector)
```

### RAG Flow

1. **Upload PDF** → Extract text (PyMuPDF) → Chunk (800 tokens, 150 overlap) → Embed (nomic-embed-text) → Store in pgvector
2. **Ask Question** → Embed query → Cosine similarity search (top 5) → Context + question → Ollama LLM → Answer
3. **Generate Quiz** → Retrieve relevant chunks → LLM generates 10 MCQs → Structured JSON
4. **Generate Notes** → Retrieve relevant chunks → LLM generates bullet-point notes → Markdown

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Ollama** installed and running ([ollama.ai](https://ollama.ai))
- **Supabase** project ([supabase.com](https://supabase.com))

---

## Setup

### 1. Supabase Database

1. Create a new Supabase project
2. Go to **SQL Editor** in your Supabase dashboard
3. Paste and run the contents of `backend/supabase_schema.sql`
4. Note down from **Settings → API**:
   - Project URL
   - `anon` public key
   - `service_role` secret key
5. Note down from **Settings → API → JWT Settings**:
   - JWT Secret

### 2. Ollama Models

```bash
ollama pull nomic-embed-text
ollama pull llama3
```

### 3. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your Supabase and Ollama settings

# Run the server
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend

# Copy and fill in environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and API settings

npm install
npm run dev
```

Open http://localhost:3000

---

## Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/subjects` | Create a subject |
| `GET` | `/subjects` | List teacher's subjects |
| `POST` | `/documents/upload` | Upload PDF to a subject |
| `GET` | `/documents/{subject_id}` | List documents for a subject |
| `POST` | `/ask` | Ask a question (RAG) |
| `POST` | `/generate-quiz` | Generate MCQ quiz |
| `POST` | `/generate-notes` | Generate study notes |

All endpoints (except `/health`) require a valid Supabase JWT in the `Authorization: Bearer <token>` header.

---

## Docker (Backend)

```bash
cd backend
docker build -t teachassist-backend .
docker run -p 8000:8000 --env-file .env teachassist-backend
```

---

## Project Structure

```
EduRAG/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Settings from env
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic models
│   │   ├── routers/
│   │   │   ├── subjects.py      # Subject CRUD
│   │   │   ├── documents.py     # PDF upload
│   │   │   ├── ask.py           # Q&A endpoint
│   │   │   ├── quiz.py          # Quiz generation
│   │   │   └── notes.py         # Notes generation
│   │   ├── services/
│   │   │   ├── subject_service.py
│   │   │   ├── document_service.py
│   │   │   ├── ask_service.py
│   │   │   ├── quiz_service.py
│   │   │   └── notes_service.py
│   │   ├── rag/
│   │   │   ├── pdf_parser.py    # PyMuPDF extraction
│   │   │   ├── chunker.py       # Token-based chunking
│   │   │   ├── embeddings.py    # Ollama embeddings
│   │   │   ├── llm.py           # Ollama LLM calls
│   │   │   └── retriever.py     # Vector similarity search
│   │   └── utils/
│   │       ├── auth.py          # JWT validation
│   │       └── supabase_client.py
│   ├── supabase_schema.sql
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── dashboard/page.tsx
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives
│   │   └── dashboard/
│   │       ├── sidebar.tsx
│   │       ├── chat-panel.tsx
│   │       ├── upload-dialog.tsx
│   │       ├── quiz-dialog.tsx
│   │       └── notes-dialog.tsx
│   ├── lib/
│   │   ├── api.ts               # Axios with auth interceptor
│   │   ├── supabase.ts          # Supabase client
│   │   └── utils.ts             # cn() helper
│   ├── types/index.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   └── .env.example
│
└── README.md
```

---

## Security

- All API queries filter by `teacher_id` — teachers can only access their own data
- Supabase JWT validation on every backend request
- Row Level Security (RLS) policies on all tables
- Backend uses `service_role` key (server-side only, never exposed to client)
- Frontend uses `anon` key (safe for client-side)
