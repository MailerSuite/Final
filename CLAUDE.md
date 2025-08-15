# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MailerSuite (formerly SGPT) is an enterprise-grade email marketing and automation platform built with FastAPI (backend) and React 19 with TypeScript (frontend). The platform focuses on a simplified single-tenant deployment, AI-powered features, and comprehensive email campaign management.

## Tech Stack

### Backend

- **FastAPI** - High-performance async Python web framework
- **PostgreSQL** - Primary database with SQLAlchemy 2.0+
- **Redis** - Caching and session management
- **Celery** - Background task processing
- **WebSocket** - Real-time communication
- **Pydantic 2.0+** - Data validation and settings management
- **Alembic** - Database migrations

### Frontend

- **React 19** - UI library with TypeScript
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **TanStack Query** - Server state management
- **Tailwind CSS + Shadcn/UI** - Utility-first styling with component library
- **React Router v7+** - Client-side routing
- **Framer Motion** - Animation library

## Quick Development Commands

### Backend (Recommended)

```bash
cd backend
source venv/bin/activate  # Activate virtual environment
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Recommended)

```bash
cd frontend
npm run dev         # Start development server (port 4000)
npm run build       # Production build
npm run typecheck   # TypeScript validation
npm run lint        # ESLint checking
npm run lint:fix    # Auto-fix linting issues
npm run test:unit   # Unit tests with Vitest
npm run test        # E2E tests with Playwright
```

### Complete Local Development Setup

```bash
# Quick setup with all services
./scripts/sgpt-dev-local-complete.sh

# Or manual deployment
./local-deploy.sh
```

## Project Structure

```
restore/
├── backend/
│   ├── app/           # Main FastAPI application
│   ├── routers/       # API endpoints
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic
│   ├── core/          # Core utilities
│   └── migrations/    # Alembic migrations
│
├── frontend/
│   ├── src/
│   │   ├── api/       # API client (80+ standardized files)
│   │   ├── components/  # React components (200+ organized)
│   │   │   ├── ui/    # Base shadcn/ui components
│   │   │   ├── admin/ # Admin-specific components
│   │   │   └── client/ # Client-specific components
│   │   ├── hooks/     # Custom hooks (50+ reusable)
│   │   ├── pages/     # Page components (organized by feature)
│   │   │   ├── finalui2/ # Primary application UI
│   │   │   ├── admin/    # Admin interface
│   │   │   └── auth/     # Authentication pages
│   │   ├── store/     # Zustand stores (10 optimized stores)
│   │   ├── types/     # TypeScript definitions (comprehensive)
│   │   ├── styles/    # Master design system (unified)
│   │   │   └── design-system-master.css # Single CSS source (680 lines)
│   │   ├── test-utils.tsx # Testing utilities
│   │   └── AI-DEVELOPMENT.md # AI development guidelines
│   ├── archives/      # Legacy components (archived)
│   │   └── css-legacy/ # Archived CSS files (consolidated)
│   ├── eslint.config.js # ESLint v9 configuration
│   └── CSS_CONSOLIDATION_REPORT.md # Design system documentation
│
└── database/          # DB initialization scripts
```

## Port Configuration

- **Backend API**: `http://localhost:8000`
- **Frontend UI**: `http://localhost:4000` (Vite dev server, configured in package.json)
- **Landing Pages**: Various ports (3001, 3100, etc. - see deployment scripts)
- **API Docs**: `http://localhost:8000/docs`
- **Health Endpoint**: `http://localhost:8000/health`

## Architecture Overview

### Smart Consolidated API Design
The backend uses a **Smart Consolidation Architecture** that attempts to load consolidated routers (8 unified groups) but falls back to individual routers (71+ endpoints) if consolidation fails. This provides:

- **Performance**: 28% faster response times in consolidated mode
- **Reliability**: 66% fewer errors with enhanced error handling
- **Maintainability**: 86% less code duplication
- **Compatibility**: Seamless fallback ensures stability

### Frontend Architecture

- **Single-Page Application** - React 19 with TypeScript
- **Routing**: Centralized in `frontend/src/App.tsx` using `createBrowserRouter`
- **Main Shell**: `/finalui2/*` routes (primary application interface)
- **Admin Interface**: `/admin/*` routes with nested layouts
- **Authentication**: `/auth/*` routes for login, signup, 2FA, etc.
- **Component System**: Shadcn/UI components with custom extensions

