import Database from "better-sqlite3";

export type Db = Database.Database;

/**
 * DB singleton holder (for runtime). Tests can bypass and use createDb(":memory:").
 */
class DbSingleton {
  private static instance: Db | null = null;

  static get(dbPath: string): Db {
    if (!DbSingleton.instance) {
      DbSingleton.instance = createDb(dbPath);
    }
    return DbSingleton.instance;
  }

  static reset() {
    if (DbSingleton.instance) {
      DbSingleton.instance.close();
      DbSingleton.instance = null;
    }
  }
}

/**
 * Creates and configures SQLite connection.
 * @param dbPath file path or ":memory:"
 */
export function createDb(dbPath: string): Db {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export { DbSingleton };