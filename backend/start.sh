#!/bin/bash

# ThirteenLabs Backend - Startup Script
# This script starts the FastAPI backend server

set -e  # Exit on any error

echo "🚀 Starting ThirteenLabs Backend..."

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

# Function to cleanup background processes
cleanup() {
    print_status "Stopping FastAPI server..."
    pkill -f "uvicorn.*main:app" 2>/dev/null || true
    print_success "Server stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    print_error "Python3 is not installed or not in PATH"
    exit 1
fi

# Check if we're in the backend directory
if [ ! -f "main.py" ]; then
    print_error "Please run this script from the backend directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please update .env with your API keys before continuing"
    else
        print_error "No .env or .env.example file found"
        exit 1
    fi
fi

# Install dependencies if needed
print_status "Checking dependencies..."
pip3 install -r requirements.txt > /dev/null 2>&1 || {
    print_error "Failed to install dependencies"
    exit 1
}
print_success "Dependencies installed"

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Start FastAPI server
print_status "Starting FastAPI server..."
print_success "Server starting up!"
echo ""
echo "🌐 API available at: http://localhost:8000"
echo "📊 API docs at: http://localhost:8000/docs"
echo "🔍 Health check at: http://localhost:8000/health"
echo ""
echo "✅ Using FastAPI BackgroundTasks for async processing"
echo ""
echo "Press Ctrl+C to stop the server"

# Start the FastAPI server in the foreground
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 