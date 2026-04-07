// ── Book & Chapter ──

export interface Book {
  id: string;
  owner_id: string;
  title: string;
  author?: string;
  cover_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  title: string;
  chapter_num: number;
  raw_text: string;
  word_count: number;
  created_at: string;
}

export interface Paragraph {
  id: string;
  chapter_id: string;
  content: string;
  para_index: number;
  created_at: string;
}

// ── Chat ──

export interface ChatMessage {
  id: string;
  session_id?: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ── Learning Session ──

export interface LearningSession {
  id: string;
  child_id: string;
  book_id: string;
  chapter_id: string;
  started_at: string;
  ended_at?: string;
  duration_sec?: number;
}

// ── Pronunciation Assessment ──

export interface PronunciationAssessment {
  id: string;
  session_id: string;
  original_text: string;
  transcript: string;
  accuracy_score: number;
  error_words: ErrorWord[];
  created_at: string;
}

export interface ErrorWord {
  word: string;
  accuracy_score: number;
  error_type: "None" | "Mispronunciation" | "Omission" | "Insertion";
}

// ── Vocabulary ──

export interface VocabHighlight {
  id: string;
  book_id: string;
  word: string;
  definition?: string;
  paragraph_id?: string;
  created_at: string;
}

// ── API Request/Response types ──

export interface ChatRequest {
  message: string;
  bookId: string;
  chapterId?: string;
  history?: { role: string; content: string }[];
}

export interface ChatResponse {
  reply: string;
}

export interface TtsRequest {
  text: string;
}

export interface AssessRequest {
  referenceText: string;
  audioBase64: string;
}

export interface AssessResponse {
  accuracyScore: number;
  fluencyScore: number;
  words: ErrorWord[];
}

// ── Constants ──

export const MAX_CHAPTERS = 5;
export const MAX_WORDS_PER_CHAPTER = 3000;
