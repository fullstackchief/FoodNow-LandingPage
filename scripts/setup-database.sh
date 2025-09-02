#!/bin/bash

# FoodNow Database Setup Script
# This script sets up the Supabase database with all required tables and seed data

echo "🚀 FoodNow Database Setup Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local file not found${NC}"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check if Supabase URL and key are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Error: Supabase credentials not found in .env.local${NC}"
    echo "Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    exit 1
fi

echo -e "${GREEN}✅ Supabase credentials loaded${NC}"

# Extract project ID from Supabase URL
PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\/\(.*\)\.supabase\.co/\1/')
echo "📦 Project ID: $PROJECT_ID"

# Function to run SQL file
run_sql() {
    local sql_file=$1
    local description=$2
    
    echo -e "${YELLOW}⏳ Running: $description${NC}"
    
    # You'll need to use Supabase CLI or direct database connection
    # Option 1: Using Supabase CLI (recommended)
    if command -v supabase &> /dev/null; then
        supabase db reset --db-url "$DATABASE_URL" < "$sql_file"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $description completed${NC}"
        else
            echo -e "${RED}❌ $description failed${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Supabase CLI not found. Please install it or run the SQL manually${NC}"
        echo "To install Supabase CLI: npm install -g supabase"
        echo ""
        echo "Manual steps:"
        echo "1. Go to your Supabase dashboard: https://app.supabase.com/project/$PROJECT_ID/sql"
        echo "2. Copy and paste the contents of: $sql_file"
        echo "3. Run the SQL query"
        return 1
    fi
}

# Main setup process
echo ""
echo "📋 Setup Steps:"
echo "1. Create database schema"
echo "2. Insert seed data"
echo ""

read -p "Do you want to continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Starting database setup...${NC}"
    
    # Run migrations
    if [ -f "supabase/migrations/001_complete_schema.sql" ]; then
        run_sql "supabase/migrations/001_complete_schema.sql" "Database schema creation"
    else
        echo -e "${RED}❌ Schema file not found${NC}"
        exit 1
    fi
    
    # Run seed data
    if [ -f "supabase/seed.sql" ]; then
        echo ""
        read -p "Do you want to insert seed data? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            run_sql "supabase/seed.sql" "Seed data insertion"
        fi
    else
        echo -e "${YELLOW}⚠️  Seed file not found${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✨ Database setup complete!${NC}"
    echo ""
    echo "📝 Test Accounts Created:"
    echo "  Customer: test-customer@foodnow.com"
    echo "  Restaurant: test-restaurant@foodnow.com"
    echo "  Rider: test-rider@foodnow.com"
    echo "  Admin: test-admin@foodnow.com"
    echo "  Password for all: Test@123456"
    echo ""
    echo "🔗 Next steps:"
    echo "  1. Update your auth settings in Supabase dashboard"
    echo "  2. Enable Row Level Security (RLS) policies"
    echo "  3. Configure email templates"
    echo "  4. Test the application"
else
    echo -e "${YELLOW}Setup cancelled${NC}"
fi