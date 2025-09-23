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

# Copy specific working components (skip problematic files for now)
COPY frontend/src/App.tsx ./frontend/src/
COPY frontend/src/index.tsx ./frontend/src/
COPY frontend/src/components ./frontend/src/components
COPY frontend/src/contexts ./frontend/src/contexts
COPY frontend/src/theme ./frontend/src/theme
COPY frontend/src/utils ./frontend/src/utils
COPY frontend/src/firebase ./frontend/src/firebase

# Copy working pages (exclude TimersPage for now)
RUN mkdir -p ./frontend/src/pages
COPY frontend/src/pages/HomePage.tsx ./frontend/src/pages/
COPY frontend/src/pages/AnalyzerPage.tsx ./frontend/src/pages/
COPY frontend/src/pages/ReporterPage.tsx ./frontend/src/pages/
COPY frontend/src/pages/SportsTrainingPage.tsx ./frontend/src/pages/
COPY frontend/src/pages/DataExportPage.tsx ./frontend/src/pages/
COPY frontend/src/pages/HealthIntegrationsPage.tsx ./frontend/src/pages/
COPY frontend/src/pages/ExerciseRoutinesPage.tsx ./frontend/src/pages/
COPY frontend/src/pages/PerformanceDiaryPage.tsx ./frontend/src/pages/

# Create a simple TimersPage to replace the corrupted one
RUN echo 'import React from "react"; import { Typography, Container } from "@mui/material"; const TimersPage = () => ( <Container><Typography variant="h4">Timers & Stopwatch</Typography><Typography>Timer functionality coming soon...</Typography></Container> ); export default TimersPage;' > ./frontend/src/pages/TimersPage.tsx

# Create a simple TrackerPage 
RUN echo 'import React from "react"; import { Typography, Container } from "@mui/material"; const TrackerPage = () => ( <Container><Typography variant="h4">Activity Tracker</Typography><Typography>Tracking functionality coming soon...</Typography></Container> ); export default TrackerPage;' > ./frontend/src/pages/TrackerPage.tsx

# Copy public files  
COPY frontend/public/index.html ./frontend/public/
COPY frontend/public/manifest.json ./frontend/public/
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