/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// ============================================================================
// Inlined Types and Interfaces (from _shared/user-context.ts and _shared/types.ts)
// ============================================================================

interface TravelPatterns {
  preferredAirlines: string[];
  typicalBookingWindow: number;
  priceVsSchedule: number;
  averageSpendPerTrip: number;
  preferredDepartureTime: 'morning' | 'afternoon' | 'evening' | null;
  frequentDestinations: string[];
  typicalTripDuration: number;
}

interface LoyaltyAccount {
  program: string;
  accountNumber: string;
  points: number;
  tier: string;
  redemptionValue: number;
}

interface CommunicationStyle {
  verbosity: 'terse' | 'balanced' | 'detailed';
  prefersOptions: boolean;
  preferredResponseFormat: 'text' | 'structured';
}

interface SearchIntent {
  intent: string;
  params: Record<string, any>;
  timestamp: Date;
}

interface UserContext {
  profile: any;
  preferences: any;
  recentTasks: any[];
  recentSearches: SearchIntent[];
  pendingTasks: any[];
  upcomingEvents: any[];
  upcomingTrips: any[];
  todaySchedule: any[];
  tomorrowSchedule: any[];
  travelPatterns?: TravelPatterns;
  loyaltyAccounts: LoyaltyAccount[];
  communicationStyle: CommunicationStyle;
  homeAirport?: string;
  currentLocation?: string;
  timeZone: string;
}

interface AgentResult {
  success: boolean;
  data?: any;
  requires_human?: boolean;
  confidence?: number;
  message?: string;
}

interface ChatRequest {
  userId: string;
  message: string;
  conversationId?: string;
}

interface TaskUIState {
  current_step: string;
  progress: number;
  results_preview?: any;
  needs_decision?: {
    question: string;
    options: Array<{ id: string; label: string; preview: any }>;
  };
  rendered_component?: 'FlightComparisonGrid' | 'HotelRecommendations' | 'BookingConfirmation' | 'CalendarPicker' | 'DefaultTaskCard';
  search_params?: any;
  assumptions?: string[];
  error_message?: string;
}

interface ClassifiedIntent {
  intent_type: string;
  confidence: number;
  risk_level: 'low' | 'medium' | 'high';
  parameters: Record<string, any>;
  reasoning: string;
  missing_info: string[];
  assumptions: string[];
}

// ============================================================================
// User Context Functions (inlined from _shared/user-context.ts)
// ============================================================================

/**
 * Get comprehensive user context - the secret sauce
 */
async function getUserContext(
  supabase: any,
  userId: string
): Promise<UserContext> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Get user profile with all preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, travel_preferences, personal_context, communication_preferences, time_zone')
    .eq('id', userId)
    .single();

  // Get recent tasks (last 30 days)
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  // Get pending tasks
  const { data: pendingTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'in_progress', 'awaiting_human'])
    .order('created_at', { ascending: false });

  // Get upcoming calendar events
  const { data: upcomingEvents } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', now.toISOString())
    .lte('start_time', nextWeek.toISOString())
    .order('start_time', { ascending: true });

  // Get today's schedule
  const { data: todaySchedule } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', today.toISOString())
    .lt('start_time', tomorrow.toISOString())
    .order('start_time', { ascending: true });

  // Get tomorrow's schedule
  const { data: tomorrowSchedule } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', tomorrow.toISOString())
    .lt('start_time', new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString())
    .order('start_time', { ascending: true });

  // Get upcoming trips (next 30 days)
  const { data: upcomingTrips } = await supabase
    .from('entities')
    .select('*')
    .eq('user_id', userId)
    .eq('entity_type', 'trip')
    .gte('data->>start_date', now.toISOString())
    .lte('data->>start_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('data->>start_date', { ascending: true });

  // Extract recent searches from tasks
  const recentSearches: SearchIntent[] = (recentTasks || [])
    .filter((task: any) => task.task_type === 'user_request' && task.input_data?.intent)
    .map((task: any) => ({
      intent: task.input_data.intent,
      params: task.input_data.parameters || {},
      timestamp: new Date(task.created_at),
    }))
    .slice(0, 10);

  // Get loyalty accounts
  const { data: loyaltyEntities } = await supabase
    .from('entities')
    .select('*')
    .eq('user_id', userId)
    .eq('entity_type', 'loyalty_account');

  const loyaltyAccounts: LoyaltyAccount[] = (loyaltyEntities || []).map((entity: any) => ({
    program: entity.data?.program || '',
    accountNumber: entity.data?.account_number || '',
    points: entity.data?.points || 0,
    tier: entity.data?.tier || '',
    redemptionValue: entity.data?.redemption_value || 0,
  }));

  // Extract travel patterns from personal_context
  const personalContext = profile?.personal_context || {};
  const travelPatterns: TravelPatterns = {
    preferredAirlines: personalContext.preferredAirlines || 
                       profile?.travel_preferences?.preferred_airlines || [],
    typicalBookingWindow: personalContext.typicalBookingWindow || 14,
    priceVsSchedule: personalContext.priceVsSchedule || 0.5,
    averageSpendPerTrip: personalContext.averageSpendPerTrip || 0,
    preferredDepartureTime: personalContext.preferredDepartureTime || null,
    frequentDestinations: personalContext.frequentDestinations || [],
    typicalTripDuration: personalContext.typicalTripDuration || 3,
  };

  // Extract communication style
  const commPrefs = profile?.communication_preferences || {};
  const communicationStyle: CommunicationStyle = {
    verbosity: commPrefs.verbosity || 'balanced',
    prefersOptions: commPrefs.prefersOptions !== false,
    preferredResponseFormat: commPrefs.preferredResponseFormat || 'structured',
  };

  // Extract home airport
  const homeAirport = personalContext.homeAirport || 
                     profile?.travel_preferences?.home_airport ||
                     profile?.metadata?.home_airport;

  return {
    profile: profile || {},
    preferences: profile?.travel_preferences || {},
    recentTasks: recentTasks || [],
    recentSearches,
    pendingTasks: pendingTasks || [],
    upcomingEvents: upcomingEvents || [],
    upcomingTrips: upcomingTrips || [],
    todaySchedule: todaySchedule || [],
    tomorrowSchedule: tomorrowSchedule || [],
    travelPatterns,
    loyaltyAccounts,
    communicationStyle,
    homeAirport,
    timeZone: profile?.time_zone || 'America/New_York',
  };
}

/**
 * Infer return date from calendar events
 */
function inferReturnDate(
  context: UserContext,
  departDate: string
): string | null {
  const depart = new Date(departDate);
  const typicalDuration = context.travelPatterns?.typicalTripDuration || 3;
  const expectedReturn = new Date(depart);
  expectedReturn.setDate(expectedReturn.getDate() + typicalDuration);

  const eventsAfterReturn = context.upcomingEvents.filter((event: any) => {
    const eventDate = new Date(event.start_time);
    return eventDate >= expectedReturn && eventDate <= new Date(expectedReturn.getTime() + 7 * 24 * 60 * 60 * 1000);
  });

  if (eventsAfterReturn.length > 0) {
    const firstEvent = new Date(eventsAfterReturn[0].start_time);
    firstEvent.setDate(firstEvent.getDate() - 1);
    return firstEvent.toISOString().split('T')[0];
  }

  return expectedReturn.toISOString().split('T')[0];
}

/**
 * Check for time conflicts between flight and calendar events
 */
function isTimeConflict(
  flightTime: string,
  eventStart: string,
  bufferMinutes: number = 120
): boolean {
  const flight = new Date(flightTime);
  const event = new Date(eventStart);
  const buffer = bufferMinutes * 60 * 1000;
  return Math.abs(flight.getTime() - event.getTime()) < buffer;
}

