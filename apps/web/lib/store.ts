import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Book, Chapter, ChatMessage } from "@readbuddy/shared-types";
import { MAX_CHAPTERS, MAX_WORDS_PER_CHAPTER } from "@readbuddy/shared-types";
import * as api from "./api";

interface BookState {
  currentBook: Book | null;
  chapters: Chapter[];
  isBookLoading: boolean;

  /** Load book from backend (or create if none exists) */
  initBook: (title?: string) => Promise<void>;
  setBookTitle: (title: string) => void;
  setBookAuthor: (author: string) => void;
  addChapter: (title: string, rawText: string) => Promise<{ ok: boolean; error?: string }>;
  updateChapter: (id: string, title: string, rawText: string) => Promise<{ ok: boolean; error?: string }>;
  deleteChapter: (id: string) => Promise<void>;
  setCurrentBook: (book: Book) => void;
  setChapters: (chapters: Chapter[]) => void;
}

/** chapterId -> { lastParagraph, readAt } */
type ReadingProgress = Record<string, { lastParagraph: number; readAt: string }>;

export interface MarkedWord {
  word: string;
  context: string;
  chapterTitle: string;
  markedAt: string;
}

interface ReadingState {
  currentChapterIndex: number;
  currentParagraphIndex: number;
  readingProgress: ReadingProgress;
  markedWords: MarkedWord[];
  setCurrentChapterIndex: (index: number) => void;
  setCurrentParagraphIndex: (index: number) => void;
  markChapterRead: (chapterId: string, lastParagraph: number) => void;
  toggleMarkedWord: (word: string, context: string, chapterTitle: string) => void;
  removeMarkedWord: (word: string) => void;
  isWordMarked: (word: string) => boolean;
}

const MAX_HISTORY_TURNS = 10;

