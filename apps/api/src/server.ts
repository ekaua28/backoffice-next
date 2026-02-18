import { DbSingleton } from "./infrastructure/database/db.js";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 4000);
const DB_PATH = process.env.DB_PATH ?? "./app.db";

const db = DbSingleton.get(DB_PATH);
const app = createApp(db);

app.listen({ port: PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
