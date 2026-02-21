import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:crypto", () => ({
  randomUUID: () => "uid-1",
}));

vi.mock("argon2", () => ({
  default: {
    hash: vi.fn(async (_pw: string) => "hash-1"),
  },
}));

const domainMock = vi.hoisted(() => {
  class InactiveUserCannotRenameError extends Error {}

  const User = {
    InactiveUserCannotRenameError,
    create: vi.fn(),
  };

  const Credentials = {
    fromHash: vi.fn(),
  };

  return { User, Credentials };
});

vi.mock("../../domain/index.js", () => domainMock);

const helpersMock = vi.hoisted(() => ({
  Errors: {
    conflict: (m: string) => Object.assign(new Error(m), { statusCode: 409 }),
    notFound: (m: string) => Object.assign(new Error(m), { statusCode: 404 }),
    badRequest: (m: string) => Object.assign(new Error(m), { statusCode: 400 }),
  },
  toUserDto: vi.fn((u: any) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    status: u.status,
  })),
}));

vi.mock("../helpers/index.js", () => helpersMock);

import { UsersService } from "./users.js";

describe("UsersService", () => {
  const repo = {
    findByName: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    list: vi.fn(),
    deleteById: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create() throws conflict if user exists", async () => {
    repo.findByName.mockReturnValue({ id: "x" });

    const svc = new UsersService(repo as any);

    await expect(
      svc.create({ firstName: "A", lastName: "B", password: "123456" }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(repo.create).not.toHaveBeenCalled();
  });

  it("create() hashes password, creates user, persists and returns dto", async () => {
    repo.findByName.mockReturnValue(null);

    const creds = { kind: "creds" };
    domainMock.Credentials.fromHash.mockReturnValue(creds);

    const userEntity = { id: "uid-1", firstName: "A", lastName: "B", status: "active", credentials: creds };
    domainMock.User.create.mockReturnValue(userEntity);

    repo.findById.mockReturnValue(userEntity);

    const svc = new UsersService(repo as any);
    const dto = await svc.create({ firstName: "A", lastName: "B", password: "123456" });

    const argon2 = (await import("argon2")).default;
    expect(argon2.hash).toHaveBeenCalledWith("123456");

    expect(domainMock.Credentials.fromHash).toHaveBeenCalledWith("hash-1");

    expect(domainMock.User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "uid-1",
        firstName: "A",
        lastName: "B",
        status: "active",
        credentials: creds,
        now: expect.any(String),
      }),
    );

    expect(repo.create).toHaveBeenCalledWith(userEntity);
    expect(repo.findById).toHaveBeenCalledWith("uid-1");

    expect(helpersMock.toUserDto).toHaveBeenCalledWith(userEntity);
    expect(dto).toEqual({ id: "uid-1", firstName: "A", lastName: "B", status: "active" });
  });

  it("list() returns mapped items with pagination meta", () => {
    const u1 = { id: "u1", firstName: "A", lastName: "B", status: "active" };
    const u2 = { id: "u2", firstName: "C", lastName: "D", status: "inactive" };

    repo.list.mockReturnValue({ items: [u1, u2], total: 10 });

    const svc = new UsersService(repo as any);
    const res = svc.list(2, 6);

    expect(repo.list).toHaveBeenCalledWith(2, 6);
    expect(res).toEqual({
      items: [
        { id: "u1", firstName: "A", lastName: "B", status: "active" },
        { id: "u2", firstName: "C", lastName: "D", status: "inactive" },
      ],
      total: 10,
      page: 2,
      limit: 6,
    });
  });

  it("update() throws notFound if user missing", () => {
    repo.findById.mockReturnValue(null);

    const svc = new UsersService(repo as any);

    expect(() => svc.update("missing", { firstName: "X" })).toThrow("User not found");
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("update() maps domain rename error to badRequest", () => {
    const { User } = domainMock;

    const u = {
      id: "u1",
      update: vi.fn(() => {
        throw new User.InactiveUserCannotRenameError("Inactive cannot rename");
      }),
    };

    repo.findById.mockReturnValue(u);

    const svc = new UsersService(repo as any);

    expect(() => svc.update("u1", { firstName: "X" })).toThrow("Inactive cannot rename");
    try {
      svc.update("u1", { firstName: "X" });
    } catch (e: any) {
      expect(e.statusCode).toBe(400);
    }

    expect(repo.save).not.toHaveBeenCalled();
  });

  it("update() updates, saves and returns dto", () => {
    const u: any = {
      id: "u1",
      firstName: "A",
      lastName: "B",
      status: "active",
      update: vi.fn(),
    };

    repo.findById.mockReturnValue(u);

    const svc = new UsersService(repo as any);
    const dto = svc.update("u1", { lastName: "BB" });

    expect(u.update).toHaveBeenCalledWith({ lastName: "BB" }, expect.any(String));
    expect(repo.save).toHaveBeenCalledWith(u);
    expect(dto).toEqual({ id: "u1", firstName: "A", lastName: "B", status: "active" });
  });

  it("remove() throws notFound when nothing deleted", () => {
    repo.deleteById.mockReturnValue(0);

    const svc = new UsersService(repo as any);
    expect(() => svc.remove("x")).toThrow("User not found");
  });

  it("remove() succeeds when deleteById returns changes > 0", () => {
    repo.deleteById.mockReturnValue(1);

    const svc = new UsersService(repo as any);
    expect(() => svc.remove("u1")).not.toThrow();
  });

  it("get() returns dto when user exists", () => {
    repo.findById.mockReturnValue({ id: "u1", firstName: "A", lastName: "B", status: "active" });

    const svc = new UsersService(repo as any);
    const res = svc.get("u1");

    expect(res).toEqual({ id: "u1", firstName: "A", lastName: "B", status: "active" });
  });

  it("get() returns null when user not found", () => {
    repo.findById.mockReturnValue(null);

    const svc = new UsersService(repo as any);
    expect(svc.get("missing")).toBeNull();
  });

  it("get() maps repo error to notFound('Session not found.')", () => {
    repo.findById.mockImplementation(() => {
      throw new Error("db down");
    });

    const svc = new UsersService(repo as any);
    try {
      svc.get("u1");
      throw new Error("expected");
    } catch (e: any) {
      expect(e.statusCode).toBe(404);
      expect(e.message).toBe("Session not found.");
    }
  });
});