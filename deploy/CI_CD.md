# StarSync CI/CD

GitHub Actions workflow: `.github/workflows/deploy.yml`

Production branch: `master`

## Flow

### Pull request → CI only

```text
PR targeting master
  → checkout
  → backend: npm ci && npm run build
  → frontend: npm ci && npm run build
  → no Azure SSH
  → no deployment
```

### Push to master → CI then CD

```text
push master
  → CI (backend + frontend builds)
  → CD (only if CI passed)
      → SSH to Azure VM
      → git pull --ff-only origin master
      → backend: npm ci, npm run build, prisma migrate deploy, pm2 restart
      → frontend: npm ci, npm run build (uses existing server .env)
      → rsync dist → /var/www/starsync/frontend/dist
      → health check https://starsynclive.me/api/health
```

Concurrent deployments are prevented by workflow concurrency (`starsync-production-deploy`).

---

## Required GitHub secrets

Create these in the repository:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | What to put in it (no real values in git) |
| --- | --- |
| `AZURE_HOST` | Public IP or DNS hostname of the Azure VM (e.g. `x.x.x.x` or `starsynclive.me` if SSH resolves there) |
| `AZURE_USER` | SSH login user: `azureuser` |
| `AZURE_SSH_PRIVATE_KEY` | Full private key contents for the deploy key (PEM/OpenSSH format, including `BEGIN`/`END` lines) |
| `AZURE_KNOWN_HOSTS` | Output of `ssh-keyscan` for the VM (see below) |

Do not commit these values. Do not paste them into the repository.

---

## One-time Azure setup

### 1. SSH deploy key

On your local machine (or a secure admin machine):

```bash
ssh-keygen -t ed25519 -C "github-actions-starsync" -f ./starsync-deploy-key -N ""
```

- Add `starsync-deploy-key.pub` to `/home/azureuser/.ssh/authorized_keys` on the VM.
- Store the **private** key as GitHub secret `AZURE_SSH_PRIVATE_KEY`.

### 2. Known hosts

From a machine that can reach the VM:

```bash
ssh-keyscan -H YOUR_VM_IP_OR_HOST >> known_hosts.txt
```

Copy the file contents into GitHub secret `AZURE_KNOWN_HOSTS`.

This keeps `StrictHostKeyChecking=yes` enabled in the workflow.

### 3. Frontend deploy directory permissions (no interactive sudo in CI)

The workflow deploys as `azureuser` and must write to `/var/www/starsync/frontend/dist` without a sudo password.

Run **once** on the Azure VM (as a user with sudo):

```bash
sudo mkdir -p /var/www/starsync/frontend/dist
sudo chown -R azureuser:www-data /var/www/starsync
sudo chmod -R 775 /var/www/starsync
```

After this, GitHub Actions can `rsync` built assets into `dist` without sudo.

Do **not** delete or overwrite `/home/azureuser/StarSync/Starsync_frontend/.env` during deploy. The workflow only runs `npm run build`, which reads the existing server `.env` (including `VITE_API_URL`, `VITE_TLDRAW_LICENSE_KEY`, etc.).

### 4. PM2

Ensure the backend is already registered with PM2 as `starsync-backend` (see `deploy/pm2.ecosystem.config.cjs`). The workflow runs:

```bash
pm2 restart starsync-backend
pm2 save
```

### 5. Repository on VM

Clone should live at `/home/azureuser/StarSync`, tracking `origin/master`.

---

## What the workflow does NOT do

- No `git reset --hard`, `git clean`, or `git stash` (preserves local VM changes such as `docker-compose.piston.yml` edits).
- No Piston Docker restart.
- No Redis restart.
- No Nginx config changes or reload (static frontend swap only).
- No commit of `.env` files.
- No production secrets in the repository.

---

## Technical debt: local `docker-compose.piston.yml` on VM

The Azure VM may have an **uncommitted** change to `docker-compose.piston.yml` (deployment hardening). The workflow uses `git pull --ff-only`, which:

- Will succeed if the VM has no conflicting commits and the remote change does not touch the same lines.
- May **fail** if a remote update modifies the same file and conflicts with the local edit.

Normalize that file in git separately; do not use destructive git commands in CI to work around it.

---

## Inspecting deployments

### GitHub Actions

- Repository → **Actions** → workflow **CI/CD**
- Open the run for the commit; check **CI** then **CD** job logs.

### On the Azure VM (SSH as azureuser)

```bash
pm2 status
pm2 logs starsync-backend --lines 100
curl -fsS https://starsynclive.me/api/health
```

---

## Local validation (same commands as CI)

```bash
cd Starsync_backend
npm ci
npm run build

cd ../Starsync_frontend
npm ci
npm run build
```

Backend build does not require a live `DATABASE_URL` for `prisma generate` + `tsc`. Production migrations run only on the VM during CD via `npx prisma migrate deploy` (reads `DIRECT_DATABASE_URL` from the server `.env` through `prisma.config.ts`).

---

## Database URLs on Azure

Production `/home/azureuser/StarSync/Starsync_backend/.env` must define **both**:

| Variable | Used by | Connection |
| --- | --- | --- |
| `DATABASE_URL` | Node app / Prisma Client at runtime | Neon **pooled** URL (hostname usually contains `-pooler`) |
| `DIRECT_DATABASE_URL` | Prisma CLI (`migrate deploy`, seed, etc.) | Neon **direct** URL (same database, hostname must **not** contain `-pooler`) |

CI/CD continues to run `npx prisma migrate deploy` on the VM. No database URLs belong in GitHub Actions secrets. Never commit real URLs.
