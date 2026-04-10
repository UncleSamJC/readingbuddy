import type { FastifyPluginAsync } from "fastify";
import { supabase } from "../db/supabase.js";
import { PLAN_CHAPTER_LIMITS, type UserPlan } from "@readbuddy/shared-types";

const MAX_WORDS_PER_CHAPTER = 3000;

function cleanText(text: string): string {
  return text
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove soft hyphens (PDF line-break artifacts: "some-\nword" → "someword")
    .replace(/\u00ad/g, "")
    // Replace non-breaking spaces and other Unicode whitespace with regular space
    .replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, " ")
    // Remove zero-width characters
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "")
    // Join hyphenated line breaks: "some-\nword" → "someword"
    .replace(/(\w)-\n(\w)/g, "$1$2")
    // Single newline between text (PDF soft wrap) → space
    .replace(/([^\n])\n([^\n])/g, "$1 $2")
    // Normalize spaces/tabs
    .replace(/[ \t]+/g, " ")
    // Collapse excessive blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const bookRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/books
  app.get("/", async (request, reply) => {
    const userId = (request as any).userId;
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });

  // GET /api/books/:bookId
  app.get<{ Params: { bookId: string } }>("/:bookId", async (request, reply) => {
    const userId = (request as any).userId;
    const { bookId } = request.params;

    const { data: book, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .eq("owner_id", userId)
      .single();

    if (error) return reply.status(404).send({ error: "Book not found" });

    const { data: chapters } = await supabase
      .from("chapters")
      .select("*")
      .eq("book_id", bookId)
      .order("chapter_num");

    return reply.send({ ...book, chapters: chapters ?? [] });
  });

  // POST /api/books
  app.post<{
    Body: { title: string; author?: string };
  }>("/", async (request, reply) => {
    const userId = (request as any).userId;
    const { title, author } = request.body;

    if (!title?.trim()) {
      return reply.status(400).send({ error: "Title is required" });
    }

    const { data, error } = await supabase
      .from("books")
      .insert({ owner_id: userId, title: title.trim(), author: author?.trim() || null })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });

  // PUT /api/books/:bookId — update book info
  app.put<{
    Params: { bookId: string };
    Body: { title?: string; author?: string };
  }>("/:bookId", async (request, reply) => {
    const userId = (request as any).userId;
    const { bookId } = request.params;
    const { title, author } = request.body;

    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title.trim();
    if (author !== undefined) update.author = author.trim() || null;

    const { data, error } = await supabase
      .from("books")
      .update(update)
      .eq("id", bookId)
      .eq("owner_id", userId)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });

  // POST /api/books/:bookId/chapters
  app.post<{
    Params: { bookId: string };
    Body: { title: string; rawText: string; chapterNum: number };
  }>("/:bookId/chapters", async (request, reply) => {
    const userId = (request as any).userId;
    const { bookId } = request.params;
    const { title, rawText, chapterNum } = request.body;

    // Resolve user plan
    const { data: settings } = await supabase
      .from("user_settings")
      .select("plan")
      .eq("user_id", userId)
      .single();
    const plan = ((settings?.plan as UserPlan) ?? "Free");
    const maxChapters = PLAN_CHAPTER_LIMITS[plan];

    const { count } = await supabase
      .from("chapters")
      .select("*", { count: "exact", head: true })
      .eq("book_id", bookId);

    if ((count ?? 0) >= maxChapters) {
      return reply.status(400).send({
        error: `Your ${plan} plan allows a maximum of ${maxChapters} chapters per book`,
      });
    }

    const cleaned = cleanText(rawText);
    const wordCount = cleaned.split(/\s+/).length;
    if (wordCount > MAX_WORDS_PER_CHAPTER) {
      return reply.status(400).send({ error: `Chapter cannot exceed ${MAX_WORDS_PER_CHAPTER} words (got ${wordCount})` });
    }

    const { data, error } = await supabase
      .from("chapters")
      .insert({ book_id: bookId, title: title.trim(), raw_text: cleaned, chapter_num: chapterNum })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });

  // PUT /api/books/:bookId/chapters/:chapterId
  app.put<{
    Params: { bookId: string; chapterId: string };
    Body: { title?: string; rawText?: string };
  }>("/:bookId/chapters/:chapterId", async (request, reply) => {
    const { chapterId } = request.params;
    const { title, rawText } = request.body;

    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title.trim();
    if (rawText !== undefined) {
      const cleaned = cleanText(rawText);
      const wordCount = cleaned.split(/\s+/).length;
      if (wordCount > MAX_WORDS_PER_CHAPTER) {
        return reply.status(400).send({ error: `Chapter cannot exceed ${MAX_WORDS_PER_CHAPTER} words (got ${wordCount})` });
      }
      update.raw_text = cleaned;
    }

    const { data, error } = await supabase
      .from("chapters")
      .update(update)
      .eq("id", chapterId)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });

  // DELETE /api/books/:bookId/chapters/:chapterId
  app.delete<{ Params: { bookId: string; chapterId: string } }>(
    "/:bookId/chapters/:chapterId",
    async (request, reply) => {
      const { chapterId } = request.params;
      const { error } = await supabase.from("chapters").delete().eq("id", chapterId);
      if (error) return reply.status(500).send({ error: error.message });
      return reply.status(204).send();
    }
  );
};
