# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first (safe glob for lockfile)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Configure Vite env for build
ARG VITE_API_BASE=/api/v1
ARG VITE_WS_URL=/api/v1/ws
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_WS_URL=$VITE_WS_URL

# Build static assets
RUN npm run build

# --- Runtime stage ---
FROM nginx:alpine AS runtime

# Nginx configuration for SPA + API proxy to backend service name
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]