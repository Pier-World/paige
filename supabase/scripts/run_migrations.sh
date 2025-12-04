#!/bin/bash

# Run Database Migrations
# This script helps you run the schema verification and enhancement migrations

echo "🚀 Running Pier OS v2 Database Migrations"
echo "=========================================="
echo ""

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI detected"
    echo ""
    echo "To run migrations via Supabase CLI:"
    echo "  supabase db push"
    echo ""
    echo "Or run specific migrations:"
    echo "  supabase migration up"
    echo ""
else
    echo "⚠️  Supabase CLI not found"
    echo ""
fi

echo "📋 Migration Files to Run:"
echo ""
echo "1. Schema Enhancement:"
echo "   supabase/migrations/20251201_verify_and_enhance_profiles_schema.sql"
echo ""
echo "2. User Preferences Alignment (if needed):"
echo "   supabase/migrations/20251201_align_user_preferences_with_profiles.sql"
echo ""
echo "📝 Instructions:"
echo ""
echo "Option 1: Via Supabase Dashboard (Recommended)"
echo "  1. Go to your Supabase project dashboard"
echo "  2. Navigate to SQL Editor"
echo "  3. Copy and paste the migration SQL"
echo "  4. Run the query"
echo ""
echo "Option 2: Via Supabase CLI"
echo "  supabase db push"
echo ""
echo "Option 3: Via psql"
echo "  psql <your-connection-string> -f supabase/migrations/20251201_verify_and_enhance_profiles_schema.sql"
echo ""
echo "✅ After running migrations, verify with:"
echo "  Run: supabase/scripts/verify_schema.sql in SQL Editor"
echo ""

