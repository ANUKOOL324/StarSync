# Known Issues

This document tracks known issues, limitations, and debugging steps for the WebSocket Chat Application.

## Active Issues

### 1. Liveblocks Requires Local Credentials For Demo
- **Severity**: Low
- **Category**: Integration / Setup
- **Description**: The collaborative whiteboard requires a valid `LIVEBLOCKS_SECRET_KEY` configured in `wsocket_backend/.env`.
- **Current Behavior**: If the key is missing or invalid, the Liveblocks auth route cannot create a whiteboard room token and the Board tab will show an auth/loading error.
- **Workaround**: Configure the key from a Liveblocks developer project before demoing the Board tab.
- **Resolution Plan**: Add a local mock/fallback board mode later if the app needs demos without external credentials.

### 2. Piston Must Be Running For Code Execution
- **Severity**: Low
- **Category**: Integration / Setup
- **Description**: Chat, DMs, editor sync, and whiteboard can run without Docker Piston, but the Run Code button needs a local Piston API.
- **Current Behavior**: If Docker/Piston is not running, the editor returns a clean runner-unavailable message.
- **Workaround**: Start Docker Desktop, then run `docker compose -f docker-compose.piston.yml up -d` from the project root.

### 3. Heavy C++ Can Timeout Locally
- **Severity**: Low
- **Category**: Code Runner
- **Description**: C++ compilation inside Docker Desktop can be slower than JavaScript/Python execution.
- **Current Behavior**: Lightweight `#include <iostream>` examples work best for demos. Heavy C++ or large headers can timeout cleanly.
- **Workaround**: Use the lightweight C++ starter code during presentations.
