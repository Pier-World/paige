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
    const { userId, action, eventData } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'init') {
      return await initialSync(userId);
    } else if (action === 'create') {
      return await createEvent(userId, eventData);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Calendar sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function initialSync(userId: string) {
  const token = await getValidGoogleToken(userId, 'google_calendar');

  // Fetch events from primary calendar (next 30 days)
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Calendar API error: ${error}`);
  }

  const data = await response.json();
  const events = data.items || [];

  // Store events
  let processedCount = 0;
  for (const event of events) {
    try {
      const { error: upsertError } = await supabase.from('calendar_events').upsert({
        user_id: userId,
        gcal_event_id: event.id,
        gcal_calendar_id: 'primary',
        title: event.summary,
        description: event.description,
        location: event.location,
        start_time: event.start.dateTime || event.start.date,
        end_time: event.end.dateTime || event.end.date,
        all_day: !event.start.dateTime,
        time_zone: event.start.timeZone,
        status: event.status || 'confirmed',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,gcal_event_id',
      });

      if (upsertError) {
        console.error(`Error storing event ${event.id}:`, upsertError);
      } else {
        processedCount++;
      }
    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
    }
  }

  // Update last_sync_at
  await supabase
    .from('integrations')
    .update({
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'google_calendar');

  return new Response(
    JSON.stringify({ success: true, eventsProcessed: processedCount }),
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

