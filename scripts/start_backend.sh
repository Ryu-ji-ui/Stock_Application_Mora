#!/bin/bash

echo "🚀 Starting Stock Analyzer Backend..."

cd "$(dirname "$0")/../backend" || exit

# Install dependencies if needed
if [ -f "requirements.txt" ]; then
    echo "📦 Installing backend dependencies..."
    pip install -r requirements.txt
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "🔧 Creating default .env file..."
    cat > .env << EOF
DATABASE_URL=sqlite:///stock_analyzer.db
SECRET_KEY=super-secret-key-stock-analyzer-2026-change-in-production
EOF
fi

echo "✅ Backend is starting on http://localhost:5000"
python app.py