import Fastify from "fastify";
import type { Db } from "./infrastructure";
import {
  UsersRepository,
  SessionsRepository,
  migrate,
} from "./infrastructure/index.js";
import {
  AuthService,
  SessionsService,
  UsersService,
} from "./application/index.js";
import {
  createSessionGuard,
  registerAuthRoutes,
  registerUsersRoutes,
  registerSessionsRoutes,
  registerTestRoutes,
} from "./http/index.js";

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

  app.addHook("onRequest", async (req, reply) => {
    reply.header("access-control-allow-origin", req.headers.origin ?? "*");
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

  if (process.env.ENABLE_TEST_ROUTES === "true") {
    registerTestRoutes(app, db);
  }

  return app;
}
