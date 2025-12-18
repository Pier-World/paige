import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Plane, Users, Video, ChevronLeft, ChevronRight, Plus, ExternalLink, Settings } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { EventDetailModal } from '../components/ui/EventDetailModal';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: string;
  type: 'dinner' | 'flight' | 'meeting' | 'experience';
  title: string;
  date: string; // YYYY-MM-DD format
  time: string;
  endTime?: string;
  location?: string;
  attendees?: string[]; // Array of attendee names/emails
  description?: string;
  startTime: Date; // Full Date object for comparison
  endTimeDate?: Date;
  gcalEventId?: string;
  isPast: boolean;
}

const iconMap = {
  dinner: Users,
  flight: Plane,
  meeting: Video,
  experience: MapPin,
};

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [calendarIntegrations, setCalendarIntegrations] = useState<any[]>([]);
  const [isCheckingConnections, setIsCheckingConnections] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Start from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  useEffect(() => {
    if (user) {
      loadEvents();
      checkConnections();
    } else {
      setLoading(false);
      setIsCheckingConnections(false);
    }
  }, [user, currentWeekStart]);

  // Helper function to get local date string (YYYY-MM-DD) from a Date object
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  async function loadEvents() {
    if (!user) {
      setLoading(false);
      return;
    }

    // Quick connection test before loading data
    try {
      const { error: testError } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (testError) {
        console.error('Supabase connection test failed:', testError);
        setLoading(false);
        setEvents([]);
        return;
      }
    } catch (testErr) {
      console.error('Supabase connection error:', testErr);
      setLoading(false);
      setEvents([]);
      return;
    }

    try {
      // Use Promise.race to handle timeout properly
      let timeoutId: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn('Calendar events load timeout - queries taking too long');
          resolve(null);
        }, 30000); // Increased to 30 seconds from 15s
      });

      // Calculate 7-day window
      const startDate = new Date(currentWeekStart);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);

      const queryPromise = supabase
        .from('calendar_events')
        .select('*, metadata')
        .eq('user_id', user.id)
        .gte('start_time', startDate.toISOString())
        .lt('start_time', endDate.toISOString())
        .order('start_time');

      // Race between query and timeout
      let result: any = null;
      let timedOut = false;
      
      try {
        result = await Promise.race([
          queryPromise,
          timeoutPromise.then(() => {
            timedOut = true;
            return null;
          })
        ]);
      } catch (error) {
        console.error('Error in Promise.race:', error);
        timedOut = true;
      }
      
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // If timeout won, result will be null
      if (timedOut || result === null) {
        console.error('Calendar events query timed out');
        setLoading(false);
        setEvents([]);
        return;
      }

      const { data: calendarEvents, error } = result;

      if (error) {
        console.error('Error loading events:', error);
        setEvents([]);
      } else {
        const now = new Date();
        
        // Transform calendar events
        const transformedEvents: Event[] = (calendarEvents || []).map((event, index) => {
          // Parse dates - handle timezone correctly
          const startTime = new Date(event.start_time);
          const endTime = new Date(event.end_time);
          
          // Get local date string (not UTC)
          const localDateString = getLocalDateString(startTime);
          
          // Determine if event is in the past
          const isPast = endTime < now;

          // Determine event type
          let eventType: 'dinner' | 'flight' | 'meeting' | 'experience' = 'meeting';
          const title = (event.title || '').toLowerCase();
          if (title.includes('flight') || title.includes('airport')) {
            eventType = 'flight';
          } else if (title.includes('dinner') || title.includes('restaurant') || title.includes('lunch')) {
            eventType = 'dinner';
          } else if (title.includes('tasting') || title.includes('experience') || title.includes('wine')) {
            eventType = 'experience';
          }

          // Parse attendees from metadata if available
          let attendees: string[] = [];
          if (event.metadata) {
            try {
              // Handle both JSONB object and string
              let metadata: any;
              if (typeof event.metadata === 'string') {
                try {
                  metadata = JSON.parse(event.metadata);
                } catch (parseError) {
                  console.warn('Failed to parse metadata string:', event.id, parseError);
                  metadata = null;
                }
              } else {
                metadata = event.metadata;
              }
              
              if (metadata && typeof metadata === 'object' && metadata !== null) {
                // Check for attendees array
                if (metadata.attendees && Array.isArray(metadata.attendees)) {
                  attendees = metadata.attendees.map((a: any) => {
                    if (typeof a === 'string') return a;
                    // Handle object format from Google Calendar sync
                    if (a && typeof a === 'object') {
                      // Prefer displayName, fallback to email
                      if (a.displayName && typeof a.displayName === 'string') {
                        return a.displayName;
                      }
                      if (a.email && typeof a.email === 'string') {
                        return a.email;
                      }
                    }
                    return '';
                  }).filter((name: string) => name && name.trim().length > 0);
                }
              }
            } catch (e) {
              console.warn('Error parsing metadata for event:', event.id, e, event.metadata);
            }
          }
          
          // Enhanced debug logging (only log first few events to avoid spam)
          if (index < 3) {
            if (attendees.length > 0) {
              console.log('✅ Event attendees found:', event.title, attendees);
            } else {
              if (event.metadata) {
                console.log('⚠️ Event has metadata but no attendees:', event.title, {
                  metadata: event.metadata,
                  metadataType: typeof event.metadata,
                  hasAttendeesKey: event.metadata && typeof event.metadata === 'object' && 'attendees' in event.metadata,
                  attendeesValue: event.metadata && typeof event.metadata === 'object' ? (event.metadata as any).attendees : 'N/A'
                });
              } else {
                console.log('ℹ️ Event has no metadata:', event.title, event.id);
              }
            }
          }

          return {
            id: event.id,
            type: eventType,
            title: event.title || 'Untitled Event',
            date: localDateString,
            time: event.all_day ? 'All Day' : startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            endTime: event.all_day ? undefined : endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            location: event.location,
            description: event.description,
            attendees,
            startTime,
            endTimeDate: endTime,
            gcalEventId: event.gcal_event_id,
            isPast,
          };
        });

        setEvents(transformedEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const sortedDates = Object.keys(eventsByDate).sort();

  // Format week range for display
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekRange = currentWeekStart.getMonth() === weekEnd.getMonth()
    ? `${currentWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { day: 'numeric' })}`
    : `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const handlePreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentWeekStart(today);
  };

  const handleAddEvent = () => {
    // TODO: Open add event dialog/modal
    console.log('Add event clicked');
  };

  const handleViewDetails = (event: Event) => {
    // Always show modal instead of opening Google Calendar
    setSelectedEvent(event);
  };

  const handleReschedule = (event: Event) => {
    if (event.gcalEventId) {
      // Open Google Calendar edit page
      window.open(`https://calendar.google.com/calendar/r/eventedit/${event.gcalEventId}`, '_blank');
    } else {
      alert('Reschedule functionality coming soon');
    }
  };

  const handlePrepare = (event: Event) => {
    // This could open a preparation checklist or AI assistant
    alert(`Prepare for: ${event.title}\n\nThis feature will help you prepare for your upcoming event.`);
  };

  async function checkConnections() {
    if (!user) {
      setIsCheckingConnections(false);
      return;
    }

    setIsCheckingConnections(true);
    try {
      // Add timeout to prevent hanging
      let timeoutId: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn('Calendar connections check timeout - query taking too long');
          resolve(null);
        }, 30000); // Increased to 30 seconds from 20s
      });

      // Get calendar integrations AND unique calendar IDs from events in parallel
      const integrationsPromise = supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const eventsPromise = supabase
        .from('calendar_events')
        .select('gcal_calendar_id')
        .eq('user_id', user.id);

      // Race between queries and timeout
      let timedOut = false;
      let results: any = null;
      
      try {
        results = await Promise.race([
          Promise.all([integrationsPromise, eventsPromise]),
          timeoutPromise.then(() => {
            timedOut = true;
            return null;
          })
        ]);
      } catch (error) {
        console.error('Error in Promise.race for connections:', error);
        timedOut = true;
      }
      
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // If timeout won, results will be null
      if (timedOut || results === null) {
        console.error('Calendar connections query timed out');
        setCalendarIntegrations([]);
        setIsCheckingConnections(false);
        return;
      }

      const [integrationsResult, eventsResult] = results;
      const { data: calInts, error: integrationsError } = integrationsResult;
      const { data: calendarEvents, error: eventsError } = eventsResult;

      if (integrationsError) {
        console.error('Error checking integrations:', integrationsError);
        setCalendarIntegrations([]);
      } else if (eventsError) {
        console.error('Error checking calendar events:', eventsError);
        // Still proceed with integrations if events query failed
        if (calInts && calInts.length > 0) {
          const calInt = calInts[0];
          setCalendarIntegrations([{
            id: calInt.id,
            integration_id: calInt.id,
            calendar_id: 'primary',
            calendar_name: calInt.metadata?.calendar_name || calInt.metadata?.email || 'Google Calendar',
            email: calInt.metadata?.email || user.email,
            metadata: calInt.metadata,
            ...calInt,
          }]);
        }
      } else if (calInts && calInts.length > 0) {
        // Get the calendar integration
        const calInt = calInts[0];
        
        // Get unique calendar IDs
        const uniqueCalendarIds = Array.from(
          new Set((calendarEvents || []).map((e: any) => e.gcal_calendar_id).filter(Boolean))
        );

        // Create calendar objects for each unique calendar
        const calendars = uniqueCalendarIds.map((calendarId: string, index: number) => {
          // Try to get calendar name from metadata or use a readable name
          let calendarName = calendarId;
          if (calendarId === 'primary') {
            calendarName = calInt.metadata?.calendar_name || calInt.metadata?.email || 'Primary Calendar';
          } else if (calendarId.includes('@')) {
            // If it's an email, use it as the name
            calendarName = calendarId;
          } else {
            // Try to extract a readable name or use calendar ID
            calendarName = calInt.metadata?.calendar_name || calendarId;
          }

          return {
            id: `${calInt.id}-${calendarId}`,
            integration_id: calInt.id,
            calendar_id: calendarId,
            calendar_name: calendarName,
            email: calInt.metadata?.email || user.email,
            metadata: calInt.metadata,
            ...calInt,
          };
        });

        // If no calendar events found, still show the integration
        if (calendars.length === 0 && calInt) {
          calendars.push({
            id: calInt.id,
            integration_id: calInt.id,
            calendar_id: 'primary',
            calendar_name: calInt.metadata?.calendar_name || calInt.metadata?.email || 'Google Calendar',
            email: calInt.metadata?.email || user.email,
            metadata: calInt.metadata,
            ...calInt,
          });
        }

        setCalendarIntegrations(calendars);
      } else {
        setCalendarIntegrations([]);
      }
    } catch (error) {
      console.error('Error checking connections:', error);
      setCalendarIntegrations([]);
    } finally {
      setIsCheckingConnections(false);
    }
  }

  async function connectCalendar() {
    if (!user) return;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!anonKey) {
      console.error('Missing VITE_SUPABASE_ANON_KEY');
      return;
    }
    
    // Use popup window for OAuth (standard approach - avoids CORS issues)
    const oauthUrl = `${supabaseUrl}/functions/v1/auth-google?user_id=${user.id}&provider=calendar&apikey=${anonKey}`;
    const popup = window.open(
      oauthUrl,
      'Google OAuth',
      'width=500,height=600,left=' + (window.screen.width / 2 - 250) + ',top=' + (window.screen.height / 2 - 300)
    );
    
    if (!popup) {
      alert('Please allow popups to connect your account');
      return;
    }
    
    // Poll for popup to close (user completed or cancelled OAuth)
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        // Refresh connection status after popup closes
        setTimeout(() => {
          checkConnections();
          loadEvents(); // Reload events after connecting
        }, 1000);
      }
    }, 500);
    
    // Listen for messages from popup (callback sends postMessage)
    const messageHandler = (event: MessageEvent) => {
      // Handle both old format (string) and new format (object with type)
      const messageType = typeof event.data === 'string' 
        ? event.data 
        : event.data?.type;
      
      if (messageType === 'oauth-success' || messageType === 'oauth-complete') {
        if (popup && !popup.closed) {
          popup.close();
        }
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        // Refresh connection status
        setTimeout(() => {
          checkConnections();
          loadEvents(); // Reload events after connecting
        }, 500);
      } else if (messageType === 'oauth-error') {
        if (popup && !popup.closed) {
          popup.close();
        }
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    // Cleanup after 5 minutes if popup is still open
    setTimeout(() => {
      if (popup && !popup.closed) {
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
      }
    }, 5 * 60 * 1000);
  }

  const handleManageCalendars = () => {
    navigate('/profile');
  };

  // Scroll to today on mount
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = getLocalDateString(today);
    
    // Find today's events and scroll to them
    if (sortedDates.includes(todayString)) {
      setTimeout(() => {
        const element = document.getElementById(`date-${todayString}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [sortedDates]);

  return (
    <PageLayout>
      <main className="pt-20 md:pt-24 pb-20 bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-text-primary mb-2 md:text-[36px]">
                  Your Calendar
                </h1>
                <p className="text-text-secondary md:text-base" style={{ fontSize: '14px', fontWeight: 300 }}>
                  Unified view across all calendars and commitments
                </p>
              </div>
              <button
                onClick={handleAddEvent}
                className="flex items-center justify-center gap-2 px-4 py-2.5 md:px-5 md:py-3 rounded-xl bg-accent hover:bg-[#d4c4a6] text-background transition-all w-full sm:w-auto"
                style={{ fontSize: '14px', fontWeight: 400 }}
              >
                <Plus size={18} />
                <span>Add Event</span>
              </button>
            </div>

            {/* Calendar Navigation - 7 Day View */}
            <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-surface border border-border">
              <button
                onClick={handlePreviousWeek}
                className="p-2 rounded-lg hover:bg-surface-elevated transition-colors flex-shrink-0"
              >
                <ChevronLeft size={18} className="text-text-secondary md:w-5 md:h-5" />
              </button>
              <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center min-w-0">
                <h2 style={{ fontSize: '14px', fontWeight: 400 }} className="text-text-primary md:text-lg truncate">
                  {weekRange}
                </h2>
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg bg-surface-elevated hover:bg-border text-text-secondary hover:text-text-primary transition-colors flex-shrink-0 text-xs md:text-sm"
                  style={{ fontSize: '12px', fontWeight: 400 }}
                >
                  Today
                </button>
              </div>
              <button
                onClick={handleNextWeek}
                className="p-2 rounded-lg hover:bg-surface-elevated transition-colors flex-shrink-0"
              >
                <ChevronRight size={18} className="text-text-secondary md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          {/* Timeline View */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-tertiary" style={{ fontSize: '14px', fontWeight: 300 }}>
                No events scheduled for this week
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedDates.map((date) => {
                const dateObj = new Date(date + 'T00:00:00'); // Parse as local date
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                const dayNumber = dateObj.getDate();
                const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' });
                const isToday = getLocalDateString(new Date()) === date;

                return (
                  <motion.div
                    key={date}
                    id={`date-${date}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row gap-4 md:gap-6"
                  >
                    {/* Date Sidebar - Mobile: Horizontal, Desktop: Vertical */}
                    <div className="flex md:flex-col md:w-32 md:flex-shrink-0 pt-1 md:pt-1 items-center md:items-start gap-3 md:gap-0 pb-2 md:pb-0 border-b md:border-b-0 border-border-subtle md:border-0">
                      <div className="md:sticky md:top-28">
                        <p className="text-text-tertiary mb-0 md:mb-1 text-xs md:text-sm" style={{ fontSize: '12px', fontWeight: 300 }}>
                          {dayName}
                        </p>
                        <div className="flex items-baseline gap-2 md:block">
                          <p 
                            style={{ 
                              fontSize: '24px', 
                              fontWeight: 300, 
                              letterSpacing: '-0.02em',
                              color: isToday ? '#d4c4a6' : undefined
                            }} 
                            className={`${isToday ? 'text-accent' : 'text-text-primary'} md:text-[32px]`}
                          >
                            {dayNumber}
                          </p>
                          <p className="text-text-secondary md:mt-0 text-xs md:text-sm" style={{ fontSize: '12px', fontWeight: 300 }}>
                            {monthName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Events for this date */}
                    <div className="flex-1 space-y-3 md:space-y-3">
                      {eventsByDate[date].map((event, index) => {
                        const Icon = iconMap[event.type];
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.01 }}
                            onClick={() => handleViewDetails(event)}
                            className={`group rounded-xl border p-4 md:p-6 transition-all cursor-pointer ${
                              event.isPast
                                ? 'bg-surface/50 border-border/50 opacity-60'
                                : 'bg-surface border-border hover:border-[#3a3a3a]'
                            }`}
                          >
                            <div className="flex items-start gap-3 md:gap-4">
                              <div className={`p-2 md:p-3 rounded-lg transition-colors flex-shrink-0 ${
                                event.isPast
                                  ? 'bg-surface-elevated/50'
                                  : 'bg-surface-elevated group-hover:bg-accent/10'
                              }`}>
                                <Icon size={18} className={`${event.isPast ? 'text-text-tertiary' : 'text-accent'} md:w-5 md:h-5`} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2 gap-2">
                                  <h4 
                                    style={{ fontSize: '16px', fontWeight: 400 }} 
                                    className={`${event.isPast ? 'text-text-tertiary' : 'text-text-primary'} md:text-lg line-clamp-2`}
                                  >
                                    {event.title}
                                  </h4>
                                  <span 
                                    className="ml-2 flex-shrink-0 text-[10px] md:text-xs" 
                                    style={{ 
                                      fontSize: '10px', 
                                      fontWeight: 300, 
                                      textTransform: 'uppercase', 
                                      letterSpacing: '0.05em',
                                      color: event.isPast ? '#666' : undefined
                                    }}
                                  >
                                    {event.type}
                                  </span>
                                </div>

                                <div className={`flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 mb-3 text-sm md:text-base ${event.isPast ? 'text-text-tertiary' : 'text-text-secondary'}`} style={{ fontSize: '13px', fontWeight: 300 }}>
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={13} className="md:w-3.5 md:h-3.5 flex-shrink-0" />
                                    <span className="whitespace-nowrap">{event.time}{event.endTime ? ` - ${event.endTime}` : ''}</span>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <MapPin size={13} className="md:w-3.5 md:h-3.5 flex-shrink-0" />
                                      <span className="truncate">{event.location}</span>
                                    </div>
                                  )}
                                  {event.attendees && event.attendees.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <Users size={13} className="md:w-3.5 md:h-3.5 flex-shrink-0" />
                                      <span>{event.attendees.length} {event.attendees.length === 1 ? 'attendee' : 'attendees'}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Participants List */}
                                {event.attendees && event.attendees.length > 0 && (
                                  <div className="mb-3">
                                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                                      {event.attendees.slice(0, 5).map((attendee, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-surface-elevated border border-border text-text-secondary text-[11px] md:text-xs"
                                          style={{ fontSize: '11px', fontWeight: 300 }}
                                        >
                                          {attendee.split('@')[0]} {/* Show name or email prefix */}
                                        </span>
                                      ))}
                                      {event.attendees.length > 5 && (
                                        <span
                                          className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-surface-elevated border border-border text-text-secondary text-[11px] md:text-xs"
                                          style={{ fontSize: '11px', fontWeight: 300 }}
                                        >
                                          +{event.attendees.length - 5} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity md:flex-nowrap">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewDetails(event);
                                    }}
                                    className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-surface-elevated hover:bg-border text-text-primary transition-colors flex-1 md:flex-none text-xs md:text-sm" 
                                    style={{ fontSize: '12px', fontWeight: 400 }}
                                  >
                                    View Details
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReschedule(event);
                                    }}
                                    className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-surface-elevated hover:bg-border text-text-primary transition-colors flex-1 md:flex-none text-xs md:text-sm" 
                                    style={{ fontSize: '12px', fontWeight: 400 }}
                                  >
                                    Reschedule
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrepare(event);
                                    }}
                                    className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-surface-elevated hover:bg-border text-text-secondary hover:text-accent transition-colors flex-1 md:flex-none text-xs md:text-sm" 
                                    style={{ fontSize: '12px', fontWeight: 400 }}
                                  >
                                    Prepare
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Integration Status */}
          <div className="mt-8 md:mt-12 p-4 md:p-6 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: '14px', fontWeight: 400 }} className="text-text-primary md:text-base">
                Connected Calendars
              </h3>
              <button
                onClick={handleManageCalendars}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg bg-surface-elevated hover:bg-border text-text-secondary hover:text-text-primary transition-colors text-xs md:text-sm"
                style={{ fontSize: '12px', fontWeight: 400 }}
              >
                <Settings size={13} className="md:w-3.5 md:h-3.5" />
                <span>Manage</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {isCheckingConnections ? (
                <div className="px-4 py-2 rounded-lg bg-surface-elevated border border-border">
                  <span className="text-text-tertiary" style={{ fontSize: '13px', fontWeight: 300 }}>
                    Checking...
                  </span>
                </div>
              ) : calendarIntegrations.length === 0 ? (
                <div className="px-4 py-2 rounded-lg bg-surface-elevated border border-border">
                  <span className="text-text-tertiary" style={{ fontSize: '13px', fontWeight: 300 }}>
                    No calendars connected
                  </span>
                </div>
              ) : (
                calendarIntegrations.map((calendar) => (
                  <div
                    key={calendar.id}
                    className="px-4 py-2 rounded-lg bg-surface-elevated border border-border flex items-center gap-2"
                  >
                    <Calendar size={14} className="text-accent" />
                    <span className="text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                      {calendar.calendar_name || calendar.calendar_id}
                    </span>
                  </div>
                ))
              )}
              <button
                onClick={connectCalendar}
                className="px-4 py-2 rounded-lg bg-surface-elevated border border-accent/40 hover:bg-accent/10 text-accent transition-all flex items-center gap-2"
                style={{ fontSize: '13px', fontWeight: 400 }}
              >
                <Plus size={14} />
                <span>Add Calendar</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </PageLayout>
  );
};

export default CalendarPage;
