# Conduit Container Platform

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quickstart](#quickstart)
4. [Usage](#usage)
5. [Testing & Verification](#testing--verification)
6. [Security & Operations](#security--operations)
7. [Troubleshooting](#troubleshooting)

## Overview
This repository packages a minimal Conduit-like stack—Python/Flask backend plus a React/Vite frontend—into production-ready containers. The goal is to rehearse cloud deployment skills: image hardening, service networking, persistence, logging and smoke testing.

### What the Application Does
The Conduit Container application is a simple article/blog management system that allows users to:
- **View articles**: Browse a list of articles with titles, descriptions, and content
- **Create articles**: Add new articles with title, description, body text, and author
- **Delete articles**: Remove articles from the system
- **VSCode-like UI**: Experience a modern, editor-style interface with a dark theme, sidebar navigation, and tabbed article view

The application demonstrates a typical microservices architecture with a RESTful API backend (Flask/Gunicorn) and a single-page application frontend (React/Vite), all containerized and orchestrated with Docker Compose.

## Architecture
- **Backend (`backend/`)**: Flask API served via Gunicorn (true WSGI) with SQLite persistence under `/app/data`.
- **Frontend (`frontend/`)**: React SPA built with Vite and served via a production Node.js server with API proxy.
- **Orchestration**: `docker-compose.yaml` wires the services, sets well-known ports (`8000` API, `8282` UI), and persists the database via the `backend-data` volume.

## Quickstart
1. **Prerequisites**
   - Docker Engine ≥ 24
   - Docker Compose plugin ≥ 2.20
2. **Bootstrap environment**
   ```bash
   cp env.example .env
   docker compose build
   docker compose up -d
   ```
3. **Verify**
   - Frontend: `http://localhost:8282`
   - Backend health: `curl http://localhost:8000/api/health`

## Usage
### Configuration
All configuration is done via environment variables in the `.env` file. Key variables:

- **Backend**:
  - `BACKEND_PORT`: Port for the backend service (default: `8000`)
  - `BACKEND_DB_PATH`: Path to SQLite database file (default: `/app/data/conduit.db`)

- **Frontend**:
  - `FRONTEND_PORT`: External port exposed on the host (default: `8282`)
  - `FRONTEND_PORT_INTERNAL`: Internal port in the container (default: `4173`)
  - `FRONTEND_API_URL`: Backend API URL for the frontend (default: `http://backend:8000/api`)

To modify these values, edit the `.env` file and rebuild/restart the containers:
```bash
docker compose down
docker compose up -d --build
```

### Development workflow
- **Backend**: iterate locally with `docker compose up backend` and hot reload via `flask --app app.py run` if needed.
- **Frontend**: `npm install` inside `frontend/` and run `npm run dev` (served on `5173` by default).

### Deployment
1. Build and tag images:
   ```bash
   docker compose build
   docker tag conduit-container-backend your-registry/conduit-backend:latest
   docker tag conduit-container-frontend your-registry/conduit-frontend:latest
   ```
2. Push to the registry of your choice and deploy on your VM.
3. In production, map the frontend service to port `8282` per checklist requirements.

### Data persistence
- SQLite lives under the named volume `backend-data`. To back it up:
  ```bash
  docker run --rm -v conduit-container_backend-data:/data alpine tar -czf - /data > backup.tgz
  ```

## Testing & Verification
- **Smoke tests**
  - UI available on the VM’s public IP + `:8282`.
  - API responds via `curl http://<vm-ip>:8000/api/articles`.
  - Articles created in the UI persist across container restarts thanks to the volume.
- **Resiliency**
  ```bash
  docker compose restart backend
  docker compose ps
  ```
  Containers use `restart: unless-stopped`, ensuring automatic recovery.
- **Logs**
  ```bash
  docker logs conduit-backend > backend.log
  docker logs conduit-frontend > frontend.log
  ```

## Security & Operations
- Multi-stage builds strip tooling from runtime images and drop privileges to `appuser`.
- Sensitive values stay outside the repo—inject them via `.env` or your orchestrator’s secret store.
- All environment variables, build args and shell snippets follow `${VAR}` notation.
- Default CORS allows all origins for local testing; scope it via `CORS_ALLOW_ORIGINS` in production.

## Troubleshooting
- **Port already in use**: adjust `BACKEND_PORT` / `FRONTEND_PORT` in `.env`.
- **Frontend can't reach API**: ensure `FRONTEND_API_URL` matches the backend hostname accessible from the frontend container (use `http://backend:8000/api` within Compose).
- **Permission errors on the database**: wipe the volume via `docker volume rm conduit-container_backend-data` and redeploy.

