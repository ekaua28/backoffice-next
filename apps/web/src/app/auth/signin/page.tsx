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

export default function SignInPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.signIn({ firstName, lastName, password });
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
          Sign in
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {err && <Alert severity="error">{err}</Alert>}

          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <Typography variant="body2">
            No account? <Link href="/auth/signup">Sign up</Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
