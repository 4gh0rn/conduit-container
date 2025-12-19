#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-${HOME}/conduit-container}"
COMPOSE_FILE="${COMPOSE_FILE:-${DEPLOY_PATH}/compose.prod.yml}"

mkdir -p "${DEPLOY_PATH}"
cd "${DEPLOY_PATH}"

# Optional: login to GHCR if your images are private (requires secrets.GHCR_PAT)
if [ -n "${GHCR_PAT:-}" ]; then
  echo "${GHCR_PAT}" | docker login ghcr.io -u "${GHCR_USERNAME:-}" --password-stdin
fi

# Fail-fast on required production config (backend enforces these)
: "${SECRET_KEY:?Missing secrets.DJANGO_SECRET_KEY}"
: "${ALLOWED_HOSTS:?Missing vars.ALLOWED_HOSTS}"
: "${CORS_ALLOW_ORIGINS:?Missing vars.CORS_ALLOW_ORIGINS}"

# Export variables for Compose interpolation (no .env file needed)
export IMAGE_TAG="${IMAGE_TAG:-latest}"
export BACKEND_PORT="${BACKEND_PORT:-8000}"
export FRONTEND_PORT="${FRONTEND_PORT:-8282}"
export BACKEND_DB_PATH="${BACKEND_DB_PATH:-/app/data/conduit.db}"
export BACKEND_LOG_LEVEL="${BACKEND_LOG_LEVEL:-info}"
export DEBUG="${DEBUG:-False}"
export ALLOWED_HOSTS
export CORS_ALLOW_ORIGINS
export SECRET_KEY

COMPOSE="docker compose -f ${COMPOSE_FILE}"

echo "Pulling images (no build on VM)..."
$COMPOSE pull

echo "Starting containers (detached)..."
$COMPOSE up -d --remove-orphans

echo "Waiting briefly for health..."
sleep 10

echo "Container status:"
$COMPOSE ps

echo "Health check:"
curl -f "http://localhost:${BACKEND_PORT:-8000}/api/health"
