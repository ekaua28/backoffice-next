"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionGate } from "../components/SessionGate";
import { api } from "../lib/api";
import { clearSessionId, getSessionId } from "../lib/session";

export default function AppPage() {
  return (
    <SessionGate>
      <Inner />
    </SessionGate>
  );
}

function Inner() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string>("");

  useEffect(() => {
    api.me().then((r) => setFirstName(r.user?.firstName ?? ""));
  }, []);

  async function logout() {
    const sid = getSessionId();
    if (sid) {
      try {
        await api.logout(sid);
      } catch {
        // ignore
      }
    }
    clearSessionId();
    router.replace("/auth/signin");
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Hello {firstName || "..."}</h1>
        <button onClick={logout}>Log Out</button>
      </div>
    </main>
  );
}