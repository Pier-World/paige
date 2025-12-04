// Comprehensive User Context for Intelligent Orchestration
// This is the "secret sauce" that makes Pier intelligent

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface TravelPatterns {
  preferredAirlines: string[];
  typicalBookingWindow: number; // days in advance
  priceVsSchedule: number; // 0-1 scale (0 = price, 1 = schedule)
  averageSpendPerTrip: number;
  preferredDepartureTime: 'morning' | 'afternoon' | 'evening' | null;
  frequentDestinations: string[];
  typicalTripDuration: number; // days
}

export interface LoyaltyAccount {
  program: string;
  accountNumber: string;
  points: number;
  tier: string;
  redemptionValue: number; // cents per point
}

export interface CommunicationStyle {
  verbosity: 'terse' | 'balanced' | 'detailed';
  prefersOptions: boolean; // true = show choices, false = make smart defaults
  preferredResponseFormat: 'text' | 'structured';
}

export interface SearchIntent {
  intent: string;
  params: Record<string, any>;
  timestamp: Date;
}

export interface UserContext {
  // Core identity
  profile: any;
  preferences: any;
  
  // Behavioral intelligence
  recentTasks: any[];
  recentSearches: SearchIntent[];
  pendingTasks: any[];
  
  // Temporal awareness
  upcomingEvents: any[];
  upcomingTrips: any[];
  todaySchedule: any[];
  tomorrowSchedule: any[];
  
  // Learned patterns
  travelPatterns?: TravelPatterns;
  
  // Loyalty intelligence
  loyaltyAccounts: LoyaltyAccount[];
  
  // Communication preferences
  communicationStyle: CommunicationStyle;
  
  // Additional context
  homeAirport?: string;
  currentLocation?: string;
  timeZone: string;
}

/**
 * Get comprehensive user context - the secret sauce
 */
export async function getUserContext(
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
    typicalBookingWindow: personalContext.typicalBookingWindow || 14, // default 2 weeks
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
    prefersOptions: commPrefs.prefersOptions !== false, // default true
    preferredResponseFormat: commPrefs.preferredResponseFormat || 'structured',
  };

  // Extract home airport from profile or personal context
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
export function inferReturnDate(
  context: UserContext,
  departDate: string
): string | null {
  const depart = new Date(departDate);
  const typicalDuration = context.travelPatterns?.typicalTripDuration || 3;
  const expectedReturn = new Date(depart);
  expectedReturn.setDate(expectedReturn.getDate() + typicalDuration);

  // Look for calendar events after expected return
  const eventsAfterReturn = context.upcomingEvents.filter((event: any) => {
    const eventDate = new Date(event.start_time);
    return eventDate >= expectedReturn && eventDate <= new Date(expectedReturn.getTime() + 7 * 24 * 60 * 60 * 1000);
  });

  if (eventsAfterReturn.length > 0) {
    // Return date is likely the day before the first event
    const firstEvent = new Date(eventsAfterReturn[0].start_time);
    firstEvent.setDate(firstEvent.getDate() - 1);
    return firstEvent.toISOString().split('T')[0];
  }

  // Default to typical duration
  return expectedReturn.toISOString().split('T')[0];
}

/**
 * Check for time conflicts between flight and calendar events
 */
export function isTimeConflict(
  flightTime: string,
  eventStart: string,
  bufferMinutes: number = 120
): boolean {
  const flight = new Date(flightTime);
  const event = new Date(eventStart);
  const buffer = bufferMinutes * 60 * 1000;

  // Check if flight arrival conflicts with event (within buffer)
  return Math.abs(flight.getTime() - event.getTime()) < buffer;
}

