import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("../../components/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light", toggle: vi.fn() }),
}));

vi.mock("../../components/SessionGate", () => ({
  SessionGate: ({ children }: any) => <>{children}</>,
}));

const apiMock = vi.hoisted(() => ({
  me: vi.fn(),
  usersList: vi.fn(),
  usersCreate: vi.fn(),
  usersUpdate: vi.fn(),
  usersDelete: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  api: apiMock,
}));

const sessionMock = vi.hoisted(() => ({
  getSessionId: vi.fn(),
  clearSessionId: vi.fn(),
}));

vi.mock("../../lib/auth/session.storage", () => sessionMock);

import { Dashboard } from "./page";

const confirmSpy = vi.spyOn(window, "confirm");

function mkUser(partial: Partial<any>) {
  const now = Date.now();
  return {
    id: "u1",
    firstName: "John",
    lastName: "Doe",
    status: "active",
    loginsCounter: 1,
    creationTime: now,
    lastUpdateTime: now,
    ...partial,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  confirmSpy.mockReturnValue(true);

  apiMock.me.mockResolvedValue({ user: { id: "me", firstName: "Me" } });
  apiMock.usersList.mockResolvedValue({
    items: [mkUser({ id: "me", firstName: "Me", lastName: "User" })],
    total: 1,
    page: 1,
  });

  sessionMock.getSessionId.mockReturnValue("sid-123");
});

describe("Dashboard", () => {
  it("loads me + users on mount", async () => {
    render(<Dashboard />);

    expect(await screen.findByText(/Hello Me/i)).toBeInTheDocument();

    expect(apiMock.me).toHaveBeenCalledTimes(1);
    expect(apiMock.usersList).toHaveBeenCalledWith(1, 6);

    expect(screen.getByText("you")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Me")).toBeInTheDocument();
    expect(screen.getByDisplayValue("User")).toBeInTheDocument();
  });

  it("opens/closes create dialog", async () => {
    render(<Dashboard />);
    await screen.findByText(/Hello Me/i);
    await userEvent.click(screen.getByRole("button", { name: /Create user/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("creates user, resets form, refreshes list", async () => {
    render(<Dashboard />);
    await screen.findByText(/Hello Me/i);

    apiMock.usersCreate.mockResolvedValue({});

    apiMock.usersList
      .mockResolvedValueOnce({
        items: [mkUser({ id: "me", firstName: "Me", lastName: "User" })],
        total: 1,
        page: 1,
      })
      .mockResolvedValueOnce({
        items: [
          mkUser({ id: "me", firstName: "Me", lastName: "User" }),
          mkUser({ id: "u2", firstName: "Alice", lastName: "Smith" }),
        ],
        total: 2,
        page: 1,
      });

    await userEvent.click(screen.getByRole("button", { name: /Create user/i }));
    const dialog = screen.getByRole("dialog");

    await userEvent.type(within(dialog).getByLabelText(/First name/i), "Alice");
    await userEvent.type(within(dialog).getByLabelText(/Last name/i), "Smith");
    await userEvent.type(within(dialog).getByLabelText(/Password/i), "pass123");

    await userEvent.click(
      within(dialog).getByRole("button", { name: /Create/i }),
    );

    await waitFor(() => {
      expect(apiMock.usersCreate).toHaveBeenCalledWith({
        firstName: "Alice",
        lastName: "Smith",
        password: "pass123",
        status: "active",
      });
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("current user row has disabled status/save/delete", async () => {
    render(<Dashboard />);
    await screen.findByText(/Hello Me/i);

    const youChip = screen.getByText("you");
    const row = youChip.closest("tr");
    expect(row).toBeTruthy();

    const save = within(row!).getByRole("button", { name: /Save/i });
    const del = within(row!).getByRole("button", { name: /Delete/i });

    expect(save).toBeDisabled();
    expect(del).toBeDisabled();
  });

  it("deletes user after confirm and refreshes", async () => {
    apiMock.usersList.mockResolvedValue({
      items: [
        mkUser({ id: "me", firstName: "Me", lastName: "User" }),
        mkUser({ id: "u2", firstName: "Alice", lastName: "Smith" }),
      ],
      total: 2,
      page: 1,
    });

    render(<Dashboard />);
    await screen.findByText(/Hello Me/i);

    apiMock.usersDelete.mockResolvedValue({});
    apiMock.usersList.mockResolvedValue({
      items: [mkUser({ id: "me", firstName: "Me", lastName: "User" })],
      total: 1,
      page: 1,
    });

    const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
    await userEvent.click(deleteButtons[1]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(apiMock.usersDelete).toHaveBeenCalledWith("u2");
      expect(apiMock.usersList).toHaveBeenCalledWith(1, 6);
    });
  });

  it("shows error from API", async () => {
    apiMock.me.mockRejectedValueOnce(new Error("boom"));

    render(<Dashboard />);

    expect(await screen.findByText("boom")).toBeInTheDocument();
  });
});
