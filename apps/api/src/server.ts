import Fastify from "fastify";

const PORT = Number(process.env.PORT ?? 4000);

const app = Fastify({ logger: true });

app.get("/health", async () => {
  return { status: "ok" };
});

app.get("/", async () => {
  return { message: "API running" };
});

app.listen({ port: PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});