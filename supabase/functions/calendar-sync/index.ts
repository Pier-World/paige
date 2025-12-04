import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getValidGoogleToken } from '../_shared/google-oauth.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Support both JSON body and URL params for userId
    let userId: string | null = null;
    let action: string | null = null;
    let eventData: any = null;

    try {
      const body = await req.json();
      userId = body.userId;
      action = body.action;
      eventData = body.eventData;
    } catch {
      // If JSON parsing fails, try URL params
      const url = new URL(req.url);
      userId = url.searchParams.get('userId');
      action = url.searchParams.get('action') || 'init';
    }

    // Also try to get userId from Authorization header (for service role calls)
    if (!userId) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        // For now, require userId in body/params
        // Could extract from JWT token if needed
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'init' || !action) {
      return await initialSync(userId);
    } else if (action === 'create') {
      if (!eventData) {
        return new Response(
          JSON.stringify({ error: 'Missing eventData for create action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return await createEvent(userId, eventData);
    } else if (action === 'sync') {
      // Alias for init
      return await initialSync(userId);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "init", "sync", or "create"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Calendar sync error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function initialSync(userId: string) {
  const token = await getValidGoogleToken(userId, 'google_calendar');

  // Get integration to check last sync time
  const { data: integration } = await supabase
    .from('integrations')
    .select('last_sync_at, sync_cursor')
    .eq('user_id', userId)
    .eq('provider', 'google_calendar')
    .single();

  // For initial sync, fetch events from past 7 days to future 60 days
  // For incremental sync, use syncToken if available
  const timeMin = integration?.last_sync_at 
    ? new Date(integration.last_sync_at).toISOString()
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Past 7 days
  const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // Next 60 days

  // Build API URL - explicitly request attendees and other fields in the response
  // Using fields parameter ensures we get attendees data
  const fields = 'items(id,summary,description,location,start,end,status,attendees,htmlLink),nextSyncToken';
  let apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=2500&fields=${encodeURIComponent(fields)}`;
  
  // Use syncToken for incremental sync if available
  if (integration?.sync_cursor) {
    apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?syncToken=${encodeURIComponent(integration.sync_cursor)}&fields=${encodeURIComponent(fields)}`;
  }

  const response = await fetch(apiUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    // If syncToken is invalid, do full sync
    if (integration?.sync_cursor && response.status === 410) {
      console.log('Sync token expired, doing full sync');
      return await initialSync(userId); // Retry without syncToken
    }
    throw new Error(`Google Calendar API error: ${error}`);
  }

  const data = await response.json();
  const events = data.items || [];
  const nextSyncToken = data.nextSyncToken; // For incremental sync

  // Store events
  let processedCount = 0;
  let errorCount = 0;
  
  for (const event of events) {
    try {
      // Skip cancelled events
      if (event.status === 'cancelled') {
        // Delete from our DB if it exists
        await supabase
          .from('calendar_events')
          .delete()
          .eq('user_id', userId)
          .eq('gcal_event_id', event.id);
        continue;
      }

      // Extract attendees from Google Calendar event
      // Log raw event data for first few events to debug
      if (processedCount < 3) {
        console.log(`Event "${event.summary}" raw data:`, {
          hasAttendees: !!event.attendees,
          attendeesType: typeof event.attendees,
          attendeesIsArray: Array.isArray(event.attendees),
          attendeesLength: event.attendees?.length,
          attendeesSample: event.attendees?.slice(0, 2)
        });
      }

      const attendees = event.attendees && Array.isArray(event.attendees) && event.attendees.length > 0
        ? event.attendees.map((a: any) => {
            // Handle both object and string formats
            if (typeof a === 'string') {
              return { email: a, displayName: a, responseStatus: 'needsAction' };
            }
            return {
              email: a.email || null,
              displayName: a.displayName || a.email || 'Unknown',
              responseStatus: a.responseStatus || 'needsAction',
            };
          })
        : [];

      // Store metadata with attendees (always include attendees array in metadata if event has attendees field)
      const metadata = event.attendees !== undefined ? { attendees } : null;

      const { error: upsertError } = await supabase.from('calendar_events').upsert({
        user_id: userId,
        gcal_event_id: event.id,
        gcal_calendar_id: 'primary',
        title: event.summary || '(No title)',
        description: event.description || null,
        location: event.location || null,
        start_time: event.start.dateTime || event.start.date,
        end_time: event.end.dateTime || event.end.date,
        all_day: !event.start.dateTime,
        time_zone: event.start.timeZone || 'UTC',
        status: event.status || 'confirmed',
        metadata: metadata,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,gcal_event_id',
      });

      // Enhanced logging for attendees
      if (attendees.length > 0) {
        console.log(`✅ Event "${event.summary}" has ${attendees.length} attendees:`, attendees.map((a: any) => a.displayName || a.email));
      } else {
        console.log(`⚠️ Event "${event.summary}" - attendees: ${event.attendees === undefined ? 'undefined' : event.attendees === null ? 'null' : Array.isArray(event.attendees) ? `empty array (length: ${event.attendees.length})` : `unexpected type: ${typeof event.attendees}`}`);
      }

      if (upsertError) {
        console.error(`Error storing event ${event.id}:`, upsertError);
        errorCount++;
      } else {
        processedCount++;
      }
    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
      errorCount++;
    }
  }

  // Update integration with sync status
  await supabase
    .from('integrations')
    .update({
      last_sync_at: new Date().toISOString(),
      sync_cursor: nextSyncToken || null, // Store syncToken for next incremental sync
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'google_calendar');

  return new Response(
    JSON.stringify({ 
      success: true, 
      eventsProcessed: processedCount,
      eventsWithErrors: errorCount,
      totalEvents: events.length,
      nextSyncToken: nextSyncToken ? 'stored' : null,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function createEvent(userId: string, eventData: any) {
  const token = await getValidGoogleToken(userId, 'google_calendar');

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: {
          dateTime: eventData.startTime,
          timeZone: eventData.timeZone || 'America/New_York',
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: eventData.timeZone || 'America/New_York',
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Calendar API error: ${error}`);
  }

  const event = await response.json();

  // Store in our DB
  await supabase.from('calendar_events').insert({
    user_id: userId,
    gcal_event_id: event.id,
    gcal_calendar_id: 'primary',
    title: event.summary,
    description: event.description,
    location: event.location,
    start_time: event.start.dateTime,
    end_time: event.end.dateTime,
    all_day: !event.start.dateTime,
    time_zone: event.start.timeZone,
    status: event.status || 'confirmed',
  });

  return new Response(
    JSON.stringify({ success: true, event }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