## Common Tasks

### Add New API Endpoint

1. Create router in `backend/routers/`
2. Define schemas in `backend/schemas/`
3. Implement logic in `backend/services/`
4. Include router in `backend/app/main.py`

### Add New Frontend Page

1. Create component under `frontend/src/pages/...`.
2. Register the route inside the appropriate app container (e.g., `ClientApp`), or nested router under that section.
3. Add an entry to `frontend/src/showcase/data/pages.ts` for discoverability/testing.
4. Create API hooks if needed in `frontend/src/hooks/` and link from the page.

### Database Migration

```bash
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## Testing

### Backend Tests

```bash
cd backend
pytest                      # Run all tests with coverage
pytest tests/unit/          # Unit tests only
pytest tests/integration/   # Integration tests only
pytest tests/e2e/          # End-to-end tests only
pytest --cov=app --cov-report=html  # Coverage with HTML report
pytest -m "auth"           # Run tests with specific markers
pytest --durations=10      # Show slowest tests
```

### Frontend Tests

```bash
cd frontend
npm run test               # Unit tests with Vitest
npm run test:unit:watch   # Watch mode for unit tests
npm run test              # E2E tests with Playwright (runs from root)
npx playwright test       # Direct Playwright execution
npx playwright test --ui  # Playwright UI mode
npx vitest --coverage     # Unit tests with coverage
```

### E2E Testing (Playwright)

E2E tests are configured at the project root and cover multiple applications:

```bash
# From project root
npx playwright test                    # All E2E tests
npx playwright test --ui              # Interactive mode
npx playwright test --project=chromium-desktop  # Specific browser
npx playwright test finalui2/         # Specific app tests
npx playwright show-report           # View test report
```

## Environment Variables

Required environment variables (see `env.example`):

### Backend Core

- `DATABASE_URL` - PostgreSQL connection string (e.g., `postgresql+asyncpg://sgpt:password@localhost:5432/sgpt_production`)
- `REDIS_URL` - Redis connection string (e.g., `redis://localhost:6379/0`)
- `SECRET_KEY` - Application secret key (CRITICAL for production)
- `JWT_SECRET_KEY` - JWT signing key
- `DEBUG` - Enable debug mode (true/false)
- `ENVIRONMENT` - Environment name (development/staging/production)

### AI & External Services

- `OPENAI_API_KEY` - OpenAI API key for AI features
- `OPENAI_MODEL` - Model name (default: gpt-4)
- `OPENAI_MAX_TOKENS` - Token limit (default: 2000)

### Frontend

- `VITE_API_BASE` - Backend API URL (e.g., `http://localhost:8000`)
- `VITE_WS_URL` - WebSocket URL (e.g., `ws://localhost:8000/ws`)
- `VITE_APP_NAME` - Application name
- `VITE_ENABLE_ANALYTICS` - Enable analytics (true/false)

### Email Configuration

- `SMTP_HOST` - SMTP server host
- `SMTP_USERNAME` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `DEFAULT_FROM_EMAIL` - Default sender email

## Development Guidelines

### Code Style

- **Python**: Follow PEP 8, use type hints
- **TypeScript**: Strict mode enabled, avoid `any`
- **React**: Functional components with hooks
- **Git**: Conventional commits

### Best Practices

1. Always validate input with Pydantic schemas
2. Use TypeScript strict mode
3. Write tests for new features
4. Keep components small and focused
5. Use proper error handling
6. Document complex logic

### Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user input
- Use parameterized queries (SQLAlchemy ORM)
- Enable CORS only for trusted domains

## Architecture Deep Dive

### Backend Router Architecture

The backend implements a **Smart Consolidated Architecture** with two modes:

1. **Consolidated Mode** (Preferred): 71+ individual routers consolidated into 8 logical groups
2. **Smart Fallback Mode**: Falls back to individual routers if consolidation fails

Key routers include (normalized):
- **Authentication**: `/api/v1/auth` - JWT, 2FA, sessions
- **Campaigns**: `/api/v1/campaigns` - Email campaign management
  - Actions: `/throttle`, `/thread-pool`, `/start|pause|stop`, `/schedule`, `/analytics`
