import type { FastifyRequest } from "fastify";
import type { SessionsRepository } from "../infrastructure";
import { Session } from "../domain";

export function createSessionGuard(sessionsRepo: SessionsRepository) {
  return async (req: FastifyRequest, reply: any) => {
    const sid = req.headers["x-session-id"];
    if (!sid || typeof sid !== "string") return reply.code(401).send({ error: "Missing x-session-id" });

    const s = sessionsRepo.findById(sid);
    if (!s) return reply.code(401).send({ error: "Invalid session" });

    try {
      s.assertActive();
    } catch (e) {
      if (e instanceof Session.SessionTerminatedError) return reply.code(401).send({ error: e.message });
      throw e;
    }

    (req as any).sessionId = s.id;
    (req as any).userId = s.userId;
  };
}
