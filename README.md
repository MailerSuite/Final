# MailerSuite2 - Enterprise Email Marketing Platform

**Modern AI-Powered Email Marketing Solution with Production-Ready Infrastructure**

A comprehensive email marketing platform built with cutting-edge technology, featuring AI-powered content generation, advanced campaign management, enterprise-grade security, and scalable architecture.

## 🚀 Current Status

**🔄 UNDER DEVELOPMENT** - Core infrastructure established, development in progress
- **Backend**: FastAPI structure ready, needs environment configuration
- **Frontend**: React + Vite setup complete, routing issues resolved
- **Database**: PostgreSQL setup ready, needs environment configuration
- **Authentication**: JWT-based system ready for configuration
- **API**: Consolidated API structure implemented with stable client
- **Privacy**: Comprehensive .gitignore protecting development PC information
- **Deployment**: Environment templates and deployment scripts ready

## 🎯 Key Features

### Core Capabilities
- **AI-Powered Email Generation** - GPT-4 integration for intelligent content creation
- **Advanced Campaign Management** - Multi-threaded email campaigns with smart throttling
- **SMTP/IMAP Integration** - Support for multiple email providers and accounts
- **Real-time Analytics** - Comprehensive campaign performance tracking
- **Template Management** - Professional email templates with AI optimization
- **Lead Management** - Advanced lead scoring and segmentation
- **Proxy Management** - SOCKS5 proxy support for deliverability

### AI & Machine Learning
- **Smart Content Generation** - AI-powered subject lines and email content
- **Spam Detection** - Real-time AI spam scoring and prevention
- **Audience Targeting** - AI-driven audience segmentation and optimization
- **Performance Prediction** - Machine learning-based campaign success forecasting
- **Sentiment Analysis** - Email response sentiment tracking
- **A/B Testing** - Automated split testing with AI optimization

### Enterprise Features
- **Multi-tenant Architecture** - Scalable user management and isolation
- **Advanced Security** - Role-based access control, audit logging, and 2FA
- **API Integration** - RESTful API with comprehensive OpenAPI documentation
- **WebSocket Support** - Real-time updates and notifications
- **Database Tiers** - Shared, premium, and dedicated database options
- **Rate Limiting** - Plan-based API abuse prevention
- **Audit Logging** - Comprehensive activity tracking

## 🏗️ Architecture

### Backend Stack
- **Framework**: FastAPI 0.104+ (Python 3.11+)
- **Database**: PostgreSQL 15+ with async support via asyncpg
- **ORM**: SQLAlchemy 2.0 with async support
- **Authentication**: JWT-based with advanced security features
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **Migrations**: Alembic for database schema management
- **Task Queue**: Celery for background job processing
- **Cache**: Redis for session management and caching

### Frontend Stack
- **Framework**: React 19 with TypeScript 5
- **Build Tool**: Vite 7 for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state, Zustand for client state
- **Routing**: React Router v6 with lazy loading
- **UI Components**: Modern, accessible component library
- **Testing**: Vitest for unit tests, Playwright for E2E

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 6+
- Linux/macOS (Windows with WSL)

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd clean-mailersuite
```

### 2. Automated Setup (Recommended)
```bash
# Run the automated deployment setup script
./deploy-setup.sh

# This will create all necessary environment files and directories
```

### 3. Manual Backend Setup
```bash
# Install system dependencies
sudo apt-get update -y
sudo apt-get install -y python3-venv python3-pip postgresql postgresql-contrib redis-server

# Setup PostgreSQL
sudo systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE DATABASE mailersuite2_dev;"
sudo -u postgres psql -c "CREATE USER mailersuite WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mailersuite2_dev TO mailersuite;"

# Setup Redis
sudo systemctl enable --now redis-server

# Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Environment setup
cp backend/.env.example backend/.env.local
# Edit backend/.env.local with your database credentials

# Database migrations
cd backend
alembic upgrade head

# Start backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Manual Frontend Setup
```bash
cd frontend
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your configuration

npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:4000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📁 Project Structure

```
clean-mailersuite/
├── backend/                    # FastAPI backend application
│   ├── app/                   # Main application modules
│   ├── models/                # SQLAlchemy database models
│   ├── routers/               # API route definitions
│   ├── services/              # Business logic services
│   ├── migrations/            # Alembic database migrations
│   ├── config/                # Configuration files
│   ├── core/                  # Core utilities and middleware
│   ├── security/              # Security and authentication
│   ├── .env.example          # Development environment template
│   └── .env.production.template  # Production environment template
├── frontend/                  # React frontend application
│   ├── src/                   # Source code
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API services
│   │   ├── store/             # State management
│   │   ├── http/              # HTTP client and API utilities
│   │   └── utils/             # Utility functions
│   ├── .env.example          # Frontend environment template
│   └── public/                # Static assets
├── venv/                      # Python virtual environment
├── .gitignore                 # Privacy-focused gitignore
├── deploy-setup.sh            # Automated deployment setup script
├── DEPLOYMENT.md              # Comprehensive deployment guide
└── README.md                  # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env.local)
```bash
# Database
DATABASE_URL=postgresql+asyncpg://mailersuite:your_password@localhost:5432/mailersuite2_dev

# Security
SECRET_KEY=your-super-secret-key-here-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis
REDIS_URL=redis://localhost:6379/0

# Features
DEBUG=True
ENVIRONMENT=development
LOG_LEVEL=INFO
```

#### Frontend (.env.local)
```bash
# API Configuration
VITE_API_BASE=http://localhost:8000/api
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws

# Development Server
VITE_DEV_SERVER_PORT=4000
VITE_DEV_SERVER_HOST=localhost

# Debugging
VITE_DEBUG=true
VITE_LOG_LEVEL=info
```