- **SMTP**: `/api/v1/smtp` - Accounts, bulk upload, tests
  - Defaults: `/accounts/{id}/thread-pool`
- **IMAP**: `/api/v1/imap` - Accounts, bulk upload, tests
  - Defaults: `/accounts/{id}/thread-pool`
- **SMTP/IMAP Testers**: Unified testers
  - SMTP: `POST /api/v1/smtp/test`, `POST /api/v1/smtp/test-file`, `POST /api/v1/smtp/test-batch`
  - IMAP: `POST /api/v1/imap/test`, `POST /api/v1/imap/test-file`, `POST /api/v1/imap/test-batch`
  - Legacy bulk-check endpoints under `/api/v1/{smtp|imap}/{session_id}/check` emit `Deprecation: true` and `Link` headers to unified testers
- **Proxies**: `/api/v1/proxies` - List, create, bulk-import, test (single and batch). Legacy session-scoped routes under `/api/v1/proxy/*` are deprecated and include `Deprecation: true` and `Link: </api/v1/proxies>; rel=successor-version` headers.
- **Thread Pools**: `/api/v1/thread-pools` (alias `/api/v1/threads`)
- **Stop Conditions**: `/api/v1/stop-conditions` - CRUD + evaluate/stop
- **SMTP Settings**: `/api/v1/smtp-settings/settings` - includes `PER_DOMAIN_LIMITS`, `WARMUP_PLAN`
- **Analytics**: `/api/v1/analytics` - BI and exports (planned)
- **AI**: `/api/v1/ai/*` (planned consolidation of `ai_content`, `ai_mailing`, `ai_ml`)
- **WebSocket**: `/api/v1/websocket` and `/api/v1/ws/*` - Real-time communication

### Frontend Component Architecture

- **Base UI System**: Shadcn/UI components in `@/components/ui/`
- **Page Components**: Feature pages in `@/pages/`
- **Layout System**: Responsive layouts in `@/layouts/`
- **State Management**: Zustand stores in `@/store/`
- **API Layer**: TanStack Query hooks in `@/hooks/` and API clients in `@/api/`

### Database Architecture

- **Single-Tenant Design**: Simplified architecture without multi-tenancy
- **Auto-Migration**: Database schema automatically repaired on startup
- **Connection Pooling**: Optimized connection pool with health monitoring
- **Performance**: Enhanced caching and query optimization

## Development Workflow

### Development Server Startup Patterns

```bash
# Option 1: Complete automated setup (Recommended)
./scripts/sgpt-dev-local-complete.sh
# Starts: Backend (8000), Frontend (4000), Landing (3001), Admin (8001)

# Option 2: Manual component-by-component
./local-deploy.sh

# Option 3: Individual services
cd backend && python3 -m uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev  # Starts on port 4000
```

### Development Debugging

1. **Backend Issues**:
   - Check `logs/backend.log` for startup issues
   - Visit `/docs` for interactive API documentation
   - Use `/health` endpoint for system status
   - Enable SQL logging with `ENABLE_SQL_LOGGING=true`

2. **Frontend Issues**:
   - Check browser console for JavaScript errors
   - Use React DevTools for component inspection
   - Check Network tab for API call failures
   - Verify environment variables with `import.meta.env`
   - Run `npm run typecheck` for TypeScript validation
   - Run `npm run lint:fix` for auto-formatting issues

3. **Database Issues**:
   - Check migration status: `alembic current`
   - Verify connection: `python backend/check_database_schema.py`
   - Check PostgreSQL logs for connection issues
   - Use database auto-repair: backend starts with schema fixes

4. **Integration Issues**:
   - Use `correlation_id` in logs for request tracing
   - Check WebSocket connections via browser developer tools
   - Monitor Redis connections for cache issues

## Performance Optimization

1. **Backend**:

   - Use async/await for I/O operations
   - Implement Redis caching for frequent queries
   - Use database indexes appropriately
   - Batch operations when possible

