# Step-by-Step Integration Guide

## ✅ Step 1: Components Are Ready

The components are already created and ready to use:
- ✅ `src/components/ui/EnhancedTaskCard.tsx` - Task card with real-time updates
- ✅ `src/components/ui/FlightComparisonGrid.tsx` - Flight comparison grid
- ✅ `src/lib/orchestrator.ts` - Orchestrator API client (just created)

## ✅ Step 2: Updated Files

I've already updated:
- ✅ `src/pages/TasksPage.tsx` - Now uses `EnhancedTaskCard` instead of `TaskCard`
- ✅ `src/pages/HomePage.tsx` - Now calls orchestrator when sending messages
- ✅ `src/lib/orchestrator.ts` - New orchestrator API client

## 🔧 Step 3: How to Use (In Your Code Files)

### Import the Components

**In any React component file** (not in terminal!):

```tsx
// ✅ Correct - In a .tsx file
import { EnhancedTaskCard } from '../components/ui/EnhancedTaskCard';
import { FlightComparisonGrid } from '../components/ui/FlightComparisonGrid';
import { callOrchestrator } from '../lib/orchestrator';
```

**NOT in terminal** - These are TypeScript imports that go in `.tsx` files!

### Example: Using EnhancedTaskCard

```tsx
// In TasksPage.tsx (already updated)
import { EnhancedTaskCard } from '../components/ui/EnhancedTaskCard';

// Then use it:
<EnhancedTaskCard 
  taskId={task.id} 
  variant="detailed"
  onUpdate={(task) => {
    console.log('Task updated:', task);
    // Refresh your task list if needed
  }}
/>
```

### Example: Calling Orchestrator

```tsx
// In HomePage.tsx (already updated)
import { callOrchestrator } from '../lib/orchestrator';
import { useAuth } from '../context/AuthContext';

const { user } = useAuth();

const handleSendMessage = async (message: string) => {
  if (!user) return;
  
  try {
    const result = await callOrchestrator(user.id, message);
    
    if (result.success) {
      console.log('Task created:', result.task);
      // Task will appear automatically via real-time subscription
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 🧪 Step 4: Test the Integration

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Go to HomePage** and type a message like:
   - "Find flights to Miami"
   - "Looking for flights to LAX"

3. **Check the Tasks page** - You should see the task appear with:
   - Progress bar
   - Confidence score
   - Decision strategy
   - Real-time updates

4. **Check browser console** for any errors

## 🔍 Step 5: Verify Everything Works

### Check Database

Run this in Supabase SQL Editor:

```sql
SELECT 
  id,
  title,
  status,
  confidence_score,
  decision_strategy,
  ui_state->>'current_step' as current_step,
  ui_state->>'rendered_component' as component
FROM tasks
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 5;
```

### Check Real-Time Updates

1. Open Tasks page
2. Send a message from HomePage
3. Watch the task appear and update in real-time on Tasks page

### Check Travel Agent Integration

1. Send: "Find flights from JFK to LAX on December 15th"
2. Wait a few seconds
3. Check task's `output_data` in database - should have flight results

## 🐛 Troubleshooting

### Import Errors

**Problem:** `Cannot find module '../components/ui/EnhancedTaskCard'`

**Solution:** 
- Make sure you're importing in a `.tsx` file, not in terminal
- Check the file path is correct relative to your file
- The components are at: `src/components/ui/EnhancedTaskCard.tsx`

### Real-Time Not Working

**Problem:** Tasks don't update in real-time

**Solution:**
- Check Supabase Realtime is enabled for `tasks` table
- Check browser console for subscription errors
- Verify RLS policies allow reading tasks

### Orchestrator Not Called

**Problem:** Message sent but no task created

**Solution:**
- Check browser console for errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check Edge Function logs in Supabase Dashboard

## 📝 Next Steps

1. ✅ Components created
2. ✅ TasksPage updated
3. ✅ HomePage updated
4. ✅ Orchestrator client created
5. ⏭️ Test the integration
6. ⏭️ Add error handling UI
7. ⏭️ Add loading states
8. ⏭️ Test with different message types

## 🎯 What Happens When You Send a Message

1. **User types message** in ConciergeInput
2. **HomePage calls** `callOrchestrator(userId, message)`
3. **Orchestrator creates task** immediately (optimistic UI)
4. **Orchestrator classifies intent** with GPT-4
5. **Orchestrator determines strategy** (auto_execute, preview_confirm, etc.)
6. **If travel search:** Calls travel-agent
7. **Travel agent searches flights** and ranks by preferences
8. **Task updates** with results
9. **Real-time subscription** updates UI automatically
10. **EnhancedTaskCard** displays results with FlightComparisonGrid

## 💡 Key Points

- ✅ **Imports go in code files** (`.tsx`), not terminal
- ✅ **Use relative paths** like `'../components/ui/EnhancedTaskCard'`
- ✅ **Real-time is automatic** - EnhancedTaskCard subscribes automatically
- ✅ **Tasks appear immediately** - Optimistic UI creates task before processing
- ✅ **Results update live** - No need to refresh

