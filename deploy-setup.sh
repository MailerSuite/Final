#!/bin/bash

# ========================================
# 🚀 MAILERSUITE DEPLOYMENT SETUP SCRIPT
# ========================================
# This script helps set up environment files for deployment
# ========================================

set -e

echo "🔧 Setting up MailerSuite deployment environment..."

# ========================================
# 📁 CREATE NECESSARY DIRECTORIES
# ========================================
echo "📁 Creating necessary directories..."
mkdir -p backend/logs
mkdir -p frontend/dist
mkdir -p pids

# ========================================
# 🔐 BACKEND ENVIRONMENT SETUP
# ========================================
echo "🔐 Setting up backend environment..."

if [ ! -f "backend/.env.local" ]; then
    echo "📝 Creating backend .env.local from template..."
    cp backend/.env.example backend/.env.local
    echo "✅ Backend .env.local created"
    echo "⚠️  Please edit backend/.env.local with your actual values"
else
    echo "✅ Backend .env.local already exists"
fi

if [ ! -f "backend/.env.production" ]; then
    echo "📝 Creating backend .env.production from template..."
    cp backend/.env.production.template backend/.env.production
    echo "✅ Backend .env.production created"
    echo "⚠️  Please edit backend/.env.production with your production values"
    echo "🔒 IMPORTANT: Never commit .env.production to version control!"
else
    echo "✅ Backend .env.production already exists"
fi

# ========================================
# 🎨 FRONTEND ENVIRONMENT SETUP
# ========================================
echo "🎨 Setting up frontend environment..."

if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Creating frontend .env.local from template..."
    cp frontend/.env.example frontend/.env.local
    echo "✅ Frontend .env.local created"
    echo "⚠️  Please edit frontend/.env.local with your actual values"
else
    echo "✅ Frontend .env.local already exists"
fi

if [ ! -f "frontend/.env.production" ]; then
    echo "📝 Creating frontend .env.production from template..."
    cp frontend/.env.example frontend/.env.production
    echo "✅ Frontend .env.production created"
    echo "⚠️  Please edit frontend/.env.production with your production values"
    echo "🔒 IMPORTANT: Never commit .env.production to version control!"
else
    echo "✅ Frontend .env.production already exists"
fi

# ========================================
# 🗄️ DATABASE SETUP
# ========================================
echo "🗄️ Database setup instructions..."
echo ""
echo "📋 To set up the database:"
echo "1. Install PostgreSQL"
echo "2. Create database: CREATE DATABASE mailersuite2_dev;"
echo "3. Create user: CREATE USER mailersuite WITH PASSWORD 'your_password';"
echo "4. Grant privileges: GRANT ALL PRIVILEGES ON DATABASE mailersuite2_dev TO mailersuite;"
echo "5. Update backend/.env.local with your database credentials"
echo ""

# ========================================
# 🚀 DEPLOYMENT COMMANDS
# ========================================
echo "🚀 Deployment commands:"
echo ""
echo "📱 Start Frontend (Development):"
echo "  cd frontend && npm run dev"
echo ""
echo "🔧 Start Backend (Development):"
echo "  cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "🏗️  Build Frontend (Production):"
echo "  cd frontend && npm run build"
echo ""
echo "🚀 Start Backend (Production):"
echo "  cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo ""

# ========================================
# 🔒 SECURITY REMINDERS
# ========================================
echo "🔒 Security reminders:"
echo "✅ .env.example files are safe to commit (templates only)"
echo "❌ .env.local and .env.production files are blocked by .gitignore"
echo "🔐 Always use strong, unique passwords in production"
echo "🌍 Update CORS_ORIGINS for your actual domain in production"
echo "🔒 Use HTTPS in production (WSS for WebSocket connections)"
echo ""

# ========================================
# 📋 NEXT STEPS
# ========================================
echo "📋 Next steps:"
echo "1. Edit backend/.env.local with your development values"
echo "2. Edit frontend/.env.local with your development values"
echo "3. Set up your database"
echo "4. Install dependencies: npm install (frontend) and pip install -r requirements.txt (backend)"
echo "5. Start the development servers"
echo ""

echo "🎉 Deployment setup complete!"
echo "📚 Check the README.md for detailed deployment instructions"
