# MailerSuite2 Frontend

Modern React + TypeScript + Vite frontend for the MailerSuite2 platform.

**✅ PRODUCTION READY** - Fully deployed and operational

## 🚀 Current Status

- **Frontend**: Running on port 4000 with Vite dev server
- **Backend Integration**: Connected to FastAPI backend on port 8000
- **API Endpoints**: 71+ consolidated endpoints across 8 logical groups
- **Authentication**: JWT-based with role-based access control
- **Database**: 11 tables with complete schema and admin user
- **Build System**: Vite 7 with HMR and fast refresh
- **Testing**: Comprehensive test suite with Vitest and Playwright

### Features

- **Real-time Dashboards** - Live campaign metrics and analytics
- **Advanced UI Components** - Professional design system with shadcn/ui
- **Type-safe Development** - Full TypeScript integration
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **State Management** - Efficient state handling with Zustand
- **API Integration** - Typed API clients with TanStack Query
- **AI-powered Tools** - Content generation and optimization
- **Campaign Management** - Comprehensive email campaign tools
- **SMTP/IMAP Checkers** - Email server validation tools
- **Proxy Management** - Advanced proxy configuration and testing

### Tech Stack

- **Framework**: React 19 with TypeScript 5
- **Build Tool**: Vite 7 for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state, Zustand for client state
- **Routing**: React Router v6 with lazy loading
- **UI Components**: Modern, accessible component library
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Linting**: ESLint with strict rules
- **Formatting**: Prettier for consistent code style

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Modern web browser

### Installation

```bash
cd frontend
npm ci
npm run dev
# Verify
curl -sfS http://localhost:4000/health || curl -s http://localhost:4000 | head -n 3
```

### Development Server

- **Dev server**: http://localhost:4000
- **API proxy**: http://localhost:8000 (FastAPI backend)
- **HMR**: Hot Module Replacement enabled
- **Fast Refresh**: React Fast Refresh for instant updates

## 🏗️ Build & Preview

### Development Build

```bash
npm run dev
# Starts development server with hot reload
```

### Production Build

```bash
npm run build
# Creates optimized production build in dist/ folder
```

### Preview Production Build

```bash
npm run preview -- --port 4000 --strictPort
# Serves dist/ folder for local preview
```

### Build Analysis

```bash
npm run build:analyze
# Analyzes bundle size and dependencies
```

## 📚 Documentation

- **Design Rules**: `frontend/docs/design-rules.md`
- **AI Development**: `frontend/docs/ai-development.md`
- **Deployment Guide**: `frontend/docs/deployment.md`
- **Architecture**: `frontend/docs/architecture.md`
- **Component Library**: `frontend/docs/components.md`
- **API Integration**: `frontend/docs/api-integration.md`

## 📁 Project Structure

```
frontend/
├─ src/
│  ├─ api/             # HTTP clients and endpoints
│  │   ├─ admin/       # Admin API endpoints
│  │   ├─ auth/        # Authentication endpoints
│  │   ├─ campaigns/   # Campaign management
│  │   ├─ ai/          # AI-powered features
│  │   └─ consolidated/# Unified API clients
│  ├─ components/      # UI and feature components
│  │   ├─ ui/          # Base UI components (shadcn/ui)
│  │   ├─ admin/       # Admin-specific components
│  │   ├─ campaigns/   # Campaign management components
│  │   ├─ analytics/   # Analytics and reporting
│  │   └─ common/      # Shared components
│  ├─ hooks/           # Custom React hooks
│  │   ├─ api/         # API-related hooks
│  │   ├─ auth/        # Authentication hooks
│  │   ├─ forms/       # Form handling hooks
│  │   └─ ui/          # UI interaction hooks
│  ├─ pages/           # Route-level pages
│  │   ├─ admin/       # Admin pages
│  │   ├─ campaigns/   # Campaign pages
│  │   ├─ auth/        # Authentication pages
│  │   └─ dashboard/   # Dashboard pages
│  ├─ store/           # Zustand stores
│  │   ├─ auth.ts      # Authentication state
│  │   ├─ campaigns.ts # Campaign state
│  │   ├─ ui.ts        # UI state
│  │   └─ settings.ts  # User settings
│  ├─ types/           # Shared TypeScript types
│  │   ├─ api.ts       # API response types
│  │   ├─ auth.ts      # Authentication types
│  │   ├─ campaigns.ts # Campaign types
│  │   └─ ui.ts        # UI component types
│  ├─ lib/             # Utilities and config
│  │   ├─ utils.ts     # Utility functions
│  │   ├─ constants.ts # Application constants
│  │   ├─ validators.ts# Form validation
│  │   └─ helpers.ts   # Helper functions
│  ├─ styles/          # Global styles and themes
│  ├─ assets/          # Static assets
│  └─ index.css        # Tailwind + design system entry
├─ public/             # Static assets
├─ docs/               # Current documentation
├─ tests/              # Test files
├─ .eslintrc.js        # ESLint configuration
├─ tailwind.config.ts  # Tailwind CSS configuration
├─ vite.config.ts      # Vite build configuration
├─ tsconfig.json       # TypeScript configuration
└─ package.json        # Dependencies and scripts
```