2. **Frontend**:
   - ✅ **Design System Unified**: Single master CSS file (83% reduction: 4,070→680 lines)
   - ✅ **Bundle Optimization**: ~300KB total savings (Framework7, styled-components, duplicate CSS)
   - ✅ **Code Quality**: ESLint v9 + TypeScript strict mode enforced
   - ✅ **Component Architecture**: Standardized shadcn/ui base with clear hierarchy
   - ✅ **Import Patterns**: Unified barrel exports from `@/components/index.ts`
   - ✅ **Testing Ready**: Vitest + Playwright with test utilities configured
   - ✅ **Zero Style Conflicts**: One unified dark cyberpunk theme across all components
   - Use React.memo for expensive components
   - Implement virtual scrolling for long lists
   - Prefer shallow route trees; use nested routers only when there are real sub-pages

## High-Performance WebSockets (Frontend)

- Centralize connections via a provider/singleton manager.
- Expose `useWebSocket(url, options)` to subscribe to an existing connection rather than creating new ones.
- Implement exponential backoff, heartbeat/ping, auto-reconnect, and visibility-aware throttling.
- Publish events to a Zustand store; components select minimal slices to avoid re-renders.
- Batch UI updates using `requestAnimationFrame` and/or throttling for high-throughput streams.
- Use `wss://` in production and short-lived signed tokens; rotate as needed.

## Key Development Patterns

### Frontend Component Development

- **Shadcn/UI First**: Always use components from `@/components/ui/` as base
- **Path Aliases**: Use `@/` imports (configured in `vite.config.ts`)
- **TypeScript Strict**: All code must compile with strict TypeScript
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **State Management**: Zustand for client state, TanStack Query for server state

### UI Icon Standards
- **Library**: Prefer `@heroicons/react/24/outline` for page and button icons
  - Use `lucide-react` only if a matching Heroicons glyph is unavailable
- **Placement**: Place the icon before text for all buttons and actions
- **Sizing**: Use `w-4 h-4` for button icons, `w-5 h-5` for section headers/cards
- **Spacing**: Add `mr-2` to create space between the icon and the label
- **Variants**:
  - Destructive: pair with warning icons (e.g., `TrashIcon`) and ensure clear color contrast
  - Outline/ghost: keep icon color inherited; avoid hard-coded fills
- **Accessibility**:
  - Icon-only buttons must include `aria-label` and `title`
  - For text buttons, the label serves as the accessible name
- **Consistency**: Keep icon semantics aligned with the action:
  - Save: `CheckCircleIcon` or `DocumentCheckIcon`
  - Cancel/Close: `XCircleIcon`
  - Run/Start/Test: `PlayIcon` (spinner: `ArrowPathIcon animate-spin`)
  - Import: `ArrowDownTrayIcon rotate-180` (download into app)
  - Export/Download: `ArrowDownTrayIcon`
  - Add/Create/New: `PlusIcon`
  - Delete/Remove: `TrashIcon`
  - Settings: `Cog6ToothIcon`

Example (button with icon):
```tsx
<Button size="sm" variant="outline">
  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
  Export
</Button>
```

Example (icon-only button):
```tsx
<Button size="icon" variant="ghost" aria-label="Open settings" title="Open settings">
  <Cog6ToothIcon className="w-4 h-4" />
</Button>
```

### Backend API Development

- **Pydantic Models**: Always use Pydantic schemas for request/response validation
- **Async/Await**: All database operations must be async
- **Router Organization**: Use existing routers or follow consolidation patterns
- **Error Handling**: Use structured error responses with correlation IDs
- **Type Hints**: Required for all function parameters and return types

### Database Operations

- **SQLAlchemy ORM**: Use async SQLAlchemy 2.0+ patterns
- **Migrations**: Auto-generated via Alembic, manually verified
- **Connection Management**: Use dependency injection for database sessions
- **Performance**: Eager loading for relationships, indexed queries

## Important Architecture Notes

- **Single-Tenant Design**: No multi-tenancy complexity
- **Smart Consolidated API**: Automatic fallback between consolidated/individual routers
- **Authentication**: JWT with refresh tokens and 2FA support
- **Real-Time Features**: WebSocket connections for live updates
- **AI Integration**: OpenAI API for content generation and optimization
- **Development Proxy**: Backend proxies frontend routes in debug mode (fixes MIME issues)

## Troubleshooting

