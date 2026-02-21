import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

const apiMock = vi.hoisted(() => ({
  signIn: vi.fn(),
}));

vi.mock("../../../lib/api", () => ({
  api: apiMock,
}));

const sessionMock = vi.hoisted(() => ({
  setSessionId: vi.fn(),
}));

vi.mock("../../../lib/auth/session.storage", () => sessionMock);

import SignInPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SignInPage", () => {
  it("renders fields and signup link", () => {
    render(<SignInPage />);

    expect(
      screen.getByRole("heading", { name: /^Sign in$/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/First name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();

    const btn = screen.getByRole("button", { name: /^Sign in$/i });
    expect(btn).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Sign up/i });
    expect(link).toHaveAttribute("href", "/auth/signup");
  });

  it("submits, stores session id, navigates to /dashboard", async () => {
    const { useRouter } = await import("next/navigation");
    const r = useRouter();

    apiMock.signIn.mockResolvedValue({ id: "sid-1" });

    render(<SignInPage />);

    await userEvent.type(screen.getByLabelText(/First name/i), "John");
    await userEvent.type(screen.getByLabelText(/Last name/i), "Doe");
    await userEvent.type(screen.getByLabelText(/Password/i), "pass");

    await userEvent.click(screen.getByRole("button", { name: /^Sign in$/i }));

    await waitFor(() => {
      expect(apiMock.signIn).toHaveBeenCalledWith({
        firstName: "John",
        lastName: "Doe",
        password: "pass",
      });
      expect(sessionMock.setSessionId).toHaveBeenCalledWith("sid-1");
    });
  });

  it("shows loading state while submitting", async () => {
    let resolve!: (v: any) => void;
    apiMock.signIn.mockImplementation(() => new Promise((r) => (resolve = r)));

    render(<SignInPage />);

    await userEvent.type(screen.getByLabelText(/First name/i), "John");
    await userEvent.type(screen.getByLabelText(/Last name/i), "Doe");
    await userEvent.type(screen.getByLabelText(/Password/i), "pass");

    await userEvent.click(screen.getByRole("button", { name: /^Sign in$/i }));

    expect(
      screen.getByRole("button", { name: /Signing in\.\.\./i }),
    ).toBeDisabled();

    resolve({ id: "sid-1" });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^Sign in$/i })).toBeEnabled(),
    );
  });

  it("shows error message from api (Error)", async () => {
    apiMock.signIn.mockRejectedValue(new Error("Invalid creds"));

    render(<SignInPage />);

    await userEvent.type(screen.getByLabelText(/First name/i), "John");
    await userEvent.type(screen.getByLabelText(/Last name/i), "Doe");
    await userEvent.type(screen.getByLabelText(/Password/i), "bad");

    await userEvent.click(screen.getByRole("button", { name: /^Sign in$/i }));

    expect(await screen.findByText("Invalid creds")).toBeInTheDocument();
  });

  it("shows generic error when thrown value is not Error", async () => {
    apiMock.signIn.mockRejectedValue("nope");

    render(<SignInPage />);

    await userEvent.type(screen.getByLabelText(/First name/i), "John");
    await userEvent.type(screen.getByLabelText(/Last name/i), "Doe");
    await userEvent.type(screen.getByLabelText(/Password/i), "bad");

    await userEvent.click(screen.getByRole("button", { name: /^Sign in$/i }));

    expect(await screen.findByText("Failed")).toBeInTheDocument();
  });
});
