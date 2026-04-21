# Meeting Minds

Meeting Minds is a full-stack web chat app for shared spaces and direct conversations.

It combines:

- Django + DRF + Channels on the backend
- React + TypeScript on the frontend
- PostgreSQL, Redis, and MinIO in Docker Compose

## Quick Start

1. Start the app from the repository root:

```bash
docker compose up --build
```

2. Open:

- Frontend: `http://127.0.0.1:3000/`
- OpenAPI schema: `http://localhost:8000/api/schema/`
- Backend health: `http://localhost:8000/health/ready/`

This repository should be treated as healthy only if it starts from `docker compose up --build`.

## What's In The Repo

```text
legendary-telegram-main/
|-- AGENTS.md
|-- README.md
|-- .env
|-- docker-compose.yml
|-- backend/
`-- frontend/
```

- `backend/`: Django, DRF, Channels, business logic, migrations, tests
- `frontend/`: React, TypeScript, Vite, UI, browser-side API and websocket handling

## Core Features

Meeting Minds is designed to support:

- sign in, registration, password reset, and account deletion
- public and private spaces
- direct one-to-one conversations
- contacts and connection requests
- moderation and bans
- attachments with guarded access
- unread tracking
- online / AFK / offline presence
- session listing and revocation
- REST APIs and WebSocket updates

## Important Naming Note

The product-facing name is now **Meeting Minds**.

Inside the backend and API contract, you will still see terms like `rooms`, `dialogs`, and `friend requests`. Those names remain in code and endpoints because they are part of the current implementation and contract.

## Tech Stack

- Python 3.12+
- Django
- Django REST Framework
- Django Channels
- PostgreSQL
- Redis
- React
- TypeScript
- Vite
- Docker Compose
- MinIO for object storage in local Docker

## Environment

Use the root `.env` as the starting point.

Key values include:

- database connection settings
- Redis settings
- MinIO settings
- backend/frontend ports
- Django security and local runtime flags
- frontend API and websocket base URLs

## Common Commands

Start everything:

```bash
docker compose up --build
```

Run in the background:

```bash
docker compose up --build -d
```

Stop everything:

```bash
docker compose down
```

Stop and remove volumes:

```bash
docker compose down -v
```

See logs:

```bash
docker compose logs -f
```

Backend only:

```bash
docker compose logs -f backend
```

Frontend only:

```bash
docker compose logs -f frontend
```

## Backend Notes

The backend exposes:

- REST routes under `/api/v1`
- WebSocket traffic under `/ws/v1/chat`
- health endpoints under `/health/`
- docs under `/api/docs/` and `/api/schema/`

Useful containerized commands:

```bash
docker compose run --rm backend python manage.py migrate
docker compose run --rm backend python manage.py test
docker compose run --rm backend pytest
docker compose run --rm backend ruff check .
```

## Frontend Notes

Useful frontend commands:

```bash
docker compose run --rm frontend npm test
docker compose run --rm frontend npm run build
docker compose run --rm frontend npm run typecheck
```

## Development Rules

Keep these principles in mind:

- follow `AGENTS.md`
- keep backend and frontend behavior aligned
- prefer small, explicit changes
- update docs when behavior or terminology changes
- do not break local Docker startup

## Authoritative Docs

Read these first when making product or implementation changes:

- [AGENTS.md](AGENTS.md)

## Status

This repository is more than a scaffold. It includes backend apps, migrations, tests, frontend UI, and a local Docker runtime.

The simplest supported way to run it remains:

```bash
docker compose up --build
```
