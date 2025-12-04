#!/bin/bash
# Deploy orchestrator using npx (no installation needed)

echo "🚀 Deploying orchestrator function using npx..."

# Check if logged in
echo "📝 Checking Supabase login status..."
npx supabase projects list 2>&1 | grep -q "Not logged in" && {
    echo "Please login to Supabase:"
    npx supabase login
}

# Deploy the function
echo "📦 Deploying orchestrator function..."
npx supabase functions deploy orchestrator --project-ref oifchjaqembbkdyfjctp

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

