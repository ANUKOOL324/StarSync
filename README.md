# WS Chat Collaboration Workspace

A full-stack realtime collaboration app built with React, TypeScript, Express, native `ws`, Prisma, PostgreSQL, and a Monaco-powered code editor.

The project intentionally keeps chat and editor collaboration on native `ws`, without Socket.IO, Redis, or Yjs. Liveblocks is used only for the whiteboard tab so the core realtime architecture stays easy to understand and explain.

## Features

- JWT authentication for REST APIs and WebSocket connections
- Protected frontend routes
- Persistent group rooms and direct messages
- Persistent message history with pagination
- Native `ws` realtime chat
- Online room presence and typing indicators
- Unread room indicators
- Monaco code editor with autosave
- Editor sync over the existing WebSocket connection
- Editor active-collaborator presence
- Collaborative whiteboard with tldraw and Liveblocks
- Run code through a local Piston Docker runner
- Supported code-runner languages: C, C++, JavaScript, TypeScript, Python
- Dark futuristic chat UI with responsive sidebar/details drawers

## Project Structure

```txt
websockets/
|- docker-compose.piston.yml
|- wsocket_backend/
|  |- prisma/
|  |- src/
|  |  |- controllers/
|  |  |- middleware/
|  |  |- routes/
|  |  |- services/
|  |  |- types/
|  |  |- validations/
|  |  `- websocket/
|  `- CODE_RUNNER.md
`- wsocket_fronted/
   `- src/
      |- components/
      |- hooks/
      |- layouts/
      |- pages/
      |- services/
      |- types/
      `- utils/
```

## Requirements

- Node.js
- npm
- PostgreSQL database URL, Neon recommended
- Liveblocks secret key, only needed for the collaborative whiteboard
- Docker Desktop, only needed for the code runner

## Backend Setup

```powershell
cd websockets
cd wsocket_backend
npm install
copy .env.example .env
```

Update `wsocket_backend/.env`:

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require"
JWT_SECRET="change-this-to-a-long-random-secret"
JWT_EXPIRES_IN=7d
CODE_RUNNER_URL=http://localhost:2000/api/v2
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key
```

Generate Prisma Client and apply migrations:

```powershell
npx prisma generate
npx prisma migrate deploy
```

For local development, run:

```powershell
npm run dev
```

Backend runs on:

```txt
http://localhost:3001
```

## Frontend Setup

```powershell
cd websockets
cd wsocket_fronted
npm install
copy .env.example .env
```

Update `wsocket_fronted/.env` if needed:

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WEBSOCKET_URL=ws://localhost:3001
```

Run the frontend:

```powershell
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

## Piston Code Runner Setup

The backend does not run user code with `child_process`. It sends code to a Piston-compatible API.

Start Docker Desktop first. Then from the project root:

```powershell
cd websockets
docker compose -f docker-compose.piston.yml up -d
```

Check the runner:

```powershell
docker compose -f docker-compose.piston.yml ps
Invoke-RestMethod http://localhost:2000/api/v2/runtimes
```

If runtimes are missing, install them:

```powershell
$packagesToInstall = @(
  @{ language = "gcc"; version = "10.2.0" },
  @{ language = "node"; version = "20.11.1" },
  @{ language = "typescript"; version = "5.0.3" },
  @{ language = "python"; version = "3.10.0" }
)

foreach ($package in $packagesToInstall) {
  Invoke-RestMethod `
    -Method POST `
    -ContentType "application/json" `
    -Uri http://localhost:2000/api/v2/packages `
    -Body (@{
      language = $package.language
      version = $package.version
    } | ConvertTo-Json)
}
```

Stop the runner:

```powershell
docker compose -f docker-compose.piston.yml down
```

Note: C++ compilation is heavier than Python/JavaScript. The default editor starter uses `#include <iostream>` because it is faster and more reliable locally. Very heavy C++ programs can still timeout cleanly.

## Liveblocks Whiteboard Setup

The app uses native `ws` for chat, DMs, typing indicators, online presence, editor sync, and editor presence.

Liveblocks is used only for the whiteboard tab.

To enable the whiteboard:

1. Create a Liveblocks project.
2. Copy your secret key from the Liveblocks dashboard.
3. Add it to `wsocket_backend/.env`:

```env
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key
```

The frontend never receives this secret key.

When a user opens the whiteboard, the frontend asks:

```txt
POST /api/v1/liveblocks/auth
```

The backend:

1. Verifies the normal JWT.
2. Checks `RoomMember` for the current room.
3. Allows access only to `whiteboard:<roomId>`.
4. Returns a short-lived Liveblocks token.

This keeps whiteboard access tied to the same room membership rules as the rest of the app.

## Run Everything Locally

Use three terminals:

Terminal 1, code runner:

```powershell
cd websockets
docker compose -f docker-compose.piston.yml up -d
```

