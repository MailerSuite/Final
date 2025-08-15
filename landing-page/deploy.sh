#!/bin/bash

# SpamGPT Landing Page Deployment Script
# This script provides various deployment options for the landing page

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="spamgpt-landing"
BUILD_DIR="dist"
PORT=9000

echo -e "${BLUE}🚀 SpamGPT Landing Page Deployment Script${NC}"
echo "================================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to start local development server
start_local() {
    echo -e "${YELLOW}Starting local development server...${NC}"
    
    if command_exists python3; then
        echo "Using Python 3 HTTP server"
        python3 -m http.server $PORT
    elif command_exists python; then
        echo "Using Python HTTP server"
        python -m SimpleHTTPServer $PORT
    elif command_exists node; then
        echo "Using Node.js serve"
        npx serve -s . -p $PORT
    elif command_exists php; then
        echo "Using PHP built-in server"
        php -S localhost:$PORT
    else
        echo -e "${RED}No suitable server found. Please install Python, Node.js, or PHP.${NC}"
        exit 1
    fi
}

# Function to build production version
build_production() {
    echo -e "${YELLOW}Building production version...${NC}"
    
    # Create build directory
    rm -rf $BUILD_DIR
    mkdir -p $BUILD_DIR
    
    # Copy files
    cp -r css js index.html $BUILD_DIR/
    
    # Create production index.html (remove development comments)
    sed '/<!-- Development -->/,/<!-- End Development -->/d' index.html > $BUILD_DIR/index.html
    
    echo -e "${GREEN}Production build created in $BUILD_DIR/ directory${NC}"
}

# Function to deploy to Netlify (if netlify-cli is installed)
deploy_netlify() {
    if ! command_exists netlify; then
        echo -e "${YELLOW}Netlify CLI not found. Installing...${NC}"
        npm install -g netlify-cli
    fi
    
    echo -e "${YELLOW}Deploying to Netlify...${NC}"
    
    # Build production version first
    build_production
    
    # Deploy to Netlify
    cd $BUILD_DIR
    netlify deploy --prod --dir=.
    
    echo -e "${GREEN}Deployed to Netlify successfully!${NC}"
}

# Function to create Docker image
create_docker() {
    echo -e "${YELLOW}Creating Docker image...${NC}"
    
    # Build production version first
    build_production
    
    # Create Dockerfile
    cat > $BUILD_DIR/Dockerfile << 'EOF'
FROM nginx:alpine

# Copy static files
COPY . /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

    # Create nginx configuration
    cat > $BUILD_DIR/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Cache static assets
        location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Handle SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
EOF

    # Build Docker image
    cd $BUILD_DIR
    docker build -t $PROJECT_NAME .
    
    echo -e "${GREEN}Docker image created successfully!${NC}"
    echo -e "${BLUE}To run: docker run -p 80:80 $PROJECT_NAME${NC}"
}

# Function to deploy to AWS S3 (if AWS CLI is installed)
deploy_s3() {
    if ! command_exists aws; then
        echo -e "${RED}AWS CLI not found. Please install it first.${NC}"
        echo "Visit: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    echo -e "${YELLOW}Deploying to AWS S3...${NC}"
    
    # Check if bucket name is provided
    if [ -z "$1" ]; then
        echo -e "${RED}Please provide an S3 bucket name:${NC}"
        echo "Usage: $0 s3-deploy <bucket-name>"
        exit 1
    fi
    
    BUCKET_NAME=$1
    
    # Build production version first
    build_production
    
    # Sync files to S3
    aws s3 sync $BUILD_DIR/ s3://$BUCKET_NAME --delete
    
    # Configure static website hosting
    aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html
    
    echo -e "${GREEN}Deployed to S3 successfully!${NC}"
    echo -e "${BLUE}Website URL: http://$BUCKET_NAME.s3-website-$(aws configure get region).amazonaws.com${NC}"
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  local              Start local development server"
    echo "  build              Build production version"
    echo "  netlify            Deploy to Netlify"
    echo "  docker             Create Docker image"
    echo "  s3-deploy <bucket> Deploy to AWS S3"
    echo "  help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 local           # Start local server"
    echo "  $0 build           # Build for production"
    echo "  $0 netlify         # Deploy to Netlify"
    echo "  $0 s3-deploy my-bucket  # Deploy to S3"
}

# Main script logic
case "${1:-help}" in
    "local")
        start_local
        ;;
    "build")
        build_production
        ;;
    "netlify")
        deploy_netlify
        ;;
    "docker")
        create_docker
        ;;
    "s3-deploy")
        deploy_s3 "$2"
        ;;
    "help"|*)
        show_help
        ;;
esac
