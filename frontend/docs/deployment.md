# Frontend Deployment Guide (Vite + React)

Fast steps to run the frontend in development and deploy a production build.

## Prerequisites

- Node.js 18+ and npm
- Port 4000 available for the frontend (configurable in `vite.config.ts`)
- Optional backend at `http://localhost:8000` (proxy set in `vite.config.ts`)

## Development (recommended)

```bash
cd frontend
npm ci
npm run dev
# Health check (dev mock shown if backend is offline)
curl -sfS http://localhost:4000/health || curl -s http://localhost:4000 | head -n 3
# Open in browser
xdg-open http://localhost:4000 || echo "Open http://localhost:4000"
```

Notes:

- Dev server runs on port 4000 with strict port checking and a proxy to the backend on 8000.
- Health endpoints are mocked in dev when the backend is down to reduce console noise.

## Production build

```bash
cd frontend
npm ci
npm run build
# Built assets in dist/
```

### Quick local preview (not for production)

```bash
npm run preview -- --port 4000 --strictPort
```

## Serve with Nginx (recommended for production)

1. Copy `dist/` to your server (e.g., `/var/www/clean-mailersuite-frontend/dist`).
2. Example Nginx server block:

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/clean-mailersuite-frontend/dist;
    index index.html;

    # Single Page App routing
    location / {
        try_files $uri /index.html;
    }

    # Proxy API to backend (FastAPI) on port 8000
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Reload Nginx: `sudo systemctl reload nginx`.

## Docker (optional quick serve)

```bash
# Build static assets
npm ci && npm run build
# Serve dist/ via a tiny nginx container on port 8080

docker run --rm -p 8080:80 -v "$PWD/dist":/usr/share/nginx/html:ro nginx:alpine
```

## Troubleshooting

- Port in use: `sudo lsof -i :4000` then kill the process.
- Node version mismatch: `node -v` (use >= 18). Consider `nvm` to manage versions.
- Stale vite cache: remove `node_modules/.vite` and restart dev server.
- Clean install: `rm -rf node_modules package-lock.json && npm ci`.
- Backend not reachable: confirm backend on `http://localhost:8000` or adjust proxy in `vite.config.ts`.

## Notes

- Dev server is configured in `package.json` (port 4000). Adjust in `vite.config.ts > server.port` if needed.
- Environment variables must be prefixed with `VITE_` to be exposed to the client.
