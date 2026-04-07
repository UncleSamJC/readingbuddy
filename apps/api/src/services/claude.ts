import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@readbuddy/prompts";
import { supabase } from "../db/supabase.js";

const client = new Anthropic();

const MAX_HISTORY_TURNS = 10;

interface ChatInput {
  message: string;
  bookId: string;
  chapterId?: string;
  history: { role: string; content: string }[];
}

async function buildContext(bookId: string, chapterId?: string) {
  const { data: book } = await supabase
    .from("books")
    .select("title, author")
    .eq("id", bookId)
    .single();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("title, raw_text")
    .eq("book_id", bookId)
    .order("chapter_num");

  const bookContent = (chapters ?? [])
    .map((ch) => `## ${ch.title}\n${ch.raw_text}`)
    .join("\n\n");

  // If chapterId given, find its title
  let chapterTitle = "All Chapters";
  if (chapterId) {
    const ch = (chapters ?? []).find((c) => c.title?.includes(chapterId));
    if (ch) chapterTitle = ch.title;
  }

  return buildSystemPrompt({
    bookTitle: book?.title ?? "Unknown",
    chapterTitle,
    bookContent,
  });
}

/** Non-streaming: returns full response text */
export async function sendChatMessage(input: ChatInput): Promise<string> {
  const systemPrompt = await buildContext(input.bookId, input.chapterId);
  const recentHistory = input.history.slice(-MAX_HISTORY_TURNS * 2);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      ...recentHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: input.message },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

/** Streaming: yields text chunks via callback */
export async function streamChatMessage(
  input: ChatInput,
  onChunk: (text: string) => void,
  onDone: () => void
): Promise<void> {
  const systemPrompt = await buildContext(input.bookId, input.chapterId);
  const recentHistory = input.history.slice(-MAX_HISTORY_TURNS * 2);

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      ...recentHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: input.message },
    ],
  });

  stream.on("text", (text) => onChunk(text));
  stream.on("end", () => onDone());
  stream.on("error", () => onDone());

  await stream.finalMessage();
}
