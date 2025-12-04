# Deploy Orchestrator Function

## Issue

The orchestrator function exists in your codebase but hasn't been deployed to Supabase yet. That's why you're getting `"Requested function was not found"`.

## Solution: Deploy the Function

### Option 1: Supabase CLI (Recommended)

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref oifchjaqembbkdyfjctp

# Deploy the orchestrator function
supabase functions deploy orchestrator
```

### Option 2: Supabase Dashboard (Easier)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/oifchjaqembbkdyfjctp

2. **Go to Edge Functions**
   - Click "Edge Functions" in the left sidebar
   - Click "Create a new function"

3. **Create Function**
   - Function name: `orchestrator`
   - Copy the contents of `supabase/functions/orchestrator/index.ts`
   - Paste into the editor
   - Click "Deploy"

4. **Set Environment Variables**
   - Go to: Settings → Edge Functions → Environment Variables
   - Add:
     - `SUPABASE_URL` = `https://oifchjaqembbkdyfjctp.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY` = (Get from Settings → API → service_role key)
     - `OPENAI_API_KEY` = (Your OpenAI API key)

### Option 3: Manual Upload via Dashboard

1. Go to Edge Functions in Supabase Dashboard
2. Click "Create function"
3. Name it `orchestrator`
4. Copy the entire contents of `supabase/functions/orchestrator/index.ts`
5. Paste into the code editor
6. Click "Deploy"

## Required Environment Variables

Make sure these are set in Supabase Dashboard → Settings → Edge Functions:

- `SUPABASE_URL` = `https://oifchjaqembbkdyfjctp.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = (Get from Settings → API)
- `OPENAI_API_KEY` = (Your OpenAI API key for GPT-4)

## Verify Deployment

After deploying, test:

```bash
curl -X POST "https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/orchestrator/chat" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "f78c2fcb-b2ba-4b75-8c4f-d7c73982c480",
    "message": "Looking for flights to Miami"
  }'
```

You should get a response with a task object instead of "NOT_FOUND".

## Also Deploy Travel Agent

The orchestrator calls the travel-agent, so deploy that too:

```bash
# If using CLI
supabase functions deploy travel-agent

# Or via Dashboard (same process as orchestrator)
```

## Quick Checklist

- [ ] Deploy `orchestrator` function
- [ ] Deploy `travel-agent` function (if not already deployed)
- [ ] Set environment variables in Supabase Dashboard
- [ ] Test with curl command
- [ ] Verify tasks are created in database

