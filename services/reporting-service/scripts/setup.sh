#!/bin/bash

# Development Setup Script for Reporting Service
set -e

echo "🚀 Setting up Reporting Service for development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Copying environment configuration..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your configuration"
fi

# Make scripts executable
chmod +x scripts/*.sh

# Run database migration
echo "🗄️  Setting up database..."
./scripts/migrate.sh

# Create storage directories
mkdir -p storage/reports
mkdir -p logs

echo "📁 Created storage directories"

# Build the project
echo "🔨 Building the project..."
npm run build

echo ""
echo "🎉 Setup complete! You can now:"
echo "   - Run in development mode: npm run dev"
echo "   - Run in production mode: npm start"
echo "   - Run tests: npm test"
echo "   - Lint code: npm run lint"
echo ""
echo "📝 Don't forget to:"
echo "   - Update your .env file with the correct database credentials"
echo "   - Ensure PostgreSQL is running"
echo "   - Configure external service URLs"