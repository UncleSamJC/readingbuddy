import { Readable } from "node:stream";

// Using OpenAI TTS (replacing ElevenLabs)
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

export async function generateSpeech(
  text: string,
  voice?: string,
  speed?: number
): Promise<Readable> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice: voice || "shimmer",
      response_format: "mp3",
      speed: speed ?? 0.85,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenAI TTS error ${response.status}: ${body}`);
  }

  return Readable.fromWeb(response.body as import("stream/web").ReadableStream);
}
