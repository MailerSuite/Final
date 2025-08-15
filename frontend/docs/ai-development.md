# Frontend AI Development Guide

- Use strict TypeScript; keep `tsconfig.*.json` in sync
- Do not change Vite dev port (4000) without updating backend proxy
- Keep API base under `/api` (proxied to backend)
- Prefer TanStack Query for server state; avoid ad‑hoc fetches
- Add unit tests (Vitest) for components/hooks; keep coverage high
- Run `npm run typecheck`, `npm run lint`, and `npm run test:unit` before committing

For project‑wide rules, see `../../docs/AI_DEV_GUIDELINES.md`.