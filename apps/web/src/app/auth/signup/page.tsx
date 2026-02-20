"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../lib/api";
import { setSessionId } from "../../../lib/auth/session.storage";

export default function SignUpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (p1 !== p2) {
      setErr("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await api.signUp({ firstName, lastName, password: p1 });
      setSessionId(res.id);
      router.replace("/dashboard");
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr("Failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Sign up</h1>

      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 10, marginTop: 12 }}
      >
        <input
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={p1}
          onChange={(e) => setP1(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Repeat password"
          value={p2}
          onChange={(e) => setP2(e.target.value)}
          required
        />

        {err && <p style={{ color: "crimson" }}>{err}</p>}

        <button disabled={loading} type="submit">
          {loading ? "Signing up..." : "Create account"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Already have an account? <Link href="/auth/signin">Sign in</Link>
      </p>
    </main>
  );
}