// ============================================================================
// Orchestrator Functions
// ============================================================================

/**
 * Generate idempotency key to prevent duplicate tasks
 */
function generateIdempotencyKey(userId: string, message: string): string {
  // Normalize message (lowercase, trim, remove extra spaces)
  const normalized = message.toLowerCase().trim().replace(/\s+/g, ' ');
  // Create hash from user_id + normalized message
  return `${userId}-${normalized.substring(0, 100)}`;
}

/**
 * Create task with initial state
 */
async function createTask(
  supabase: any,
  userId: string,
  message: string,
  idempotencyKey: string
) {
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      // Create a natural title from the message (remove "User request:" prefix)
      title: message.substring(0, 60).trim() + (message.length > 60 ? '...' : ''),
      description: message,
      task_type: 'user_request',
      status: 'in_progress',
      ui_state: {
        current_step: 'understanding_request',
        progress: 10,
      } as TaskUIState,
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (error) {
    // If duplicate key error, fetch existing task
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('tasks')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .single();
      return { data: existing, error: null };
    }
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return { data: task, error: null };
}

/**
 * Update task with new state
 */
async function updateTask(
  supabase: any,
  taskId: string,
  updates: Partial<any>
) {
  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);

  if (error) {
    console.error('Failed to update task:', error);
    throw new Error(`Failed to update task: ${error.message}`);
  }
}

/**
 * Classify intent with confidence and risk assessment
 */
async function classifyIntentWithRisk(
  message: string,
  context: UserContext
): Promise<ClassifiedIntent> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  if (!openaiKey) {
    console.warn('OPENAI_API_KEY not set, using fallback classification');
    // Fallback classification
    const lower = message.toLowerCase();
    const isTravel = lower.includes('flight') || lower.includes('fly') || 
                     lower.includes('trip') || lower.includes('ticket') ||
                     lower.includes('travel') || lower.includes('book');
    
    return {
      intent_type: isTravel ? 'travel_search_flights' : 'general_question',
      confidence: isTravel ? 0.7 : 0.5,
      risk_level: isTravel ? 'low' : 'low',
      parameters: {},
      reasoning: 'Fallback classification - OpenAI not configured',
      missing_info: [],
      assumptions: [],
    };
  }

  // Build context summary
  const contextSummary = {
    upcomingTrips: context.upcomingTrips.length,
    calendarEventsToday: context.todaySchedule.length,
    preferredAirlines: context.travelPatterns?.preferredAirlines?.join(', ') || 'none',
    recentSearches: context.recentSearches.slice(0, 3).map(s => s.intent).join(', ') || 'none',
    homeAirport: context.homeAirport || 'unknown',
    pendingTasks: context.pendingTasks.length,
  };

  // Get current date for context
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split('T')[0];
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekISO = nextWeek.toISOString().split('T')[0];

  const prompt = `You are Pier's intent classifier. Analyze this user message and their context to determine:

1. Primary intent (travel_search_flights, travel_search_hotels, travel_book, calendar_add, calendar_find_time, loyalty_check, general_question)
2. Required parameters - CRITICAL: Convert relative dates to ISO format (YYYY-MM-DD)
3. Confidence in understanding (0-1) - Lower confidence if critical info is missing
4. Risk level of auto-executing this request

User Message: "${message}"

Current Date Context:
- Today: ${todayISO}
- Tomorrow: ${tomorrowISO}
- Next week (7 days): ${nextWeekISO}

User Context Summary:
- Upcoming trips: ${contextSummary.upcomingTrips}
- Calendar events today: ${contextSummary.calendarEventsToday}
- Preferred airlines: ${contextSummary.preferredAirlines}
- Recent searches: ${contextSummary.recentSearches}
- Home airport: ${contextSummary.homeAirport}
- Pending tasks: ${contextSummary.pendingTasks}

IMPORTANT DATE PARSING RULES:
- "next week" → ${nextWeekISO} (7 days from today)
- "tomorrow" → ${tomorrowISO}
- "next Monday" → Calculate the next Monday from today
- "in 3 days" → Calculate 3 days from today
- Always convert relative dates to ISO format (YYYY-MM-DD)
- If date is ambiguous (e.g., "sometime next week"), add to missing_info and lower confidence

Return JSON:
{
  "intent_type": "travel_search_flights" | "travel_search_hotels" | "travel_book" | "calendar_add" | "calendar_find_time" | "loyalty_check" | "general_question",
  "confidence": 0.95,
  "risk_level": "low" | "medium" | "high",
  "parameters": {
    "origin": "auto-filled from context (home airport) or extracted from message",
    "destination": "extracted from message (e.g., 'Miami' → 'MIA')",
    "date": "ISO date string (YYYY-MM-DD) - convert relative dates like 'next week' to actual date",
    "return_date": "ISO date string or null",
    "passengers": 1,
    "message": "original user message for hotel parsing"
  },
  "reasoning": "User wants to fly to Miami next week. I'm 85% confident. Origin auto-filled from profile (NYC). Date converted to ${nextWeekISO}. Low risk because it's a search, not a booking.",
  "missing_info": ["return_date", "specific_departure_days"],
  "assumptions": ["One-way trip based on no return mentioned", "Departing from NYC (user's home city)", "Date converted from 'next week' to ${nextWeekISO}"]
}

CRITICAL RULES:
- If critical parameters are missing (destination, date, origin), add them to missing_info and lower confidence below 0.7
- For travel_search_flights: destination and date are REQUIRED. If missing, confidence should be < 0.7
- For travel_search_hotels: city is REQUIRED. If missing, confidence should be < 0.7
- Convert ALL relative dates to ISO format (YYYY-MM-DD) using current date context
- Auto-fill origin from home airport if not specified
- If confidence < 0.7 due to missing info, the system will ask clarifying questions
- Classify as travel_search_hotels if user mentions: "hotel", "accommodation", "place to stay", "where to stay", "book a room", "find a hotel"

Risk level guidelines:
- LOW: Read-only operations, searches, questions, calendar holds
- MEDIUM: Creating/modifying non-financial entities, sending emails, adding to calendar
- HIGH: Financial transactions (bookings, purchases), cancellations, sharing private data

Be liberal in classifying travel intents. If user mentions "flights", "tickets", "fly", "travel", "trip" → classify as travel. If user mentions "hotel", "accommodation", "stay" → classify as travel_search_hotels.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert intent classifier. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const classification: ClassifiedIntent = JSON.parse(content);
    return classification;
  } catch (error) {
    console.error('Intent classification error:', error);
    // Return fallback
    return {
      intent_type: 'general_question',
      confidence: 0.5,
      risk_level: 'low',
      parameters: {},
      reasoning: `Classification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      missing_info: [],
      assumptions: [],
    };
  }
}

/**
 * Determine execution strategy based on confidence, risk, and missing info
 */
function determineExecutionStrategy(
  confidence: number,
  risk: 'low' | 'medium' | 'high',
  missingInfo: string[] = [],
  intentType: string
): 'auto_execute' | 'preview_confirm' | 'clarify' | 'escalate' {
  // If critical parameters are missing, always clarify
  const criticalParams = {
    'travel_search_flights': ['destination', 'date'],
    'travel_search_hotels': ['city'],
    'travel_book': ['destination', 'date'],
  };
  
  const requiredParams = criticalParams[intentType as keyof typeof criticalParams] || [];
  const hasMissingCritical = requiredParams.some(param => 
    missingInfo.some(missing => missing.toLowerCase().includes(param.toLowerCase()))
  );
  
  if (hasMissingCritical) {
    return 'clarify'; // Always ask if critical info is missing
  }

  if (confidence > 0.9 && risk === 'low' && missingInfo.length === 0) {
    return 'auto_execute'; // Just do it + show undo
  }

  if (confidence > 0.7 && risk !== 'high' && missingInfo.length === 0) {
    return 'preview_confirm'; // Show what we'll do, ask to confirm
  }

  if (confidence > 0.4) {
    return 'clarify'; // Ask follow-up questions
  }

  return 'escalate'; // Send to human review
}

