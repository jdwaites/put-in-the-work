# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy root package.json and install root dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy frontend package.json and install dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Copy frontend source and build
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Production stage
FROM nginx:alpine

# Install curl for health checks (required by Cloud Run)
RUN apk add --no-cache curl

# Copy built frontend to nginx
COPY --from=builder /app/frontend/build /usr/share/nginx/html

# Copy nginx configuration
COPY deployment/nginx.conf /etc/nginx/nginx.conf

# Create nginx user and set permissions
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Switch to non-root user for security
USER nginx

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Add metadata labels for Cloud Run
LABEL \
    org.opencontainers.image.title="Putting in the Work" \
    org.opencontainers.image.description="Comprehensive fitness tracking application for families" \
    org.opencontainers.image.vendor="jdwaites" \
    org.opencontainers.image.source="https://github.com/jdwaites/put-in-the-work"

# Start nginx (removed daemon off for Cloud Run compatibility)
CMD ["nginx", "-g", "daemon off;"]