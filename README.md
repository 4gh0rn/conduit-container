# Conduit Container Deployment

## Table of Contents

- [Description](#description)
- [Quickstart](#quickstart)
- [Usage](#usage)
- [Logging and Debugging](#logging-and-debugging)
- [Security Notes](#security-notes)

## Description

This repository contains a containerized deployment of the **Conduit application** - a social blogging platform. The application consists of a Django REST API backend and an Angular frontend, containerized with Docker Compose.

- **Backend**: Django 3.2.25 LTS with Gunicorn WSGI server
- **Frontend**: Angular 17.2.1 with production build
- **Database**: SQLite with persistent volumes
- **Features**: Multi-stage builds, non-root containers, health checks

## Quickstart

1. **Clone and build**
   ```bash
   git clone <repository-url>
   cd conduit-container
   make build
   docker compose up -d
   ```

2. **Access the application**
   - Frontend: http://localhost:8282
   - Backend API: http://localhost:8000/api

## Usage

**Environment Configuration:**
```bash
cp .env.example .env
# Edit .env for your configuration
```

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

1. **Add GitHub Secrets** (Settings → Secrets → Actions):
   - `SSH_PRIVATE_KEY`: Your SSH private key
   - `REMOTE_HOST`: Server IP or domain
   - `REMOTE_USER`: SSH username
   - `REMOTE_PORT`: SSH port (optional, default 22)

2. **Add GitHub Variables** (Settings → Variables → Actions):
   - `DEPLOY_PATH`: Server path (default: `~/conduit-container`)
   - `BACKEND_PORT`: Backend port (default: 8000)
   - `FRONTEND_PORT`: Frontend port (default: 8282)
   - `FRONTEND_API_URL`: API URL (default: `http://localhost:8000/api`)

3. **Deploy**: Push to `main` or `master` branch, or trigger manually from Actions tab


## Security Notes

- Containers run as non-root users
- Change `SECRET_KEY` in production
- Set `DEBUG=False` in production
- Use specific `CORS_ALLOW_ORIGINS` (not `*`)