interface ChatState {
  messages: ChatMessage[];
  isAiLoading: boolean;
  streamingMessageId: string | null;
  addMessage: (message: ChatMessage) => void;
  updateMessageContent: (id: string, content: string) => void;
  setStreamingMessageId: (id: string | null) => void;
  setIsAiLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const TTS_VOICES = [
  { id: "alloy", label: "Alloy", desc: "Neutral and balanced" },
  { id: "ash", label: "Ash", desc: "Warm and conversational" },
  { id: "ballad", label: "Ballad", desc: "Soft and gentle" },
  { id: "coral", label: "Coral", desc: "Clear and friendly" },
  { id: "echo", label: "Echo", desc: "Calm and steady" },
  { id: "fable", label: "Fable", desc: "Expressive and story-like" },
  { id: "nova", label: "Nova", desc: "Bright and energetic" },
  { id: "onyx", label: "Onyx", desc: "Deep and rich" },
  { id: "sage", label: "Sage", desc: "Wise and measured" },
  { id: "shimmer", label: "Shimmer", desc: "Warm and smooth" },
] as const;

export type TtsVoiceId = (typeof TTS_VOICES)[number]["id"];

export const TTS_SPEED_OPTIONS = [
  { value: 0.7, label: "Slow" },
  { value: 0.85, label: "Moderate" },
  { value: 1.0, label: "Normal" },
  { value: 1.15, label: "Fast" },
] as const;

interface SettingsState {
  ttsVoice: TtsVoiceId;
  ttsSpeed: number;
  setTtsVoice: (voice: TtsVoiceId) => void;
  setTtsSpeed: (speed: number) => void;
}

type AppState = BookState & ReadingState & ChatState & SettingsState;

// Debounce helper for DB sync
let bookSyncTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedBookSync(bookId: string, data: { title?: string; author?: string }) {
  if (bookSyncTimer) clearTimeout(bookSyncTimer);
  bookSyncTimer = setTimeout(() => {
    api.updateBook(bookId, data).catch(() => {});
  }, 800);
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Book ──
      currentBook: null,
      chapters: [],
      isBookLoading: false,

      initBook: async (title?: string) => {
        set({ isBookLoading: true });
        try {
          const books = await api.getBooks();
          if (books.length > 0) {
            // Load existing book
            const bookData = await api.getBookWithChapters(books[0].id);
            set({
              currentBook: {
                id: bookData.id,
                owner_id: "local",
                title: bookData.title,
                author: bookData.author ?? undefined,
                is_active: true,
                created_at: "",
              },
              chapters: bookData.chapters.map((ch) => ({
                ...ch,
                book_id: bookData.id,
              })),
            });
          } else if (title) {
            // Create new book
            const book = await api.createBook(title);
            set({
              currentBook: {
                id: book.id,
                owner_id: "local",
                title: book.title,
                is_active: true,
                created_at: "",
              },
              chapters: [],
            });
          } else {
            // No books for this user — reset local state
            set({
              currentBook: null,
              chapters: [],
              markedWords: [],
              readingProgress: {},
            });
          }

          // Load user data: settings, marked words, reading progress
          const [settings, words, progress] = await Promise.all([
            api.getUserSettings().catch(() => null),
            api.getMarkedWords().catch(() => []),
            api.getReadingProgress().catch(() => []),
          ]);

          if (settings) {
            set({
              ttsVoice: (settings.tts_voice || "shimmer") as TtsVoiceId,
              ttsSpeed: settings.tts_speed || 0.85,
            });
          }

          if (words.length > 0) {
            set({
              markedWords: words.map((w) => ({
                word: w.word,
                context: w.context || "",
                chapterTitle: w.chapter_title || "",
                markedAt: "",
              })),
            });
          }

          if (progress.length > 0) {
            const progressMap: ReadingProgress = {};
            for (const p of progress) {
              progressMap[p.chapter_id] = {
                lastParagraph: p.last_paragraph,
                readAt: p.updated_at,
              };
            }
            set({ readingProgress: progressMap });
          }
        } finally {
          set({ isBookLoading: false });
        }
      },

      setCurrentBook: (book) => set({ currentBook: book }),
      setChapters: (chapters) => set({ chapters }),

      setBookTitle: (title) => {
        set((state) => {
          if (state.currentBook) {
            if (state.currentBook.id) debouncedBookSync(state.currentBook.id, { title });
            return { currentBook: { ...state.currentBook, title } };
          }
          return {
            currentBook: {
              id: "",
              owner_id: "local",
              title,
              is_active: true,
              created_at: new Date().toISOString(),
            },
          };
        });
      },

      setBookAuthor: (author) => {
        set((state) => {
          if (!state.currentBook) return state;
          if (state.currentBook.id) debouncedBookSync(state.currentBook.id, { author });
          return { currentBook: { ...state.currentBook, author } };
        });
      },

      addChapter: async (title, rawText) => {
        const state = get();
        if (state.chapters.length >= MAX_CHAPTERS) {
          return { ok: false, error: `Maximum ${MAX_CHAPTERS} chapters allowed` };
        }
        const wordCount = countWords(rawText);
        if (wordCount > MAX_WORDS_PER_CHAPTER) {
          return { ok: false, error: `Chapter exceeds ${MAX_WORDS_PER_CHAPTER} word limit (${wordCount} words)` };
        }

        let bookId = state.currentBook?.id;

        // Create book if not exists
        if (!bookId) {
          try {
            const bookTitle = state.currentBook?.title || "My Book";
            const book = await api.createBook(bookTitle);
            bookId = book.id;
            set({
              currentBook: {
                id: book.id,
                owner_id: "local",
                title: book.title,
                is_active: true,
                created_at: "",
              },
            });
          } catch (err) {
            return { ok: false, error: err instanceof Error ? err.message : "Failed to create book" };
          }
        }

        try {
          const chapter = await api.addChapter(
            bookId,
            title,
            rawText,
            state.chapters.length + 1
          ) as Chapter;
          set({ chapters: [...get().chapters, { ...chapter, book_id: bookId }] });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "Failed to add chapter" };
        }
      },

