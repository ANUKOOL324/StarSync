# WebSocket Chat Application Architecture

This document outlines the architecture, data flow, and technology choices for the WebSocket Chat Application.

## Backend Architecture

The backend is built as a Node.js + Express application written in TypeScript. It handles:
- **Authentication**: JWT-based authentication for HTTP routes and WebSocket connections.
- **API Endpoints**: REST endpoints for user authentication, room management, messages, and external integrations (e.g., Liveblocks token generation).
- **Database Access**: Prisma ORM maps requests to a PostgreSQL database.
- **Validation**: Schema-based validation using Zod for API endpoints.

## Frontend Architecture

The frontend is a single-page application (SPA) built with React, TypeScript, and Vite:
- **State Management**: React state/hooks to manage UI components, rooms list, messages, and active user lists.
- **Styling**: TailwindCSS for styling and modern design aesthetics.
- **Animations**: Framer Motion for subtle transitions and interactive cues.
- **Rich Components**: 
  - Monaco Editor for code collaboration.
  - tldraw for collaborative whiteboarding.

## Database Schema

The system uses PostgreSQL, with key models defined via Prisma:
- **User**: Represents registered users with credentials (hashed passwords).
- **Room**: Group chat rooms or Direct Message (DM) channels.
- **Message**: Chat messages associated with a user and a room.
- **RoomMember**: Joins users to rooms, tracking membership and roles.
- **CodeSession / SavedCode**: Stores code versions and Monaco editor states.

## WebSocket Flow

Real-time communications (except whiteboard) are managed using the native `ws` library:
1. **Connection**: Client establishes a secure WebSocket connection passing a JWT token in the query parameters or protocols.
2. **Authentication**: The server validates the JWT. If invalid, the connection is closed.
3. **Subscriptions**: On successful connection, the server registers the client and tracks which room(s) they are viewing.
4. **Events**:
   - **Chat Message**: Client sends message payload -> Server saves to DB -> Server broadcasts message to all room subscribers.
   - **Typing Indicator**: Client sends "typing" status -> Server broadcasts to other room members (throttled/debounced).
   - **Presence**: Client connects/disconnects -> Server updates online status list -> Server broadcasts updated member lists.

## Editor Flow

Monaco-powered collaborative editor flow:
1. **Selection**: User clicks on a room's Editor tab.
2. **Sync**: The latest code document state is fetched from the backend (or populated via WebSocket).
3. **Real-time Collaboration**: As the user types, edits or synchronization payloads are sent via the native WebSocket connection to other users currently viewing the same room's editor.
4. **Active Collaborators**: Active user cursors and editing statuses are displayed using local state populated by editor presence WebSocket events.
5. **Autosave**: Changes are periodically persisted to the PostgreSQL database via a debounced autosave endpoint or specialized WebSocket save event.

## Whiteboard Flow

Collaborative drawing whiteboard flow using Liveblocks and tldraw:
1. **Authorization**: When a user navigates to the Whiteboard tab, the client requests a token via `POST /api/v1/liveblocks/auth`.
2. **Access Control**: The backend validates membership of the user in that room, granting access only to `whiteboard:<roomId>`.
3. **Session Establishment**: The client establishes a connection directly to the Liveblocks service using the token.
4. **State Synchronization**: tldraw reads and writes shape data synchronized in real-time by Liveblocks servers.

## Code Runner Flow

User code execution flow:
1. **Submission**: User clicks the "Run Code" button in the editor panel.
2. **Backend Proxy**: The frontend posts code, language, and input to the Express backend.
3. **Docker Runner (Piston)**: The Express backend forwards the payload to the local Piston Docker container (`http://localhost:2000`).
4. **Execution**: Piston runs the code in an isolated environment and returns the stdout, stderr, and execution status.
5. **Output**: The Express backend forwards Piston's output back to the frontend to render in the console drawer.
