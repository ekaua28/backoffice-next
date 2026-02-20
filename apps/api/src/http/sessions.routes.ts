import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { AppError } from "../application/index.js";
import type { SessionsService, UsersService } from "../application";

export function registerSessionsRoutes(
  app: FastifyInstance,
  sessionsService: SessionsService,
  usersService: UsersService,
  guard: preHandlerHookHandler,
) {
  app.get("/sessions/me", { preHandler: guard }, async (req, reply) => {
    try {
      const u = usersService.get(req.userId);
      return { id: req.sessionId, userId: req.userId, user: u ?? null };
    } catch (e) {
      if (e instanceof AppError)
        return reply.code(e.statusCode).send({ error: e.message });
      throw e;
    }
  });

  app.patch<{ Params: { id: string } }>(
    "/sessions/:id/terminate",
    { preHandler: guard },
    async (req, reply) => {
      try {
        return sessionsService.terminate(req.params.id);
      } catch (e) {
        if (e instanceof AppError)
          return reply.code(e.statusCode).send({ error: e.message });
        throw e;
      }
    },
  );
}
