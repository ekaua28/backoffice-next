# Web (Next.js Frontend)

Frontend application built with:

- Next.js 16 (App Router)
- React 19
- MUI 7
- Vitest + Testing Library (unit)
- Playwright (e2e)

---

## Installation

From the root of the monorepo:

```bash
pnpm install
```

---

## Development

Run dev server:

```bash
pnpm -C apps/web dev
```

App runs at:

```
http://localhost:3000
```

---

## Build

```bash
pnpm -C apps/web build
pnpm -C apps/web start
```

---

## Unit Tests (Vitest)

Run all unit tests:

```bash
pnpm -C apps/web test
```

If you want watch mode:

```bash
pnpm -C apps/web vitest
```

Environment:
- jsdom
- Testing Library
- jest-dom matchers

---

## E2E Tests (Playwright)

Run headless:

```bash
pnpm exec playwright install (if not installed)
pnpm -C apps/web e2e
```

Run UI mode:

```bash
pnpm -C apps/web e2e:ui
```

---

## Project Structure

```
apps/web
 ├── src/app          # Next.js App Router pages
 ├── src/components   # UI components
 ├── src/lib          # API client, session, helpers
 ├── tests            # (optional) test utilities
 ├── vitest.config.ts
 ├── playwright.config.ts
 └── package.json
```

---

## Testing Philosophy

### Unit (Vitest)
- Test behavior, not implementation
- Use role-based queries
- Mock API layer
- Avoid testing MUI internals

### E2E (Playwright)
- Test real flows:
  - Sign in
  - Sign up
  - Dashboard actions
- No API mocks
- Run against real dev server

---

## Environment Variables

Create `.env.local` if needed:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Stack Versions

- next: 16.x
- react: 19.x
- @mui/material: 7.x
- vitest: 2.x
- playwright: 1.x

---

## Notes

- This package is part of a monorepo.
- Run commands using `-C apps/web` from root.
- Do not commit `.env.local`.