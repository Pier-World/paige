# Deploy Orchestrator Function - Step by Step

## Option 1: Using npx (No Installation Needed) ✅ RECOMMENDED

Since `npx supabase` works, you can deploy without installing anything globally!

### Step 1: Login to Supabase

Run this in your terminal (it will open a browser):

```bash
cd /Users/spencerchandlee/paige
npx supabase login
```

This will:
- Open your browser
- Ask you to authorize
- Save your access token

### Step 2: Link to Your Project

```bash
npx supabase link --project-ref oifchjaqembbkdyfjctp
```

### Step 3: Deploy

```bash
npx supabase functions deploy orchestrator
```

That's it! Your function will deploy from your local file.

---

## Option 2: Fix Global Installation (If You Want)

If you want to install globally to use `supabase` directly:

### Fix Permission Issues

```bash
# Option A: Use sudo (not ideal but works)
sudo npm install -g supabase

# Option B: Fix npm permissions (better)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
npm install -g supabase
```

### Upgrade Node.js (Required)

The Supabase CLI needs Node.js v20.17.0+ but you have v18.15.0.

**Install nvm (Node Version Manager):**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

Then restart your terminal and:

```bash
nvm install 20
nvm use 20
npm install -g supabase
```

---

## Option 3: Use Dashboard (If CLI Doesn't Work)

If you prefer the dashboard:

1. **Open your local file:**
   ```bash
   open supabase/functions/orchestrator/index.ts
   # Or use: cat supabase/functions/orchestrator/index.ts
   ```

2. **Copy the ENTIRE file** (Cmd+A, then Cmd+C)

3. **In Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/oifchjaqembbkdyfjctp/functions
   - Click on `orchestrator` function
   - Click "Edit" or "Code" tab
   - **Select ALL** (Cmd+A)
   - **Delete everything**
   - **Paste your new code**
   - **Wait 3 seconds**
   - Click "Deploy"

4. **Verify:**
   - After deployment, search for `relatedTaskId` in the code
   - Should find 5 occurrences

---

## Quick Deploy Script

I've created a script that uses npx. After you login, you can run:

```bash
./deploy_with_npx.sh
```

Or manually:

```bash
npx supabase functions deploy orchestrator --project-ref oifchjaqembbkdyfjctp
```

---

## Troubleshooting

### "Access token not provided"
- Run `npx supabase login` first
- Make sure it completes successfully

### "Project not found"
- Check your project ref: `oifchjaqembbkdyfjctp`
- Make sure you're logged in with the correct account

### "Function not found"
- The function will be created if it doesn't exist
- Make sure the path is correct: `supabase/functions/orchestrator/index.ts`

### Still having issues?
- Check Supabase status: https://status.supabase.com
- Check function logs in dashboard
- Try the dashboard method (Option 3)

