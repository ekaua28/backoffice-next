"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionGate } from "../../components/SessionGate";
import type { UserDto } from "../../lib/api/types";
import { api } from "../../lib/api";
import { clearSessionId, getSessionId } from "../../lib/auth/session.storage";
import type { UserStatus } from "./status";

export default function AppPage() {
  return (
    <SessionGate>
      <Dashboard />
    </SessionGate>
  );
}

function Dashboard() {
  const router = useRouter();

  const [meName, setMeName] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 6;

  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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

      const res = await api.usersList(p, limit);
      setUsers(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr("Failed to load");
      }
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
      } catch {
        /* ignore */
      }
    }
    clearSessionId();
    router.replace("/auth/signin");
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api.usersCreate({
        firstName: cFirst,
        lastName: cLast,
        password: cPass,
        status: cStatus,
      });
      setCFirst("");
      setCLast("");
      setCPass("");
      setCStatus("active");
      await refresh(1);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr("Create failed");
      }
    }
  }

  async function saveUser(
    u: UserDto,
    patch: Partial<Pick<UserDto, "firstName" | "lastName" | "status">>,
  ) {
    setErr(null);
    try {
      await api.usersUpdate(u.id, patch);
      await refresh(page);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr("Update failed");
      }
    }
  }

  async function deleteUser(u: UserDto) {
    if (!confirm(`Delete user ${u.firstName} ${u.lastName}?`)) return;
    setErr(null);
    try {
      await api.usersDelete(u.id);
      const nextPage = page > 1 && users.length === 1 ? page - 1 : page;
      await refresh(nextPage);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr("Delete failed");
      }
    }
  }

  return (
    <main style={{ maxWidth: 920, margin: "40px auto", padding: 16 }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>User Management</h1>
          <p style={{ margin: "6px 0 0", opacity: 0.75 }}>
            Hello {meName || "..."}
          </p>
        </div>
        <button onClick={logout}>Log Out</button>
      </header>

      {err && <p style={{ color: "crimson", marginTop: 12 }}>{err}</p>}

      <section
        style={{
          marginTop: 18,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 10,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create user</h2>
        <form
          onSubmit={createUser}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <input
            placeholder="First name"
            value={cFirst}
            onChange={(e) => setCFirst(e.target.value)}
            required
          />
          <input
            placeholder="Last name"
            value={cLast}
            onChange={(e) => setCLast(e.target.value)}
            required
          />
          <input
            style={{ gridColumn: "1 / span 2" }}
            type="password"
            placeholder="Password"
            value={cPass}
            onChange={(e) => setCPass(e.target.value)}
            required
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Status
            <select
              value={cStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setCStatus(e.target.value as UserStatus);
              }}
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>

          <div
            style={{
              gridColumn: "1 / span 2",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button type="submit">Create</button>
          </div>
        </form>
      </section>

      <section style={{ marginTop: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>Users</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              disabled={page <= 1 || loading}
              onClick={() => refresh(page - 1)}
            >
              Prev
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => refresh(page + 1)}
            >
              Next
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            border: "1px solid #ddd",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f6f6f6" }}>
                <th style={th}>Name</th>
                <th style={th}>Status</th>
                <th style={th}>Logins</th>
                <th style={th}>Created</th>
                <th style={th}>Updated</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  u={u}
                  onSave={(patch) => saveUser(u, patch)}
                  onDelete={() => deleteUser(u)}
                />
              ))}
              {!users.length && (
                <tr>
                  <td style={{ padding: 12 }} colSpan={6}>
                    {loading ? "Loading..." : "No users"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid #ddd",
};

function UserRow({
  u,
  onSave,
  onDelete,
}: {
  u: UserDto;
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
    <tr>
      <td style={td}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={inp}
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={inp}
          />
        </div>
      </td>
      <td style={td}>
        <select
          value={status}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setStatus(e.target.value as UserStatus);
          }}
        >
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </td>
      <td style={td}>{u.loginsCounter}</td>
      <td style={td}>{new Date(u.creationTime).toLocaleString()}</td>
      <td style={td}>{new Date(u.lastUpdateTime).toLocaleString()}</td>
      <td style={td}>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            disabled={!dirty}
            onClick={() => onSave({ firstName, lastName, status })}
          >
            Save
          </button>
          <button onClick={onDelete}>Delete</button>
        </div>
      </td>
    </tr>
  );
}

const td: React.CSSProperties = {
  padding: 10,
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};
const inp: React.CSSProperties = { width: "100%", minWidth: 110 };
