# StarSync

StarSync is a realtime collaboration workspace for chat, direct messages, shared coding rooms, whiteboard sessions, and contest-style problem solving. It uses a React/Vite frontend, an Express/TypeScript backend, Socket.IO, Prisma, PostgreSQL, Redis-backed sessions, Monaco, tldraw, Liveblocks, and a local Piston runner for code execution.

## Highlights

- HttpOnly cookie authentication with Redis sessions
- Realtime group rooms and direct messages over Socket.IO
- Persistent chat history, unread states, typing indicators, and online presence
- Collaborative code editor with autosave and active collaborator presence
- Whiteboard collaboration through tldraw and Liveblocks
- Competing rooms with assigned problem-bank questions
- Run Code execution against visible/sample testcases only
- Piston-backed code runner for JavaScript, TypeScript, Python, C, and C++
- Responsive dark workspace UI for dashboard, chat, editor, and contest rooms

## Tech Stack

| Area | Stack |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Monaco, tldraw |
| Backend | Node.js, Express, TypeScript, Socket.IO |
| Database | PostgreSQL with Prisma |
| Sessions | Redis + HttpOnly `sid` cookie |
| Code runner | Piston Docker API |
| Whiteboard auth | Liveblocks server token endpoint |

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

## System Flow

```mermaid
flowchart LR
  User[Browser] --> Frontend[React Frontend]
  Frontend -->|HTTP + sid cookie| API[Express API]
  Frontend -->|Socket.IO + sid cookie| Realtime[Socket.IO Server]
  API --> Session[Redis Sessions]
  Realtime --> Session
  API --> DB[(PostgreSQL)]
  Realtime --> DB
  API --> Piston[Piston Runner]
  API --> Liveblocks[Liveblocks Auth]
```

## Core App Flow

```mermaid
flowchart TD
  A[Sign up or log in] --> B[Dashboard]
  B --> C[Join room]
  B --> D[Create collaborative room]
  B --> E[Create competing room]
  C --> F[Chat workspace]
  D --> F
  F --> G[Chat]
  F --> H[Editor]
  F --> I[Whiteboard]
  E --> J[Competing workspace]
  J --> K[Assigned DB problems]
  K --> L[Run visible testcases]
  J --> M[Submission history]
```

## Requirements

- Node.js and npm
- PostgreSQL database, Neon works well
- Redis for session storage, local or hosted
- Docker Desktop for the optional local Piston code runner
- Liveblocks secret key for the whiteboard tab

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

Chat, direct messages, room presence, typing, timers, editor sync, and contest events use the app Socket.IO server at `/socket.io/`. The whiteboard uses Liveblocks because canvas synchronization is a separate high-frequency collaboration problem.

Whiteboard access still follows StarSync room membership rules:

1. Frontend requests `POST /api/v1/liveblocks/auth`.
2. Backend verifies the `sid` session cookie.
3. Backend checks room membership.
4. Backend returns a Liveblocks token scoped to the room.

## Competing Rooms

Competing rooms use the problem bank stored in PostgreSQL:

- Room creation stores difficulty/topic preferences.
- The backend assigns four available problems to the room.
- The frontend loads P1/P2/P3/P4 from `GET /api/v1/rooms/:roomId/problems`.
- Run Code calls `POST /api/v1/rooms/:roomId/problems/run`.
- Only visible/sample testcases are executed and returned.
- Hidden testcases stay private and are not returned to the frontend.
- Submit and leaderboard behavior are intentionally separate from Run Code.

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
- Same-origin domain for frontend, `/api`, and `/socket.io/`

Use `deploy/env/backend.production.env.example` and `deploy/env/frontend.production.env.example` when building for production.
Use `deploy/pm2.ecosystem.config.cjs` to keep the backend running after SSH logout.

## Troubleshooting

### Login does not persist after refresh

Check that Redis is running and `REDIS_URL` is correct. The app uses a Redis-backed HttpOnly `sid` cookie for both HTTP and Socket.IO auth.

### API requests fail in development

Confirm `CLIENT_ORIGIN` and `FRONTEND_URL` match the frontend URL, usually `http://localhost:5173`.

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
