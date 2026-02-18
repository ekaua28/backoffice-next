import type Database from "better-sqlite3";
import type { Db } from "./db";

/**
 * Typed query helpers for better-sqlite3.
 */
export function q(db: Db) {
  return {
    get<T>(sql: string, ...params: unknown[]): T | undefined {
      return db.prepare(sql).get(...params) as T | undefined;
    },
    all<T>(sql: string, ...params: unknown[]): T[] {
      return db.prepare(sql).all(...params) as T[];
    },
    run(sql: string, ...params: unknown[]): Database.RunResult {
      return db.prepare(sql).run(...params);
    }
  };
}
