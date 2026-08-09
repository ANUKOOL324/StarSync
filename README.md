# StarSync

StarSync is a realtime collaboration workspace for teams that want chat, shared coding, whiteboarding, and contest-style problem solving in one focused room. It combines a React/Vite frontend with an Express/TypeScript API, Socket.IO application realtime, Redis-backed HttpOnly sessions, PostgreSQL/Prisma persistence, Liveblocks-powered whiteboard collaboration, and a local Piston runner for code execution.

## What StarSync Does

- Creates collaborative rooms with chat, direct messages, presence, typing indicators, shared editor state, and whiteboard access.
- Creates competing rooms with assigned problem-bank questions, contest timers, run-code checks, submission history, and submission notifications.
- Keeps authentication session-based: HTTP requests and Socket.IO handshakes both use the browser's HttpOnly `sid` cookie backed by Redis.
- Separates realtime responsibilities clearly: Socket.IO handles StarSync app events, while Liveblocks/Yjs remain responsible for collaborative canvas/editor features where they are already used.

## Highlights

- Redis-backed HttpOnly cookie authentication
- Socket.IO group chat, direct messages, presence, typing, timers, editor room events, and submission events
- Persistent chat history, unread states, optimistic message reconciliation, and online user state
- Collaborative editor workspace with autosave and active collaborator presence contracts
- Whiteboard workspace built with tldraw and Liveblocks
- Competing rooms with assigned PostgreSQL problem-bank questions
- Piston-backed code execution for JavaScript, TypeScript, Python, C, and C++
- Responsive dark UI for dashboard, chat rooms, editor views, whiteboard, and contest rooms

## Tech Stack

| Area | Stack |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Monaco, tldraw |
| Backend | Node.js, Express, TypeScript, Socket.IO |
| Realtime app events | Socket.IO at `/socket.io/` |
| Authentication | HttpOnly `sid` cookie + Redis sessions |
| Database | PostgreSQL with Prisma |
| Code runner | Piston Docker API |
| Collaborative canvas/editor tooling | Liveblocks / Yjs where used |

## Architecture

```mermaid
flowchart LR
  Browser[Browser]
  Frontend[React Frontend]
  API[Express API]
  Realtime[Socket.IO Server]
  Sessions[Redis Sessions]
  DB[(PostgreSQL + Prisma)]
  Piston[Piston Runner]
  Liveblocks[Liveblocks / Yjs]

  Browser --> Frontend
  Frontend -->|REST / HTTP + sid cookie| API
  Frontend -->|Socket.IO + sid cookie| Realtime
  Frontend -->|whiteboard collaboration| Liveblocks
  API --> Sessions
  Realtime --> Sessions
  API --> DB
  Realtime --> DB
  API --> Piston
  API -->|room-scoped auth token| Liveblocks
```

## Realtime Model

StarSync uses Socket.IO for application realtime events. The browser sends the existing HttpOnly session cookie during the Socket.IO handshake, and the backend resolves the Redis-backed session before accepting the realtime connection.

Important Socket.IO behavior:

- The client connects to the server origin from `VITE_SOCKET_IO_URL`; the Socket.IO path is configured separately as `/socket.io/`.
- After reconnect, the client emits `join`, the backend re-validates room membership, and presence restores the online state.
- Presence represents unique users rather than raw connections, so multiple tabs for the same user do not appear as multiple people online.
- Chat uses named events: the client emits `chat`, the server persists the message, and the server emits `message`; optimistic messages are reconciled with `clientMessageId`.
- Competing-room timer and submission updates are broadcast through `ROOM_TIMER_UPDATED` and `ROOM_SUBMISSION_CREATED`.

## Project Structure

```txt
<repo-root>/
|- Starsync_backend/
|  |- prisma/
|  |- src/
|  |  |- config/
|  |  |- controllers/
|  |  |- middleware/
|  |  |- prisma/
|  |  |- routes/
|  |  |- services/
|  |  |- socketio/
|  |  |- types/
|  |  |- utils/
|  |  `- validations/
|  `- CODE_RUNNER.md
|- Starsync_frontend/
|  |- public/
|  `- src/
|     |- components/
|     |  |- chat/
|     |  |- competing/
|     |  |- dashboard/
|     |  |- editor/
|     |  |- landing/
|     |  |- ui/
|     |  `- whiteboard/
|     |- context/
|     |- hooks/
|     |- layouts/
|     |- pages/
|     |- services/
|     |- types/
|     `- utils/
|- deploy/
|  |- env/
|  `- nginx/
`- docker-compose.piston.yml
```

## Core App Flow

```mermaid
flowchart TD
  A[Sign up or log in] --> B[Dashboard]
  B --> C[Join room]
  B --> D[Create collaborative room]
  B --> E[Create competing room]
  C --> F[Room workspace]
  D --> F
  F --> G[Chat and direct messages]
  F --> H[Shared editor]
  F --> I[Whiteboard]
  E --> J[Competing workspace]
  J --> K[Assigned problems]
  K --> L[Run visible testcases]
  J --> M[Submit solution]
  M --> N[Submission history and notifications]
