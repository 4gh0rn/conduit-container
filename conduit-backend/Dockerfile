# Multi-stage build for Django Backend
FROM python:3.9-slim AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.9-slim

# Create non-root user with home directory
RUN groupadd -r conduit && useradd -r -g conduit -m conduit

# Set working directory
WORKDIR /app

# Copy Python dependencies from builder to conduit's home
COPY --from=builder --chown=conduit:conduit /root/.local /home/conduit/.local

# Copy application code
COPY --chown=conduit:conduit . .

# Create data directory for database and staticfiles
RUN mkdir -p /app/data /app/staticfiles && chown -R conduit:conduit /app/data /app/staticfiles

# Make sure scripts are executable
RUN chmod +x docker-entrypoint.sh || true

# Set PATH to include user's local bin and PYTHONPATH for packages
ENV PATH=/home/conduit/.local/bin:$PATH
ENV PYTHONPATH=/home/conduit/.local/lib/python3.9/site-packages:$PYTHONPATH
ENV PYTHONUNBUFFERED=1

# Switch to non-root user
USER conduit

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
