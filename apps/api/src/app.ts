import Fastify from "fastify";
import type { Db } from "./infrastructure";
import { UsersRepository, SessionsRepository, migrate } from "./infrastructure";
import { AuthService, SessionsService, UsersService } from "./application";
import {
  createSessionGuard,
  registerAuthRoutes,
  registerUsersRoutes,
  registerSessionsRoutes,
} from "./http";

/**
 * Creates Fastify app with all dependencies wired (DI).
 */
export function createApp(db: Db) {
  migrate(db);

  const usersRepo = new UsersRepository(db);
  const sessionsRepo = new SessionsRepository(db);

  const usersService = new UsersService(usersRepo);
  const sessionsService = new SessionsService(sessionsRepo);
  const authService = new AuthService(usersRepo, sessionsService);

  const guard = createSessionGuard(sessionsRepo);

  const app = Fastify({ logger: true });

  // minimal CORS for local dev
  app.addHook("onSend", async (_req, reply) => {
    reply.header("access-control-allow-origin", "*");
    reply.header("access-control-allow-headers", "content-type,x-session-id");
    reply.header(
      "access-control-allow-methods",
      "GET,POST,PATCH,DELETE,OPTIONS",
    );
  });
  app.options("*", async (_req, reply) => reply.code(204).send());

  app.get("/health", async () => ({ ok: true }));

  registerAuthRoutes(app, authService);
  registerUsersRoutes(app, usersService, guard);
  registerSessionsRoutes(app, sessionsService, usersService, guard);

  return app;
}
