import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth.js";

vi.mock("node:crypto", () => ({
  randomUUID: () => "uuid-1",
}));

vi.mock("../../domain/index.js", () => {
  class InactiveUserCannotCreateSessionError extends Error {}

  class User {
    static InactiveUserCannotCreateSessionError = InactiveUserCannotCreateSessionError;

    static create(data: any) {
      const u: any = {
        ...data,
        id: data.id,
        credentials: data.credentials,
        bumpLogin: vi.fn(),
        assertCanCreateSession: vi.fn(),
      };
      return u;
    }
  }

  class Credentials {
    static fromPlainPassword = vi.fn(async (_pw: string) => ({
      verify: vi.fn(async (_pw2: string) => true),
    }));
  }

  return { User, Credentials };
});

// Мокаємо helpers/errors + mapper
vi.mock("../helpers/index.js", () => {
  const Errors = {
    conflict: (m: string) => Object.assign(new Error(m), { statusCode: 409 }),
    unauthorized: (m: string) => Object.assign(new Error(m), { statusCode: 401 }),
    forbidden: (m: string) => Object.assign(new Error(m), { statusCode: 403 }),
  };
  const toUserDto = (u: any) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, status: u.status });
  return { Errors, toUserDto };
});

const mkRepo = () => ({
  findByName: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
});

const mkSessions = () => ({
  create: vi.fn(),
});

describe("AuthService", () => {
  const usersRepo = mkRepo();
  const sessionsService = mkSessions();
  const svc = new AuthService(usersRepo as any, sessionsService as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signUp throws conflict if user exists", async () => {
    usersRepo.findByName.mockReturnValue({ id: "u1" });

    await expect(
      svc.signUp({ firstName: "A", lastName: "B", password: "pass" }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(usersRepo.create).not.toHaveBeenCalled();
    expect(sessionsService.create).not.toHaveBeenCalled();
  });

  it("signUp creates user, bumps login, creates session, returns dto", async () => {
    usersRepo.findByName.mockReturnValue(null);

    usersRepo.findById.mockReturnValue({
      id: "uuid-1",
      firstName: "A",
      lastName: "B",
      status: "active",
    });

    sessionsService.create.mockReturnValue({ id: "sid-1" });

    const res = await svc.signUp({ firstName: "A", lastName: "B", password: "pass" });

    expect(usersRepo.create).toHaveBeenCalledTimes(1);
    expect(sessionsService.create).toHaveBeenCalledWith("uuid-1");

    expect(res).toEqual({
      id: "sid-1",
      user: { id: "uuid-1", firstName: "A", lastName: "B", status: "active" },
    });
  });

  it("signIn throws unauthorized if user not found", async () => {
    usersRepo.findByName.mockReturnValue(null);

    await expect(
      svc.signIn({ firstName: "A", lastName: "B", password: "x" }),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(usersRepo.save).not.toHaveBeenCalled();
    expect(sessionsService.create).not.toHaveBeenCalled();
  });

  it("signIn throws unauthorized if password invalid", async () => {
    const u = {
      id: "u1",
      credentials: { verify: vi.fn(async () => false) },
      assertCanCreateSession: vi.fn(),
      bumpLogin: vi.fn(),
    };
    usersRepo.findByName.mockReturnValue(u);

    await expect(
      svc.signIn({ firstName: "A", lastName: "B", password: "bad" }),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it("signIn throws forbidden if user cannot create session (inactive)", async () => {
    const { User } = await import("../../domain/index.js");

    const u = {
      id: "u1",
      credentials: { verify: vi.fn(async () => true) },
      assertCanCreateSession: vi.fn(() => {
        throw new User.InactiveUserCannotCreateSessionError();
      }),
      bumpLogin: vi.fn(),
    };
    usersRepo.findByName.mockReturnValue(u);

    await expect(
      svc.signIn({ firstName: "A", lastName: "B", password: "ok" }),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(usersRepo.save).not.toHaveBeenCalled();
    expect(sessionsService.create).not.toHaveBeenCalled();
  });

  it("signIn bumps login, saves, creates session, returns dto", async () => {
    const u: any = {
      id: "u1",
      credentials: { verify: vi.fn(async () => true) },
      assertCanCreateSession: vi.fn(),
      bumpLogin: vi.fn(),
    };
    usersRepo.findByName.mockReturnValue(u);
    usersRepo.findById.mockReturnValue({ id: "u1", firstName: "A", lastName: "B", status: "active" });
    sessionsService.create.mockReturnValue({ id: "sid-9" });

    const res = await svc.signIn({ firstName: "A", lastName: "B", password: "ok" });

    expect(u.bumpLogin).toHaveBeenCalledTimes(1);
    expect(usersRepo.save).toHaveBeenCalledWith(u);
    expect(sessionsService.create).toHaveBeenCalledWith("u1");

    expect(res.id).toBe("sid-9");
    expect(res.user.id).toBe("u1");
  });
});