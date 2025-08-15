# Contributing

Thank you for considering contributing! Please follow these rules to keep the project stable and secure.

## Ground Rules

- Use feature branches and small, focused edits
- Keep changes minimal and avoid unrelated refactors
- Preserve existing indentation style and formatting; do not reformat unrelated files
- Maintain backward compatibility for public APIs
- Write tests for new behavior; keep coverage >= 80%

## Backend (Python)

- Python 3.11+
- Run: `pip install -r backend/requirements.txt -r backend/requirements-dev.txt`
- Lint/format: `flake8 app/` and `black app/`
- Run tests: `pytest` (Postgres and Redis required)

## Frontend (React + Vite)

- Node 18+/20+
- Install: `npm ci` in `frontend/`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Tests: `npm run test:unit` and `npm test`

## AI Assistant Contributor Policy (Cursor, Copilot, Claude, etc.)

These rules are mandatory when using AI tools:

1. Discovery before edits
   - Read relevant files (entrypoints, configs, tests) before changing anything
   - Identify ports, env vars, and shared contracts; do not invent endpoints
2. Stability first
   - Do not change default ports or env names without aligning backend and frontend
   - Avoid speculative file creation; prefer editing existing code
   - Keep dependency changes to the minimum needed; avoid bulk upgrades
3. Security and privacy
   - Never hardcode secrets or tokens; use environment variables
   - Do not paste unvetted code from the internet
4. Code quality
   - Preserve indentation characters and widths; avoid mixing tabs/spaces
   - Match project style; prefer explicit, readable code
   - Add types (TS) and type hints (Python) where missing
5. Testing and validation
   - Run unit tests locally; add tests for new behavior
   - Manually sanity‑check critical flows after changes (auth, health, bootstrap)
6. Documentation
   - Update README/Docs for any user‑visible change
   - Summarize rationale and impact in PR description
7. Limits
   - Do not modify CI, licensing, or security policies without approval
   - Large edits (>500 LOC) require prior discussion

Violations may lead to the PR being closed. All AI‑assisted changes must be reviewed by a human maintainer.