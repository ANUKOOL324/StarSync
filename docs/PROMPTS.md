# Reusable Codex Prompt Template

This document provides a structured, reusable prompt template optimized for AI agents working on this codebase. Copy and adapt it for new feature requests, code refactoring, or bug fixes.

---

```markdown
# Goal
[Describe the exact goal of the task, e.g., Add unread message counters to rooms list]

# Context
We are working on a full-stack TypeScript WebSocket Chat Application. The project structure consists of Starsync_backend/ (Node, Express, Prisma, Native ws) and Starsync_frontend/ (React, Vite, TailwindCSS, Monaco, tldraw).

# Constraints
- Do not use socket.io; keep all WebSocket connections native ws.
- Do not add Redis or change core database structure unless explicitly instructed.
- Liveblocks is strictly reserved for the Whiteboard feature.
- Write readable, maintainable, interview-friendly code.
- Avoid introducing over-abstracted utilities or unnecessary Framer Motion animations.

# Files to Inspect
- [List files to read or edit, e.g., Starsync_frontend/src/pages/Dashboard.tsx]
- [e.g., Starsync_backend/src/websocket/handler.ts]

# Acceptance Criteria
- [Criteria 1, e.g., Unread count increments in real-time when message is received in an inactive room]
- [Criteria 2, e.g., Unread count resets to 0 when user enters/clicks on the room]

# Validation Commands
Backend:
cd Starsync_backend
npm run build

Frontend:
cd Starsync_frontend
npm run lint
npm run build

# Final Response Format
Please structure your final response exactly as follows:
1. Changed files (list of file paths)
2. What changed (brief summary of modifications)
3. Validation result (output of backend/frontend build and lint checks)
4. Remaining issues (any unresolved edge cases or bugs)
```
