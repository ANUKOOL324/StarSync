# Frontend

React + TypeScript + Vite frontend for the WS Chat collaboration workspace.

## Run Locally

```powershell
npm install
copy .env.example .env
npm run dev
```

Expected environment:

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WEBSOCKET_URL=ws://localhost:3001
```

## Scripts

```powershell
npm run dev
npm run lint
npm run build
npm run preview
```

## Main Areas

- `src/pages` - public and protected route pages
- `src/layouts` - auth/protected page wrappers
- `src/components/chat` - chat workspace, room sidebar, messages, details panel
- `src/components/editor` - Monaco editor, toolbar, output panel, editor status
- `src/components/ui` - shared UI primitives
- `src/hooks` - auth, room, and socket state hooks
- `src/services` - REST and WebSocket service helpers
- `src/types` - shared frontend TypeScript types
