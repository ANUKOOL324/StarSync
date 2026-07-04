# StarSync Production Deployment

This example deploys StarSync behind one public domain so the frontend, API, WebSocket, and HttpOnly `sid` cookie all share the same origin.

## Build

1. Build the frontend:

```bash
cd Starsync_frontend
npm run build
```

2. Copy the frontend build to the Nginx static root:

```bash
sudo mkdir -p /var/www/starsync/frontend
sudo rsync -a dist/ /var/www/starsync/frontend/dist/
```

3. Build and run the backend on localhost only:

```bash
cd ../Starsync_backend
npm run build
NODE_ENV=production PORT=3001 npm run start
```

Use PM2 or systemd for a real long-running process.

## Services

- Run Redis locally or on a private network. Do not expose Redis publicly.
- Run Piston locally or on a private network. Do not expose Piston publicly.
- Expose only Nginx ports 80 and 443 publicly.
- Keep the backend bound behind Nginx and do not expose port 3001 publicly.

## Nginx

1. Copy `deploy/nginx/starsync.conf.example` to your Nginx sites directory.
2. Replace `yourdomain.com` and any filesystem paths.
3. Enable the site and reload Nginx.
4. Enable HTTPS with Certbot, for example:

```bash
sudo certbot --nginx -d yourdomain.com
```

## Environment

Use `deploy/env/backend.production.env.example` for backend production variables.
Use `deploy/env/frontend.production.env.example` when building the frontend for same-domain deployment.

## Checks

1. Open `https://yourdomain.com` and confirm the React app loads.
2. Test the API through Nginx, for example `https://yourdomain.com/api/health` if the health route is enabled.
3. Open a room and confirm the WebSocket connects through `wss://yourdomain.com/ws`.
4. Login, refresh, and confirm the session persists through the HttpOnly `sid` cookie.
