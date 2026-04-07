import type { FastifyPluginAsync } from "fastify";
import { supabase } from "../db/supabase.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/auth/register
  app.post<{
    Body: { email: string; password: string };
  }>("/register", async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return reply.status(400).send({ error: error.message });
    }

    // Create default user settings
    if (data.user) {
      await supabase.from("user_settings").upsert({
        user_id: data.user.id,
        tts_voice: "shimmer",
        tts_speed: 0.85,
      });
    }

    return reply.status(201).send({
      user: { id: data.user?.id, email: data.user?.email },
      session: data.session,
    });
  });

  // POST /api/auth/login
  app.post<{
    Body: { email: string; password: string };
  }>("/login", async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return reply.status(401).send({ error: error.message });
    }

    return reply.send({
      user: { id: data.user.id, email: data.user.email },
      session: data.session,
    });
  });
};
