#!/bin/bash
# Quick deployment script for orchestrator function

echo "🚀 Deploying orchestrator function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "📝 Please login to Supabase:"
    supabase login
fi

# Deploy the function
echo "📦 Deploying orchestrator function..."
supabase functions deploy orchestrator --project-ref oifchjaqembbkdyfjctp

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🧪 Test with:"
    echo "curl -X POST 'https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/orchestrator/chat' \\"
    echo "  -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"userId\": \"test\", \"message\": \"test\"}'"
else
    echo "❌ Deployment failed. Check the error above."
    exit 1
fi

