# 🚀 MailerSuite Deployment Automation Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Deployment Scripts](#deployment-scripts)
- [Automated Features](#automated-features)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

## 🌟 Overview

MailerSuite now features a **fully automated deployment system** that handles everything from environment setup to server management. The system includes intelligent process management, automatic health checks, and comprehensive logging.

## ⚡ Quick Start

### **One-Command Deployment**

```bash
# Development deployment
./scripts/deploy.sh dev

# Production deployment
./scripts/deploy.sh prod

# Stop all servers
./scripts/deploy.sh stop

# Check status
./scripts/deploy.sh status
```

### **Individual Scripts**

```bash
# Development
./scripts/deploy-dev.sh      # Full development setup
./scripts/stop-dev.sh        # Stop development servers

# Production
./scripts/deploy-prod.sh     # Full production setup
./scripts/stop-prod.sh       # Stop production servers
```

## 🔧 Deployment Scripts

### **1. Master Deployment Script (`deploy.sh`)**

**Purpose**: Centralized deployment management with multiple options

**Features**:
- Environment selection (dev/prod)
- Status checking
- Log viewing
- Process management
- Help system

**Usage**:
```bash
./scripts/deploy.sh [OPTIONS] [ENVIRONMENT]

Options:
  -h, --help     Show help message
  -v, --verbose  Enable verbose output
  -f, --force    Force deployment
  -c, --clean    Clean deployment

Environments:
  dev            Development (default)
  prod           Production
  stop           Stop all servers
  status         Show status
  logs           Show logs
```

### **2. Development Deployment (`deploy-dev.sh`)**

**Purpose**: Complete development environment setup

**Automated Tasks**:
- ✅ Prerequisites checking (Python, Node.js, PostgreSQL, Redis)
- ✅ Database setup and user creation
- ✅ Environment file configuration
- ✅ Python virtual environment setup
- ✅ Dependency installation (Python + Node.js)
- ✅ Database migrations
- ✅ Server startup with health checks
- ✅ Process tracking and PID management

**Features**:
- **Smart Database Setup**: Automatically creates database and user if PostgreSQL is available
- **Environment Configuration**: Generates secure random keys and updates config files
- **Health Monitoring**: Performs health checks on both backend and frontend
- **Process Management**: Tracks all running processes with PID files

### **3. Production Deployment (`deploy-prod.sh`)**

**Purpose**: Enterprise-grade production deployment

**Automated Tasks**:
- ✅ Production environment validation
- ✅ Production database setup
- ✅ Frontend production build
- ✅ Environment configuration with production settings
- ✅ Database migrations
- ✅ PM2 process management
- ✅ Security configuration (firewall, systemd services)
- ✅ Health monitoring and logging

**Features**:
- **PM2 Integration**: Professional process management with auto-restart
- **Security Setup**: Firewall configuration and systemd service creation
- **Production Builds**: Optimized frontend builds with dependency management
- **Credential Management**: Secure storage of production credentials

### **4. Stop Scripts (`stop-dev.sh`, `stop-prod.sh`)**

**Purpose**: Clean server shutdown and cleanup

**Features**:
- **Process Termination**: Graceful shutdown with force-kill fallback
- **Port Verification**: Ensures ports are free after shutdown
- **Cleanup**: Removes PID files and temporary data
- **Security**: Removes sensitive credential files

## 🤖 Automated Features

### **🔍 Intelligent Prerequisites Checking**

The system automatically detects and validates:
- Python 3.11+ installation
- Node.js 18+ installation
- PostgreSQL availability
- Redis availability
- Required system tools

### **🗄️ Database Automation**

**Development**:
- Creates `mailersuite2_dev` database
- Creates `mailersuite` user with secure password
- Grants necessary privileges
- Runs database migrations

**Production**:
- Creates `mailersuite2_prod` database
- Creates `mailersuite_prod` user with secure password
- Configures production database settings
- Runs production migrations

### **🔐 Security Automation**

**Automatic Generation**:
- Secure random secret keys
- JWT secret keys
- Database passwords
- Production credentials

**Security Features**:
- Firewall configuration (UFW)
- Systemd service files
- Process isolation
- Credential file protection

### **📊 Process Management**

**Development**:
- PID file tracking
- Health check monitoring
- Graceful shutdown
- Port verification

**Production**:
- PM2 process management
- Auto-restart on failure
- Load balancing
- Process monitoring

### **🔍 Health Monitoring**

**Automatic Checks**:
- Backend API health (`/health` endpoint)
- Frontend availability
- Database connectivity
- Port availability

**Health Metrics**:
- Response time monitoring
- Error rate tracking
- Process status
- Resource usage

## 📖 Usage Examples

### **Complete Development Setup**

```bash
# 1. Navigate to project
cd clean-mailersuite

# 2. Run development deployment
./scripts/deploy.sh dev

# 3. Check status
./scripts/deploy.sh status

# 4. View logs
./scripts/deploy.sh logs
```

### **Production Deployment**

```bash
# 1. Deploy to production
./scripts/deploy.sh prod

# 2. Check PM2 status
pm2 status

# 3. View production logs
pm2 logs

# 4. Monitor health
./scripts/deploy.sh status
```

### **Server Management**

```bash
# Stop all servers
./scripts/deploy.sh stop

# Restart development
./scripts/deploy.sh dev

# Restart production
./scripts/deploy.sh prod

# Force clean deployment
./scripts/deploy.sh -c prod
```

### **Monitoring and Debugging**

```bash
# Check deployment status
./scripts/deploy.sh status

# View available logs
./scripts/deploy.sh logs

# Verbose deployment
./scripts/deploy.sh -v dev

# Force deployment
./scripts/deploy.sh -f prod
```

## 🛠️ Advanced Configuration

### **Environment Variables**

The scripts automatically configure environment files:

**Development**:
```bash
# Backend
DATABASE_URL=postgresql+asyncpg://mailersuite:password@localhost:5432/mailersuite2_dev
SECRET_KEY=auto_generated_secure_key
JWT_SECRET_KEY=auto_generated_jwt_key

# Frontend
VITE_API_BASE=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

**Production**:
```bash
# Backend
DATABASE_URL=postgresql+asyncpg://mailersuite_prod:password@localhost:5432/mailersuite2_prod
SECRET_KEY=production_secure_key
JWT_SECRET_KEY=production_jwt_key
DEBUG=False
ENVIRONMENT=production
```

### **Customization**

**Script Configuration**:
```bash
# Edit script variables
nano scripts/deploy-dev.sh

# Common variables to modify:
PROJECT_ROOT="/path/to/project"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
VENV_DIR="$PROJECT_ROOT/venv"
```

**Database Configuration**:
```bash
# Custom database names
DB_NAME="custom_db_name"
DB_USER="custom_user"
DB_PASSWORD="custom_password"
```

## 🔍 Troubleshooting

### **Common Issues**

#### **1. Permission Denied**
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Check file permissions
ls -la scripts/
```

#### **2. Port Already in Use**
```bash
# Check what's using the port
lsof -i :8000
lsof -i :4000

# Stop conflicting processes
./scripts/deploy.sh stop
```

#### **3. Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify database exists
sudo -u postgres psql -l

# Check user permissions
sudo -u postgres psql -c "\du"
```

#### **4. PM2 Issues**
```bash
# Reset PM2
pm2 kill
pm2 start

# Check PM2 logs
pm2 logs

# Restart PM2 processes
pm2 restart all
```

### **Debug Mode**

Enable verbose output for troubleshooting:

```bash
# Verbose development deployment
./scripts/deploy.sh -v dev

# Verbose production deployment
./scripts/deploy.sh -v prod

# Check script execution
bash -x scripts/deploy-dev.sh
```

### **Log Analysis**

**Development Logs**:
```bash
# Backend logs
tail -f pids/backend.log

# Frontend logs
tail -f pids/frontend.log
```

**Production Logs**:
```bash
# PM2 logs
pm2 logs

# Application logs
tail -f production/logs/backend-error.log
tail -f production/logs/frontend-pm2.log
```

## 📚 Integration with Existing Tools

### **Git Integration**
```bash
# Pre-deployment
git pull origin main
git status

# Post-deployment
git add .
git commit -m "🚀 Deploy to production"
git push origin main
```

### **Docker Integration**
```bash
# Build Docker images
docker build -t mailersuite-backend ./backend
docker build -t mailersuite-frontend ./frontend

# Run with deployment scripts
./scripts/deploy.sh prod
```

### **CI/CD Integration**
```bash
# GitHub Actions example
- name: Deploy to Production
  run: |
    chmod +x scripts/*.sh
    ./scripts/deploy.sh prod
```

## 🎯 Best Practices

### **Development Workflow**
1. **Always check status** before deploying: `./scripts/deploy.sh status`
2. **Use clean deployments** for fresh starts: `./scripts/deploy.sh -c dev`
3. **Monitor logs** during development: `./scripts/deploy.sh logs`
4. **Stop servers** when done: `./scripts/deploy.sh stop`

### **Production Workflow**
1. **Test in development** first: `./scripts/deploy.sh dev`
2. **Backup database** before production deployment
3. **Monitor health** after deployment: `./scripts/deploy.sh status`
4. **Check PM2 status** regularly: `pm2 status`

### **Security Considerations**
1. **Never commit** `.env.production` files
2. **Rotate credentials** regularly
3. **Monitor logs** for security issues
4. **Use firewall** rules for production

## 🚀 Future Enhancements

### **Planned Features**
- **Kubernetes Integration**: Container orchestration support
- **Multi-Environment**: Staging, testing, and production
- **Auto-Scaling**: Dynamic resource allocation
- **Backup Automation**: Automated database and file backups
- **Monitoring Dashboard**: Web-based monitoring interface

### **Customization Options**
- **Plugin System**: Extensible deployment scripts
- **Configuration Templates**: Environment-specific templates
- **Integration APIs**: REST API for deployment management
- **Web Interface**: GUI for deployment management

---

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Enable verbose mode: `./scripts/deploy.sh -v`
3. Review logs: `./scripts/deploy.sh logs`
4. Check status: `./scripts/deploy.sh status`

**Documentation**: See `README.md` and `DEPLOYMENT.md` for additional information.

---

**🎉 Your MailerSuite deployment is now fully automated!** 🚀
