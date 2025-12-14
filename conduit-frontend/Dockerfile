# Multi-stage build for Angular Frontend
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Use build-time argument for API URL
ARG FRONTEND_API_URL=http://localhost:8000/api

# Generate environment.prod.ts with the provided API URL
RUN mkdir -p src/environments && \
    echo "export const environment = { production: true, apiUrl: '${FRONTEND_API_URL}' };" > src/environments/environment.prod.ts

# Build the application
RUN npm run build -- --configuration production

# Stage 2: Production with simple HTTP server
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S conduit && \
    adduser -S conduit -u 1001 -G conduit

# Install http-server and wget for healthcheck
RUN npm install -g http-server && \
    apk add --no-cache wget

# Copy built application from builder stage
COPY --from=builder --chown=conduit:conduit /app/dist/angular-conduit /app/dist

# Copy entrypoint script
COPY --chown=conduit:conduit entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create directory for static files
RUN mkdir -p /app/dist && \
    chown -R conduit:conduit /app/dist

# Switch to non-root user
USER conduit

# Expose port (Angular preview server uses 4173)
EXPOSE 4173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4173/ || exit 1

# Use entrypoint script for runtime configuration
WORKDIR /app
ENTRYPOINT ["/app/entrypoint.sh"]
