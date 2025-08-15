# AI Development Guide

Guidelines for AI/codegen agents working in this repo.

## Code Navigation

- Prefer barrel exports from `@/components/ui` and `@/hooks`
- Co-locate feature code under `src/pages/*` and `src/api/*`
- Reuse existing stores (`src/store`) and types (`src/types`)

## Patterns

- Functional components with typed props
- TanStack Query for server state, Zustand for client state
- Centralize HTTP in `src/api/*`; do not call axios directly in components
- Use `cn()` and Tailwind; avoid new CSS files

## Commands

```bash
npm run dev        # Start dev server (port 4000)
npm run typecheck  # TS checks
npm run lint       # ESLint
npm run test:unit  # Vitest
npm run test       # Playwright
```

## Component Template

```tsx
import { cn } from "@/lib/utils";

type Props = { className?: string };

export function ComponentName({ className }: Props) {
  return <div className={cn("p-4", className)}>{/* content */}</div>;
}
```

## API Hook Template

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { featureApi } from "@/api/feature";

export function useFeature(id: string) {
  return useQuery({
    queryKey: ["feature", id],
    queryFn: () => featureApi.getById(id),
  });
}

export function useCreateFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: featureApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["features"] }),
  });
}
```

## Anti-patterns

- Relative deep imports (`../../../`)
- Ad-hoc CSS files or inline heavy styles
- Duplicated API logic scattered in components
- Any usage of `any` types without strong reason

## PR Expectations

- Small, focused edits; lint and typecheck pass
- Add tests for new logic when feasible
- Follow folder conventions and naming
