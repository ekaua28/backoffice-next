import { randomUUID } from "node:crypto";
import { Session } from "../../domain/index.js";
import { SessionsRepository } from "../../infrastructure/index.js";
import { Errors, SessionDto, toSessionDto } from "../helpers/index.js";

function nowIso() {
  return new Date().toISOString();
}

export class SessionsService {
  constructor(private readonly sessionsRepo: SessionsRepository) {}

  create(userId: string): SessionDto {
    const s = Session.create({ id: randomUUID(), userId, now: nowIso() });
    this.sessionsRepo.create(s);
    return toSessionDto(s);
  }

  terminate(sessionId: string): SessionDto {
    const s = this.sessionsRepo.findById(sessionId);
    if (!s) throw Errors.notFound("Session not found");

    s.terminate(nowIso());
    this.sessionsRepo.save(s);

    return toSessionDto(s);
  }
}
