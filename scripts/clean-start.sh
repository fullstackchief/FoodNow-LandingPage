#!/bin/bash

# Clean Start Script for FoodNow Development
# Ensures a fresh development environment free from cache issues

echo "🧹 Starting clean development environment setup..."

# 1. Kill any running Node processes
echo "📍 Stopping all Node processes..."
pkill -f node 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# 2. Clear Next.js cache
echo "📍 Clearing Next.js cache..."
rm -rf .next 2>/dev/null || true

# 3. Clear Node modules cache
echo "📍 Clearing Node modules cache..."
rm -rf node_modules/.cache 2>/dev/null || true

# 4. Clear Turbopack cache if exists
echo "📍 Clearing Turbopack cache..."
rm -rf .turbo 2>/dev/null || true

# 5. Clear npm cache
echo "📍 Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# 6. Update the cache buster in supabase.ts
echo "📍 Updating module cache buster..."
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/Cache Buster: .*/Cache Buster: $TIMESTAMP/" src/lib/supabase.ts
else
  # Linux
  sed -i "s/Cache Buster: .*/Cache Buster: $TIMESTAMP/" src/lib/supabase.ts
fi

echo "✅ Clean environment ready!"
echo "📍 Starting development server with Turbopack..."
echo ""
echo "⚠️  IMPORTANT: Clear your browser cache for localhost:3000"
echo "   Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)"
echo "   Safari: Cmd+Option+R"
echo ""

# Start the dev server
npm run dev