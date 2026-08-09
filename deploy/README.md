# StarSync Production Deployment

This guide deploys StarSync on a single DigitalOcean Droplet behind one public domain. The frontend, REST API, Socket.IO realtime endpoint, and HttpOnly `sid` cookie all share the same origin.

## Recommended Stack

| Service | Where |
| --- | --- |
| Droplet | DigitalOcean, 4 GB RAM recommended |
| PostgreSQL | Neon free tier |
| Redis | Same Droplet, used for sessions |
| Backend | PM2 on `127.0.0.1:3001` |
| Frontend | Nginx static files |
| Socket.IO | Proxied by Nginx at `/socket.io/` |
| Piston code runner | Docker on same Droplet |
| Public ports | Only `80` and `443` |

Use a 2 GB Droplet only if you skip Piston or host it elsewhere.

## Production Routing

| Public path | Destination |
| --- | --- |
| `/api/` | Express API on `127.0.0.1:3001` |
| `/socket.io/` | Socket.IO server on `127.0.0.1:3001` |
| `/` | React SPA from Nginx static files |

Nginx must forward Socket.IO upgrade headers for realtime connections. The example config in `deploy/nginx/starsync.conf.example` already includes the `/socket.io/` proxy.

## GitHub Student Pack Credits

1. Activate DigitalOcean credits from the GitHub Student Developer Pack.
2. Create one Ubuntu Droplet.
3. Use Neon for PostgreSQL so database cost stays free.
4. Keep Redis, backend, frontend, and Piston on the Droplet.
5. Point your domain `A` record to the Droplet IP.

A `$12/month` Droplet can run for many months on typical student credits.

## Server Setup

Install packages on Ubuntu:

```bash
sudo apt update
sudo apt install -y nginx redis-server git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Install Docker for Piston:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Open firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Clone And Configure

```bash
git clone <your-repo-url> starsync
cd starsync
```

Backend env:

```bash
cd Starsync_backend
cp ../deploy/env/backend.production.env.example .env
nano .env
npm install
npm run build
npx prisma migrate deploy
npx prisma db seed
```

Set real values in `.env`:

- `CLIENT_ORIGIN=https://yourdomain.com`
- `FRONTEND_URL=https://yourdomain.com`
- `DATABASE_URL=` your Neon URL
- `REDIS_URL=redis://127.0.0.1:6379`
- `CODE_RUNNER_URL=http://127.0.0.1:2000/api/v2`
- `LIVEBLOCKS_SECRET_KEY=` your Liveblocks secret

Frontend build:

```bash
cd ../Starsync_frontend
cp ../deploy/env/frontend.production.env.example .env
npm install
npm run build
sudo mkdir -p /var/www/starsync/frontend
sudo rsync -a dist/ /var/www/starsync/frontend/dist/
```

The production frontend should use the same public origin:

```env
VITE_API_URL=https://yourdomain.com/api/v1
VITE_SOCKET_IO_URL=https://yourdomain.com
```

`VITE_SOCKET_IO_URL` is the Socket.IO server origin. The Socket.IO path remains `/socket.io/`.

## Start Services

Redis:

```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

Piston:

```bash
cd <repo-root>
docker compose -f docker-compose.piston.yml up -d
```

Backend with PM2:

```bash
cd <repo-root>/deploy
pm2 start pm2.ecosystem.config.cjs
pm2 save
pm2 startup
```

## Nginx

```bash
sudo cp <repo-root>/deploy/nginx/starsync.conf.example /etc/nginx/sites-available/starsync
sudo nano /etc/nginx/sites-available/starsync
sudo ln -s /etc/nginx/sites-available/starsync /etc/nginx/sites-enabled/starsync
sudo nginx -t
sudo systemctl reload nginx
```

Replace `yourdomain.com` and confirm the frontend path is:

```txt
/var/www/starsync/frontend/dist
```

Enable HTTPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Verify

1. Open `https://yourdomain.com`.
2. Check `https://yourdomain.com/api/health`.
3. Sign up or log in, refresh, and confirm the session persists.
4. Open a room and confirm Socket.IO connects through `https://yourdomain.com/socket.io/`.
5. Send a chat message and confirm presence stays online after refresh.
6. Run code in a competing room and confirm Piston responds.

Useful commands:

```bash
pm2 status
pm2 logs starsync-backend
docker compose -f docker-compose.piston.yml ps
sudo nginx -t
```

## Notes

- Keep backend on `HOST=127.0.0.1` in production.
- Do not expose Redis, Piston, or port `3001` publicly.
- Redis stores sessions; it is not documented here as a Socket.IO scaling adapter.
- Rebuild frontend after changing `Starsync_frontend/.env`.
- Restart backend after changing `Starsync_backend/.env` with `pm2 restart starsync-backend`.
