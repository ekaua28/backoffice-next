import type { UserDto, SessionDto } from "./dto.js";
import { User } from "../../domain/entities/user.js";
import { Session } from "../../domain/entities/session.js";

export function toUserDto(u: User): UserDto {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    status: u.status,
    loginsCounter: u.loginsCounter,
    creationTime: u.createdAt,
    lastUpdateTime: u.updatedAt
  };
}

export function toSessionDto(s: Session): SessionDto {
  return {
    id: s.id,
    userId: s.userId,
    creationTime: s.createdAt,
    terminationTime: s.terminatedAt ?? null
  };
}
