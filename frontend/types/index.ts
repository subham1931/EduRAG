export interface Subject {
  id: string;
  teacher_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  subject_id: string;
  teacher_id: string;
  filename: string;
  page_count: number;
  chunk_count: number;
  created_at: string;
}

export interface AskResponse {
  answer: string;
  sources: {
    content: string;
    page_number: number;
    similarity: number;
  }[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

export interface QuizResponse {
  subject: string;
  questions: QuizQuestion[];
}

export interface NotesResponse {
  subject: string;
  notes: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: AskResponse["sources"];
  timestamp: Date;
}
