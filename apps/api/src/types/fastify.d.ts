import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    sessionId: string;
    userId: string;
  }
}