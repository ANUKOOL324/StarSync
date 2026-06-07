# Feature Roadmap

This document maps out future enhancements, testing efforts, and deployment workflows for the WebSocket Chat Application.

## Short-Term Tasks (Next Steps)

### 1. Liveblocks Integration Testing
- [ ] Set up real Liveblocks browser-based end-to-end (E2E) testing.
- [ ] Configure environment parameters in development and CI pipelines to validate token generation and connection establishment.
- [ ] Implement local mock testing fallback for whiteboard when `LIVEBLOCKS_SECRET_KEY` is not set.

### 2. Whiteboard Feature Polish
- [ ] Enhance tldraw canvas tools integration (custom assets support, local image uploads).
- [ ] Add clearing/reset canvas functionality for room admins.
- [ ] Save whiteboard snapshots or metadata to database on change (or periodically).

### 3. Repository Documentation & Screenshots
- [ ] Capture key UI screenshots (Login, Chat workspace, Monaco Editor synchronization, tldraw whiteboard).
- [ ] Store screenshots inside `docs/screenshots/`.
- [ ] Reference screenshots in the root `README.md` to showcase visual aesthetics.

## Medium-Term Tasks

### 4. Production Deployment & CI/CD
- [ ] Containerize backend and frontend using Docker.
- [ ] Set up deployment configuration for backend (Render, fly.io, or AWS) and frontend (Vercel, Netlify).
- [ ] Build Git workflows for automatic linting, building, and validation checks.
- [ ] Setup production PostgreSQL (Neon) migrations pipeline.

## Long-Term Enhancements

### 5. Advanced Collaborative Editing
- [ ] Implement differential synchronization or Yjs/CRDT support for the editor (currently uses debounced native WS syncing).
- [ ] Add linting/autocomplete capabilities in Monaco Editor for backend language environments.
