import type { FastifyPluginAsync } from "fastify";
import { supabase } from "../db/supabase.js";

export const userRoutes: FastifyPluginAsync = async (app) => {
  // ── Settings ──

  // GET /api/user/settings
  app.get("/settings", async (request, reply) => {
    const userId = (request as any).userId;
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      // Return defaults if no settings yet
      return reply.send({ tts_voice: "shimmer", tts_speed: 0.85 });
    }
    return reply.send(data);
  });

  // PUT /api/user/settings
  app.put<{
    Body: { tts_voice?: string; tts_speed?: number };
  }>("/settings", async (request, reply) => {
    const userId = (request as any).userId;
    const { tts_voice, tts_speed } = request.body;

    const { data, error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: userId,
        ...(tts_voice !== undefined && { tts_voice }),
        ...(tts_speed !== undefined && { tts_speed }),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });

  // ── Marked Words ──

  // GET /api/user/words
  app.get("/words", async (request, reply) => {
    const userId = (request as any).userId;
    const { data, error } = await supabase
      .from("marked_words")
      .select("*")
      .eq("user_id", userId)
      .order("created_at");

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data ?? []);
  });

  // POST /api/user/words
  app.post<{
    Body: { word: string; context: string; chapter_title: string; book_id: string };
  }>("/words", async (request, reply) => {
    const userId = (request as any).userId;
    const { word, context, chapter_title, book_id } = request.body;

    const { data, error } = await supabase
      .from("marked_words")
      .insert({ user_id: userId, word, context, chapter_title, book_id })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });

  // DELETE /api/user/words/:word
  app.delete<{ Params: { word: string } }>("/words/:word", async (request, reply) => {
    const userId = (request as any).userId;
    const { word } = request.params;

    const { error } = await supabase
      .from("marked_words")
      .delete()
      .eq("user_id", userId)
      .ilike("word", word);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(204).send();
  });

  // ── Reading Progress ──

  // GET /api/user/progress
  app.get("/progress", async (request, reply) => {
    const userId = (request as any).userId;
    const { data, error } = await supabase
      .from("reading_progress")
      .select("*")
      .eq("user_id", userId);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data ?? []);
  });

  // PUT /api/user/progress
  app.put<{
    Body: { chapter_id: string; last_paragraph: number };
  }>("/progress", async (request, reply) => {
    const userId = (request as any).userId;
    const { chapter_id, last_paragraph } = request.body;

    const { data, error } = await supabase
      .from("reading_progress")
      .upsert({
        user_id: userId,
        chapter_id,
        last_paragraph,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,chapter_id" })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });
};
