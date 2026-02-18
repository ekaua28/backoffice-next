import type { Db } from "../database/db.js";
import { q } from "../database/query.js";
import { Session, type SessionProps } from "../../domain";

type SessionRow = SessionProps;

export class SessionsRepository {
  private Q;

  constructor(private readonly db: Db) {
    this.Q = q(db);
  }

  findById(id: string): Session | undefined {
    const row = this.Q.get<SessionRow>(`SELECT * FROM sessions WHERE id=?`, id);
    return row ? Session.fromPersistence(row) : undefined;
  }

  create(session: Session): void {
    const p = session.toPersistence();
    this.Q.run(
      `INSERT INTO sessions (id, userId, createdAt, terminatedAt) VALUES (?, ?, ?, ?)`,
      p.id,
      p.userId,
      p.createdAt,
      p.terminatedAt,
    );
  }

  save(session: Session): void {
    const p = session.toPersistence();
    this.Q.run(
      `UPDATE sessions SET terminatedAt=? WHERE id=?`,
      p.terminatedAt,
      p.id,
    );
  }
}
