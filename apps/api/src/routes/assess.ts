import type { FastifyPluginAsync } from "fastify";
import { assessPronunciation } from "../services/azure-speech.js";

export const assessRoutes: FastifyPluginAsync = async (app) => {
  app.post<{
    Body: { referenceText: string; audioBase64: string };
  }>("/", async (request, reply) => {
    const { referenceText, audioBase64 } = request.body;
    const audioBuffer = Buffer.from(audioBase64, "base64");

    const result = await assessPronunciation(audioBuffer, referenceText);
    return reply.send(result);
  });
};
