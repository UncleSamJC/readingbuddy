import type { FastifyPluginAsync } from "fastify";
import { sendChatMessage, streamChatMessage } from "../services/claude.js";
import { supabase } from "../db/supabase.js";
import { PLAN_CHAT_LIMITS } from "@readbuddy/shared-types";

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function checkAndIncrementUsage(
  userId: string,
  afterSuccess: boolean
): Promise<{ allowed: boolean; used: number; limit: number }> {
  // Get user plan
  const { data: settings } = await supabase
    .from("user_settings")
    .select("plan")
    .eq("user_id", userId)
    .single();

  const plan = (settings?.plan as keyof typeof PLAN_CHAT_LIMITS) ?? "Free";
  const limit = PLAN_CHAT_LIMITS[plan];
  const ym = currentYearMonth();

  // Get current usage
  const { data: usage } = await supabase
    .from("chat_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("year_month", ym)
    .single();

  const used = usage?.count ?? 0;

  if (!afterSuccess) {
    // Pre-check: block if already at or over limit
    return { allowed: used < limit, used, limit };
  }

  // Post-success: increment atomically
  await supabase.rpc("increment_chat_usage", { p_user_id: userId, p_year_month: ym });
  return { allowed: true, used: used + 1, limit };
}

export const chatRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/chat — non-streaming
  app.post<{
    Body: {
      message: string;
      bookId: string;
      chapterId?: string;
      history?: { role: string; content: string }[];
      language?: string;
    };
  }>("/", async (request, reply) => {
    const userId = (request as any).userId as string;
    const { message, bookId, chapterId, history, language } = request.body;

    const { allowed, used, limit } = await checkAndIncrementUsage(userId, false);
    if (!allowed) {
      return reply.status(429).send({
        error: "Monthly chat limit reached",
        used,
        limit,
        resetsOn: (() => {
          const now = new Date();
          return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
            .toISOString()
            .slice(0, 10);
        })(),
      });
    }

    const response = await sendChatMessage({
      message,
      bookId,
      chapterId,
      history: history ?? [],
      language,
    });

    await checkAndIncrementUsage(userId, true);
    return reply.send({ reply: response });
  });

  // POST /api/chat/stream — SSE streaming
  app.post<{
    Body: {
      message: string;
      bookId: string;
      chapterId?: string;
      history?: { role: string; content: string }[];
      language?: string;
    };
  }>("/stream", async (request, reply) => {
    const userId = (request as any).userId as string;
    const { message, bookId, chapterId, history, language } = request.body;

    const { allowed, used, limit } = await checkAndIncrementUsage(userId, false);

    const origin = request.headers.origin || process.env.FRONTEND_URL || "http://localhost:3000";
    reply.raw.writeHead(allowed ? 200 : 429, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
    });

    if (!allowed) {
      const resetsOn = new Date(Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth() + 1, 1
      )).toISOString().slice(0, 10);
      reply.raw.write(`data: ${JSON.stringify({ error: "limit_reached", used, limit, resetsOn })}\n\n`);
      reply.raw.end();
      return;
    }

    let success = false;
    await streamChatMessage(
      { message, bookId, chapterId, history: history ?? [], language },
      (text) => {
        reply.raw.write(`data: ${JSON.stringify({ text })}\n\n`);
      },
      () => {
        success = true;
        reply.raw.write("data: [DONE]\n\n");
        reply.raw.end();
      }
    );

    if (success) {
      await checkAndIncrementUsage(userId, true);
    }
  });
};
