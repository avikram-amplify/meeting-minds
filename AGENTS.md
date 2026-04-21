# AGENTS.md

## Purpose

This repository builds **Meeting Minds**, a classic web chat app for shared spaces and direct conversations.

This file is the top-level instruction set for coding, review, planning, and refactoring agents working in this repo.

When in doubt, choose the **smallest secure, testable, spec-compliant change**.

## Precedence

Use documents in this order:

1. `AGENTS.md`
2. `docs/API_CONTRACT.md`
3. `docs/SCHEMA.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DEPLOYEMENT.md`
6. `docs/TASKS.md`
7. `docs/DJANGO_MODELS_MAPPING.md`
8. source code and tests
9. temporary notes or plans

Higher-precedence docs always win. If code or lower docs drift, align them to the higher source.

## Product Scope

Meeting Minds is a web chat product with:

- registration and authentication
- public and private spaces
- one-to-one conversations
- contacts / friendship flows
- attachments
- moderation
- message history
- unread tracking
- presence
- session management

Do not expand the product into a social network, forum, feed, or project tool unless a higher-precedence doc requires it.

## Required Stack

Use:

- Python 3.12+
- Django
- Django REST Framework
- Django Channels
- PostgreSQL
- Redis
- React + TypeScript
- Docker Compose

Do not replace the primary backend language, database, or Channels + Redis websocket stack.

## Working Style

Agents must:

- prefer correctness over speed
- make small, explicit, verifiable changes
- keep the codebase buildable
- keep local startup compatible with `docker compose up --build`
- preserve understandable module boundaries
- avoid speculative rewrites
- avoid inventing requirements

Agents must not:

- ship placeholder logic as complete work
- silently change visible behavior without spec support
- bypass service-layer validation for convenience
- rely on frontend-only authorization
- hardcode environment-specific secrets or addresses

## Before Coding

Always:

- read `AGENTS.md`
- read `docs/API_CONTRACT.md`
- read the relevant parts of `docs/SCHEMA.md`
- read the relevant parts of `docs/ARCHITECTURE.md`
- identify the affected modules first
- check whether an existing abstraction already fits the change

## Implementation Rules

Keep these rules in force:

- REST and WebSocket behavior must match `docs/API_CONTRACT.md`
- schema changes must follow `docs/SCHEMA.md`
- architecture boundaries must follow `docs/ARCHITECTURE.md`
- deployment assumptions must stay compatible with Docker Compose
- authorization checks must stay close to business actions
- websocket events must reflect persisted state
- messages must be persisted before broadcast
- pagination must be preserved for scalable reads

## Domain Rules

The implementation must enforce:

- unique email
- unique username
- unique room name
- room ownership
- room admin membership
- room bans
- friendship state
- peer bans
- dialog participant constraints
- attachment ownership and binding
- session records when session listing/revocation depends on them

## Authorization Rules

Server-side authorization is mandatory.

At minimum:

- only authenticated users may access protected APIs
- only room members may read room messages
- only dialog participants may read dialog messages
- only authorized room moderators may perform moderation actions
- only message authors may edit their own messages
- only room message authors or moderators may delete room messages
- only dialog message authors may delete their own dialog messages
- only room owners may delete rooms
- banned or removed users must lose room access immediately
- peer-banned users must be blocked from direct contact flows

## Presence Rules

Presence follows the contract:

- `online` if active in at least one open tab
- `afk` if all open tabs are inactive for more than one minute
- `offline` if all app tabs are closed or expired

Presence is computed at the user level across tabs and sessions. Do not fake it from last login time.

## Attachment Rules

Attachments must:

- preserve original filenames
- enforce size limits
- enforce type handling rules
- stay access-controlled
- lose access immediately when room access is lost
- be deleted permanently when a room is deleted

Never expose raw storage paths.

## Security Rules

Always keep:

- secure password hashing
- `HttpOnly` auth cookies
- `Secure` cookies in production
- CSRF protection for cookie-authenticated unsafe methods
- upload validation
- server-side authorization on every protected resource

Never:

- store plaintext passwords
- trust client-supplied roles
- use client-only bans or access control

## Delivery Order

Unless blocked, work in this order:

1. local execution and scaffolding
2. models and migrations
3. auth and session handling
4. spaces and direct conversations
5. REST contract coverage
6. WebSocket contract coverage
7. presence and unread state
8. attachments and file access control
9. moderation and bans
10. UI integration
11. deployment hardening

## Tests and Validation

For meaningful behavior changes, agents must add or update tests.

At minimum, cover relevant parts of:

- auth success and rejection paths
- room creation and uniqueness
- public/private join rules
- friendship request flows
- peer bans
- room bans
- send/edit/delete message flows
- unread clearing
- attachment access rules
- session listing and revocation
- websocket authorization and broadcasts
- presence aggregation where practical

After coding, agents must:

- run relevant tests
- run configured lint/static checks when available
- verify imports and boundaries remain clean
- verify docs still match behavior
- verify the app still starts from the repository root with `docker compose up --build`

If migrations were added, also verify them with:

```bash
docker compose up -d postgres
sleep 10
cd backend
python manage.py migrate
```

## Documentation Rules

Update docs whenever changing:

- endpoints
- websocket events
- environment variables
- migration steps
- service dependencies
- local startup flow
- storage behavior
- permission behavior
- product-facing terminology

Do not leave stale examples in authoritative docs.

## Review Rules

When reviewing, focus on:

- spec compliance
- authorization correctness
- migration safety
- API compatibility
- websocket consistency
- access revocation behavior
- deletion rules
- deployment impact
- test adequacy

Do not approve code that breaks the contract, weakens authorization, introduces schema drift, or breaks local Docker startup.

## Definition Of Done

Work is only done when:

- implementation matches the relevant spec
- the codebase remains buildable
- the repo-local startup path still works with `docker compose up --build`
- tests for changed behavior pass
- migrations exist and are coherent if schema changed
- docs are updated when behavior or terminology changed
- no critical placeholder logic remains in the affected flow

## Output Expectations

Completion summaries must say:

- what changed
- which contract areas were affected
- whether migrations were added
- what tests were added or updated
- any explicit remaining gaps
