# StarSync Frontend

React + TypeScript + Vite frontend for StarSync. The frontend provides the landing page, authentication screens, dashboard, collaborative room workspace, competing-room interface, Monaco editor, and whiteboard UI.

## Runtime Model

- REST requests use `VITE_API_URL`.
- StarSync application realtime connects to Socket.IO using `VITE_SOCKET_IO_URL` as the server origin.
- The Socket.IO path is configured by the app as `/socket.io/`; do not include that path in `VITE_SOCKET_IO_URL`.
- Liveblocks/Yjs remain responsible for collaborative features where they are already used.

## Run Locally

```powershell
npm install
copy .env.example .env
npm run dev
```

Expected environment:

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_SOCKET_IO_URL=http://localhost:3001
```

## Scripts

```powershell
npm run dev
npm run lint
npm run build
npm run preview
```

## Main Areas

- `src/pages` - landing, auth, dashboard, and room routes
- `src/layouts` - auth and protected route wrappers
- `src/components/chat` - chat workspace, sidebar, messages, and room settings
- `src/components/competing` - contest room UI, timer, submissions, problem panel, and editor layout
- `src/components/dashboard` - dashboard shell, room cards, create/join dialogs
- `src/components/editor` - Monaco editor, toolbar, and output panel
- `src/components/landing` - landing page visuals
- `src/components/whiteboard` - tldraw whiteboard workspace
- `src/components/ui` - shared UI primitives
- `src/hooks/useChatSocket.ts` - active Socket.IO room hook
- `src/services/socketIoService.ts` - Socket.IO client setup
- `src/services` - REST service helpers
- `src/types` - shared frontend TypeScript types
