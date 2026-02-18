import type { FastifyInstance } from "fastify";
import { AppError } from "../application/index.js";
import type { SessionsService, UsersService } from "../application";

export function registerSessionsRoutes(
  app: FastifyInstance,
  sessionsService: SessionsService,
  usersService: UsersService,
  guard: any,
) {
  app.get("/sessions/me", { preHandler: guard }, async (req: any, reply) => {
    try {
      const u = usersService.get(req.userId);
      return { id: req.sessionId, userId: req.userId, user: u ?? null };
    } catch (e) {
      if (e instanceof AppError)
        return reply.code(e.statusCode).send({ error: e.message });
      throw e;
    }
  });

  app.patch(
    "/sessions/:id/terminate",
    { preHandler: guard },
    async (req: any, reply) => {
      const id = (req.params as any).id as string;
      try {
        return sessionsService.terminate(id);
      } catch (e) {
        if (e instanceof AppError)
          return reply.code(e.statusCode).send({ error: e.message });
        throw e;
      }
    },
  );
}