/**
 * Execute agent pipeline
 */
async function executeAgentPipeline(
  supabase: any,
  intent: ClassifiedIntent,
  context: UserContext,
  taskId: string
): Promise<{ status: string; data: any; ui_state: TaskUIState }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Update task UI state
  await updateTask(supabase, taskId, {
    ui_state: {
      current_step: 'executing',
      progress: 50,
    },
  });

  // Route to appropriate agent
  // Hotel search flow: parse → recommend → rates → format
  if (intent.intent_type === 'travel_search_hotels' || 
      (intent.intent_type.startsWith('travel') && intent.parameters?.accommodation_type === 'hotel')) {
    try {
      // Get the original message from the task
      const { data: task } = await supabase
        .from('tasks')
        .select('description')
        .eq('id', taskId)
        .single();
      
      const originalMessage = task?.description || intent.parameters?.message || '';

      // Update UI: Parsing request
      await updateTask(supabase, taskId, {
        ui_state: {
          current_step: 'parsing_request',
          progress: 20,
          status_message: 'Understanding your request...',
        },
      });

      // Step 1: Parse the request
      const parseUrl = `${supabaseUrl}/functions/v1/parse-hotel-request`;
      console.log('Calling parse-hotel-request:', parseUrl);
      
      const parseResponse = await fetch(parseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          message: originalMessage,
          user_id: context.profile.id,
          conversation_history: [], // Could be enhanced to pass actual history
        }),
      });

      if (!parseResponse.ok) {
        const errorText = await parseResponse.text();
        console.error('Parse hotel request failed:', {
          status: parseResponse.status,
          statusText: parseResponse.statusText,
          url: parseUrl,
          errorBody: errorText,
        });
        
        // If function not found, provide helpful error
        if (parseResponse.status === 404) {
          throw new Error(`parse-hotel-request function not found. Please ensure it is deployed. Status: ${parseResponse.status}, URL: ${parseUrl}`);
        }
        
        throw new Error(`Parse hotel request error: ${parseResponse.status} ${parseResponse.statusText}. ${errorText}`);
      }

      const parseResult = await parseResponse.json();
      const parsed = parseResult.parsed_request;

      // Step 2: Check if we have enough info - be smart about assumptions
      // For hotels, we only truly need: city
      // Dates can be assumed/estimated, budget is optional, trip type can be inferred
      console.log('=== HOTEL REQUEST EVALUATION ===');
      console.log('Parsed request:', JSON.stringify(parsed, null, 2));
      console.log('Missing fields:', parsed.missing_fields);
      console.log('Has city:', !!parsed.city);
      console.log('Has dates:', !!parsed.dates?.check_in);

      // Store parsed request in task for follow-up handling
      await updateTask(supabase, taskId, {
        assigned_agent: 'hotel',
        input_data: {
          search_type: 'hotel',
          parsed_request: parsed,
          missing_fields: parsed.missing_fields,
        },
      });

      // ONLY ask for clarification if city is ACTUALLY missing
      // If city exists, proceed with assumptions even if dates are "missing"
      if (!parsed.city) {
        console.log('City is missing, need clarification');
        // Need clarification - but use hotel-specific clarification
        const clarificationResult = await generateHotelClarifyingQuestions(
          supabase,
          parsed,
          context,
          taskId,
          originalMessage
        );
        
        // Update task status
        await updateTask(supabase, taskId, {
          status: 'awaiting_human',
          decision_strategy: 'clarify',
          ui_state: clarificationResult.ui_state,
          input_data: {
            search_type: 'hotel',
            parsed_request: parsed,
            missing_fields: parsed.missing_fields,
            input_hint: clarificationResult.input_hint,
          },
        });
        
        // Return in the format expected by handleUserMessage
        return {
          status: clarificationResult.status,
          data: clarificationResult.data,
          ui_state: clarificationResult.ui_state,
        };
      }

      console.log('City exists, proceeding with assumptions');

      // If dates are missing but city exists, make smart assumptions
      if (!parsed.dates?.check_in && parsed.city) {
        console.log('Dates missing but city exists, assuming next weekend');
        // Make assumption: if no dates, assume next weekend
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextSaturday = new Date(today);
        const dayOfWeek = nextSaturday.getDay();
        // Calculate days until next Saturday
        let daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
        if (daysUntilSaturday === 0) daysUntilSaturday = 7; // If today is Saturday, use next week
        nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);
        const nextSunday = new Date(nextSaturday);
        nextSunday.setDate(nextSunday.getDate() + 1);

        parsed.dates = {
          check_in: nextSaturday.toISOString().split('T')[0],
          check_out: nextSunday.toISOString().split('T')[0],
        };
        parsed.missing_fields = parsed.missing_fields.filter((f: string) => f !== 'dates' && f !== 'check_in' && f !== 'check_out');
        // Increase confidence since we made a reasonable assumption
        parsed.confidence = Math.min(0.95, parsed.confidence + 0.1);
        console.log('Assumed dates:', parsed.dates);
      }

      // If dates are already set but check_out is missing, infer it (1 night default)
      if (parsed.dates?.check_in && !parsed.dates?.check_out) {
        const checkInDate = new Date(parsed.dates.check_in);
        checkInDate.setDate(checkInDate.getDate() + 1);
        parsed.dates.check_out = checkInDate.toISOString().split('T')[0];
        console.log('Inferred check_out:', parsed.dates.check_out);
      }

      // Update UI: Finding hotels
      await updateTask(supabase, taskId, {
        ui_state: {
          current_step: 'finding_hotels',
          progress: 50,
          status_message: 'Searching our curated hotel network...',
        },
      });

      // Step 3: Get recommendations from curated inventory
      const recUrl = `${supabaseUrl}/functions/v1/get-hotel-recommendations`;
      console.log('Calling get-hotel-recommendations:', recUrl);
      
      const recResponse = await fetch(recUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          parsed_request: parsed,
          user_id: context.profile.id,
          limit: 3,
          include_reasoning: true,
        }),
      });

      if (!recResponse.ok) {
        const errorText = await recResponse.text();
        console.error('Get hotel recommendations failed:', {
          status: recResponse.status,
          statusText: recResponse.statusText,
          url: recUrl,
          errorBody: errorText,
        });
        
        if (recResponse.status === 404) {
          throw new Error(`get-hotel-recommendations function not found. Please ensure it is deployed. Status: ${recResponse.status}, URL: ${recUrl}`);
        }
        
        throw new Error(`Get hotel recommendations error: ${recResponse.status} ${recResponse.statusText}. ${errorText}`);
      }

      // Get raw response text first for debugging
      const recResponseText = await recResponse.text();
      console.log('Raw recommendation response (first 500 chars):', recResponseText.substring(0, 500));
      
      let recResult;
      try {
        recResult = JSON.parse(recResponseText);
      } catch (e) {
        console.error('Failed to parse recommendation response:', e);
        console.error('Full response text:', recResponseText);
        throw new Error('Invalid response from get-hotel-recommendations');
      }
      
      console.log('=== RECOMMENDATIONS RECEIVED ===');
      console.log('Success:', recResult.success);
      console.log('Recommendations count:', recResult.recommendations?.length || 0);
      console.log('Has recommendations array:', Array.isArray(recResult.recommendations));
      console.log('Full recResult keys:', Object.keys(recResult));
      if (recResult.recommendations && recResult.recommendations.length > 0) {
        console.log('First recommendation:', JSON.stringify(recResult.recommendations[0], null, 2));
      }

      // If no recommendations, fall back to search-hotels
      if (!recResult.success || !recResult.recommendations || !Array.isArray(recResult.recommendations) || recResult.recommendations.length === 0) {
        console.log('No curated recommendations, falling back to search-hotels');
        const fallbackResponse = await fetch(`${supabaseUrl}/functions/v1/search-hotels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            location: parsed.city || '',
            check_in_date: parsed.dates.check_in || '',
            check_out_date: parsed.dates.check_out || '',
            guests: parsed.party_size || 1,
            max_price: parsed.budget_range.max || undefined,
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          await updateTask(supabase, taskId, {
            output_data: {
              search_type: 'hotel',
              recommendations: fallbackResult.results || [],
              fallback_used: true,
            },
            ui_state: {
              current_step: 'results_ready',
              progress: 100,
              rendered_component: 'HotelRecommendations',
            },
          });

          return {
            status: 'completed',
            data: {
              search_type: 'hotel',
              recommendations: fallbackResult.results || [],
              fallback_used: true,
            },
            ui_state: {
              current_step: 'results_ready',
              progress: 100,
              rendered_component: 'HotelRecommendations',
            },
          };
        }
      }

      // Update UI: Ranking results
      await updateTask(supabase, taskId, {
        ui_state: {
          current_step: 'ranking_results',
          progress: 80,
          status_message: 'Matching with your preferences...',
        },
      });

      // Step 4: Get rates for top picks
      const topHotelIds = recResult.recommendations.slice(0, 3).map((r: any) => {
        const id = r.hotel_id || r.id;
        if (!id) {
          console.error('Recommendation missing hotel_id:', r);
        }
        return id;
      }).filter((id: string) => id); // Filter out any undefined/null IDs
      let rates: any[] = [];

      if (parsed.dates.check_in && parsed.dates.check_out) {
        const ratesUrl = `${supabaseUrl}/functions/v1/get-hotel-rates`;
        console.log('Calling get-hotel-rates:', ratesUrl);
        
        const ratesResponse = await fetch(ratesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            hotel_ids: topHotelIds,
            check_in: parsed.dates.check_in,
            check_out: parsed.dates.check_out,
            guests: parsed.party_size || 1,
          }),
        });

        if (ratesResponse.ok) {
          const ratesResult = await ratesResponse.json();
          rates = ratesResult.results || [];
        } else {
          const errorText = await ratesResponse.text();
          console.warn('Get hotel rates failed (non-critical):', {
            status: ratesResponse.status,
            statusText: ratesResponse.statusText,
            url: ratesUrl,
            errorBody: errorText,
          });
          // Don't throw - rates are optional, we can proceed without them
        }
      }

      // Step 5: Format response and update task
      console.log('Formatting recommendations, count:', recResult.recommendations.length);
      
      const recommendations = recResult.recommendations.map((rec: any) => {
        const rateData = rates.find((r: any) => (r.hotel_id === rec.hotel_id || r.hotel_id === rec.id));
        return {
          ...rec,
          rates: rateData?.rates || [],
        };
      });

      console.log('Formatted recommendations count:', recommendations.length);
      console.log('Saving to task output_data...');

      await updateTask(supabase, taskId, {
        status: 'completed',
        output_data: {
          search_type: 'hotel',
          parsed_request: parsed,
          recommendations: recommendations,
          hotels: recommendations, // Also save as 'hotels' for frontend compatibility
          event_id: recResult.event_id,
          candidates_evaluated: recResult.candidates_evaluated,
        },
        ui_state: {
          current_step: 'results_ready',
          progress: 100,
          rendered_component: 'HotelRecommendations',
        },
      });

      console.log('Task updated with recommendations:', recommendations.length);

      return {
        status: 'completed',
        data: {
          search_type: 'hotel',
          parsed_request: parsed,
          recommendations,
          event_id: recResult.event_id,
        },
        ui_state: {
          current_step: 'results_ready',
          progress: 100,
          rendered_component: 'HotelRecommendations',
        },
      };
    } catch (error) {
      console.error('Hotel search execution error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        status: 'failed',
        data: { 
          error: errorMessage,
          error_type: 'hotel_search_error'
        },
        ui_state: {
          current_step: 'error',
          progress: 0,
          error_message: errorMessage,
        },
      };
    }
  }

  // Flight search flow (existing)
  if (intent.intent_type.startsWith('travel_search')) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/travel-agent/search-flights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          userId: context.profile.id,
          taskId,
          parameters: intent.parameters,
        }),
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorDetails = response.statusText;
        try {
          const errorBody = await response.text();
          if (errorBody) {
            const parsed = JSON.parse(errorBody);
            errorDetails = parsed.error || parsed.message || errorBody;
          }
        } catch {
          // If parsing fails, use statusText
        }
        throw new Error(`Travel agent error: ${errorDetails}`);
      }

      const result = await response.json();

      // Travel-agent already updates the task directly, so fetch the updated task state
      const { data: updatedTask } = await supabase
        .from('tasks')
        .select('output_data, ui_state')
        .eq('id', taskId)
        .single();

      // Use the task's updated state (travel-agent already set rendered_component and output_data)
      return {
        status: updatedTask?.ui_state?.rendered_component ? 'completed' : 'completed',
        data: updatedTask?.output_data || result.data,
        ui_state: updatedTask?.ui_state || {
          current_step: 'results_ready',
          progress: 100,
          rendered_component: 'FlightComparisonGrid',
          results_preview: result.data?.flights?.slice(0, 5) || [],
        },
      };
    } catch (error) {
      console.error('Agent execution error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Try to get more details from the response if available
      let detailedError = errorMessage;
      if (error instanceof Error && error.message.includes('Travel agent error')) {
        // The error might contain response details
        detailedError = errorMessage;
      }
      
      return {
        status: 'failed',
        data: { 
          error: detailedError,
          error_type: 'agent_execution_error'
        },
        ui_state: {
          current_step: 'error',
          progress: 0,
          error_message: detailedError,
        },
      };
    }
  }

  // Default response for other intents
  return {
    status: 'completed',
    data: {},
    ui_state: {
      current_step: 'complete',
      progress: 100,
    },
  };
}

/**
 * Prepare preview for confirmation
 */
async function preparePreviewForConfirmation(
  supabase: any,
  intent: ClassifiedIntent,
  context: UserContext,
  taskId: string
): Promise<{ status: string; data: any; ui_state: TaskUIState }> {
  // Similar to executeAgentPipeline but mark as awaiting confirmation
  const result = await executeAgentPipeline(supabase, intent, context, taskId);

  return {
    ...result,
    status: 'awaiting_human',
    ui_state: {
      ...result.ui_state,
      current_step: 'awaiting_confirmation',
      needs_decision: {
        question: 'I\'ll perform this action. Confirm?',
        options: [
          { id: 'confirm', label: 'Confirm', preview: result.data },
          { id: 'cancel', label: 'Cancel', preview: null },
        ],
      },
    },
  };
}

/**
 * Generate hotel-specific clarifying questions with ChatGPT-like specificity
 */
async function generateHotelClarifyingQuestions(
  supabase: any,
  parsed: any,
  context: UserContext,
  taskId: string,
  originalMessage: string
): Promise<{ status: string; data: any; ui_state: TaskUIState; input_hint?: string }> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  
  let questions: Array<{ id: string; label: string; preview: any }> = [];
  let questionText = 'Let me help you find the perfect hotel.';
  let inputHint = 'Type your response...';

  // Build acknowledgment of what we understood
  const understood: string[] = [];
  if (parsed.city) understood.push(`a hotel in ${parsed.city}`);
  if (parsed.budget_range?.max) understood.push(`under $${parsed.budget_range.max}/night`);
  if (parsed.trip_type) understood.push(`for ${parsed.trip_type}`);
  if (parsed.constraints?.atmosphere?.length) {
    understood.push(`somewhere ${parsed.constraints.atmosphere.join(', ')}`);
  }
  if (parsed.constraints?.design_style?.length) {
    understood.push(`${parsed.constraints.design_style.join(', ')} style`);
  }

  // Build specific questions for missing fields
  const missing = parsed.missing_fields || [];
  const questionsToAsk: string[] = [];
  
  if (missing.includes('city')) {
    questionsToAsk.push('which city are you looking for a hotel in');
    inputHint = 'Enter city (e.g., NYC, London, LA)';
  }
  if (missing.includes('dates') || missing.includes('check_in')) {
    questionsToAsk.push('what dates you\'re looking to stay');
    inputHint = 'Enter dates (e.g., Dec 12-14, next weekend)';
  }
  if (missing.includes('party_size') && parsed.trip_type === 'offsite') {
    questionsToAsk.push('how many guests will be staying');
    inputHint = 'Enter number of guests';
  }

  if (openaiKey) {
    try {
      const prompt = `You are Pier's luxury hotel concierge. The user asked: "${originalMessage}"

What we understood:
${understood.length > 0 ? `- ${understood.join('\n- ')}` : '- Basic hotel request'}

What we need:
${questionsToAsk.length > 0 ? `- ${questionsToAsk.join('\n- ')}` : '- Nothing, we have everything!'}

Generate a helpful, conversational response that:
1. Acknowledges what you understood from their request (be specific)
2. Asks naturally for the missing information
3. Be concise and friendly - like ChatGPT

Examples:
- If missing city: "Great! I can help you find ${understood.length > 1 ? understood.slice(1).join(', ') : 'a hotel'}. Which city are you looking for a hotel in?"
- If missing dates: "Perfect! I can help you find ${understood.join(', ')}. What dates are you looking to stay?"
- If missing both: "I'd be happy to help! Which city are you looking for a hotel in, and what dates are you planning to stay?"

Return JSON:
{
  "question_intro": "A natural, conversational message that acknowledges what you understood and asks for missing info",
  "input_hint": "${inputHint}",
  "questions": [
    {
      "id": "city",
      "label": "Which city are you looking for a hotel in?",
      "parameter": "city"
    }
  ]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful luxury travel concierge. Return only valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const content = result.choices[0]?.message?.content;
        if (content) {
          const parsedResponse = JSON.parse(content);
          questionText = parsedResponse.question_intro || questionText;
          inputHint = parsedResponse.input_hint || inputHint;
          questions = (parsedResponse.questions || []).map((q: any) => ({
            id: q.id,
            label: q.label,
            preview: null,
          }));
        }
      }
    } catch (error) {
      console.error('Error generating hotel clarifying questions:', error);
    }
  }

  // Fallback to simple questions if GPT-4 fails
  if (questions.length === 0) {
    questions = missing.map((info: string, idx: number) => {
      let label = '';
      
      if (info.toLowerCase() === 'city') {
        label = 'Which city are you looking for a hotel in?';
        inputHint = 'Enter city (e.g., NYC, London, LA)';
      } else if (info.toLowerCase().includes('date')) {
        label = 'What dates are you planning to check in?';
        inputHint = 'Enter dates (e.g., Dec 12-14, next weekend)';
      } else if (info.toLowerCase().includes('budget')) {
        label = 'What\'s your budget per night?';
        inputHint = 'Enter budget (e.g., $500/night)';
      } else {
        label = `What's your ${info}?`;
      }
      
      return {
        id: `q${idx}`,
        label,
        preview: null,
      };
    });
  }

  // Update task with parsed request for follow-up handling
  await updateTask(supabase, taskId, {
    input_data: {
      search_type: 'hotel',
      parsed_request: parsed,
      missing_fields: missing,
      input_hint: inputHint,
    },
  });

  return {
    status: 'awaiting_human',
    data: { 
      missing_fields: missing, 
      questions, 
      parsed_request: parsed,
      input_hint: inputHint,
    },
    ui_state: {
      current_step: 'clarifying',
      progress: 30,
      needs_decision: {
        question: questionText,
        options: questions,
      },
    },
    input_hint: inputHint,
  };
}

