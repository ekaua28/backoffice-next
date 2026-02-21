import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:crypto", () => ({
  randomUUID: () => "sid-1",
}));

const domainMock = vi.hoisted(() => ({
  Session: {
    create: vi.fn(),
  },
}));

vi.mock("../../domain/index.js", () => domainMock);

const helpersMock = vi.hoisted(() => ({
  Errors: {
    notFound: (m: string) => Object.assign(new Error(m), { statusCode: 404 }),
  },
  toSessionDto: vi.fn(),
}));

vi.mock("../helpers/index.js", () => helpersMock);

import { SessionsService } from "./sessions.js";

describe("SessionsService", () => {
  const repo = {
    create: vi.fn(),
    save: vi.fn(),
    findById: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create() creates session via domain, persists it and returns dto", () => {
    const sessionEntity = { id: "sid-1", userId: "u1" };
    domainMock.Session.create.mockReturnValue(sessionEntity);
    helpersMock.toSessionDto.mockReturnValue({ id: "sid-1", userId: "u1" });

    const svc = new SessionsService(repo as any);
    const dto = svc.create("u1");

    expect(domainMock.Session.create).toHaveBeenCalledWith({
      id: "sid-1",
      userId: "u1",
      now: expect.any(String),
    });

    expect(repo.create).toHaveBeenCalledWith(sessionEntity);
    expect(helpersMock.toSessionDto).toHaveBeenCalledWith(sessionEntity);

    expect(dto).toEqual({ id: "sid-1", userId: "u1" });
  });

  it("terminate() throws notFound if session missing", () => {
    repo.findById.mockReturnValue(null);

    const svc = new SessionsService(repo as any);

    expect(() => svc.terminate("missing")).toThrow("Session not found");
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("terminate() terminates session, saves it and returns dto", () => {
    const sessionEntity = {
      id: "sid-1",
      userId: "u1",
      terminate: vi.fn(),
    };

    repo.findById.mockReturnValue(sessionEntity);
    helpersMock.toSessionDto.mockReturnValue({
      id: "sid-1",
      userId: "u1",
      terminationTime: "some-time",
    });

    const svc = new SessionsService(repo as any);
    const dto = svc.terminate("sid-1");

    expect(repo.findById).toHaveBeenCalledWith("sid-1");

    expect(sessionEntity.terminate).toHaveBeenCalledWith(expect.any(String));
    expect(repo.save).toHaveBeenCalledWith(sessionEntity);

    expect(helpersMock.toSessionDto).toHaveBeenCalledWith(sessionEntity);
    expect(dto).toEqual({
      id: "sid-1",
      userId: "u1",
      terminationTime: "some-time",
    });
  });
});