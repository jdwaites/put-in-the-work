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

# Copy your actual application source code
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public
COPY frontend/tsconfig.json ./frontend/

# Build the React app
RUN cd frontend && npm run build

# Production stage
FROM nginx:alpine

# Install curl for health checks (required by Cloud Run)
RUN apk add --no-cache curl

# Copy built frontend to nginx
COPY --from=builder /app/frontend/build /usr/share/nginx/html

# Copy nginx configuration
COPY deployment/nginx.conf /etc/nginx/nginx.conf

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Add metadata labels for Cloud Run
LABEL \
    org.opencontainers.image.title="Putting in the Work" \
    org.opencontainers.image.description="Comprehensive fitness tracking application for families" \
    org.opencontainers.image.vendor="jdwaites" \
    org.opencontainers.image.source="https://github.com/jdwaites/put-in-the-work"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]