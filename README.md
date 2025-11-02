# Achieving

A full‑stack web application with a React (Vite) frontend and a Go backend. This repo includes developer‑friendly Docker setups, CI/CD helpers, and security‑minded defaults.

## Features
- Vite + React frontend with Tailwind.
- Go backend with clear modular structure.
- Dev and prod Docker/Compose for quick spin‑up.
- Jenkins pipelines for SSH smoke tests and frontend deploy.
- Hardened `.gitignore` and `.dockerignore` to keep secrets and noise out.

## Project Structure
```
achieving/
├── backend/                 # Go service
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── db/
│   ├── internal/
│   └── main.go
├── frontend/                # React (Vite)
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── src/
│   └── vite.config.js
├── devops/
│   ├── ssh-smoke-test.groovy
│   ├── jenkins-installation.sh
│   └── signal-api-install.sh
├── docker-compose.dev.yml   # Developer stack
├── docker-compose.prod.yml  # Production stack
└── docs/
    └── ARCHITECTURE.md
```

## Quick Start (Development)
Prerequisites: `Docker`, `Docker Compose`. If developing locally without Docker, install `Node 18+` and `Go 1.22+`.

- Set environment files (do not commit secrets):
  - `frontend/.env` example: `VITE_API_BASE=http://localhost:8080`
  - `backend/.env` example: `ALLOW_ORIGIN=http://localhost:5173`
- Bring up dev stack:
  - `docker compose -f docker-compose.dev.yml up --build`
- Access:
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:8080`

Notes:
- Source code is live‑mounted; changes reflect immediately on the frontend.
- Go runs via `go run .`. For hot‑reload, we can add `air` or `CompileDaemon` on request.

## Production (Compose)
- Build and run:
  - `docker compose -f docker-compose.prod.yml up --build -d`
- Access:
  - Frontend: `http://localhost:80`
  - Backend: `http://localhost:8080`
- `frontend/Dockerfile` accepts `VITE_API_BASE` build arg; adjust in `docker-compose.prod.yml` for your API domain.

## CI/CD (Jenkins)
This repo includes a Jenkins declarative pipeline (`Jenkinsfile`) for SSH-based deploys.

### Jenkinsfile: Frontend Deploy via Angie (optional backend restart)
- What it does:
  - SSH to production, clone/update repo in `REMOTE_WORKDIR`.
  - Build React app in `FRONTEND_PATH` using `pnpm` or `npm`.
  - `rsync -a --delete` `dist/` to `ANGIE_WEBROOT`.
  - Restart Angie (`ANGIE_SERVICE_NAME`) and verify it is `active`.
  - Optionally restart backend (`BACKEND_SERVICE_NAME`).
  - Send Telegram message on success/failure.

- Required Jenkins credentials:
  - `prod-server-ssh`: SSH Username with private key for `${DEPLOY_USER}@${DEPLOY_HOST}`.
  - `telegram-bot-token`: Secret text for Telegram Bot API token.
  - `telegram-chat-id`: Secret text for target chat/group ID.

- Parameters:
  - `DEPLOY_HOST`, `DEPLOY_USER`, `REPO_URL`, `REMOTE_WORKDIR`, `FRONTEND_PATH`.
  - `ANGIE_WEBROOT`, `ANGIE_SERVICE_NAME`, `ANGIE_TEST_URL`.
  - `DEPLOY_BACKEND`, `BACKEND_SERVICE_NAME`, `BACKEND_DIR`.

- Server prerequisites:
  - Node.js (`npm` or `pnpm`), `rsync`, `curl`, `systemctl`, `journalctl`.
  - Angie service configured and permissions for `sudo systemctl restart` and writing to `ANGIE_WEBROOT`.

### Utilities
- SSH Smoke Test: `devops/ssh-smoke-test.groovy` validates SSH connectivity and basics on the target server.

## Security & Secrets
- `.gitignore` blocks environment files, keys, and build artifacts.
- `.dockerignore` keeps secrets and bulky folders out of build contexts.
- Recommended:
  - Commit `frontend/.env.example` and `backend/.env.example` with placeholders.
  - Use CI secrets/credentials (e.g., Jenkins) for tokens and passwords.
  - Rotate any secrets previously committed.

## Development Without Docker
- Frontend:
  - `cd frontend && npm ci && npm run dev`
  - Ensure `VITE_API_BASE` points to your backend.
- Backend:
  - `cd backend && go mod download && go run .`
  - Set `ALLOW_ORIGIN` in `.env` appropriately.

## Troubleshooting
- Ports in use: adjust `docker-compose.*.yml` `ports` mappings.
- Service restart (prod): configure your process manager (e.g., `systemctl` for `angie`/nginx).
- Telegram alerts: set credential IDs for bot token and chat ID; disable via pipeline parameter if not needed.

## License
Proprietary. Do not redistribute without permission.