#!/bin/bash

# ===========================================
# Multi-Service Docker Application
# Startup Script
# ===========================================

set -e

echo "🐳 Multi-Service Docker Application"
echo "===================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed."
    exit 1
fi

# Copy .env if not exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
fi

# Parse arguments
ACTION=${1:-"up"}

case $ACTION in
    "build")
        echo "🔨 Building all services..."
        docker-compose build --no-cache
        echo "✅ Build complete!"
        ;;
    "up")
        echo "🚀 Starting all services..."
        docker-compose up -d --build
        echo ""
        echo "⏳ Waiting for services to be healthy..."
        sleep 10
        echo ""
        docker-compose ps
        echo ""
        echo "✅ Services are running!"
        echo "🌐 Access the application at: http://localhost"
        echo "💚 Health check at: http://localhost/health"
        ;;
    "down")
        echo "🛑 Stopping all services..."
        docker-compose down
        echo "✅ All services stopped."
        ;;
    "restart")
        echo "🔄 Restarting all services..."
        docker-compose restart
        echo "✅ Services restarted."
        ;;
    "logs")
        echo "📋 Showing logs..."
        docker-compose logs -f
        ;;
    "clean")
        echo "🧹 Cleaning up everything..."
        docker-compose down -v --rmi all
        echo "✅ Cleanup complete."
        ;;
    "status")
        echo "📊 Service Status:"
        docker-compose ps
        echo ""
        echo "🔍 Health Check:"
        curl -s http://localhost/health | python3 -m json.tool 2>/dev/null || echo "Services may not be ready yet."
        ;;
    *)
        echo "Usage: $0 {build|up|down|restart|logs|clean|status}"
        exit 1
        ;;
esac