/**
 * Generate clarifying questions using GPT-4
 */
async function generateClarifyingQuestions(
  supabase: any,
  intent: ClassifiedIntent,
  context: UserContext,
  taskId: string
): Promise<{ status: string; data: any; ui_state: TaskUIState }> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  
  // Check if this is a hotel search FIRST - if so, use hotel-specific clarification
  const { data: task } = await supabase
    .from('tasks')
    .select('description, input_data')
    .eq('id', taskId)
    .single();
  
  const taskInputData = task?.input_data || {};
  if (taskInputData?.search_type === 'hotel' || intent.intent_type === 'travel_search_hotels') {
    // Get the parsed request from task
    const parsed = taskInputData?.parsed_request;
    if (parsed) {
      return await generateHotelClarifyingQuestions(
        supabase,
        parsed,
        context,
        taskId,
        task?.description || ''
      );
    }
  }
  
  // Generate intelligent clarifying questions for non-hotel requests
  let questions: Array<{ id: string; label: string; preview: any }> = [];
  let questionText = 'I need a bit more information to help you:';

  if (openaiKey) {
    try {
      const userMessage = task?.description || 'about travel';


      const prompt = `You are Pier's conversational assistant. The user asked: "${userMessage}"

Missing information: ${intent.missing_info.join(', ')}

User context:
- Home airport: ${context.homeAirport || 'Not set'}
- Preferred airlines: ${context.travelPatterns?.preferredAirlines?.join(', ') || 'None'}
- Upcoming events: ${context.upcomingEvents.length} events

Generate 2-4 natural, conversational questions to gather the missing information. Be specific and helpful.

For flight searches, ask about:
- Dates: "What days are you looking to travel?" or "When do you need to be in [destination]?"
- Origin: "Are you departing from [home airport]?" (if not specified)
- Return: "Is this a round trip or one-way?"
- Passengers: "How many travelers?"

Return JSON:
{
  "question_intro": "Brief intro sentence",
  "questions": [
    {
      "id": "date",
      "label": "What days are you looking to travel?",
      "parameter": "date"
    },
    {
      "id": "origin",
      "label": "Are you departing from NYC (your home city)?",
      "parameter": "origin"
    }
  ]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful travel assistant. Return only valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const content = result.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          questionText = parsed.question_intro || questionText;
          questions = parsed.questions.map((q: any) => ({
            id: q.id,
            label: q.label,
            preview: null,
          }));
        }
      }
    } catch (error) {
      console.error('Error generating clarifying questions:', error);
    }
  }

  // Fallback to simple questions if GPT-4 fails
  if (questions.length === 0) {
    questions = intent.missing_info.map((info, idx) => {
      let label = `What's your ${info}?`;
      
      // Make questions more natural
      if (info.toLowerCase().includes('date') || info.toLowerCase().includes('departure')) {
        label = 'What dates are you looking to travel?';
      } else if (info.toLowerCase().includes('origin') || info.toLowerCase().includes('from')) {
        label = `Are you departing from ${context.homeAirport || 'your home city'}?`;
      } else if (info.toLowerCase().includes('destination') || info.toLowerCase().includes('to')) {
        label = 'Where are you traveling to?';
      } else if (info.toLowerCase().includes('return')) {
        label = 'Is this a round trip or one-way?';
      }
      
      return {
        id: `q${idx}`,
        label,
        preview: null,
      };
    });
  }

  return {
    status: 'awaiting_human',
    data: { missing_info: intent.missing_info, questions },
    ui_state: {
      current_step: 'clarifying',
      progress: 30,
      needs_decision: {
        question: questionText,
        options: questions,
      },
    },
  };
}