Terminal 2, backend:

```powershell
cd websockets\wsocket_backend
npm run dev
```

Terminal 3, frontend:

```powershell
cd websockets\wsocket_fronted
npm run dev
```

Then open:

```txt
http://localhost:5173
```

## Demo Flow

Use this flow when showing the project:

1. Start Docker Piston if you plan to demo code execution.
2. Start the backend and frontend.
3. Sign up or log in.
4. Create a group room from the dashboard.
5. Open the room and send a group chat message.
6. Open the same room with a second user in another browser or incognito window.
7. Show online room members and typing indicators.
8. Start a direct message from a room member and send a private message.
9. Return to the group room and open the Editor tab.
10. Type code, wait for autosave, then refresh to confirm the code persists.
11. Run JavaScript or Python code and show stdout in the output panel.
12. Open the Editor tab with the second user and show active collaborators.
13. Open the Whiteboard tab with both users and draw together.
14. Switch one user back to Chat and confirm editor/board state does not break.

Short presenter script:

```txt
This is a realtime collaboration workspace.
REST APIs handle persistent actions like auth, rooms, messages, and editor saves.
Native WebSocket handles chat, DMs, typing, online presence, editor sync, and editor presence.
Docker Piston handles code execution safely outside the backend process.
Liveblocks is used only for the whiteboard because high-frequency canvas sync is a different problem from chat.
```

## Final Demo Checklist

Before recording or presenting:

- [ ] Backend is running on `http://localhost:3001`
- [ ] Frontend is running on `http://localhost:5173`
- [ ] Database connection works
- [ ] Docker Desktop is running
- [ ] Piston responds at `http://localhost:2000/api/v2/runtimes`
- [ ] `LIVEBLOCKS_SECRET_KEY` is configured if showing the whiteboard
- [ ] User A and User B test accounts are ready
- [ ] One normal browser and one incognito/second browser are open
- [ ] Chat message persists after refresh
- [ ] DM message persists after refresh
- [ ] Editor code persists after refresh
- [ ] Code runner shows output for a simple JavaScript or Python example
- [ ] Whiteboard opens and drawing syncs between two users

## Screenshots To Capture

Recommended screenshots for the repository:

| Screenshot | What To Show |
|---|---|
| Login page | Dark auth UI and product branding |
| Dashboard | Create room, join room, recent rooms |
| Group chat workspace | Room sidebar, live chat, room details |
| Typing/presence | Online users and typing indicator |
| Direct message view | Private DM room with another user |
| Editor tab | Monaco editor with saved code |
| Code runner output | stdout/stderr panel after running code |
| Editor collaborators | Active editor avatars/count |
| Whiteboard tab | tldraw canvas with shared drawing |
| Responsive drawer | Mobile/tablet sidebar or details drawer |

Add screenshots under:

```txt
docs/screenshots/
```

Then reference them from this README when they are available.

## Useful Commands

Backend:

```powershell
cd wsocket_backend
npm run dev
npm run build
```

Frontend:

```powershell
cd wsocket_fronted
npm run dev
npm run lint
npm run build
```

Prisma:

```powershell
cd wsocket_backend
npx prisma generate
npx prisma migrate deploy
npx prisma studio
```

Piston:

```powershell
docker compose -f docker-compose.piston.yml up -d
docker compose -f docker-compose.piston.yml ps
docker compose -f docker-compose.piston.yml down
```

## Troubleshooting

### Docker pipe error on Windows

If you see an error like:

```txt
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified
```

Docker Desktop is not running. Open Docker Desktop, wait until it says the engine is running, then run:

```powershell
docker compose -f docker-compose.piston.yml up -d
```

### Code runner is currently unavailable

This means the backend could not reach Piston.

Check:

```powershell
docker compose -f docker-compose.piston.yml ps
Invoke-RestMethod http://localhost:2000/api/v2/runtimes
```

Also confirm `wsocket_backend/.env` contains:

```env
CODE_RUNNER_URL=http://localhost:2000/api/v2
```

### C++ timeout

C++ is supported, but Docker Desktop on Windows can compile slowly. Use the lightweight starter code with:

```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "hello" << endl;
    return 0;
}
```

Very heavy C++ code may timeout. The app should show a clean timeout/error message instead of exposing backend stack traces.

### Prisma or database connection error

Check that `DATABASE_URL` in `wsocket_backend/.env` is your real PostgreSQL connection string.

For Neon, keep `sslmode=require` in the URL.

### Port already in use

If port `3001` or `5173` is already running, stop the old process or change the port in your environment/dev command.

## Notes For Forks

This repository does not include:

- `.env` files
- `node_modules`
- `dist`
- local Piston runtime data under `data/`

That is intentional. Forkers should install dependencies, create their own environment files, connect their own database, and start their own local Piston runner.