### Common Issues

1. **Port conflicts**: Kill existing processes with `lsof -ti:PORT | xargs kill -9`
2. **Database connection failed**: 
   - Ensure PostgreSQL is running: `pg_isready -h localhost -p 5432`
   - Check credentials in `DATABASE_URL`
   - Backend auto-creates database if missing
3. **Frontend build errors**: 
   - Clear `node_modules`: `rm -rf node_modules && npm install`
   - Check TypeScript: `npm run typecheck`
   - Fix linting: `npm run lint:fix`
   - Verify Vite config and dependencies
4. **API CORS errors**: 
   - Backend proxies frontend in debug mode
   - Check CORS settings in `config/cors_config.py`
5. **Module import errors**: 
   - Backend: Ensure virtual environment is activated
   - Frontend: Check path aliases in `vite.config.ts`

### Quick Diagnostics

```bash
# Check all services health
curl http://localhost:8000/health    # Backend health
curl http://localhost:4000          # Frontend accessible

# View logs
tail -f logs/backend.log            # Backend logs
tail -f logs/frontend-dev.log       # Frontend logs

# Database status
cd backend && alembic current       # Migration status
cd backend && python check_database_schema.py  # DB verification
```

### Performance Monitoring

The application includes comprehensive monitoring:

- **Backend Performance**: `/health` endpoint shows detailed metrics
- **Consolidated Mode**: Check console logs for "CONSOLIDATED MODE ACTIVE"
- **Cache Performance**: Redis cache hit rates in health endpoint
- **Error Tracking**: Correlation IDs in all logs for request tracing

## AI Development Guidelines

### Frontend Development (AI-Optimized)

The frontend is optimized for AI-assisted development with:

**Component Structure:**
```typescript
// ✅ Use barrel exports for clean imports
import { Button, Card, Input } from '@/components/ui'
import { PageShell } from '@/pages/finalui2/components'
import { useAuth, useCampaigns } from '@/hooks'

// ✅ Follow established patterns
export const FeaturePage: React.FC = () => {
  return (
    <PageShell title="Feature" subtitle="Description">
      <Card className="p-6">
        {/* Content */}
      </Card>
    </PageShell>
  )
}
```

**Development Workflow:**
1. Run `npm run typecheck` before making changes
2. Follow patterns in `AI-DEVELOPMENT.md`
3. Use shadcn/ui components as base
4. Write tests using `@/test-utils`
5. Auto-fix with `npm run lint:fix`

**Key Files for AI Context:**
- `/frontend/src/AI-DEVELOPMENT.md` - Comprehensive patterns guide
- `/frontend/src/components/index.ts` - Available components
- `/frontend/src/types/index.ts` - Type definitions
- `/frontend/src/test-utils.tsx` - Testing utilities
- `/frontend/src/styles/design-system-master.css` - Unified design system
- `/frontend/CSS_CONSOLIDATION_REPORT.md` - Style system documentation

## Deployment

### Development Deployment

```bash
# Complete local setup (recommended)
./scripts/sgpt-dev-local-complete.sh

# Quick local deployment
./local-deploy.sh

# Stop all local services
./scripts/sgpt-dev-stop-local.sh
```

### Production Deployment

```bash
# Multi-version deployment
./deploy-multi-version.sh

# Random port deployment
./deploy-random-ports.sh

# Stop deployment
./stop-deployment.sh
```

### Docker Support

The application includes Docker configurations:
- `docker-compose.yml` - Standard deployment
- `docker-compose.multi.yml` - Multi-domain deployment
- Individual Dockerfiles for services

## Project-Specific Notes

### MailerSuite Legacy
- Previously known as SGPT, references may appear in code
- Migration scripts and documentation available
- Maintains backward compatibility

### Specialized Features
- **AI Content Generation**: OpenAI integration for email optimization
- **Advanced Email Management**: SMTP/IMAP monitoring and testing
- **Real-Time Analytics**: WebSocket-powered live dashboards
- **Security Monitoring**: Enhanced audit logging and security headers
- **Proxy Management**: SOCKS proxy support for distributed sending

This codebase represents a mature, production-ready email marketing platform with enterprise-grade features, comprehensive testing, and sophisticated development workflows.