/**
 * Escalate to human
 */
async function escalateToHuman(
  supabase: any,
  intent: ClassifiedIntent,
  context: UserContext,
  taskId: string
): Promise<{ status: string; data: any; ui_state: TaskUIState }> {
  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: context.profile.id,
      title: 'Request Needs Review',
      message: 'Your request has been escalated for human review.',
      notification_type: 'alert',
      related_task_id: taskId,
    });

  return {
    status: 'awaiting_human',
    data: { escalation_reason: intent.reasoning },
    ui_state: {
      current_step: 'escalated',
      progress: 0,
    },
  };
}

/**
 * Handle hotel clarification follow-up - merge new info and proceed to recommendations
 */
async function handleHotelClarificationFollowUp(
  supabase: any,
  existingTask: any,
  followUpMessage: string,
  originalParsed: any,
  context: UserContext,
  userId: string
): Promise<{ task: any; response: string; intent: ClassifiedIntent; strategy: string }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  console.log('=== HOTEL CLARIFICATION FOLLOW-UP ===');
  console.log('Follow-up message:', followUpMessage);
  console.log('Original parsed:', JSON.stringify(originalParsed, null, 2));
  console.log('Existing task ID:', existingTask.id);

  // Parse the follow-up message to extract the missing info
  // Include the original message for context so the parser understands it's completing a request
  const parseUrl = `${supabaseUrl}/functions/v1/parse-hotel-request`;
  console.log('Calling parse-hotel-request (follow-up):', parseUrl);
  
  const parseResponse = await fetch(parseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      message: followUpMessage,
      user_id: userId,
      conversation_history: [
        { role: 'user', content: existingTask.description || '' },
        { role: 'assistant', content: 'What dates are you looking to stay?' },
      ],
    }),
  });

  if (!parseResponse.ok) {
    const errorText = await parseResponse.text();
    console.error('Parse hotel request failed (follow-up):', {
      status: parseResponse.status,
      statusText: parseResponse.statusText,
      url: parseUrl,
      errorBody: errorText,
    });
    
    // If function not found, provide helpful error
    if (parseResponse.status === 404) {
      throw new Error(`parse-hotel-request function not found. Please ensure it is deployed. Status: ${parseResponse.status}, URL: ${parseUrl}`);
    }
    
    throw new Error(`Parse hotel request error: ${parseResponse.status} ${parseResponse.statusText}. ${errorText}`);
  }

  const parseResult = await parseResponse.json();
  const clarificationParsed = parseResult.parsed_request;
  
  console.log('Clarification parsed:', JSON.stringify(clarificationParsed, null, 2));

  // Merge the new info with original request
  const mergedRequest = {
    ...originalParsed,
    city: clarificationParsed.city || originalParsed.city,
    neighborhood: clarificationParsed.neighborhood || originalParsed.neighborhood,
    dates: {
      check_in: clarificationParsed.dates?.check_in || originalParsed.dates?.check_in,
      check_out: clarificationParsed.dates?.check_out || originalParsed.dates?.check_out,
    },
    budget_range: {
      min: clarificationParsed.budget_range?.min ?? originalParsed.budget_range?.min,
      max: clarificationParsed.budget_range?.max ?? originalParsed.budget_range?.max,
    },
    party_size: clarificationParsed.party_size || originalParsed.party_size || 1,
    trip_type: clarificationParsed.trip_type || originalParsed.trip_type,
    constraints: {
      ...originalParsed.constraints,
      ...clarificationParsed.constraints,
      atmosphere: [
        ...(originalParsed.constraints?.atmosphere || []),
        ...(clarificationParsed.constraints?.atmosphere || []),
      ],
      design_style: [
        ...(originalParsed.constraints?.design_style || []),
        ...(clarificationParsed.constraints?.design_style || []),
      ],
    },
  };

  // Recalculate missing fields
  const stillMissing: string[] = [];
  if (!mergedRequest.city) stillMissing.push('city');
  if (!mergedRequest.dates?.check_in || !mergedRequest.dates?.check_out) {
    if (!mergedRequest.dates?.check_in) {
      stillMissing.push('dates');
    } else if (!mergedRequest.dates?.check_out) {
      // If we have check_in but not check_out, infer it (1 night default)
      const checkInDate = new Date(mergedRequest.dates.check_in);
      checkInDate.setDate(checkInDate.getDate() + 1);
      mergedRequest.dates.check_out = checkInDate.toISOString().split('T')[0];
    }
  }
  
  console.log('Merged request:', mergedRequest);
  console.log('Still missing:', stillMissing);

  // If still missing critical info, ask again
  if (stillMissing.length > 0) {
    const clarificationResult = await generateHotelClarifyingQuestions(
      supabase,
      { ...mergedRequest, missing_fields: stillMissing },
      context,
      existingTask.id,
      `${existingTask.description}\n\nFollow-up: ${followUpMessage}`
    );

    await updateTask(supabase, existingTask.id, {
      status: 'awaiting_human',
      input_data: {
        ...existingTask.input_data,
        parsed_request: mergedRequest,
        missing_fields: stillMissing,
      },
      ui_state: clarificationResult.ui_state,
    });

    return {
      task: existingTask,
      response: clarificationResult.ui_state.needs_decision?.question || 'I need a bit more information.',
      intent: {
        intent_type: 'travel_search_hotels',
        confidence: 0.7,
        risk_level: 'low',
        parameters: {},
        reasoning: 'Still missing critical information',
        missing_info: stillMissing,
        assumptions: [],
      },
      strategy: 'clarify',
    };
  }

  // We have everything! Get recommendations
  console.log('All info gathered, getting recommendations:', JSON.stringify(mergedRequest, null, 2));

  // Validate we have required fields
  if (!mergedRequest.city) {
    throw new Error('City is required but missing in merged request');
  }
  if (!mergedRequest.dates?.check_in || !mergedRequest.dates?.check_out) {
    throw new Error('Dates are required but missing in merged request');
  }

  await updateTask(supabase, existingTask.id, {
    ui_state: {
      current_step: 'executing',
      progress: 50,
    },
  });

  // Get recommendations
  const recUrl = `${supabaseUrl}/functions/v1/get-hotel-recommendations`;
  console.log('Calling get-hotel-recommendations (follow-up):', recUrl);
  console.log('Request params:', {
    city: mergedRequest.city,
    check_in: mergedRequest.dates.check_in,
    check_out: mergedRequest.dates.check_out,
  });

  const recResponse = await fetch(recUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      parsed_request: mergedRequest,
      user_id: userId,
      limit: 3,
      include_reasoning: true,
    }),
  });

  if (!recResponse.ok) {
    const errorText = await recResponse.text();
    console.error('Get hotel recommendations failed (follow-up):', {
      status: recResponse.status,
      statusText: recResponse.statusText,
      url: recUrl,
      errorBody: errorText,
    });
    
    if (recResponse.status === 404) {
      throw new Error(`get-hotel-recommendations function not found. Please ensure it is deployed. Status: ${recResponse.status}, URL: ${recUrl}`);
    }
    
    throw new Error(`Get hotel recommendations error: ${recResponse.status} ${recResponse.statusText}. ${errorText}`);
  }

  // Get raw response text first for debugging
  const recResponseText = await recResponse.text();
  console.log('Raw recommendation response:', recResponseText.substring(0, 500));
  
  let recResult;
  try {
    recResult = JSON.parse(recResponseText);
  } catch (e) {
    console.error('Failed to parse recommendation response:', e);
    console.error('Response text:', recResponseText);
    throw new Error('Invalid response from get-hotel-recommendations');
  }
  
  console.log('Parsed recommendation result:', {
    success: recResult.success,
    count: recResult.recommendations?.length || 0,
    error: recResult.error,
    hasRecommendations: !!recResult.recommendations,
  });
  
  console.log('=== RECOMMENDATIONS RECEIVED (FOLLOW-UP) ===');
  console.log('Success:', recResult.success);
  console.log('Recommendations count:', recResult.recommendations?.length || 0);
  console.log('Has recommendations array:', Array.isArray(recResult.recommendations));
  console.log('Full recResult keys:', Object.keys(recResult));
  if (recResult.recommendations && recResult.recommendations.length > 0) {
    console.log('First recommendation:', JSON.stringify(recResult.recommendations[0], null, 2));
  }

  if (!recResult.success) {
    console.error('Recommendations failed:', recResult.error);
  }

  // If no recommendations, fall back to search-hotels
  if (!recResult.success || !recResult.recommendations || !Array.isArray(recResult.recommendations) || recResult.recommendations.length === 0) {
    console.log('No curated recommendations, falling back to search-hotels');
    console.log('RecResult details:', {
      success: recResult.success,
      recommendationsCount: recResult.recommendations?.length || 0,
      error: recResult.error,
      hasRecommendations: !!recResult.recommendations,
    });
    const fallbackResponse = await fetch(`${supabaseUrl}/functions/v1/search-hotels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        location: mergedRequest.city || '',
        check_in_date: mergedRequest.dates.check_in || '',
        check_out_date: mergedRequest.dates.check_out || '',
        guests: mergedRequest.party_size || 1,
        max_price: mergedRequest.budget_range.max || undefined,
      }),
    });

    if (fallbackResponse.ok) {
      const fallbackResult = await fallbackResponse.json();
      await updateTask(supabase, existingTask.id, {
        output_data: {
          search_type: 'hotel',
          recommendations: fallbackResult.results || [],
          fallback_used: true,
        },
        ui_state: {
          current_step: 'results_ready',
          progress: 100,
          rendered_component: 'HotelRecommendations',
        },
        status: 'completed',
      });

      return {
        task: existingTask,
        response: `I found ${fallbackResult.results?.length || 0} hotel options for you. Check the results below.`,
        intent: {
          intent_type: 'travel_search_hotels',
          confidence: 0.9,
          risk_level: 'low',
          parameters: {},
          reasoning: 'Found hotels via fallback search',
          missing_info: [],
          assumptions: [],
        },
        strategy: 'auto_execute',
      };
    }
  }

  // Update UI: Ranking results
  await updateTask(supabase, existingTask.id, {
    ui_state: {
      current_step: 'ranking_results',
      progress: 80,
      status_message: 'Matching with your preferences...',
    },
  });

  // Get rates for top picks
  const topHotelIds = recResult.recommendations.slice(0, 3).map((r: any) => {
    const id = r.hotel_id || r.id;
    if (!id) {
      console.error('Recommendation missing hotel_id:', r);
    }
    return id;
  }).filter((id: string) => id); // Filter out any undefined/null IDs
  let rates: any[] = [];

  if (mergedRequest.dates.check_in && mergedRequest.dates.check_out) {
    const ratesResponse = await fetch(`${supabaseUrl}/functions/v1/get-hotel-rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        hotel_ids: topHotelIds,
        check_in: mergedRequest.dates.check_in,
        check_out: mergedRequest.dates.check_out,
        guests: mergedRequest.party_size || 1,
      }),
    });

    if (ratesResponse.ok) {
      const ratesResult = await ratesResponse.json();
      rates = ratesResult.results || [];
    }
  }

  // Format recommendations
  const recommendations = recResult.recommendations.map((rec: any) => {
    const rateData = rates.find((r: any) => r.hotel_id === rec.hotel_id);
    return {
      ...rec,
      rates: rateData?.rates || [],
    };
  });

  // Format response message
  const checkIn = new Date(mergedRequest.dates.check_in).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const checkOut = new Date(mergedRequest.dates.check_out).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  let responseMessage = `Here are my top picks for your ${mergedRequest.trip_type || ''} trip to ${mergedRequest.city} (${checkIn} - ${checkOut}):\n\n`;

  recommendations.forEach((rec: any, i: number) => {
    responseMessage += `${i + 1}. **${rec.name}** — ${rec.neighborhood}\n`;
    responseMessage += `${rec.reason}\n`;
    responseMessage += `💰 ~$${rec.rate_estimate.mid}/night`;
    if (rec.pier_benefits?.length > 0) {
      responseMessage += ` • Pier perks: ${rec.pier_benefits.join(', ')}`;
    }
    responseMessage += '\n\n';
  });

  responseMessage += `Would you like me to book one of these, or would you like different options?`;

  // Update task with results
  await updateTask(supabase, existingTask.id, {
    status: 'completed',
    output_data: {
      search_type: 'hotel',
      parsed_request: mergedRequest,
      recommendations: recommendations,
      hotels: recommendations, // Also save as 'hotels' for frontend compatibility
      event_id: recResult.event_id,
      candidates_evaluated: recResult.candidates_evaluated,
    },
    ui_state: {
      current_step: 'results_ready',
      progress: 100,
      rendered_component: 'HotelRecommendations',
    },
    completed_at: new Date().toISOString(),
  });

  console.log('Task updated with recommendations (follow-up):', recommendations.length);

  return {
    task: existingTask,
    response: responseMessage,
    intent: {
      intent_type: 'travel_search_hotels',
      confidence: 0.95,
      risk_level: 'low',
      parameters: {},
      reasoning: 'Successfully found hotel recommendations',
      missing_info: [],
      assumptions: [],
    },
    strategy: 'auto_execute',
  };
}

