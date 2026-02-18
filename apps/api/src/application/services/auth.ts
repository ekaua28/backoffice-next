import { randomUUID } from "node:crypto";
import { User, Credentials } from "../../domain/index.js";
import { UsersRepository } from "../../infrastructure/index.js";
import { SessionsService } from "./sessions.js";
import type { UserDto } from "../helpers";
import { Errors, toUserDto } from "../helpers/index.js";

function nowIso() {
  return new Date().toISOString();
}

export class AuthService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly sessionsService: SessionsService,
  ) {}

  async signUp(input: {
    firstName: string;
    lastName: string;
    password: string;
  }): Promise<{ id: string; user: UserDto }> {
    const exists = this.usersRepo.findByName(input.firstName, input.lastName);
    if (exists) throw Errors.conflict("User already exists");

    const now = nowIso();
    const creds = await Credentials.fromPlainPassword(input.password);

    const user = User.create({
      id: randomUUID(),
      firstName: input.firstName,
      lastName: input.lastName,
      status: "active",
      credentials: creds,
      now,
    });

    user.bumpLogin(now);
    this.usersRepo.create(user);

    const session = this.sessionsService.create(user.id);
    const saved = this.usersRepo.findById(user.id)!;
    return { id: session.id, user: toUserDto(saved) };
  }

  async signIn(input: {
    firstName: string;
    lastName: string;
    password: string;
  }): Promise<{ id: string; user: UserDto }> {
    const u = this.usersRepo.findByName(input.firstName, input.lastName);
    if (!u) throw Errors.unauthorized("Invalid credentials");

    const ok = await u.credentials.verify(input.password);
    if (!ok) throw Errors.unauthorized("Invalid credentials");

    try {
      u.assertCanCreateSession();
    } catch (e) {
      if (e instanceof User.InactiveUserCannotCreateSessionError)
        throw Errors.forbidden(e.message);
      throw e;
    }

    u.bumpLogin(nowIso());
    this.usersRepo.save(u);

    const session = this.sessionsService.create(u.id);
    const saved = this.usersRepo.findById(u.id)!;
    return { id: session.id, user: toUserDto(saved) };
  }
}
