#!/bin/bash

# ThirteenLabs Frontend Startup Script
# This script starts the Next.js development server

set -e  # Exit on any error

echo "🚀 Starting ThirteenLabs Frontend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v)
print_status "Node.js version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local file not found. Creating..."
    cat > .env.local << EOF
# ThirteenLabs Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
    print_warning "Please edit .env.local if you need to change the API URL"
fi

# Start the development server
print_status "Starting Next.js development server..."
print_status "Frontend will be available at: http://localhost:3000"
print_status "Press Ctrl+C to stop the server"

npm run dev 