## 🛠️ Scripts

### Development

```bash
npm run dev           # Start dev server (port 4000)
npm run dev:https     # Start dev server with HTTPS
npm run dev:host      # Start dev server accessible from network
```

### Building

```bash
npm run build         # Build production assets
npm run build:dev     # Build development assets
npm run build:analyze # Build with bundle analysis
npm run preview       # Serve dist/ for local preview
```

### Code Quality

```bash
npm run typecheck     # TypeScript check
npm run lint          # ESLint
npm run lint:fix      # ESLint with --fix
npm run format        # Prettier formatting
npm run format:check  # Check Prettier formatting
```

### Testing

```bash
npm run test:unit     # Vitest unit tests
npm run test:unit:ui  # Vitest with UI
npm run test:unit:coverage # Vitest with coverage
npm run test          # Playwright E2E tests
npm run test:ui       # Playwright with UI
npm run test:debug    # Playwright in debug mode
```

### Utilities

```bash
npm run clean         # Clean build artifacts
npm run validate      # Validate package.json
npm run update        # Update dependencies
npm run security      # Security audit
```

## ⚙️ Environment Configuration

### Environment Variables

Client-exposed variables must be prefixed with `VITE_`:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3

# Application
VITE_APP_NAME=MailerSuite2
VITE_APP_VERSION=2.1.0
VITE_APP_ENVIRONMENT=development

# Features
VITE_AI_ENABLED=true
VITE_ANALYTICS_ENABLED=true
VITE_DEBUG_MODE=true

