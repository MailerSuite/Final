#!/usr/bin/env python3
"""
Simple script to create an admin user
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime

# Set environment variables
os.environ['DATABASE_URL'] = 'postgresql+asyncpg://postgres:postgres@localhost:5432/sgpt_dev'
os.environ['SECRET_KEY'] = 'dev-secret-key-change-in-production-12345678901234567890'
os.environ['DEBUG'] = 'true'
os.environ['ENVIRONMENT'] = 'development'

# Add backend to path
sys.path.insert(0, '/home/pc/Desktop/dev/clean-mailersuite/backend')

import asyncpg

async def create_admin_user():
    """Create an admin user directly in PostgreSQL"""
    try:
        # Connect to PostgreSQL
        conn = await asyncpg.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='postgres',
            database='sgpt_dev'
        )
        
        print("🔌 Connected to database")
        
        # Check if users table exists
        result = await conn.fetch("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        """)
        
        if not result[0]['exists']:
            print("📋 Creating users table...")
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(255),
                    password_hash VARCHAR(255) NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_admin BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
            print("✅ Users table created")
        
        # Check if admin user exists
        admin_exists = await conn.fetchval("""
            SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)
        """, "admin@sgpt.dev")
        
        if admin_exists:
            print("⚠️  Admin user already exists")
        else:
            # Create admin user with UUID and bcrypt hash
            # Using a simple bcrypt hash for "admin123"
            hashed_password = "$2b$12$L6MHMNb4GIg7xdlA1wrqwOLw3H3yuwGNptDdPQ8g6m7gcG75I9pFa"
            user_id = str(uuid.uuid4())
            
            await conn.execute("""
                INSERT INTO users (id, email, username, password_hash, is_active, is_admin, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """, user_id, "admin@sgpt.dev", "admin", hashed_password, True, True, datetime.now(), datetime.now())
            
            print("✅ Admin user created successfully!")
            print("🆔 User ID: " + user_id)
            print("📧 Email: admin@sgpt.dev")
            print("🔑 Password: admin123")
        
        await conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = asyncio.run(create_admin_user())
    if success:
        print("\n🎉 Admin user setup completed!")
        print("You can now login at http://localhost:4000")
    else:
        print("\n💥 Failed to create admin user")
        sys.exit(1)