import { supabase } from "./supabase";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000")
    : "http://localhost:4000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error("[auth] getSession error:", error.message);
  const token = data.session?.access_token;
  if (!token) console.warn("[auth] No access token available");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

// ── Books ──

export async function createBook(title: string, author?: string) {
  return apiFetch<{ id: string; title: string; author: string | null }>(
    "/api/books",
    { method: "POST", body: JSON.stringify({ title, author }) }
  );
}

export async function updateBook(bookId: string, data: { title?: string; author?: string }) {
  return apiFetch<{ id: string; title: string; author: string | null }>(
    `/api/books/${bookId}`,
    { method: "PUT", body: JSON.stringify(data) }
  );
}

export async function getBooks() {
  return apiFetch<{ id: string; title: string; author: string | null }[]>("/api/books");
}

export async function getBookWithChapters(bookId: string) {
  return apiFetch<{
    id: string;
    title: string;
    author: string | null;
    chapters: {
      id: string;
      title: string;
      chapter_num: number;
      raw_text: string;
      word_count: number;
      created_at: string;
    }[];
  }>(`/api/books/${bookId}`);
}

export async function addChapter(
  bookId: string,
  title: string,
  rawText: string,
  chapterNum: number
) {
  return apiFetch(`/api/books/${bookId}/chapters`, {
    method: "POST",
    body: JSON.stringify({ title, rawText, chapterNum }),
  });
}

export async function updateChapter(
  bookId: string,
  chapterId: string,
  title: string,
  rawText: string
) {
  return apiFetch(`/api/books/${bookId}/chapters/${chapterId}`, {
    method: "PUT",
    body: JSON.stringify({ title, rawText }),
  });
}

export async function deleteChapter(bookId: string, chapterId: string) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/books/${bookId}/chapters/${chapterId}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Delete failed: ${res.status}`);
  }
}

// ── Chat (SSE streaming) ──

export function streamChat(
  message: string,
  bookId: string,
  history: { role: string; content: string }[],
  onChunk: (text: string) => void,
  onDone: () => void,
  chapterId?: string
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ message, bookId, chapterId, history }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Chat error ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) { onDone(); return; }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") { onDone(); return; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) onChunk(parsed.text);
          } catch {
            // skip malformed
          }
        }
      }
      onDone();
    } catch (err) {
      if ((err as Error).name !== "AbortError") console.error("Stream error:", err);
      onDone();
    }
  })();

  return () => controller.abort();
}

// ── TTS ──

export async function fetchTtsAudio(
  text: string,
  voice?: string,
  speed?: number
): Promise<string> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ text, voice, speed }),
  });
  if (!res.ok) throw new Error(`TTS error ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ── User Settings ──

export async function getUserSettings() {
  return apiFetch<{ tts_voice: string; tts_speed: number }>("/api/user/settings");
}

export async function updateUserSettings(settings: { tts_voice?: string; tts_speed?: number }) {
  return apiFetch("/api/user/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

// ── Marked Words ──

export async function getMarkedWords() {
  return apiFetch<{ id: string; word: string; context: string; chapter_title: string; book_id: string }[]>("/api/user/words");
}

export async function addMarkedWord(word: string, context: string, chapterTitle: string, bookId: string) {
  return apiFetch("/api/user/words", {
    method: "POST",
    body: JSON.stringify({ word, context, chapter_title: chapterTitle, book_id: bookId }),
  });
}

export async function removeMarkedWordApi(word: string) {
  const authHeaders = await getAuthHeaders();
  await fetch(`${API_BASE}/api/user/words/${encodeURIComponent(word)}`, {
    method: "DELETE",
    headers: authHeaders,
  });
}

// ── Reading Progress ──

export async function getReadingProgress() {
  return apiFetch<{ chapter_id: string; last_paragraph: number; updated_at: string }[]>("/api/user/progress");
}

export async function updateReadingProgress(chapterId: string, lastParagraph: number) {
  return apiFetch("/api/user/progress", {
    method: "PUT",
    body: JSON.stringify({ chapter_id: chapterId, last_paragraph: lastParagraph }),
  });
}