/**
 * Generate conversational response
 */
async function generateConversationalResponse(
  result: { status: string; data: any; ui_state: TaskUIState },
  context: UserContext,
  intent: ClassifiedIntent
): Promise<string> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  if (!openaiKey) {
    // Fallback response
    if (result.status === 'completed' && result.ui_state.rendered_component === 'FlightComparisonGrid') {
      return `I found ${result.data?.flights?.length || 0} flight options for you. Check the results below.`;
    }
    return 'I\'ve processed your request. Check the task details for results.';
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are Pier, a luxury travel concierge. Generate a brief, helpful response based on the task result. 
            Be ${context.communicationStyle.verbosity === 'terse' ? 'brief and concise' : 'helpful and detailed'}.`,
          },
          {
            role: 'user',
            content: `Task status: ${result.status}
            Intent: ${intent.intent_type}
            Results: ${JSON.stringify(result.data)}
            Generate a conversational response.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'I\'ve processed your request.';
  } catch (error) {
    console.error('Response generation error:', error);
    return 'I\'ve processed your request. Check the task details for results.';
  }
}

/**
 * Main handler - Task-first architecture
 */
async function handleUserMessage(
  supabase: any,
  userId: string,
  message: string,
  relatedTaskId?: string
) {
  console.log('=== HANDLE USER MESSAGE ===');
  console.log('Message:', message);
  console.log('Related task ID:', relatedTaskId);
  console.log('User ID:', userId);
  
  // Check if this is a follow-up to an existing clarifying task
  let existingTask = null;
  if (relatedTaskId) {
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', relatedTaskId)
      .eq('user_id', userId)
      .eq('status', 'awaiting_human')
      .single();
    
    if (task && task.decision_strategy === 'clarify') {
      existingTask = task;
    }
  }

  // If no existing task, check for recent clarifying task
  if (!existingTask) {
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'awaiting_human')
      .eq('decision_strategy', 'clarify')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (recentTasks && recentTasks.length > 0) {
      const recentTask = recentTasks[0];
      // Check if task was created in last 10 minutes (likely a follow-up)
      const taskAge = Date.now() - new Date(recentTask.created_at).getTime();
      if (taskAge < 10 * 60 * 1000) { // 10 minutes - increased window
        existingTask = recentTask;
        console.log('Found recent clarifying task:', existingTask.id);
      }
    }
  }

  // If this is a follow-up, update the existing task with the answer
  if (existingTask) {
    console.log('Existing clarifying task found:', existingTask.id);
    console.log('Task input_data:', JSON.stringify(existingTask.input_data, null, 2));
    console.log('Task assigned_agent:', existingTask.assigned_agent);
    
    const context = await getUserContext(supabase, userId);
    
    // Check if this is a hotel clarification follow-up
    const taskInputData = existingTask.input_data || {};
    const originalParsed = taskInputData.parsed_request;
    
    console.log('Checking if hotel follow-up:', {
      hasParsed: !!originalParsed,
      assignedAgent: existingTask.assigned_agent,
      searchType: taskInputData.search_type,
    });
    
    if (originalParsed && (existingTask.assigned_agent === 'hotel' || taskInputData.search_type === 'hotel')) {
      console.log('This is a hotel clarification follow-up - routing to handleHotelClarificationFollowUp');
      // This is a hotel clarification follow-up - handle it specially
      return await handleHotelClarificationFollowUp(
        supabase,
        existingTask,
        message,
        originalParsed,
        context,
        userId
      );
    }
    
    // Re-classify with the new information
    const originalMessage = existingTask.description || '';
    const combinedMessage = `${originalMessage}. Additional info: ${message}`;
    const intent = await classifyIntentWithRisk(combinedMessage, context);
    
    // Update task with new parameters - don't append to description to avoid duplicates
    const cleanDescription = originalMessage.split('\n\nFollow-up:')[0]; // Remove any existing follow-up text
    await updateTask(supabase, existingTask.id, {
      description: cleanDescription, // Keep original, don't append
      confidence_score: intent.confidence,
      input_data: {
        ...existingTask.input_data,
        follow_up: message,
        updated_parameters: intent.parameters,
      },
    });

    // Re-determine strategy with updated info
    const strategy = determineExecutionStrategy(
      intent.confidence,
      intent.risk_level,
      intent.missing_info,
      intent.intent_type
    );

    await updateTask(supabase, existingTask.id, {
      decision_strategy: strategy,
      ui_state: {
        current_step: strategy === 'auto_execute' ? 'executing' : 'processing',
        progress: 50,
      },
    });

    // Route based on new strategy
    let result;
    switch (strategy) {
      case 'auto_execute':
        result = await executeAgentPipeline(supabase, intent, context, existingTask.id);
        break;
      case 'preview_confirm':
        result = await preparePreviewForConfirmation(supabase, intent, context, existingTask.id);
        break;
      case 'clarify':
        result = await generateClarifyingQuestions(supabase, intent, context, existingTask.id);
        break;
      case 'escalate':
        result = await escalateToHuman(supabase, intent, context, existingTask.id);
        break;
    }

    await updateTask(supabase, existingTask.id, {
      status: result.status,
      output_data: result.data,
      ui_state: result.ui_state,
      completed_at: result.status === 'completed' ? new Date().toISOString() : null,
    });

    const response = await generateConversationalResponse(result, context, intent);
    
    await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        role: 'assistant',
        content: response,
        related_task_id: existingTask.id,
        metadata: {
          intent: intent.intent_type,
          confidence: intent.confidence,
          strategy,
        },
      });

    return { task: existingTask, response, intent, strategy };
  }

  // 1. Generate idempotency key
  const idempotencyKey = generateIdempotencyKey(userId, message);

  // 2. Create task immediately (optimistic)
  const { data: task, error: taskError } = await createTask(
    supabase,
    userId,
    message,
    idempotencyKey
  );

  if (taskError || !task) {
    throw new Error(`Failed to create task: ${taskError?.message || 'Unknown error'}`);
  }

  // 3. Gather rich context
  const context = await getUserContext(supabase, userId);

  // 4. Classify intent AND assess confidence + risk
  const intent = await classifyIntentWithRisk(message, context);

  await updateTask(supabase, task.id, {
    confidence_score: intent.confidence,
    risk_level: intent.risk_level,
    llm_reasoning: {
      intent_type: intent.intent_type,
      reasoning: intent.reasoning,
      assumptions: intent.assumptions,
    },
    input_data: {
      message,
      intent: intent.intent_type,
      parameters: intent.parameters,
    },
  });

  // 5. Determine execution strategy
  const strategy = determineExecutionStrategy(
    intent.confidence,
    intent.risk_level,
    intent.missing_info,
    intent.intent_type
  );

  await updateTask(supabase, task.id, {
    decision_strategy: strategy,
    assigned_agent: intent.intent_type.startsWith('travel') ? 'travel' :
                   intent.intent_type.startsWith('calendar') ? 'scheduling' :
                   intent.intent_type.startsWith('loyalty') ? 'loyalty' : null,
    ui_state: {
      current_step: strategy === 'auto_execute' ? 'executing' : 'awaiting_confirmation',
      progress: 25,
    },
  });

  // 6. Route to appropriate handler
  let result;
  switch (strategy) {
    case 'auto_execute':
      result = await executeAgentPipeline(supabase, intent, context, task.id);
      break;
    case 'preview_confirm':
      result = await preparePreviewForConfirmation(supabase, intent, context, task.id);
      break;
    case 'clarify':
      result = await generateClarifyingQuestions(supabase, intent, context, task.id);
      break;
    case 'escalate':
      result = await escalateToHuman(supabase, intent, context, task.id);
      break;
  }

  // 7. Update task with final state
  // Check if agent already updated the task (travel-agent updates directly)
  const { data: currentTask } = await supabase
    .from('tasks')
    .select('output_data, ui_state, status')
    .eq('id', task.id)
    .single();
  
  // Merge updates - preserve agent's direct updates
  const finalOutputData = currentTask?.output_data || result.data;
  const finalUIState = currentTask?.ui_state?.rendered_component 
    ? currentTask.ui_state 
    : result.ui_state;
  const finalStatus = currentTask?.status === 'completed' 
    ? 'completed' 
    : result.status;

  await updateTask(supabase, task.id, {
    status: finalStatus,
    output_data: finalOutputData,
    ui_state: finalUIState,
    completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
  });

  // 8. Generate human-readable response
  // If result has a needs_decision question, use that as the response
  let response: string;
  if (result.ui_state?.needs_decision?.question) {
    response = result.ui_state.needs_decision.question;
  } else {
    response = await generateConversationalResponse(result, context, intent);
  }

  // 9. Store in conversations
  await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      role: 'assistant',
      content: response,
      related_task_id: task.id,
      metadata: {
        intent: intent.intent_type,
        confidence: intent.confidence,
        strategy,
      },
    });

  return { task, response, intent, strategy };
}

// Main handler
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, message, relatedTaskId }: ChatRequest & { relatedTaskId?: string } = await req.json();

    if (!userId || !message) {
      return new Response(
        JSON.stringify({ error: 'userId and message are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Orchestrator processing:', { userId, messageLength: message.length });

    const result = await handleUserMessage(supabase, userId, message, relatedTaskId);

    // Get input_hint from task if available
    const taskData = result.task?.input_data || {};
    const inputHint = taskData.input_hint || 
                      result.task?.ui_state?.input_hint || 
                      result.task?.data?.input_hint ||
                      undefined;

    return new Response(
      JSON.stringify({
        success: true,
        task: result.task,
        response: result.response,
        intent: result.intent.intent_type,
        confidence: result.intent.confidence,
        strategy: result.strategy,
        input_hint: inputHint,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Orchestrator error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Try to return the task if it was created, even if there was an error
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        // Include any partial task data if available
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
