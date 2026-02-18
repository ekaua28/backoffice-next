import type { Db } from "../database";
import { q } from "../database/index.js";
import { User } from "../../domain/index.js";

type UserDbRow = {
  id: string;
  firstName: string;
  lastName: string;
  status: "active" | "inactive";
  loginsCounter: number;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export class UsersRepository {
  private Q;
  constructor(private readonly db: Db) {
    this.Q = q(db);
  }

  findById(id: string): User | undefined {
    const row = this.Q.get<UserDbRow>(`SELECT * FROM users WHERE id=?`, id);
    return row ? User.fromPersistence(row) : undefined;
  }

  findByName(firstName: string, lastName: string): User | undefined {
    const row = this.Q.get<UserDbRow>(
      `SELECT * FROM users WHERE firstName=? AND lastName=?`,
      firstName,
      lastName,
    );
    return row ? User.fromPersistence(row) : undefined;
  }

  list(page: number, limit: number): { items: User[]; total: number } {
    const total = this.Q.get<{ c: number }>(
      `SELECT COUNT(*) as c FROM users`,
    )!.c;
    const offset = (page - 1) * limit;
    const rows = this.Q.all<UserDbRow>(
      `SELECT * FROM users ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      limit,
      offset,
    );
    return { total, items: rows.map(User.fromPersistence) };
  }

  create(user: User): void {
    const p = user.toPersistence();
    this.Q.run(
      `INSERT INTO users (id, firstName, lastName, status, loginsCounter, passwordHash, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      p.id,
      p.firstName,
      p.lastName,
      p.status,
      p.loginsCounter,
      p.passwordHash,
      p.createdAt,
      p.updatedAt,
    );
  }

  save(user: User): void {
    const p = user.toPersistence();
    this.Q.run(
      `UPDATE users SET firstName=?, lastName=?, status=?, loginsCounter=?, passwordHash=?, updatedAt=? WHERE id=?`,
      p.firstName,
      p.lastName,
      p.status,
      p.loginsCounter,
      p.passwordHash,
      p.updatedAt,
      p.id,
    );
  }

  deleteById(id: string): number {
    return this.Q.run(`DELETE FROM users WHERE id=?`, id).changes;
  }
}
