"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionGate } from "../../components/SessionGate";
import { api, type UserDto } from "../../lib/api";
import { clearSessionId, getSessionId } from "../../lib/auth/session.storage";
import { useTheme } from "../../components/ThemeProvider";

import {
  Container,
  Paper,
  Typography,
  Stack,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

export default function AppPage() {
  return (
    <SessionGate>
      <Dashboard />
    </SessionGate>
  );
}

function Dashboard() {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const [meName, setMeName] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const [page, setPage] = useState(1);
  const limit = 6;

  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [cFirst, setCFirst] = useState("");
  const [cLast, setCLast] = useState("");
  const [cPass, setCPass] = useState("");
  const [cStatus, setCStatus] = useState<"active" | "inactive">("active");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit],
  );

  async function refresh(p = page) {
    setErr(null);
    setLoading(true);
    try {
      const me = await api.me();
      setMeName(me.user?.firstName ?? "");
      setCurrentUserId(me.user?.id ?? "");

      const res = await api.usersList(p, limit);
      setUsers(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    const sid = getSessionId();
    if (sid) {
      try {
        await api.logout(sid);
      } catch {}
    }
    clearSessionId();
    router.replace("/auth/signin");
  }

  async function createUser() {
    setErr(null);
    try {
      await api.usersCreate({
        firstName: cFirst,
        lastName: cLast,
        password: cPass,
        status: cStatus,
      });
      setOpenCreate(false);
      setCFirst("");
      setCLast("");
      setCPass("");
      setCStatus("active");
      await refresh(1);
    } catch (e: any) {
      setErr(e?.message ?? "Create failed");
    }
  }

  async function saveUser(
    id: string,
    patch: {
      firstName?: string;
      lastName?: string;
      status?: "active" | "inactive";
    },
  ) {
    setErr(null);
    try {
      await api.usersUpdate(id, patch);
      await refresh(page);
    } catch (e: any) {
      setErr(e?.message ?? "Update failed");
    }
  }

  async function deleteUser(u: UserDto) {
    if (!confirm(`Delete user ${u.firstName} ${u.lastName}?`)) return;
    setErr(null);
    try {
      await api.usersDelete(u.id);
      const nextPage = page > 1 && users.length === 1 ? page - 1 : page;
      await refresh(nextPage);
    } catch (e: any) {
      setErr(e?.message ?? "Delete failed");
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
      >
        <div>
          <Typography variant="h4" fontWeight={800}>
            User Management
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
            Hello {meName || "..."}
          </Typography>
        </div>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={toggle}>
            Theme: {theme}
          </Button>
          <Button variant="contained" onClick={() => setOpenCreate(true)}>
            Create user
          </Button>
          <Button color="inherit" variant="outlined" onClick={logout}>
            Log out
          </Button>
        </Stack>
      </Stack>

      {err && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {err}
        </Alert>
      )}

      <Paper sx={{ mt: 2, overflow: "hidden" }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ p: 2 }}
        >
          <Typography variant="h6" fontWeight={700}>
            Users
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              disabled={page <= 1 || loading}
              onClick={() => refresh(page - 1)}
            >
              Prev
            </Button>
            <Chip label={`Page ${page} / ${totalPages}`} />
            <Button
              disabled={page >= totalPages || loading}
              onClick={() => refresh(page + 1)}
            >
              Next
            </Button>
          </Stack>
        </Stack>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Logins</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <UserRow
                key={u.id}
                u={u}
                isCurrent={u.id === currentUserId}
                onSave={(patch) => saveUser(u.id, patch)}
                onDelete={() => deleteUser(u)}
              />
            ))}
            {!users.length && (
              <TableRow>
                <TableCell colSpan={6}>
                  {loading ? "Loading..." : "No users"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create user</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="First name"
              value={cFirst}
              onChange={(e) => setCFirst(e.target.value)}
            />
            <TextField
              label="Last name"
              value={cLast}
              onChange={(e) => setCLast(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              value={cPass}
              onChange={(e) => setCPass(e.target.value)}
            />
            <Select
              value={cStatus}
              onChange={(e) => setCStatus(e.target.value as any)}
            >
              <MenuItem value="active">active</MenuItem>
              <MenuItem value="inactive">inactive</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={createUser}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

function UserRow({
  u,
  isCurrent,
  onSave,
  onDelete,
}: {
  u: UserDto;
  isCurrent: boolean;
  onSave: (patch: {
    firstName?: string;
    lastName?: string;
    status?: "active" | "inactive";
  }) => void;
  onDelete: () => void;
}) {
  const [firstName, setFirstName] = useState(u.firstName);
  const [lastName, setLastName] = useState(u.lastName);
  const [status, setStatus] = useState<"active" | "inactive">(u.status);

  useEffect(() => {
    setFirstName(u.firstName);
    setLastName(u.lastName);
    setStatus(u.status);
  }, [u.firstName, u.lastName, u.status]);

  const dirty =
    firstName !== u.firstName || lastName !== u.lastName || status !== u.status;

  return (
    <TableRow hover>
      <TableCell>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextField
            size="small"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          {isCurrent && <Chip size="small" label="you" />}
        </Stack>
      </TableCell>

      <TableCell>
        <Select
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          disabled={isCurrent}
        >
          <MenuItem value="active">active</MenuItem>
          <MenuItem value="inactive">inactive</MenuItem>
        </Select>
      </TableCell>

      <TableCell>{u.loginsCounter}</TableCell>
      <TableCell>{new Date(u.creationTime).toLocaleString()}</TableCell>
      <TableCell>{new Date(u.lastUpdateTime).toLocaleString()}</TableCell>

      <TableCell align="right">
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            size="small"
            variant="outlined"
            disabled={!dirty || isCurrent}
            onClick={() => onSave({ firstName, lastName, status })}
          >
            Save
          </Button>
          <Button
            size="small"
            color="error"
            variant="outlined"
            disabled={isCurrent}
            onClick={onDelete}
          >
            Delete
          </Button>
        </Stack>
      </TableCell>
    </TableRow>
  );
}
