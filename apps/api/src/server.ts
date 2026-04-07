import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { authenticate } from "./middleware/auth.js";
import { authRoutes } from "./routes/auth.js";
import { chatRoutes } from "./routes/chat.js";
import { ttsRoutes } from "./routes/tts.js";
import { assessRoutes } from "./routes/assess.js";
import { bookRoutes } from "./routes/books.js";
import { userRoutes } from "./routes/user.js";

const app = Fastify({ logger: true });

async function start() {
  await app.register(cors, {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Public routes (no auth)
  app.get("/api/health", async () => ({ status: "ok" }));
  await app.register(authRoutes, { prefix: "/api/auth" });

  // Protected routes (require auth)
  await app.register(async (protectedApp) => {
    protectedApp.addHook("onRequest", authenticate);

    await protectedApp.register(chatRoutes, { prefix: "/api/chat" });
    await protectedApp.register(ttsRoutes, { prefix: "/api/tts" });
    await protectedApp.register(assessRoutes, { prefix: "/api/assess" });
    await protectedApp.register(bookRoutes, { prefix: "/api/books" });
    await protectedApp.register(userRoutes, { prefix: "/api/user" });
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen({ port, host: "0.0.0.0" });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