      updateChapter: async (id, title, rawText) => {
        const state = get();
        const wordCount = countWords(rawText);
        if (wordCount > MAX_WORDS_PER_CHAPTER) {
          return { ok: false, error: `Chapter exceeds ${MAX_WORDS_PER_CHAPTER} word limit (${wordCount} words)` };
        }
        const bookId = state.currentBook?.id;
        if (!bookId) return { ok: false, error: "No book found" };

        try {
          const updated = await api.updateChapter(bookId, id, title, rawText) as Chapter;
          set((s) => ({
            chapters: s.chapters.map((ch) =>
              ch.id === id ? { ...updated, book_id: bookId } : ch
            ),
          }));
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "Failed to update chapter" };
        }
      },

      deleteChapter: async (id) => {
        const state = get();
        const bookId = state.currentBook?.id;
        if (!bookId) return;

        try {
          await api.deleteChapter(bookId, id);
          set((s) => ({
            chapters: s.chapters
              .filter((ch) => ch.id !== id)
              .map((ch, i) => ({ ...ch, chapter_num: i + 1 })),
          }));
        } catch (err) {
          console.error("Failed to delete chapter:", err);
        }
      },

      // ── Reading ──
      currentChapterIndex: 0,
      currentParagraphIndex: 0,
      readingProgress: {},
      markedWords: [],
      setCurrentChapterIndex: (index) => set({ currentChapterIndex: index }),
      setCurrentParagraphIndex: (index) => set({ currentParagraphIndex: index }),
      markChapterRead: (chapterId, lastParagraph) => {
        set((state) => ({
          readingProgress: {
            ...state.readingProgress,
            [chapterId]: { lastParagraph, readAt: new Date().toISOString() },
          },
        }));
        api.updateReadingProgress(chapterId, lastParagraph).catch(() => {});
      },
      toggleMarkedWord: (word, context, chapterTitle) => {
        const state = get();
        const normalized = word.toLowerCase();
        const exists = state.markedWords.some(
          (w) => w.word.toLowerCase() === normalized
        );
        if (exists) {
          set({
            markedWords: state.markedWords.filter(
              (w) => w.word.toLowerCase() !== normalized
            ),
          });
          api.removeMarkedWordApi(word).catch(() => {});
        } else {
          set({
            markedWords: [
              ...state.markedWords,
              { word, context, chapterTitle, markedAt: new Date().toISOString() },
            ],
          });
          const bookId = state.currentBook?.id;
          if (bookId) {
            api.addMarkedWord(word, context, chapterTitle, bookId).catch(() => {});
          }
        }
      },
      removeMarkedWord: (word) => {
        set((state) => ({
          markedWords: state.markedWords.filter(
            (w) => w.word.toLowerCase() !== word.toLowerCase()
          ),
        }));
        api.removeMarkedWordApi(word).catch(() => {});
      },
      isWordMarked: (word) => {
        const normalized = word.toLowerCase();
        return get().markedWords.some((w) => w.word.toLowerCase() === normalized);
      },

      // ── Chat ──
      messages: [],
      isAiLoading: false,
      streamingMessageId: null,
      addMessage: (message) =>
        set((state) => {
          const updated = [...state.messages, message];
          if (updated.length > MAX_HISTORY_TURNS * 2) {
            return { messages: updated.slice(-MAX_HISTORY_TURNS * 2) };
          }
          return { messages: updated };
        }),
      updateMessageContent: (id, content) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, content } : m
          ),
        })),
      setStreamingMessageId: (id) => set({ streamingMessageId: id }),
      setIsAiLoading: (loading) => set({ isAiLoading: loading }),
      clearMessages: () => set({ messages: [], streamingMessageId: null }),

      // ── Settings ──
      ttsVoice: "shimmer",
      ttsSpeed: 0.85,
      setTtsVoice: (voice) => {
        set({ ttsVoice: voice });
        api.updateUserSettings({ tts_voice: voice }).catch(() => {});
      },
      setTtsSpeed: (speed) => {
        set({ ttsSpeed: speed });
        api.updateUserSettings({ tts_speed: speed }).catch(() => {});
      },
    }),
    {
      name: "readbuddy-storage",
      partialize: (state) => ({
        currentBook: state.currentBook,
        chapters: state.chapters,
        readingProgress: state.readingProgress,
        markedWords: state.markedWords,
        ttsVoice: state.ttsVoice,
        ttsSpeed: state.ttsSpeed,
      }),
    }
  )
);
