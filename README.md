# Conduit Container Deployment

This repository contains a containerized deployment of the **Conduit application** - a social blogging platform. The application consists of a Django REST API backend and an Angular frontend, containerized with Docker Compose.

- **Backend**: Django 3.2.25 LTS with Gunicorn WSGI server
- **Frontend**: Angular 17.2.1 with production build
- **Database**: SQLite with persistent volumes
- **Features**: Multi-stage builds, non-root containers, health checks

## Table of Contents

- [Quickstart](#quickstart)
- [Usage](#usage)
- [Logging and Debugging](#logging-and-debugging)
- [Deployment](#deployment)
- [Security Notes](#security-notes)

## Quickstart

**Prerequisites:**
- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Make (optional, for `make build` command)

1. **Clone the repository**
   ```bash
   git clone https://github.com/4gh0rn/conduit-container
   cd conduit-container
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   ```

   > [!NOTE]
   > You must update your `.env` file with secure values before deploying to production.

3. **Build and start**
   ```bash
   make build
   make up
   ```
   
   Or alternatively:
   ```bash
   docker compose -f compose.dev.yml build
   docker compose -f compose.dev.yml up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:8282
   - Backend API: http://localhost:8000/api

## Usage

**Basic Commands:**
```bash
# Build
make build

# Start/Stop
docker compose up -d
docker compose down

# View status
docker compose ps
```

**Change ports** in `.env`:
```bash
FRONTEND_PORT=3000
BACKEND_PORT=9000
```


## Logging and Debugging

**View logs:**
```bash
# Live logs
docker compose logs -f backend

# Save logs to file
docker logs conduit-backend > backend-logs.txt
```

**Debug mode:**
```bash
# Edit .env
DEBUG=True

# Restart and view logs
docker compose restart backend
docker compose logs -f backend
```

**Access container:**
```bash
docker compose exec backend /bin/bash
```

## Deployment

### SSH Deployment via GitHub Actions

This repository contains a deployment workflow at `.github/workflows/deployment.yaml` that:
- builds container images in GitHub Actions (not on the VM)
- pushes them to GHCR
- deploys to your VM via SSH
- starts the stack in detached mode using `docker compose`

 The deployment uses `compose.prod.yml` on the VM (image-based, no `build:`).

#### 1) GitHub Secrets
Add the following under **Settings → Secrets → Actions**:
- `SSH_PRIVATE_KEY`: SSH private key for the VM user
- `REMOTE_HOST`: VM IP or domain
- `REMOTE_USER`: SSH username
- `REMOTE_PORT`: optional (default: 22)
- `DJANGO_SECRET_KEY`: Django `SECRET_KEY` for production
- `GHCR_PAT`: optional, only needed if your GHCR images are private (PAT with `read:packages`)

#### 2) GitHub Variables
Add the following under **Settings → Variables → Actions**:
- `DEPLOY_PATH`: server path (default in workflow: `~/conduit-container`)
- `BACKEND_PORT`: default `8000`
- `FRONTEND_PORT`: default `8282`
- `BACKEND_DB_PATH`: default `/app/data/conduit.db`
- `BACKEND_LOG_LEVEL`: default `info`
- `FRONTEND_API_URL`: production API URL used at frontend build time (e.g. `http://<VM-IP>:8000/api`)
- `DEBUG`: `False` in production
- `ALLOWED_HOSTS`: required in production (comma-separated, e.g. `<VM-IP>,example.com`)
- `CORS_ALLOW_ORIGINS`: required in production (comma-separated origins, e.g. `http://<VM-IP>:8282`)

#### 3) Trigger a deployment
- Push to branch `main`, or run the workflow manually via the Actions tab.

#### 4) Verify on the VM
- Frontend: `http://<VM-IP>:8282`
- Backend API: `http://<VM-IP>:8000/api`
- Health endpoint (VM-local): `curl -f http://localhost:8000/api/health`

Useful commands on the VM:
```bash
cd "${DEPLOY_PATH}"
docker compose -f compose.prod.yml ps
docker compose -f compose.prod.yml logs -f
```


## Security Notes

- Containers run as non-root users
- Change `SECRET_KEY` in production
- Set `DEBUG=False` in production
- Use specific `CORS_ALLOW_ORIGINS` (not `*`)

