#!/bin/bash

echo "🚀 Starting Stock Analyzer Frontend..."

cd "$(dirname "$0")/../frontend" || exit

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

echo "✅ Frontend is starting on http://localhost:3000"
npm start