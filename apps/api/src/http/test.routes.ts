import type { FastifyInstance } from "fastify";

/**
 * Test-only routes (enabled only when NODE_ENV === "test").
 * Allows E2E tests to reset DB state deterministically.
 */
export function registerTestRoutes(app: FastifyInstance, db: any) {
  app.post("/test/reset", async (_req, reply) => {
    db.exec(`
      DELETE FROM sessions;
      DELETE FROM users;
    `);
    return reply.code(204).send();
  });
}