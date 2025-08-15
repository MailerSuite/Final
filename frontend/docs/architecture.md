# Architecture & Stack

## Overview

This frontend is a SPA built with React 19 and Vite. It consumes a FastAPI backend (default at http://localhost:8000) via REST and websockets.

## Layers

- UI: React components (shadcn/ui + Tailwind)
- State:
  - Server state: TanStack Query (caching, mutations)
  - Client state: Zustand (small, focused stores)
- API: `src/api/*` modules encapsulate HTTP calls
- Routing: React Router

## Data Flow

1. UI triggers action → calls hook (Query/Mutation)
2. Hook delegates to `src/api/*`
3. API client performs request; responses are typed
4. Query cache invalidated on mutation success

## Conventions

- Barrel exports for `@/components/ui` and `@/hooks`
- Co-locate feature pages with subcomponents when helpful
- Keep stores small and single-responsibility

## Build & Tooling

- Vite 7 builds with optimized code splitting
- ESLint v9 + TypeScript ESLint
- Vitest for unit; Playwright for E2E

## Environment

- Client-exposed env vars prefixed with `VITE_`
- Proxy to backend configured in `vite.config.ts`

## Performance

- Route-based code splitting
- Avoid large synchronous work in render
- Prefer CSS transforms for animations
