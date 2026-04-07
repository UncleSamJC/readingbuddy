import type { FastifyRequest, FastifyReply } from "fastify";
import { supabase } from "../db/supabase.js";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing authorization token" });
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }

  // Attach user to request
  (request as any).userId = data.user.id;
  (request as any).userEmail = data.user.email;
}
