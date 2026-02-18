import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import type { UserDto } from "../helpers";
import { Credentials, User } from "../../domain";
import type { UserStatus } from "../../domain";
import { UsersRepository } from "../../infrastructure";
import { Errors, toUserDto } from "../helpers";

function nowIso() {
  return new Date().toISOString();
}

export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async create(input: {
    firstName: string;
    lastName: string;
    password: string;
    status?: UserStatus;
  }): Promise<UserDto> {
    const exists = this.usersRepo.findByName(input.firstName, input.lastName);
    if (exists) throw Errors.conflict("User already exists");

    const passwordHash = await argon2.hash(input.password);
    const user = User.create({
      id: randomUUID(),
      firstName: input.firstName,
      lastName: input.lastName,
      status: input.status ?? "active",
      credentials: Credentials.fromHash(passwordHash),
      now: nowIso(),
    });

    this.usersRepo.create(user);

    const saved = this.usersRepo.findById(user.id)!;
    return toUserDto(saved);
  }

  list(page: number, limit: number) {
    const { items, total } = this.usersRepo.list(page, limit);
    return { items: items.map(toUserDto), total, page, limit };
  }

  update(
    id: string,
    patch: { firstName?: string; lastName?: string; status?: UserStatus },
  ): UserDto {
    const u = this.usersRepo.findById(id);
    if (!u) throw Errors.notFound("User not found");

    try {
      u.update(patch, nowIso());
    } catch (e) {
      if (e instanceof User.InactiveUserCannotRenameError)
        throw Errors.badRequest(e.message);
      throw e;
    }

    this.usersRepo.save(u);
    return toUserDto(this.usersRepo.findById(id)!);
  }

  remove(id: string): void {
    const changes = this.usersRepo.deleteById(id);
    if (changes === 0) throw Errors.notFound("User not found");
  }

  get(userId: string) {
    try {
      const u = this.usersRepo.findById(userId);
      return u ? toUserDto(u) : null;
    } catch {
      throw Errors.notFound("Session not found.");
    }
  }
}
