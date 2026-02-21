# API (Backend)

Backend service for Back-Office User Management Platform.

Built with:

- Node.js 22+
- TypeScript 5+
- Fastify 5
- SQLite (better-sqlite3)
- Zod
- Argon2
- Vitest

---

## Architecture

Clean Architecture with strict layer separation:

```
domain/
application/
infrastructure/
http/
```

Dependency direction:

```
http → application → domain
```

Domain layer is framework-agnostic.

---

## Domain Model

### User

- id
- firstName
- lastName
- status (active | inactive)
- loginsCounter
- creationTime
- lastUpdateTime
- Credentials (passwordHash)

### Domain Rules

- Creation time is immutable.
- Last update time updates on mutation.
- Inactive users:
  - cannot change names
  - cannot create sessions
- Users cannot deactivate/delete themselves.

---

### Session

- id
- userId
- creationTime
- terminationTime

---

## Development

Run API locally:

```bash
pnpm --filter api dev
```

Server runs on:

```
http://localhost:4000
```

---

## Unit Tests

```bash
pnpm --filter api test
```

Tests include:

- Domain logic
- Service logic
- Business rule enforcement
- Auth flows

---

## Authentication

Session-based authentication:

```
x-session-id: <sessionId>
```

Sessions stored in database.

---

## Environment Variables

```
PORT=4000
DB_PATH=./.data/app.sqlite
ENABLE_TEST_ROUTES=true
```

---

## Design Decisions

- Clean Architecture → isolate business logic
- SQLite → lightweight persistence
- Zod → request validation
- Argon2 → password hashing

---

## Possible Improvements

- JWT authentication
- Role-based authorization
- Rate limiting
- OpenAPI documentation
- Structured logging