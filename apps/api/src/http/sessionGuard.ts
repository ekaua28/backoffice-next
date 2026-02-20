import type {
  FastifyReply,
  FastifyRequest,
  preHandlerHookHandler,
} from "fastify";
import type { SessionsRepository } from "../infrastructure/index.js";
import { Session } from "../domain/index.js";

export function createSessionGuard(
  sessionsRepo: SessionsRepository,
): preHandlerHookHandler {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const sid = req.headers["x-session-id"];
    if (!sid || typeof sid !== "string")
      return reply.code(401).send({ error: "Missing x-session-id" });

    const s = sessionsRepo.findById(sid);
    if (!s) return reply.code(401).send({ error: "Invalid session" });

    try {
      s.assertActive();
    } catch (e) {
      if (e instanceof Session.SessionTerminatedError)
        return reply.code(401).send({ error: e.message });
      throw e;
    }

    req.sessionId = s.id;
    req.userId = s.userId;
  };
}
