/**
 * Script to check detected trips from calendar scanner
 * 
 * Usage: node check_detected_trips.js
 * 
 * Make sure to set these environment variables:
 * - SUPABASE_URL
 * - SUPABASE_ANON_KEY (or use service role key for this query)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://oifchjaqembbkdyfjctp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const userId = '66f01217-1e16-40e2-86cf-bb5afef42f4c';

async function checkDetectedTrips() {
  console.log('Fetching detected trips...\n');

  const { data, error } = await supabase
    .from('potential_trips')
    .select(`
      id,
      destination,
      destination_city,
      start_date,
      end_date,
      confidence_score,
      trip_type,
      status,
      metadata,
      created_at
    `)
    .eq('user_id', userId)
    .eq('detection_source', 'calendar')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching trips:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No trips detected yet.');
    return;
  }

  console.log(`Found ${data.length} detected trip(s):\n`);
  console.log('='.repeat(80));

  data.forEach((trip, index) => {
    console.log(`\n${index + 1}. Trip ID: ${trip.id}`);
    console.log(`   Destination: ${trip.destination}`);
    console.log(`   City: ${trip.destination_city || 'N/A'}`);
    console.log(`   Dates: ${trip.start_date} to ${trip.end_date}`);
    console.log(`   Confidence: ${trip.confidence_score}%`);
    console.log(`   Type: ${trip.trip_type || 'unknown'}`);
    console.log(`   Status: ${trip.status}`);
    console.log(`   Event: ${trip.metadata?.calendar_event_title || 'N/A'}`);
    console.log(`   Reasoning: ${trip.metadata?.detection_reasoning || 'N/A'}`);
    console.log(`   Created: ${new Date(trip.created_at).toLocaleString()}`);
    console.log('-'.repeat(80));
  });

  // Summary
  console.log('\n\nSummary:');
  console.log(`Total trips: ${data.length}`);
  console.log(`Average confidence: ${(data.reduce((sum, t) => sum + t.confidence_score, 0) / data.length).toFixed(1)}%`);
  console.log(`Trip types: ${[...new Set(data.map(t => t.trip_type))].join(', ')}`);
  console.log(`Statuses: ${[...new Set(data.map(t => t.status))].join(', ')}`);
}

checkDetectedTrips().catch(console.error);