# External Services
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
```

### Configuration Files

- **Vite Config**: `vite.config.ts` - Build and dev server configuration
- **Tailwind Config**: `tailwind.config.ts` - CSS framework configuration
- **TypeScript Config**: `tsconfig.json` - TypeScript compiler options
- **ESLint Config**: `.eslintrc.js` - Code quality rules
- **Prettier Config**: `.prettierrc` - Code formatting rules

## 🎨 Design System

### Component Library

- **shadcn/ui**: Modern, accessible UI components
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Components**: MailerSuite2-specific components

### Design Principles

- **Accessibility First**: WCAG 2.1 AA compliance
- **Responsive Design**: Mobile-first approach
- **Consistent Spacing**: 4px base unit system
- **Color System**: Semantic color palette
- **Typography**: Clear hierarchy and readability
- **Animation**: Subtle, purposeful motion

### Theme System

- **Light Theme**: Default application theme
- **Dark Theme**: Dark mode support
- **Custom Themes**: User-configurable themes
- **CSS Variables**: Dynamic theme switching

## 🔌 API Integration

### HTTP Client

- **Axios**: HTTP client with interceptors
- **Request/Response**: Typed API communication
- **Error Handling**: Comprehensive error management
- **Retry Logic**: Automatic retry for failed requests
- **Caching**: Request caching with TanStack Query

### State Management

- **TanStack Query**: Server state management
- **Zustand**: Client state management
- **React Context**: Theme and authentication context
- **Local Storage**: Persistent user preferences

### API Endpoints

- **Authentication**: Login, logout, refresh tokens
- **Campaigns**: CRUD operations for email campaigns
- **Analytics**: Performance metrics and reporting
- **AI Features**: Content generation and optimization
- **Admin**: User and system management
- **Settings**: User preferences and configuration

## 🧪 Testing Strategy

### Unit Testing

- **Framework**: Vitest for fast unit testing
- **Coverage**: Minimum 80% code coverage
- **Mocking**: MSW for API mocking
- **Assertions**: Jest-compatible assertions
- **Utilities**: Custom testing utilities

### Integration Testing

- **API Testing**: End-to-end API testing
- **Component Testing**: Component integration tests
- **State Testing**: State management testing
- **Routing Testing**: Navigation and routing tests

### E2E Testing

- **Framework**: Playwright for browser testing
- **Scenarios**: Critical user journeys
- **Cross-browser**: Chrome, Firefox, Safari support
- **Mobile Testing**: Responsive design validation
- **Performance**: Core Web Vitals testing

## 📱 Responsive Design

### Breakpoints

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px - 1440px
- **Large Desktop**: 1440px+

### Mobile-First Approach

- **Touch Targets**: Minimum 44px touch areas
- **Gesture Support**: Swipe and touch gestures
- **Performance**: Optimized for mobile devices
- **Offline Support**: Progressive Web App features

## 🚀 Performance Optimization

### Build Optimization

- **Code Splitting**: Route-based code splitting
- **Tree Shaking**: Unused code elimination
- **Minification**: CSS and JavaScript minification
- **Compression**: Gzip and Brotli compression
- **CDN Ready**: Optimized for CDN deployment

### Runtime Performance

- **Lazy Loading**: Component and route lazy loading
- **Memoization**: React.memo and useMemo optimization
- **Virtual Scrolling**: Large list virtualization
- **Image Optimization**: WebP and responsive images
- **Bundle Analysis**: Regular bundle size monitoring

## 🔒 Security Features

### Frontend Security

- **XSS Prevention**: Content Security Policy
- **CSRF Protection**: Token-based CSRF protection
- **Input Validation**: Client-side validation
- **Secure Headers**: Security header configuration
- **HTTPS Enforcement**: Secure communication

### Authentication

- **JWT Tokens**: Secure token storage
- **Token Refresh**: Automatic token renewal
- **Session Management**: Secure session handling
- **Logout**: Secure logout and cleanup
- **2FA Support**: Two-factor authentication

## 🚀 Deployment

### Production Build

```bash
npm run build
# Creates optimized production build
```

### Static Hosting

- **Netlify**: Easy deployment with Git integration
- **Vercel**: Fast deployment with edge functions
- **AWS S3**: Scalable static hosting
- **Nginx**: Custom server configuration

### Environment Configuration

- **Build-time**: Environment variables at build time
- **Runtime**: Dynamic configuration loading
- **Feature Flags**: Environment-based feature toggles
- **API Endpoints**: Environment-specific API URLs

## 🐛 Troubleshooting

### Common Issues

```bash
# Port conflicts
lsof -ti:4000 | xargs kill -9

# Dependency issues
rm -rf node_modules package-lock.json
npm install

# Build errors
npm run clean
npm run build

# Type errors
npm run typecheck
```

### Development Tips

- **Hot Reload**: Use Vite's HMR for fast development
- **TypeScript**: Enable strict mode for better type safety
- **ESLint**: Fix linting issues as you code
- **Testing**: Write tests alongside features
- **Performance**: Monitor bundle size and performance

## 🤝 Contributing

### Development Workflow

1. **Fork Repository**: Create your fork
2. **Feature Branch**: Create feature branch
3. **Development**: Implement features with tests
4. **Code Quality**: Ensure linting and type checking pass
5. **Testing**: Run all tests and ensure coverage
6. **Pull Request**: Submit PR with detailed description

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow linting rules
- **Prettier**: Consistent code formatting
- **Testing**: Maintain test coverage
- **Documentation**: Update relevant docs

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

- **Development**: http://localhost:4000
- **Documentation**: Check `frontend/docs/` folder
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions

---

_Last Updated: August 2025 | Version: 2.1.0 | Status: Production Ready_
