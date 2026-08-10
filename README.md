# StarSync

StarSync is a realtime collaboration platform for study groups, hackathon teams, and competitive programming rooms. It brings chat, direct messages, collaborative coding, whiteboarding, timed contests, code execution, and submission tracking into one focused workspace.

Instead of mixing every realtime concern into one transport, StarSync uses a clear production-style architecture: REST for durable API work, Socket.IO for application realtime, Redis-backed HttpOnly sessions for auth, PostgreSQL/Prisma for persistence, Liveblocks/Yjs for collaborative editor and whiteboard sync, and a self-hosted Piston runner for code execution.

## Table of Contents

- [What It Solves](#what-it-solves)
- [Features](#features)
- [Latest Architecture](#latest-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Run Locally](#run-locally)
- [Realtime Model](#realtime-model)
- [Chat, DM, and Unread Model](#chat-dm-and-unread-model)
- [Contest and Code Execution](#contest-and-code-execution)
- [Collaborative Editor and Whiteboard](#collaborative-editor-and-whiteboard)
- [Security Notes](#security-notes)
- [Useful Commands](#useful-commands)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Repository Notes](#repository-notes)

## What It Solves

Most collaboration tools split work across chat apps, code editors, whiteboards, and judge systems. StarSync keeps those workflows in one room:

- teams can discuss ideas without leaving the coding workspace;
- users can open direct messages from shared rooms;
- rooms can switch between chat, editor, and whiteboard views;
- contest rooms can assign problems, run code, track timers, and broadcast submissions;
- unread counts and presence stay consistent across room switches and reconnects.

## Features

### Collaboration Rooms

- Group rooms with chat, typing indicators, room-scoped presence, and member management.
- Direct messages built on the same room/message model as group chat.
- Searchable sidebar with current, unread, and recent room prioritization.
- Server-authoritative unread counts backed by `RoomMember.readMessageCount`.
- Socket.IO inbox notifications for inactive rooms and dashboard realtime updates.

### Competitive Rooms

- Problem-bank based room creation using difficulty, topics, and problem count.
- Contest timer state persisted on the backend.
- Late submission checks based on `sessionStartedAt`, not room creation time.
- Visible testcase runs and final submissions through Piston.
- Submission history and `ROOM_SUBMISSION_CREATED` realtime updates.

### Editor and Whiteboard

- Monaco editor for code editing.
- Shared editor content through Liveblocks/Yjs.
- Shared editor language metadata, so collaborators stay on the same language.
- Whiteboard powered by tldraw and Liveblocks.
- Liveblocks access scoped through the StarSync backend and room membership checks.

### Security and Reliability

- HttpOnly Redis-backed session cookie for REST and Socket.IO auth.
- Rate limits for login/signup and code execution endpoints.
- Piston bound to `127.0.0.1` in local Docker Compose.
- Removed room members are evicted from active Socket.IO rooms.
- DM rooms stay chat-only; editor and whiteboard access remains group-room scoped.

## Latest Architecture

```mermaid
flowchart LR
  Browser["Browser"]
  Frontend["React + Vite Frontend"]
  REST["Express REST API"]
  SocketIO["Socket.IO App Realtime"]
  Redis["Redis Sessions"]
  Postgres["PostgreSQL + Prisma"]
  Piston["Local Piston Runner"]
  Liveblocks["Liveblocks / Yjs"]

  Browser --> Frontend
  Frontend -->|"REST + HttpOnly sid cookie"| REST
  Frontend -->|"Socket.IO /socket.io + sid cookie"| SocketIO
  REST --> Redis
  SocketIO --> Redis
  REST --> Postgres
  SocketIO --> Postgres
  REST --> Piston
  REST -->|"room-scoped collaboration token"| Liveblocks
  Frontend -->|"editor + whiteboard sync"| Liveblocks
```

StarSync currently uses:

- REST for authentication, room CRUD, member management, editor document persistence, problem loading, runs, and submissions.
- Socket.IO for app realtime events: chat, inbox notifications, typing, presence, timers, submissions, and access removal.
- Liveblocks/Yjs for collaborative editor and whiteboard synchronization.
- Redis for session storage.
- PostgreSQL/Prisma for users, rooms, memberships, messages, problems, submissions, and unread state.
- Piston for sandboxed code execution.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| UI/UX | Framer Motion, Lucide, Radix UI, react-resizable-panels |
| Chat Realtime | Socket.IO client/server |
| Backend | Node.js, Express 5, TypeScript |
| Validation | Zod |
| Auth | Redis-backed HttpOnly `sid` sessions |
| Database | PostgreSQL with Prisma |
| Editor | Monaco, Yjs, Liveblocks |
| Whiteboard | tldraw, Liveblocks |
| Code Runner | Self-hosted Piston Docker API |
| Protection | `express-rate-limit`, room membership checks, local-only Piston binding |

## Project Structure

```txt
.
├── Starsync_backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socketio/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validations/
│   └── CODE_RUNNER.md
├── Starsync_frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── chat/
│       │   ├── competing/
│       │   ├── dashboard/
│       │   ├── editor/
│       │   ├── landing/
│       │   ├── ui/
│       │   └── whiteboard/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── services/
│       ├── types/
│       └── utils/
├── deploy/
│   ├── env/
│   └── nginx/
└── docker-compose.piston.yml
```

## Getting Started

### Requirements

- Node.js and npm
- PostgreSQL database
- Redis
- Docker Desktop, for the local Piston code runner
- Liveblocks project secret key

### Install Dependencies

```powershell
cd Starsync_backend
npm install

cd ..\Starsync_frontend
npm install
```

## Environment Variables

### Backend

Create the backend environment file:

```powershell
cd Starsync_backend
copy .env.example .env
```

Use values like:

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require"
REDIS_URL=redis://localhost:6379
SESSION_COOKIE_NAME=sid
SESSION_TTL_SECONDS=604800
CODE_RUNNER_URL=http://localhost:2000/api/v2
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key
```

### Frontend

Create the frontend environment file:

```powershell
cd Starsync_frontend
copy .env.example .env
```

Use values like:

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_SOCKET_IO_URL=http://localhost:3001
```

`VITE_SOCKET_IO_URL` must be the backend origin only. Do not include `/socket.io`; the app configures the Socket.IO path separately.

## Database Setup

Run Prisma setup from the backend folder:

```powershell
cd Starsync_backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

Important schema state:

- `Room` supports `GROUP` and `DM` room types.
- `Room` stores contest timer fields such as `sessionStatus`, `sessionStartedAt`, and `durationMinutes`.
- `RoomMember` stores `readMessageCount` for server-authoritative unread counts.
- `Message` is shared by group rooms and direct messages.
- DMs do not use a separate message table.

## Run Locally

Use three terminals.

### 1. Start Piston

```powershell
cd <repo-root>
docker compose -f docker-compose.piston.yml up -d
```

The local compose file binds Piston to `127.0.0.1:2000` and uses `restart: unless-stopped`.

### 2. Start Backend

```powershell
cd <repo-root>\Starsync_backend
npm run dev
```

Health check:

```txt
GET http://localhost:3001/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "starsync-api"
}
```

### 3. Start Frontend

```powershell
cd <repo-root>\Starsync_frontend
npm run dev
```

Open:

```txt
http://localhost:5173
```

## Realtime Model

StarSync no longer uses a native `/ws` server for app realtime. Application events run through Socket.IO at `/socket.io/`.

Socket.IO responsibilities:

- authenticate the handshake with the existing HttpOnly `sid` cookie;
- join room sockets only after membership validation;
- maintain unique room-scoped presence;
- send chat messages after persistence;
- broadcast typing updates;
- emit `inbox:message` to the user notification socket;
- emit `ROOM_TIMER_UPDATED` and `ROOM_SUBMISSION_CREATED`;
- emit `room:access-removed` when a member is removed from a room.

Key client events:

| Direction | Event | Purpose |
| --- | --- | --- |
| Client → Server | `join` | Join a validated room |
| Client → Server | `chat` | Send a persisted chat message |
| Client → Server | `chat:visibility` | Mark whether the chat tab is actually visible |
| Client → Server | `typing:start` / `typing:stop` | Typing indicators |
| Server → Client | `message` | Room message delivery |
| Server → Client | `inbox:message` | Inactive-room unread notification |
| Server → Client | `presence` | Room-scoped online users |
| Server → Client | `ROOM_TIMER_UPDATED` | Contest timer changes |
| Server → Client | `ROOM_SUBMISSION_CREATED` | Contest submission announcement |
| Server → Client | `room:access-removed` | Forced room exit after removal |

## Chat, DM, and Unread Model

Unread counts are database-backed, not localStorage-backed.

```txt
unreadCount = max(totalMessageCount - readMessageCount, 0)
```

Current behavior:

- `GET /api/v1/rooms` returns group rooms with `unreadCount`, `joinedAt`, and `lastActivityAt`.
- `GET /api/v1/dms` returns direct message rooms with `unreadCount`, `lastMessage`, and `lastActivityAt`.
- Active DM rooms are treated as chat-visible.
- Group rooms only advance read state when the chat tab is visible.
- Editor and whiteboard tabs can still receive room messages, but they do not silently mark group chat as read.
- Sender self-unread is prevented by marking the sender as read when dispatching notifications.
- Unknown incoming DM notifications are reconciled through bounded refresh and pending event handling.
- The dashboard and protected app layout keep a notification socket alive for realtime inbox updates.

DM behavior:

- DMs are created only between users who share an active source group room.
- DMs remain chat-only.
- DM sidebar cards show username, timestamp, and unread badge.
- DM sidebar history does not show global presence.
- Active DM header/details use room-scoped `Here now` presence.

## Contest and Code Execution

Competing rooms combine persisted room timer state with Piston-backed execution.

Flow:

1. A competing room is created with difficulty/topic preferences.
2. The backend assigns problems from the PostgreSQL problem bank.
3. The frontend loads assigned problems from `GET /api/v1/rooms/:roomId/problems`.
4. Run Code calls `POST /api/v1/rooms/:roomId/problems/run`.
5. Submit calls `POST /api/v1/rooms/:roomId/problems/submit`.
6. Successful submissions are saved and broadcast through `ROOM_SUBMISSION_CREATED`.

Execution protections:

- Code execution endpoints are rate-limited.
- Piston is intended to run locally or privately, not as a public service.
- The Docker Compose Piston service binds to `127.0.0.1:2000`.
- Late submissions are evaluated from `sessionStartedAt + durationMinutes`.

For runner setup and runtime installation, see `Starsync_backend/CODE_RUNNER.md`.

## Collaborative Editor and Whiteboard

The collaborative editor uses Monaco with Liveblocks/Yjs.

Editor details:

- document content is persisted through the backend;
- collaborative text is synchronized through Yjs;
- active collaborators are shown in the room header;
- shared language metadata is synchronized so collaborators stay aligned;
- competing mode can still use local editor state for contest flows.

Whiteboard details:

- tldraw powers the canvas UI;
- Liveblocks powers realtime collaboration;
- the backend issues room-scoped Liveblocks tokens after verifying StarSync auth and membership.

Liveblocks authorization flow:

```mermaid
sequenceDiagram
  participant Client
  participant API
  participant DB
  participant Liveblocks

  Client->>API: POST /api/v1/liveblocks/auth
  API->>API: Verify sid session
  API->>DB: Check active room membership
  API->>Liveblocks: Prepare scoped session
  Liveblocks-->>API: Token response
  API-->>Client: Room-scoped Liveblocks token
```

## Security Notes

- Session cookies are HttpOnly and backed by Redis.
- Socket.IO uses the same cookie session as REST.
- Signup/login routes use `authRateLimiter`.
- Editor run and contest run/submit routes use `codeExecutionRateLimiter`.
- Removed room members are evicted from active Socket.IO room state.
- Piston should not be exposed publicly.
- Redis, database credentials, Liveblocks secrets, and `.env` files must stay out of git.
- Native StarSync `/ws` code has been removed; `/socket.io/` is the app realtime path.

## Useful Commands

### Backend

```powershell
cd Starsync_backend
npm run dev
npm run build
npx prisma validate
npx prisma migrate deploy
npx prisma db seed
```

### Frontend

```powershell
cd Starsync_frontend
npm run dev
npm run lint
npm run build
npm run preview
```

### Piston

```powershell
cd <repo-root>
docker compose -f docker-compose.piston.yml up -d
docker compose -f docker-compose.piston.yml ps
docker compose -f docker-compose.piston.yml down
```

Check runtimes:

```powershell
Invoke-RestMethod http://localhost:2000/api/v2/runtimes
```

## Deployment

Deployment notes live in `deploy/README.md`.

Recommended production shape:

- Nginx serves the frontend and proxies `/api/` and `/socket.io/`.
- PM2 keeps the backend process running.
- Redis runs privately on the server.
- Piston runs privately through Docker.
- PostgreSQL can run on Neon or another managed provider.
- GitHub Actions runs CI/CD on push to `master`.

The CI/CD pipeline is expected to:

1. build the backend;
2. build the frontend;
3. SSH into the Azure host;
4. pull the latest code;
5. run Prisma migrations;
6. restart PM2;
7. deploy the frontend;
8. run a health check.

## Troubleshooting

### Login does not persist

Check that Redis is running and `REDIS_URL` is correct. Both REST and Socket.IO depend on the Redis-backed `sid` session.

### Socket.IO stays offline

Check that the backend is running and `VITE_SOCKET_IO_URL` points to the backend origin, for example `http://localhost:3001`.

### Browser shows `/ws` errors

The app should not use native StarSync `/ws` anymore. Rebuild the frontend and confirm the browser is connecting to `/socket.io/`.

### Code execution fails

Start Piston and confirm runtimes are installed:

```powershell
docker compose -f docker-compose.piston.yml up -d
Invoke-RestMethod http://localhost:2000/api/v2/runtimes
```

### Prisma cannot connect

Check `DATABASE_URL`. Neon-style URLs usually need `sslmode=require`.

### Realtime unread looks stale

Refresh the room list or wait for polling. The database remains the source of truth through `readMessageCount`.

## Repository Notes

This repository should not commit `.env` files, `node_modules`, `dist`, local Piston runtime data, generated logs, or editor/agent scratch files.

Before pushing, the normal verification set is:

```powershell
cd Starsync_backend
npm run build

cd ..\Starsync_frontend
npm run lint
npm run build
```
