"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { clearSessionId, getSessionId } from "../lib/auth/session.storage";

export function SessionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) {
      router.replace("/auth/signup");
      return;
    }

    api.me()
      .then(() => setReady(true))
      .catch(() => {
        clearSessionId();
        router.replace("/auth/signup");
      });
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