## 🚀 Production Deployment

### Quick Deployment Setup
```bash
# Run the automated setup script
./deploy-setup.sh

# This creates all necessary environment files and directories
```

### Backend Production
```bash
# Environment setup
cd backend
cp .env.production.template .env.production
# Edit .env.production with your production values

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start production server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# With Gunicorn (recommended)
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Production
```bash
cd frontend
cp .env.example .env.production
# Edit .env.production with your production values

npm run build
# Serve dist/ folder with Nginx or similar
```

### Process Management (PM2)
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000" --name "mailersuite-backend"

# Start frontend (if serving with Node)
cd frontend
pm2 start "npm run preview" --name "mailersuite-frontend"

# Save configuration
pm2 save
pm2 startup
```

### Docker Deployment
```bash
# Build images
docker build -t mailersuite-backend ./backend
docker build -t mailersuite-frontend ./frontend

# Run containers
docker run -d -p 8000:8000 mailersuite-backend
docker run -d -p 80:80 mailersuite-frontend

# Or use Docker Compose
docker-compose up -d
```

### 📚 Detailed Deployment Guide
See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions, troubleshooting, and security considerations.

## 📊 API Endpoints

### Core Endpoints
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/campaigns` - List campaigns
- `POST /api/v1/campaigns` - Create campaign
- `GET /api/v1/templates` - Email templates
- `POST /api/v1/ai-content/generate` - AI content generation
- `GET /api/v1/analytics` - Campaign analytics

### Admin Endpoints
- `GET /api/v1/admin/users` - User management
- `GET /api/v1/admin/plans` - Plan management
- `GET /api/v1/admin/analytics` - System analytics
- `GET /api/v1/admin/system/health` - System health monitoring

### Consolidated API Structure
- **Stable API client** implemented with comprehensive error handling
- **Unified HTTP client** consolidating all API functionality
- **Type-safe API calls** with TypeScript integration
- **Automatic retry logic** and error recovery
- **Request/response logging** for development debugging

## 🔒 Security & Privacy Features

### Security
- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **Role-based Access Control** - Granular permission system (Admin, User, Guest)
- **2FA Support** - Enhanced security with two-factor authentication
- **Input Sanitization** - Protection against injection attacks
- **Rate Limiting** - Plan-based API abuse prevention
- **Audit Logging** - Comprehensive activity tracking
- **CORS Protection** - Cross-origin request security
- **SQL Injection Protection** - SQLAlchemy ORM with parameterized queries

### Privacy Protection
- **Development PC Information Protected** - Comprehensive .gitignore prevents personal data exposure
- **Environment Variables Secured** - Templates provided, personal configs automatically blocked
- **API Client Consolidation** - Single, stable API client eliminates conflicts
- **Secure Deployment** - Environment templates for safe deployment without exposing secrets

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
pytest --cov=app --cov-report=html
pytest tests/test_auth.py
pytest tests/test_campaigns.py
pytest tests/test_admin.py
```

### Frontend Tests
```bash
cd frontend
npm run test:unit     # Vitest unit tests
npm run test          # Playwright E2E tests
npm run lint          # ESLint
npm run typecheck     # TypeScript check
```

## 📈 Monitoring & Analytics

- **Real-time Metrics** - Live campaign performance tracking
- **Error Logging** - Comprehensive error tracking and reporting
- **Performance Monitoring** - Response time and throughput metrics
- **User Analytics** - User behavior and engagement tracking
- **System Health** - Database, Redis, and service monitoring
- **Health Checks** - Automated system status monitoring
- **Performance Metrics** - Real-time API performance tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 style guide for Python
- Use TypeScript strict mode for frontend
- Write comprehensive tests
- Update documentation
- Use type hints and docstrings

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **API Documentation**: http://localhost:8000/docs
- **Health Status**: http://localhost:8000/health
- **System Metrics**: http://localhost:8000/api/v1/admin/system/health
- **Frontend Dev**: http://localhost:4000
- **Issues**: Report bugs and feature requests via GitHub Issues

## 🎯 Roadmap

### Upcoming Features
- **Advanced AI Models** - Integration with Claude, Gemini, and more
- **Mobile App** - Native iOS and Android applications
- **Enterprise SSO** - SAML and OAuth integration
- **Advanced Analytics** - Machine learning insights and predictions
- **API Marketplace** - Third-party integrations and plugins
- **Real-time Collaboration** - Multi-user campaign editing
- **Advanced Deliverability** - AI-powered inbox placement optimization

### Current Development Focus
- **API Client Consolidation** - Single, stable API client for all endpoints
- **Routing System** - Fixing and optimizing React Router implementation
- **Environment Configuration** - Streamlining development and production setup
- **Privacy Protection** - Comprehensive .gitignore and secure deployment
- **Documentation** - Keeping all guides and examples up to date

---

**MailerSuite2** - The future of email marketing is here! 🚀

*Built with ❤️ using modern web technologies*

*Last Updated: August 2025 | Version: 2.1.0 | Status: Under Development*

## 🚀 One-command VPS setup (Debian 12)

```bash
# From the project root on your VPS
chmod +x scripts/setup-debian12.sh
./scripts/setup-debian12.sh
```

- Installs Docker + Compose plugin
- Builds backend, worker, flower, and frontend images
- Starts Postgres, Redis, Backend (Uvicorn), Celery worker, Flower, and Nginx (frontend)
- Access:
  - Frontend: http://YOUR_VPS_IP/
  - API: http://YOUR_VPS_IP:8000
  - Docs: http://YOUR_VPS_IP:8000/docs
  - Flower: http://YOUR_VPS_IP:5555/flower
