import { req } from "./client";
import type { Paged, UserDto } from "./types";

export const usersList = (page: number, limit = 6) =>
  req<Paged<UserDto>>(`/users?page=${page}&limit=${limit}`);

export const usersCreate = (body: {
  firstName: string;
  lastName: string;
  password: string;
  status?: "active" | "inactive";
}) => req<UserDto>(`/users`, { method: "POST", body: JSON.stringify(body) });

export const usersUpdate = (
  id: string,
  body: {
    firstName?: string;
    lastName?: string;
    status?: "active" | "inactive";
  },
) =>
  req<UserDto>(`/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const usersDelete = (id: string) =>
  req<void>(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
