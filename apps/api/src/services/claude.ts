import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPromptParts } from "@readbuddy/prompts";
import { supabase } from "../db/supabase.js";

const client = new Anthropic();

const MAX_HISTORY_TURNS = 10;

// Inline type so we don't depend on SDK internals
type CacheableTextBlock = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
};

interface ChatInput {
  message: string;
  bookId: string;
  chapterId?: string;
  history: { role: string; content: string }[];
  language?: string;
}

async function buildSystemBlocks(
  bookId: string,
  chapterId?: string,
  language?: string
): Promise<CacheableTextBlock[]> {
  const { data: book } = await supabase
    .from("books")
    .select("title, author")
    .eq("id", bookId)
    .single();

  const query = supabase
    .from("chapters")
    .select("id, title, raw_text")
    .eq("book_id", bookId)
    .order("chapter_num");

  if (chapterId) {
    query.eq("id", chapterId);
  }

  const { data: chapters } = await query;

  const bookContent = (chapters ?? [])
    .map((ch) => `## ${ch.title}\n${ch.raw_text}`)
    .join("\n\n");

  const chapterTitle = chapters?.[0]?.title ?? "All Chapters";

  const { instructions, content } = buildSystemPromptParts({
    bookTitle: book?.title ?? "Unknown",
    chapterTitle,
    bookContent,
    language,
  });

  return [
    // Block 1: static instructions — not cached (small, ~300 tokens)
    { type: "text", text: instructions },
    // Block 2: book content — cached (large, ~20K tokens)
    // Cache lasts 5 minutes; subsequent requests in the same session pay ~10% cost
    { type: "text", text: content, cache_control: { type: "ephemeral" } },
  ];
}

/** Non-streaming: returns full response text */
export async function sendChatMessage(input: ChatInput): Promise<string> {
  const systemBlocks = await buildSystemBlocks(input.bookId, input.chapterId, input.language);
  const recentHistory = input.history.slice(-MAX_HISTORY_TURNS * 2);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: systemBlocks,
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
  const systemBlocks = await buildSystemBlocks(input.bookId, input.chapterId, input.language);
  const recentHistory = input.history.slice(-MAX_HISTORY_TURNS * 2);

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: systemBlocks,
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
