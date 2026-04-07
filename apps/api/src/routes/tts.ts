import type { FastifyPluginAsync } from "fastify";
import { generateSpeech } from "../services/elevenlabs.js";

export const ttsRoutes: FastifyPluginAsync = async (app) => {
  app.post<{
    Body: { text: string; voice?: string; speed?: number };
  }>("/", async (request, reply) => {
    const { text, voice, speed } = request.body;

    if (!text?.trim()) {
      return reply.status(400).send({ error: "Text is required" });
    }

    try {
      const audioStream = await generateSpeech(text, voice, speed);
      reply.header("Content-Type", "audio/mpeg");
      reply.header("Transfer-Encoding", "chunked");
      return reply.send(audioStream);
    } catch (err) {
      const message = err instanceof Error ? err.message : "TTS failed";
      return reply.status(502).send({ error: message });
    }
  });
};
