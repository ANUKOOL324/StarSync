# Known Issues

This document tracks known issues, limitations, and debugging steps for the WebSocket Chat Application.

## Active Issues

### 1. Real Liveblocks Browser Testing Pending
- **Severity**: Low
- **Category**: Integration / Testing
- **Description**: Real end-to-end browser testing for the collaborative whiteboard is pending. It requires a valid `LIVEBLOCKS_SECRET_KEY` configured in the backend environment (`wsocket_backend/.env`). 
- **Current Behavior**: If the key is missing or invalid, the Liveblocks authorization endpoint will fail or return a forbidden response, preventing the whiteboard from initializing. 
- **Workaround**: Configure the `LIVEBLOCKS_SECRET_KEY` in your backend env using a free Liveblocks developer account key to test whiteboard synchronization locally across browsers.
- **Resolution Plan**: Introduce mock environment configurations for local workspace testing when external API keys are omitted.