```

## Requirements

- Node.js and npm
- PostgreSQL database, Neon works well
- Redis for session storage
- Docker Desktop for the optional local Piston code runner
- Liveblocks secret key for whiteboard collaboration

## Backend Setup

Start Redis before running authenticated routes. A local Redis instance should match `REDIS_URL=redis://localhost:6379`.

```powershell
cd Starsync_backend
npm install
copy .env.example .env
```

Update `Starsync_backend/.env`:

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

Apply Prisma setup:

```powershell
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

Run the backend:

```powershell
npm run dev
```

Backend URL:

```txt
http://localhost:3001
```

Health check:

```txt
GET http://localhost:3001/api/health
```

Expected shape:

```json
{
  "status": "ok",
  "service": "starsync-api"
}
```

## Frontend Setup

```powershell
cd Starsync_frontend
npm install
copy .env.example .env
```

Update `Starsync_frontend/.env` if needed:

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_SOCKET_IO_URL=http://localhost:3001
```

`VITE_SOCKET_IO_URL` is the Socket.IO server origin. The Socket.IO path remains `/socket.io/` in the client and server configuration.

Run the frontend:

```powershell
npm run dev
```

Frontend URL:

```txt
http://localhost:5173
```

## Local Code Runner

StarSync sends code execution requests to a Piston-compatible API. Start the local runner from the repository root:

```powershell
docker compose -f docker-compose.piston.yml up -d
```

Check installed runtimes:

```powershell
Invoke-RestMethod http://localhost:2000/api/v2/runtimes
```

Stop the runner:

```powershell
docker compose -f docker-compose.piston.yml down
```

More details are in `Starsync_backend/CODE_RUNNER.md`.

## Whiteboard

Socket.IO handles StarSync application realtime events such as chat, presence, typing, timers, and submission notifications. Whiteboard collaboration uses Liveblocks because canvas synchronization is a separate high-frequency collaboration problem.

Whiteboard access still follows StarSync room membership rules:

1. Frontend requests `POST /api/v1/liveblocks/auth`.
2. Backend verifies the `sid` session cookie.
3. Backend checks room membership.
4. Backend returns a Liveblocks token scoped to the room.

## Competing Rooms

Competing rooms use the problem bank stored in PostgreSQL:

- Room creation stores difficulty/topic preferences.
- The backend assigns available problems to the room.
- The frontend loads problems from `GET /api/v1/rooms/:roomId/problems`.
- Run Code calls `POST /api/v1/rooms/:roomId/problems/run`.
- Submit calls `POST /api/v1/rooms/:roomId/problems/submit`.
- Visible/sample testcases can be returned to the frontend; hidden testcases stay private.
- Successful submissions are saved and announced through `ROOM_SUBMISSION_CREATED`.

## Run Locally

Use separate terminals:

```powershell
# Terminal 1: Piston runner
cd <repo-root>
docker compose -f docker-compose.piston.yml up -d
```

```powershell
# Terminal 2: backend
cd <repo-root>\Starsync_backend
npm run dev
```

```powershell
# Terminal 3: frontend
cd <repo-root>\Starsync_frontend
npm run dev
```

Open `http://localhost:5173`.

## Useful Commands

```powershell
# Backend
cd Starsync_backend
npm run build
npx prisma validate
npx prisma migrate deploy
npx prisma db seed
```

```powershell
# Frontend
cd Starsync_frontend
npm run lint
npm run build
npm run preview
```

```powershell
# Piston
cd <repo-root>
docker compose -f docker-compose.piston.yml ps
docker compose -f docker-compose.piston.yml down
```

## Deployment Notes

Production deployment is documented in `deploy/README.md`.

Recommended setup for DigitalOcean:

- One Ubuntu Droplet with Nginx, PM2, Redis, and Docker Piston
- Neon PostgreSQL for the database
- Same-origin domain for frontend, `/api/`, and `/socket.io/`
- Nginx forwards Socket.IO upgrade headers for realtime traffic

Use `deploy/env/backend.production.env.example` and `deploy/env/frontend.production.env.example` when building for production. Use `deploy/pm2.ecosystem.config.cjs` to keep the backend running after SSH logout.

## Troubleshooting

### Login does not persist after refresh

Check that Redis is running and `REDIS_URL` is correct. The app uses a Redis-backed HttpOnly `sid` cookie for both HTTP requests and Socket.IO handshakes.

### API requests fail in development

Confirm `CLIENT_ORIGIN` and `FRONTEND_URL` match the frontend URL, usually `http://localhost:5173`.

### Realtime room status stays offline

Confirm the backend is running, `VITE_SOCKET_IO_URL` points to the backend origin, and the browser can reach `/socket.io/` on that origin.

### Code runner is unavailable

Start Docker Desktop and run:

```powershell
docker compose -f docker-compose.piston.yml up -d
Invoke-RestMethod http://localhost:2000/api/v2/runtimes
```

### Prisma cannot connect

Check `DATABASE_URL`. Neon URLs usually need `sslmode=require`.

## Repository Notes

This repository does not include `.env` files, `node_modules`, `dist`, local Piston runtime data under `data/`, or local agent/editor files such as `AGENTS.md`. Create environment files from the provided examples before running the app.
