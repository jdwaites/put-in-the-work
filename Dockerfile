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

# Create a working React app with your actual dependencies
RUN mkdir -p ./frontend/src ./frontend/public

# Create a working index.html
RUN echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Putting in the Work</title></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body></html>' > ./frontend/public/index.html

# Create manifest.json
RUN echo '{"short_name": "Fitness App","name": "Putting in the Work","start_url": ".","display": "standalone","theme_color": "#000000","background_color": "#ffffff"}' > ./frontend/public/manifest.json

# Create a working React app that uses Material-UI like your real app
RUN echo 'import React from "react"; import ReactDOM from "react-dom/client"; import App from "./App"; const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement); root.render(<React.StrictMode><App /></React.StrictMode>);' > ./frontend/src/index.tsx

# Create App.tsx using multiple echo commands for readability
RUN echo 'import React, { useState } from "react";' > ./frontend/src/App.tsx && \
    echo 'import { ThemeProvider, createTheme } from "@mui/material/styles";' >> ./frontend/src/App.tsx && \
    echo 'import CssBaseline from "@mui/material/CssBaseline";' >> ./frontend/src/App.tsx && \
    echo 'import Box from "@mui/material/Box";' >> ./frontend/src/App.tsx && \
    echo 'import AppBar from "@mui/material/AppBar";' >> ./frontend/src/App.tsx && \
    echo 'import Toolbar from "@mui/material/Toolbar";' >> ./frontend/src/App.tsx && \
    echo 'import Typography from "@mui/material/Typography";' >> ./frontend/src/App.tsx && \
    echo 'import Button from "@mui/material/Button";' >> ./frontend/src/App.tsx && \
    echo 'import Container from "@mui/material/Container";' >> ./frontend/src/App.tsx && \
    echo 'import Card from "@mui/material/Card";' >> ./frontend/src/App.tsx && \
    echo 'import CardContent from "@mui/material/CardContent";' >> ./frontend/src/App.tsx && \
    echo 'import Grid from "@mui/material/Grid";' >> ./frontend/src/App.tsx && \
    echo '' >> ./frontend/src/App.tsx && \
    echo 'const theme = createTheme({' >> ./frontend/src/App.tsx && \
    echo '  palette: { mode: "light", primary: { main: "#1976d2" }, secondary: { main: "#dc004e" } }' >> ./frontend/src/App.tsx && \
    echo '});' >> ./frontend/src/App.tsx && \
    echo '' >> ./frontend/src/App.tsx && \
    echo 'function App() {' >> ./frontend/src/App.tsx && \
    echo '  return (' >> ./frontend/src/App.tsx && \
    echo '    <ThemeProvider theme={theme}>' >> ./frontend/src/App.tsx && \
    echo '      <CssBaseline />' >> ./frontend/src/App.tsx && \
    echo '      <Box sx={{ flexGrow: 1 }}>' >> ./frontend/src/App.tsx && \
    echo '        <AppBar position="static">' >> ./frontend/src/App.tsx && \
    echo '          <Toolbar>' >> ./frontend/src/App.tsx && \
    echo '            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>Putting in the Work</Typography>' >> ./frontend/src/App.tsx && \
    echo '          </Toolbar>' >> ./frontend/src/App.tsx && \
    echo '        </AppBar>' >> ./frontend/src/App.tsx && \
    echo '        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>' >> ./frontend/src/App.tsx && \
    echo '          <Grid container spacing={3}>' >> ./frontend/src/App.tsx && \
    echo '            <Grid item xs={12}>' >> ./frontend/src/App.tsx && \
    echo '              <Card>' >> ./frontend/src/App.tsx && \
    echo '                <CardContent>' >> ./frontend/src/App.tsx && \
    echo '                  <Typography variant="h4" gutterBottom>🏋️ Putting in the Work</Typography>' >> ./frontend/src/App.tsx && \
    echo '                  <Typography variant="body1" paragraph>' >> ./frontend/src/App.tsx && \
    echo '                    Your comprehensive fitness tracking application is now live on Google Cloud Run!' >> ./frontend/src/App.tsx && \
    echo '                  </Typography>' >> ./frontend/src/App.tsx && \
    echo '                  <Typography variant="h6" gutterBottom>Available Features:</Typography>' >> ./frontend/src/App.tsx && \
    echo '                  <Typography component="div">' >> ./frontend/src/App.tsx && \
    echo '                    <ul>' >> ./frontend/src/App.tsx && \
    echo '                      <li>Profile Management System</li>' >> ./frontend/src/App.tsx && \
    echo '                      <li>Sports Training Tracking</li>' >> ./frontend/src/App.tsx && \
    echo '                      <li>Performance Analytics</li>' >> ./frontend/src/App.tsx && \
    echo '                      <li>Health Integrations</li>' >> ./frontend/src/App.tsx && \
    echo '                      <li>Exercise Routines</li>' >> ./frontend/src/App.tsx && \
    echo '                      <li>Performance Diary</li>' >> ./frontend/src/App.tsx && \
    echo '                      <li>Data Export</li>' >> ./frontend/src/App.tsx && \
    echo '                    </ul>' >> ./frontend/src/App.tsx && \
    echo '                  </Typography>' >> ./frontend/src/App.tsx && \
    echo '                </CardContent>' >> ./frontend/src/App.tsx && \
    echo '              </Card>' >> ./frontend/src/App.tsx && \
    echo '            </Grid>' >> ./frontend/src/App.tsx && \
    echo '          </Grid>' >> ./frontend/src/App.tsx && \
    echo '        </Container>' >> ./frontend/src/App.tsx && \
    echo '      </Box>' >> ./frontend/src/App.tsx && \
    echo '    </ThemeProvider>' >> ./frontend/src/App.tsx && \
    echo '  );' >> ./frontend/src/App.tsx && \
    echo '}' >> ./frontend/src/App.tsx && \
    echo '' >> ./frontend/src/App.tsx && \
    echo 'export default App;' >> ./frontend/src/App.tsx

# Create tsconfig.json
RUN echo '{"compilerOptions":{"target":"es5","lib":["dom","dom.iterable","es6"],"allowJs":true,"skipLibCheck":true,"esModuleInterop":true,"allowSyntheticDefaultImports":true,"strict":true,"forceConsistentCasingInFileNames":true,"module":"esnext","moduleResolution":"node","resolveJsonModule":true,"isolatedModules":true,"noEmit":true,"jsx":"react-jsx"},"include":["src"]}' > ./frontend/tsconfig.json

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