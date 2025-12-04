# Date Parsing and Task Persistence Fixes

## Issues Fixed

### 1. Date Parsing - "next week" Not Processed
**Problem:** The orchestrator was passing raw relative dates like "next week" to the travel agent, which couldn't parse them, resulting in "Invalid date string" warnings.

**Solution:**
- Enhanced GPT-4 prompt in `classifyIntentWithRisk` to explicitly convert relative dates to ISO format (YYYY-MM-DD)
- Added current date context (today, tomorrow, next week) to the prompt
- GPT-4 now converts:
  - "next week" → actual date (7 days from today)
  - "tomorrow" → actual date
  - "next Monday" → calculated date
  - "in 3 days" → calculated date

### 2. Missing Parameter Handling
**Problem:** When critical parameters (destination, date, origin) were missing, the system would still try to execute with incomplete data.

**Solution:**
- Updated `determineExecutionStrategy` to check for missing critical parameters
- If critical parameters are missing, automatically use "clarify" strategy
- Enhanced `generateClarifyingQuestions` to use GPT-4 for natural, contextual questions
- Questions now include context like:
  - "What days are you looking to travel?"
  - "Are you departing from NYC (your home city)?"
  - "Is this a round trip or one-way?"

### 3. Task Persistence on Page Reload
**Problem:** Tasks disappeared when the page was reloaded because `recentTaskId` was only stored in component state.

**Solution:**
- Modified `loadHomeFeed()` to fetch recent tasks from the database on page load
- Loads the last 5 tasks (active or recently completed)
- Automatically displays the most recent active task
- Shows up to 2 additional recent tasks below the active one

## Changes Made

### `supabase/functions/orchestrator/index.ts`
1. **Enhanced Intent Classification Prompt:**
   - Added current date context (today, tomorrow, next week ISO dates)
   - Explicit instructions to convert relative dates to ISO format
   - Rules for handling ambiguous dates

2. **Updated `determineExecutionStrategy`:**
   - Now accepts `missingInfo` and `intentType` parameters
   - Checks for critical missing parameters
   - Automatically uses "clarify" strategy if critical info is missing

3. **Enhanced `generateClarifyingQuestions`:**
   - Uses GPT-4 to generate natural, contextual questions
   - Includes user context (home airport, preferences) in questions
   - Fallback to simple questions if GPT-4 fails

### `src/pages/HomePage.tsx`
1. **Added `recentTasks` state** to store tasks loaded from database
2. **Modified `loadHomeFeed()`** to:
   - Fetch recent tasks from database
   - Set the most recent active task as `recentTaskId`
3. **Updated task display** to show:
   - Newly created task (if any)
   - Recent tasks from database (up to 2 additional)

## Expected Behavior After Fixes

### Date Parsing
1. User says: "Looking for flights to Miami next week"
2. GPT-4 converts "next week" to actual date (e.g., "2025-12-08")
3. Orchestrator passes ISO date to travel agent
4. Travel agent successfully searches for flights

### Missing Parameters
1. User says: "I need flights to Miami"
2. GPT-4 identifies missing: `date`, possibly `origin`
3. Confidence lowered (< 0.7)
4. Strategy set to "clarify"
5. System asks: "What days are you looking to travel? Are you departing from NYC (your home city)?"
6. User provides answers
7. System proceeds with complete information

### Task Persistence
1. User creates a task
2. Task is saved to database
3. User reloads page
4. HomePage loads recent tasks from database
5. Most recent active task is displayed
6. Task remains visible until completed or user navigates away

## Testing

1. **Test date parsing:**
   - Send: "Looking for flights to Miami next week"
   - Verify: Date is converted to ISO format in logs
   - Verify: Travel agent receives valid date

2. **Test missing parameters:**
   - Send: "I need flights to Miami"
   - Verify: System asks clarifying questions
   - Verify: Questions are natural and contextual

3. **Test persistence:**
   - Create a task
   - Reload the page
   - Verify: Task is still visible
   - Verify: Task updates in real-time

## Next Steps

1. **Deploy updated orchestrator** to Supabase
2. **Test with various date formats:**
   - "next week"
   - "tomorrow"
   - "in 3 days"
   - "next Monday"
   - "December 15th"

3. **Test clarifying questions** with incomplete requests:
   - "flights to Miami" (missing date)
   - "flights next week" (missing destination)
   - "I need to travel" (missing both)

4. **Verify task persistence** across page reloads

