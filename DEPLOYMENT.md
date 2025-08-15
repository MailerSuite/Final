# 🚀 MailerSuite Deployment Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## 🌟 Overview

MailerSuite is a full-stack email marketing platform with a React frontend and FastAPI backend. This guide covers deployment for both development and production environments.

## ⚡ Quick Start

Run the automated setup script:

```bash
./deploy-setup.sh
```

This will create all necessary environment files and directories.

## 🔐 Environment Configuration

### 📁 Environment File Structure

```
├── backend/
│   ├── .env.example          # Development template (safe to commit)
│   ├── .env.local           # Local development (gitignored)
│   ├── .env.production      # Production config (gitignored)
│   └── .env.production.template  # Production template (safe to commit)
├── frontend/
│   ├── .env.example         # Development template (safe to commit)
│   ├── .env.local          # Local development (gitignored)
│   └── .env.production     # Production config (gitignored)
```

### 🔒 Privacy Protection

- **✅ Safe to commit**: `.env.example`, `.env.template` files
- **❌ Never commit**: `.env.local`, `.env.production` files
- **🛡️ Protected by**: `.gitignore` rules

## 🛠️ Development Setup

### 1. Backend Setup

```bash
cd backend

# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local

# Install dependencies
pip install -r requirements.txt

# Start development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Database Setup

```sql
-- Create database
CREATE DATABASE mailersuite2_dev;

-- Create user
CREATE USER mailersuite WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mailersuite2_dev TO mailersuite;
```

## 🚀 Production Deployment

### 1. Environment Configuration

```bash
# Backend production config
cd backend
cp .env.production.template .env.production
nano .env.production

# Frontend production config
cd frontend
cp .env.example .env.production
nano .env.production
```

### 2. Backend Deployment

```bash
cd backend

# Install production dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start production server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Frontend Deployment

```bash
cd frontend

# Build for production
npm run build

# Serve static files (using nginx, Apache, or CDN)
# The dist/ folder contains your production build
```

### 4. Using a Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000" --name "mailersuite-backend"

# Start frontend (if serving with Node)
cd frontend
pm2 start "npm run preview" --name "mailersuite-frontend"

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🔒 Security Considerations

### Environment Variables

- **Never commit** `.env.local` or `.env.production` files
- **Use strong, unique passwords** for all services
- **Rotate secrets regularly** in production
- **Use different credentials** for development and production

### Network Security

- **Enable HTTPS** in production
- **Configure CORS** properly for your domain
- **Use firewall rules** to restrict access
- **Monitor logs** for suspicious activity

### Database Security

- **Use dedicated database users** with minimal privileges
- **Enable SSL connections** for database
- **Regular backups** with encryption
- **Network isolation** when possible

## 🌍 Production Checklist

- [ ] Environment files configured with production values
- [ ] Database created and migrations run
- [ ] HTTPS certificates installed
- [ ] CORS origins updated for production domain
- [ ] Logging configured for production
- [ ] Monitoring and health checks enabled
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error tracking (Sentry) configured

## 🐛 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check environment variables
cat backend/.env.local

# Check database connection
python -c "from app.core.database import engine; print('DB OK')"

# Check logs
tail -f backend/logs/app.log
```

#### Frontend Build Fails
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check environment variables
cat frontend/.env.local
```

#### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -h localhost -U mailersuite -d mailersuite2_dev

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Log Locations

- **Backend logs**: `backend/logs/app.log`
- **Frontend logs**: Browser console
- **System logs**: `/var/log/syslog` (Ubuntu/Debian)

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [PostgreSQL Setup](https://www.postgresql.org/docs/)
- [Nginx Configuration](https://nginx.org/en/docs/)

## 🆘 Support

If you encounter issues:

1. Check the logs for error messages
2. Verify environment configuration
3. Ensure all dependencies are installed
4. Check network connectivity
5. Review security settings

---

**⚠️ Important**: Always test your deployment in a staging environment before going to production!
