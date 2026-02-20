import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { AppError, UsersService } from "../application/index.js";
import {
  CreateUserSchema,
  PaginationSchema,
  UpdateUserSchema,
} from "./validators.js";

export function registerUsersRoutes(
  app: FastifyInstance,
  usersService: UsersService,
  guard: preHandlerHookHandler,
) {
  app.post("/users", { preHandler: guard }, async (req, reply) => {
    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
    try {
      return reply.code(201).send(await usersService.create(parsed.data));
    } catch (e) {
      if (e instanceof AppError)
        return reply.code(e.statusCode).send({ error: e.message });
      throw e;
    }
  });

  app.get("/users", { preHandler: guard }, async (req, reply) => {
    const parsed = PaginationSchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
    try {
      return usersService.list(parsed.data.page, parsed.data.limit);
    } catch (e) {
      if (e instanceof AppError)
        return reply.code(e.statusCode).send({ error: e.message });
      throw e;
    }
  });

  app.patch<{ Params: { id: string } }>(
    "/users/:id",
    { preHandler: guard },
    async (req, reply) => {
      const id = req.params.id;
      const parsed = UpdateUserSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
      if (
        id === req.userId &&
        req.body &&
        (req.body as any).status === "inactive"
      ) {
        return reply
          .code(403)
          .send({ error: "You cannot deactivate yourself" });
      }
      try {
        return usersService.update(id, parsed.data);
      } catch (e) {
        if (e instanceof AppError)
          return reply.code(e.statusCode).send({ error: e.message });
        throw e;
      }
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/users/:id",
    { preHandler: guard },
    async (req, reply) => {
      const id = req.params.id;
      if (id === req.userId) {
        return reply.code(403).send({ error: "You cannot delete yourself" });
      }
      try {
        usersService.remove(id);
        return reply.code(204).send();
      } catch (e) {
        if (e instanceof AppError)
          return reply.code(e.statusCode).send({ error: e.message });
        throw e;
      }
    },
  );
}
