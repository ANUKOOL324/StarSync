# StarSync Frontend

React + TypeScript + Vite frontend for StarSync.

## Run Locally

```powershell
npm install
copy .env.example .env
npm run dev
```

Expected environment:

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001/ws
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
- `src/components/chat` - chat workspace, sidebar, messages, room settings
- `src/components/competing` - contest room UI, timer, submissions, problem panel
- `src/components/dashboard` - dashboard shell, room cards, create/join dialogs
- `src/components/editor` - Monaco editor, toolbar, output panel
- `src/components/landing` - landing page visuals
- `src/components/whiteboard` - tldraw whiteboard workspace
- `src/components/ui` - shared UI primitives
- `src/hooks` - auth, rooms, and socket hooks
- `src/services` - REST and WebSocket helpers
- `src/types` - shared frontend TypeScript types
