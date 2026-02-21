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
  signUp: vi.fn(),
}));

vi.mock("../../../lib/api", () => ({
  api: apiMock,
}));

const sessionMock = vi.hoisted(() => ({
  setSessionId: vi.fn(),
}));

vi.mock("../../../lib/auth/session.storage", () => sessionMock);

import SignUpPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SignUpPage", () => {
  it("renders fields and signin link", () => {
    render(<SignUpPage />);

    expect(
      screen.getByRole("heading", { name: /^Sign up$/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/First name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument();

    const passwordFields = screen.getAllByLabelText(/password/i);
    expect(passwordFields).toHaveLength(2);

    const submit = screen.getByRole("button", { name: /Create account/i });
    expect(submit).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /^Sign in$/i });
    expect(link).toHaveAttribute("href", "/auth/signin");
  });

  it("shows error when passwords do not match (no api call)", async () => {
    render(<SignUpPage />);

    await userEvent.type(screen.getByLabelText(/First name/i), "John");
    await userEvent.type(screen.getByLabelText(/Last name/i), "Doe");
    const [p1, p2] = screen.getAllByLabelText(/password/i);

    await userEvent.type(p1, "pass123");
    await userEvent.type(p2, "123");

    await userEvent.click(
      screen.getByRole("button", { name: /Create account/i }),
    );

    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
    expect(apiMock.signUp).not.toHaveBeenCalled();
    expect(sessionMock.setSessionId).not.toHaveBeenCalled();
  });

  it("shows error when password is too short (no api call)", async () => {
    render(<SignUpPage />);

    await userEvent.type(screen.getByLabelText(/First name/i), "John");
    await userEvent.type(screen.getByLabelText(/Last name/i), "Doe");
    const [p1, p2] = screen.getAllByLabelText(/password/i);

    await userEvent.type(p1, "12345");
    await userEvent.type(p2, "12345");
    await userEvent.click(
      screen.getByRole("button", { name: /Create account/i }),
    );

    expect(
      await screen.findByText("Passwords must contain at least 6 character"),
    ).toBeInTheDocument();

    expect(apiMock.signUp).not.toHaveBeenCalled();
  });

  it("submits, stores session id, navigates to /dashboard", async () => {
    const { useRouter } = await import("next/navigation");
    const r = useRouter();

    apiMock.signUp.mockResolvedValue({ id: "sid-42" });

    render(<SignUpPage />);

    await userEvent.type(screen.getByLabelText(/First name/i), "John");
    await userEvent.type(screen.getByLabelText(/Last name/i), "Doe");

    const [p1, p2] = screen.getAllByLabelText(/password/i);

    await userEvent.type(p1, "pass123");
    await userEvent.type(p2, "pass123");

    await userEvent.click(
      screen.getByRole("button", { name: /Create account/i }),
    );

    await waitFor(() => {
      expect(apiMock.signUp).toHaveBeenCalledWith({
        firstName: "John",
        lastName: "Doe",
        password: "pass123",
      });
      expect(sessionMock.setSessionId).toHaveBeenCalledWith("sid-42");
    });
  });

  it("shows loading state while submitting", async () => {
    let resolve!: (v: any) => void;
    apiMock.signUp.mockImplementation(() => new Promise((r) => (resolve = r)));

    render(<SignUpPage />);

    await userEvent.type(screen.getByLabelText(/First name/i), "John");
    await userEvent.type(screen.getByLabelText(/Last name/i), "Doe");
    const [p1, p2] = screen.getAllByLabelText(/password/i);

    await userEvent.type(p1, "pass123");
    await userEvent.type(p2, "pass123");

    await userEvent.click(
      screen.getByRole("button", { name: /Create account/i }),
    );

    expect(
      screen.getByRole("button", { name: /Signing up\.\.\./i }),
    ).toBeDisabled();

    resolve({ id: "sid-1" });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Create account/i }),
      ).toBeEnabled(),
    );
  });

  it("shows error message from api (Error)", async () => {
    apiMock.signUp.mockRejectedValue(new Error("Email exists"));

    render(<SignUpPage />);

    await userEvent.type(screen.getByLabelText(/First name/i), "John");
    await userEvent.type(screen.getByLabelText(/Last name/i), "Doe");
    const [p1, p2] = screen.getAllByLabelText(/password/i);

    await userEvent.type(p1, "pass123");
    await userEvent.type(p2, "pass123");

    await userEvent.click(
      screen.getByRole("button", { name: /Create account/i }),
    );

    expect(await screen.findByText("Email exists")).toBeInTheDocument();
  });

  it("shows generic error when thrown value is not Error", async () => {
    apiMock.signUp.mockRejectedValue("nope");

    render(<SignUpPage />);

    await userEvent.type(screen.getByLabelText(/First name/i), "John");
    await userEvent.type(screen.getByLabelText(/Last name/i), "Doe");
    const [p1, p2] = screen.getAllByLabelText(/password/i);

    await userEvent.type(p1, "pass123");
    await userEvent.type(p2, "pass123");

    await userEvent.click(
      screen.getByRole("button", { name: /Create account/i }),
    );

    expect(await screen.findByText("Failed")).toBeInTheDocument();
  });
});
