"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../lib/api";
import { setSessionId } from "../../../lib/auth/session.storage";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
} from "@mui/material";

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
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Sign up
        </Typography>

        <Stack component="form" onSubmit={onSubmit} spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <TextField
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            required
          />
          <TextField
            label="Repeat password"
            type="password"
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            required
          />

          {err && <Alert severity="error">{err}</Alert>}

          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? "Signing up..." : "Create account"}
          </Button>

          <Typography variant="body2">
            Already have an account? <Link href="/auth/signin">Sign in</Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
