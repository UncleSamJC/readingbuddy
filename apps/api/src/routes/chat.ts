import type { FastifyPluginAsync } from "fastify";
import { sendChatMessage, streamChatMessage } from "../services/claude.js";

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
    const { message, bookId, chapterId, history, language } = request.body;

    const response = await sendChatMessage({
      message,
      bookId,
      chapterId,
      history: history ?? [],
      language,
    });

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
    const { message, bookId, chapterId, history, language } = request.body;

    const origin = request.headers.origin || process.env.FRONTEND_URL || "http://localhost:3000";
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
    });

    await streamChatMessage(
      { message, bookId, chapterId, history: history ?? [], language },
      (text) => {
        reply.raw.write(`data: ${JSON.stringify({ text })}\n\n`);
      },
      () => {
        reply.raw.write("data: [DONE]\n\n");
        reply.raw.end();
      }
    );
  });
};
