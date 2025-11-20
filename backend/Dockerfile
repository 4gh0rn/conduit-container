# syntax=docker/dockerfile:1.7

FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip wheel --wheel-dir /wheels -r requirements.txt

FROM python:3.12-slim AS runner
ARG BACKEND_PORT=8000
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DB_PATH=/app/data/conduit.db \
    BACKEND_PORT=${BACKEND_PORT}

WORKDIR /app

COPY --from=builder /wheels /wheels
COPY requirements.txt .
RUN pip install --no-index --find-links=/wheels -r requirements.txt && rm -rf /wheels

COPY . .

RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/data && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE ${BACKEND_PORT}

ENTRYPOINT ["sh", "-c", "gunicorn --bind 0.0.0.0:${BACKEND_PORT} wsgi:app"]

