# AI Development Guidelines

Strict rules for AI assistants (Cursor, Copilot, Claude, Code Llama, etc.).

## Do

- Perform a discovery pass: read configs, entrypoints, and tests before editing
- Keep edits minimal; prefer surgical changes over rewrites
- Align backend/frontend contracts (URLs, ports, schemas) before changes
- Preserve indentation and formatting; avoid mass reformatting
- Add types and docstrings; use clear, meaningful names
- Write tests and run linters; ensure CI passes

## Don't

- Do not invent endpoints, env vars, or filenames
- Do not change ports (backend 8000, frontend 4000) without updating both sides
- Do not introduce new dependencies casually; justify every addition
- Do not commit secrets, tokens, or personal data
- Do not bypass error handling, logging, or security checks

## Review Checklist (AI‑assisted PRs)

- Public API unchanged or documented
- Backend/Frontend still start cleanly and health checks succeed
- Tests added/updated and pass locally
- Lint/format clean; no unrelated file churn
- Security implications considered

See also: `CONTRIBUTING.md` and `.github/pull_request_template.md`.