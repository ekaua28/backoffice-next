# Back-Office User Management Platform

A full-stack back-office application built with:

- Node.js 22+
- TypeScript 5+
- Next.js 15+
- Playwright 1.50+
- Material UI
- SQLite (better-sqlite3)
- Docker + Docker Compose

---

## Project Overview

This project implements a complete user and session management system with:

- Clean Architecture (Domain / Application / Infrastructure / HTTP)
- Authentication & session handling
- Admin dashboard with pagination
- Theme customization (light/dark)
- Unit tests (backend + frontend)
- E2E tests using Playwright
- Fully containerized setup

---

## Architecture

See:
- [apps/api/README.md](apps/api/README.md)
- [apps/web/README.md](apps/web/README.md)

---

## Docker Setup

Build and run:

docker compose up --build

Services:

API → http://localhost:4000
Web → http://localhost:3000

---

## Local Development

Install dependencies:

pnpm install

Run API:

pnpm --filter api dev

Run Web:

pnpm --filter web dev

---

## Environment Variables

Backend:

PORT=4000
DB_PATH=./.data/app.sqlite
ENABLE_TEST_ROUTES=true

Frontend:

NEXT_PUBLIC_API_URL=http://localhost:4000

---

## Possible Improvements

- JWT-based authentication
- Role-based authorization
- Configurable password hashing strength
- CI pipeline (GitHub Actions)
- OpenAPI documentation
- Rate limiting
- CSRF protection

---