# Testing Checklist

This document contains testing checklists for backend, frontend, and manual browser verification.

## Backend Testing Checklist

- [ ] **Authentication & Authorization**
  - [ ] Valid signup (proper password hashing, input validation)
  - [ ] Valid login (returns valid JWT token)
  - [ ] Protected endpoints reject requests with missing/invalid/expired tokens
  - [ ] User cannot access rooms or messages they are not members of

- [ ] **Rooms & Message API**
  - [ ] Create group room (validation of room name)
  - [ ] Create direct message (DM) room (prevents duplicate room creation between same two users)
  - [ ] Retrieve message history with correct pagination / limit parameters

- [ ] **WebSocket Server**
  - [ ] Authenticates socket connection with JWT
  - [ ] Restricts subscription/broadcasting to rooms the user is member of
  - [ ] Handles client disconnection cleanly (clears typing indicators, updates presence)

- [ ] **Code Runner API**
  - [ ] Forwards compilation/run requests to Piston container correctly
  - [ ] Sanitizes language arguments
  - [ ] Gracefully handles timeout errors if code runs too long

- [ ] **Liveblocks Authorization**
  - [ ] Authentication endpoint returns valid short-lived token
  - [ ] Restricts authorization to whiteboard rooms matches DB room membership

## Frontend Testing Checklist

- [ ] **Routing & Navigation**
  - [ ] Redirects unauthenticated users to `/login` from protected routes
  - [ ] Redirects logged-in users away from login/signup pages to dashboard

- [ ] **Rooms & Messages**
  - [ ] Correctly renders room list and handles active room selection
  - [ ] Displays historical messages and loads older messages on scroll
  - [ ] Sends message through WebSocket connection and appends to UI

- [ ] **Typing & Online Presence**
  - [ ] Typing indicators show when other room members type, fade after debounce time
  - [ ] Online presence updates when other users open/close the room

- [ ] **Monaco Code Editor**
  - [ ] Renders code correctly matching selected language
  - [ ] Autosaves code to database
  - [ ] Synchronizes text edits in real-time with other users viewing the editor

- [ ] **tldraw Collaborative Whiteboard**
  - [ ] Renders whiteboard canvas and drawing tools
  - [ ] Draws shapes, lines, and text with real-time sync via Liveblocks

## Manual Browser Testing Checklist

- [ ] **Multi-User Collaboration Flow**
  - [ ] Open User A in Browser 1 (e.g., Chrome) and User B in Browser 2 (e.g., Firefox)
  - [ ] User A creates a room -> Verify it updates in User B's list if User B is member
  - [ ] User A types -> Verify User B sees "User A is typing..."
  - [ ] User A sends a message -> Verify User B receives it in real-time
  - [ ] User A joins Editor -> Verify User B sees User A's cursor/presence in Editor
  - [ ] User A edits code -> Verify User B's editor updates in real-time
  - [ ] User A runs code -> Verify output is shown in console panel
  - [ ] User A & User B open Whiteboard -> Verify both can draw and see each other's updates

- [ ] **Responsive Design Check**
  - [ ] View layout on mobile screen (width < 768px)
  - [ ] Sidebar and details panels should slide out/hide behind drawers
  - [ ] Input panels and canvas resize correctly without breaking layout
