import type { FastifyInstance } from "fastify";
import { SignInSchema, SignUpSchema } from "./validators.js";
import { AppError } from "../application/index.js";
import type { AuthService } from "../application";

/**
 * Auth routes.
 */
export function registerAuthRoutes(app: FastifyInstance, auth: AuthService) {
  app.post("/auth/signup", async (req, reply) => {
    const parsed = SignUpSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());

    try {
      return await auth.signUp(parsed.data);
    } catch (e) {
      if (e instanceof AppError)
        return reply.code(e.statusCode).send({ error: e.message });
      throw e;
    }
  });

  app.post("/auth/signin", async (req, reply) => {
    const parsed = SignInSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());

    try {
      return await auth.signIn(parsed.data);
    } catch (e) {
      if (e instanceof AppError)
        return reply.code(e.statusCode).send({ error: e.message });
      throw e;
    }
  });
}
