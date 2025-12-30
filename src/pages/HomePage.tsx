import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ConciergeInput } from '../components/ui/ConciergeInput';
import { CompactTaskCard } from '../components/ui/CompactTaskCard';
import { AIProcessingSteps } from '../components/ui/AIProcessingSteps';
import { CompactHotelCard } from '../components/ui/CompactHotelCard';
import { HotelRecommendation, HotelRecommendationCard } from '../components/ui/HotelRecommendationCard';
import { MessageSquare, User as UserIcon } from 'lucide-react';
import { HumanConcierge } from '../components/ui/HumanConcierge';
import { Link } from 'react-router-dom';
import { UpcomingEvents } from '../components/ui/UpcomingEvents';
import { PerksSection } from '../components/ui/PerksSection';
import { ExclusiveExperiences } from '../components/ui/ExclusiveExperiences';
import { FeaturedBenefitsCarousel } from '../components/ui/FeaturedBenefitsCarousel';
import { TripCard } from '../components/ui/TripCard';
import { NotificationCard } from '../components/ui/NotificationCard';
import { MembershipDetail, MembershipDetailData } from '../components/ui/MembershipDetail';
import { PerkDetail, PerkDetailData } from '../components/ui/PerkDetail';
import { membershipDetails } from '../data/memberships';
import { perkDetailsData } from '../data/perks';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarEvent {
  id: string;
  title?: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  time_zone?: string;
}

interface Trip {
  id: string;
  data: {
    name?: string;
    start_date?: string;
    end_date?: string;
    destinations?: string[];
    [key: string]: any;
  };
  created_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: 'info' | 'alert' | 'success' | 'error';
  action_url?: string;
  action_label?: string;
  read_at?: string;
  created_at: string;
}

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState<HotelRecommendation | null>(null);
  
  // Track active subscriptions and intervals for cleanup
  const activeSubscriptionsRef = useRef<Array<{ channel: any; interval: NodeJS.Timeout | null }>>([]);

  // Prevent scroll restoration IMMEDIATELY on mount (before any rendering)
  useLayoutEffect(() => {
    // Disable browser scroll restoration FIRST
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Force scroll to top immediately - multiple methods to ensure it works
    window.scrollTo(0, 0);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Also set scroll position via CSS if needed
    if (document.documentElement) {
      document.documentElement.style.scrollBehavior = 'auto';
    }
    if (document.body) {
      document.body.style.scrollBehavior = 'auto';
    }
  }, []);

  // Also prevent scroll after user loads (in case of async content)
  useEffect(() => {
    if (user) {
      loadHomeFeed();
      
      // Ensure we stay at top after content loads
      // Use multiple timeouts to catch different render phases
      const timeouts = [
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }, 0),
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }, 100),
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }, 500),
      ];
      
      return () => {
        timeouts.forEach(clearTimeout);
      };
    } else {
      // If user is not available, clear loading state after a short delay
      // This handles the case where user is null/undefined
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [user]);
  
  // Remove any hash from URL that might cause scroll
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Cleanup all subscriptions and intervals on unmount
  useEffect(() => {
    return () => {
      // Clean up all active subscriptions and intervals
      activeSubscriptionsRef.current.forEach(({ channel, interval }) => {
        if (interval) {
          clearInterval(interval);
        }
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
      activeSubscriptionsRef.current = [];
    };
  }, []);

  // Pause/resume polling when tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - pause polling (intervals will check document.hidden)
        console.log('Tab hidden: Polling paused');
      } else {
        // Tab is visible - resume polling
        console.log('Tab visible: Polling resumed');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  async function loadHomeFeed() {
    if (!user) {
      setLoading(false);
      return;
    }

    // Safety timeout - ensure loading is cleared even if something goes wrong
    const safetyTimeout = setTimeout(() => {
      console.warn('Safety timeout: Force clearing loading state');
      setLoading(false);
    }, 45000); // Increased to 45 seconds absolute maximum

    try {
      // Quick connection test before loading data
      const { error: testError } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (testError) {
        console.error('Supabase connection test failed:', testError);
        clearTimeout(safetyTimeout);
        setLoading(false);
        return;
      }
    } catch (testErr) {
      console.error('Supabase connection error:', testErr);
      clearTimeout(safetyTimeout);
      setLoading(false);
      return;
    }

    try {
      // Add timeout to prevent infinite loading - but make it longer and only as fallback
      let timeoutId: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<void>((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn('Home feed load timeout - queries taking too long, clearing loading state');
          resolve();
        }, 30000); // Increased to 30 seconds
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Race between actual queries and timeout
      const queriesPromise = Promise.all([
        // Load recent tasks
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
          .then(({ data: allTasks, error: tasksError }) => {
            if (tasksError) {
              console.error('Error loading tasks:', tasksError);
              return { tasks: [], error: tasksError };
            }
            return { tasks: allTasks || [], error: null };
          }),
        
        // Get upcoming calendar events
        supabase
          .from('calendar_events')
          .select('*, metadata')
          .eq('user_id', user.id)
          .gte('start_time', today.toISOString())
          .lte('start_time', nextWeek.toISOString())
          .order('start_time')
          .limit(10)
          .then(({ data: events, error: eventsError }) => {
            if (eventsError) {
              console.error('Error loading events:', eventsError);
              return { events: [], error: eventsError };
            }
            return { events: events || [], error: null };
          }),
        
        // Get upcoming trips
        supabase
          .from('entities')
          .select('*')
          .eq('user_id', user.id)
          .eq('entity_type', 'trip')
          .order('created_at', { ascending: false })
          .limit(5)
          .then(({ data: trips, error: tripsError }) => {
            if (tripsError) {
              console.error('Error loading trips:', tripsError);
              return { trips: [], error: tripsError };
            }
            return { trips: trips || [], error: null };
          }),
        
        // Get unread notifications
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .is('read_at', null)
          .order('created_at', { ascending: false })
          .limit(5)
          .then(({ data: notifs, error: notifsError }) => {
            if (notifsError) {
              console.error('Error loading notifications:', notifsError);
              return { notifications: [], error: notifsError };
            }
            return { notifications: notifs || [], error: null };
          }),
      ]);

      // Race: either queries complete or timeout fires
      let result: any = null;
      let timedOut = false;
      
      try {
        result = await Promise.race([
          queriesPromise,
          timeoutPromise.then(() => {
            timedOut = true;
            return null;
          })
        ]);
      } catch (error) {
        console.error('Error in Promise.race:', error);
        timedOut = true;
      }
      
      // Clear timeout if queries completed first
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // If timeout won, result will be null
      if (timedOut || result === null) {
        console.error('Home feed queries timed out');
        clearTimeout(safetyTimeout);
        setLoading(false);
        setUpcomingEvents([]);
        setUpcomingTrips([]);
        setNotifications([]);
        setRecentTasks([]);
        return;
      }

      // Clear safety timeout since queries completed successfully
      clearTimeout(safetyTimeout);

      const [{ tasks: allTasks, error: tasksError }, { events, error: eventsError }, { trips, error: tripsError }, { notifications: notifs, error: notifsError }] = result;

      // Process tasks
      if (!tasksError && allTasks && allTasks.length > 0) {
        // Show the most recent task (in progress OR just completed) as active
        // This allows users to see processing steps and then results
        const mostRecentTask = allTasks[0]; // Already sorted by created_at desc
        if (mostRecentTask && (mostRecentTask.status === 'pending' || mostRecentTask.status === 'in_progress' || mostRecentTask.status === 'completed')) {
          setRecentTaskId(mostRecentTask.id);
        } else {
          setRecentTaskId(null);
        }
        setRecentTasks(allTasks);
      }

      // Transform and set events
      if (!eventsError) {
        const transformedEvents = (events || []).map((event: any) => {
          const eventDate = new Date(event.start_time);
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);

          let dateLabel = '';
          if (eventDate.toDateString() === now.toDateString()) {
            dateLabel = 'Today';
          } else if (eventDate.toDateString() === tomorrow.toDateString()) {
            dateLabel = 'Tomorrow';
          } else {
            dateLabel = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }

          let eventType: 'dinner' | 'flight' | 'meeting' | 'experience' = 'meeting';
          const title = (event.title || '').toLowerCase();
          if (title.includes('flight') || title.includes('airport')) {
            eventType = 'flight';
          } else if (title.includes('dinner') || title.includes('restaurant') || title.includes('lunch')) {
            eventType = 'dinner';
          } else if (title.includes('tasting') || title.includes('experience') || title.includes('wine')) {
            eventType = 'experience';
          }

          let attendees: string[] = [];
          if (event.metadata) {
            try {
              const metadata = typeof event.metadata === 'string' 
                ? JSON.parse(event.metadata) 
                : event.metadata;
              
              if (metadata && typeof metadata === 'object' && metadata !== null) {
                if (metadata.attendees && Array.isArray(metadata.attendees)) {
                  attendees = metadata.attendees.map((a: any) => {
                    if (typeof a === 'string') return a;
                    if (a && typeof a === 'object') {
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
              console.warn('Error parsing attendees for home page event:', event.id, e);
            }
          }

          return {
            id: event.id,
            type: eventType,
            title: event.title || 'Untitled Event',
            date: dateLabel,
            time: event.all_day ? 'All Day' : new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            location: event.location,
            attendees: attendees.length > 0 ? attendees.length : undefined,
          };
        });
        setUpcomingEvents(transformedEvents);
      }

      // Set trips and notifications
      if (!tripsError) {
        setUpcomingTrips(trips || []);
      }
      if (!notifsError) {
        setNotifications(notifs || []);
      }
    } catch (error) {
      console.error('Error loading home feed:', error);
      setLoading(false);
    } finally {
      // Ensure loading is always cleared
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  }

  const [sendingMessage, setSendingMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentTaskId, setRecentTaskId] = useState<string | null>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [selectedMembership, setSelectedMembership] = useState<MembershipDetailData | null>(null);
  const [selectedPerk, setSelectedPerk] = useState<PerkDetailData | null>(null);
  
  // Chat messages state
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    taskId?: string;
    recommendations?: HotelRecommendation[];
    isProcessing?: boolean;
  }>>([]);
  
  // Current task state for processing
  const [currentTask, setCurrentTask] = useState<any>(null);

  const handleSendMessage = async (message: string) => {
    if (!user) {
      setErrorMessage('You must be logged in to send messages');
      return;
    }

    setSendingMessage(true);
    setErrorMessage(null);
    
    // Add user message to chat
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    // Clear previous task and recommendations
    setRecentTaskId(null);
    setCurrentTask(null);

    try {
      // Call orchestrator to create task
      const { callOrchestrator } = await import('../lib/orchestrator');
      const result = await callOrchestrator(user.id, message);
      
      if (result.success && result.task) {
        const taskId = result.task.id;
        setRecentTaskId(taskId);
        setCurrentTask(result.task);
        
        // Add processing message
        const processingMessage = {
          id: `processing-${Date.now()}`,
          role: 'assistant' as const,
          content: '',
          timestamp: new Date().toISOString(),
          taskId,
          isProcessing: true,
        };
        setChatMessages(prev => [...prev, processingMessage]);
        
        // Also poll for updates as a fallback (real-time can be unreliable)
        // Add maximum polling duration (5 minutes) to prevent infinite polling
        const maxPollingDuration = 5 * 60 * 1000; // 5 minutes
        const pollingStartTime = Date.now();
        let pollInterval: NodeJS.Timeout | null = null;
        
        const startPolling = () => {
          pollInterval = setInterval(async () => {
            // Stop polling if max duration exceeded
            if (Date.now() - pollingStartTime > maxPollingDuration) {
              if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
              }
              console.warn('Polling stopped: Maximum duration exceeded');
              return;
            }
            
            // Pause polling if tab is hidden (browser optimization)
            if (document.hidden) {
              return;
            }
            
            try {
              const { data: polledTask } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', taskId)
                .single();
              
              if (polledTask) {
                setCurrentTask(polledTask);
                
                // Update processing message with current progress
                const processingMsgId = processingMessage.id;
                setChatMessages(prev => prev.map(msg => {
                  if (msg.id === processingMsgId && msg.isProcessing) {
                    return {
                      ...msg,
                      isProcessing: polledTask.status !== 'completed' && polledTask.status !== 'failed',
                    };
                  }
                  return msg;
                }));
                
                // If completed, process results
                if (polledTask.status === 'completed' && polledTask.output_data) {
                  if (pollInterval) {
                    clearInterval(pollInterval);
                    pollInterval = null;
                  }
                const outputData = polledTask.output_data;
                const recommendations = outputData.recommendations || outputData.hotels || [];
                
                if (recommendations.length > 0) {
                  // Fetch hotel data for images
                  const hotelIds = recommendations.map((r: any) => r.hotel_id || r.id).filter(Boolean);
                  let enrichedRecommendations = recommendations;
                  
                  if (hotelIds.length > 0) {
                    try {
                      const { data: hotelData } = await supabase
                        .from('hotels')
                        .select('id, star_rating, notes_curated, amenities, address, neighborhood, primary_city')
                        .in('id', hotelIds);
                      
                      if (hotelData) {
                        enrichedRecommendations = recommendations.map((rec: any) => {
                          const hotel = hotelData.find((h: any) => h.id === (rec.hotel_id || rec.id));
                          return {
                            ...rec,
                            star_rating: hotel?.star_rating || rec.star_rating || rec.rating,
                            description: hotel?.notes_curated || rec.description,
                            amenities: hotel?.amenities || rec.amenities || [],
                            address: hotel?.address || rec.address,
                            neighborhood: hotel?.neighborhood || rec.neighborhood,
                            primary_city: hotel?.primary_city || rec.city,
                          };
                        });
                      }
                    } catch (error) {
                      console.error('Error fetching hotel data:', error);
                    }
                  }
                  
                  // Transform to HotelRecommendation format
                  const transformed: HotelRecommendation[] = enrichedRecommendations.map((rec: any) => {
                    const city = outputData.parsed_request?.city || rec.city || '';
                    const location = rec.location || `${rec.neighborhood || ''}, ${city}`.trim();
                    
                    let averageRate = 'Rate on request';
                    if (rec.rate_estimate && rec.rate_estimate.low) {
                      // Use low rate for "starting at" pricing
                      averageRate = `Starting at $${rec.rate_estimate.low}`;
                    } else if (rec.rate_low) {
                      averageRate = `Starting at $${rec.rate_low}`;
                    } else if (rec.rate_estimate && rec.rate_estimate.mid) {
                      averageRate = `Starting at $${rec.rate_estimate.mid}`;
                    } else if (rec.rate_mid) {
                      averageRate = `Starting at $${rec.rate_mid}`;
                    }
                    
                    const matchReasons: string[] = [];
                    if (rec.reason) {
                      matchReasons.push(rec.reason);
                    }
                    if (rec.score_breakdown) {
                      const breakdown = rec.score_breakdown;
                      if (breakdown.budget_fit > 20) {
                        matchReasons.push('Excellent value for your budget');
                      }
                      if (breakdown.neighborhood_match > 10) {
                        matchReasons.push(`Perfect location in ${rec.neighborhood || city}`);
                      }
                    }
                    
                    // Extract dates from parsed request for booking message
                    // Check multiple possible locations for dates
                    const datesObj = outputData.parsed_request?.dates;
                    const checkIn = datesObj?.check_in || outputData.parsed_request?.check_in;
                    const checkOut = datesObj?.check_out || outputData.parsed_request?.check_out;
                    
                    let dateString: string | null = null;
                    if (checkIn && checkOut) {
                      // Format dates as "Dec 19th-21st"
                      const checkInDate = new Date(checkIn);
                      const checkOutDate = new Date(checkOut);
                      
                      const formatDayWithSuffix = (day: number): string => {
                        if (day >= 11 && day <= 13) return `${day}th`;
                        switch (day % 10) {
                          case 1: return `${day}st`;
                          case 2: return `${day}nd`;
                          case 3: return `${day}rd`;
                          default: return `${day}th`;
                        }
                      };
                      
                      const checkInMonth = checkInDate.toLocaleDateString('en-US', { month: 'short' });
                      const checkInDay = formatDayWithSuffix(checkInDate.getDate());
                      const checkOutMonth = checkOutDate.toLocaleDateString('en-US', { month: 'short' });
                      const checkOutDay = formatDayWithSuffix(checkOutDate.getDate());
                      
                      // If same month, format as "Dec 19th-21st", otherwise "Dec 19th - Jan 5th"
                      if (checkInMonth === checkOutMonth) {
                        dateString = `${checkInMonth} ${checkInDay}-${checkOutDay}`;
                      } else {
                        dateString = `${checkInMonth} ${checkInDay} - ${checkOutMonth} ${checkOutDay}`;
                      }
                    } else if (checkIn) {
                      // Single date
                      const checkInDate = new Date(checkIn);
                      const formatDayWithSuffix = (day: number): string => {
                        if (day >= 11 && day <= 13) return `${day}th`;
                        switch (day % 10) {
                          case 1: return `${day}st`;
                          case 2: return `${day}nd`;
                          case 3: return `${day}rd`;
                          default: return `${day}th`;
                        }
                      };
                      const month = checkInDate.toLocaleDateString('en-US', { month: 'short' });
                      const day = formatDayWithSuffix(checkInDate.getDate());
                      const year = checkInDate.getFullYear();
                      dateString = `${month} ${day}, ${year}`;
                    }

                    return {
                      id: rec.id || rec.hotel_id,
                      hotel_id: rec.hotel_id || rec.id,
                      name: rec.name,
                      location,
                      city: rec.city || city,
                      neighborhood: rec.neighborhood,
                      rating: rec.star_rating || rec.rating || 0,
                      reviewCount: rec.review_count || 0,
                      averageRate,
                      imageUrl: rec.image_hero || rec.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
                      image_hero: rec.image_hero || rec.image_url,
                      pierBenefits: rec.pier_benefits || rec.pierBenefits || [],
                      matchReasons: matchReasons.length > 0 ? matchReasons : ['Great option based on your preferences'],
                      reason: rec.reason,
                      description: rec.description || rec.notes_curated,
                      amenities: rec.amenities || [],
                      rate_estimate: rec.rate_estimate,
                      parsedDates: dateString,
                      // Store raw dates for fallback formatting
                      check_in: checkIn,
                      check_out: checkOut,
                      dates: checkIn && checkOut ? { check_in: checkIn, check_out: checkOut } : undefined,
                    };
                  });
                  
                  // Update the processing message with results
                  const processingMsgId = processingMessage.id;
                  setChatMessages(prev => prev.map(msg => 
                    msg.id === processingMsgId
                      ? {
                          ...msg,
                          content: `I've found ${transformed.length} perfect match${transformed.length !== 1 ? 'es' : ''} for you.`,
                          recommendations: transformed,
                          isProcessing: false,
                        }
                      : msg
                  ));
                } else {
                  // No recommendations found
                  const processingMsgId = processingMessage.id;
                  setChatMessages(prev => prev.map(msg => 
                    msg.id === processingMsgId
                      ? {
                          ...msg,
                          content: 'I couldn\'t find any matches for your request. Would you like to adjust your search criteria?',
                          isProcessing: false,
                        }
                      : msg
                  ));
                }
              } else if (polledTask.status === 'failed') {
                if (pollInterval) {
                  clearInterval(pollInterval);
                  pollInterval = null;
                }
                const processingMsgId = processingMessage.id;
                setChatMessages(prev => prev.map(msg => 
                  msg.id === processingMsgId
                    ? {
                        ...msg,
                        content: 'I encountered an error processing your request. Please try again.',
                        isProcessing: false,
                      }
                    : msg
                ));
              }
            }
            } catch (error) {
              console.error('Error polling task:', error);
            }
          }, 2000); // Poll every 2 seconds (reduced frequency to save resources)
        };
        
        // Subscribe to task updates (declare channel before using it)
        const channel = supabase
          .channel(`task-${taskId}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'tasks',
            filter: `id=eq.${taskId}`,
          }, async (payload) => {
            const updatedTask = payload.new as any;
            setCurrentTask(updatedTask);
            
            // Update processing message progress
            const processingMsgId = processingMessage.id;
            setChatMessages(prev => prev.map(msg => {
              if (msg.id === processingMsgId && msg.isProcessing) {
                return {
                  ...msg,
                  isProcessing: updatedTask.status !== 'completed' && updatedTask.status !== 'failed',
                };
              }
              return msg;
            }));
            
            // If task is completed, update the processing message with results
            if (updatedTask.status === 'completed' && updatedTask.output_data) {
              if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
              }
              const outputData = updatedTask.output_data;
              const recommendations = outputData.recommendations || outputData.hotels || [];
              
              if (recommendations.length > 0) {
                // Fetch hotel data for images
                const hotelIds = recommendations.map((r: any) => r.hotel_id || r.id).filter(Boolean);
                let enrichedRecommendations = recommendations;
                
                if (hotelIds.length > 0) {
                  try {
                    const { data: hotelData } = await supabase
                      .from('hotels')
                      .select('id, star_rating, notes_curated, amenities, address, neighborhood, primary_city')
                      .in('id', hotelIds);
                    
                    if (hotelData) {
                      enrichedRecommendations = recommendations.map((rec: any) => {
                        const hotel = hotelData.find((h: any) => h.id === (rec.hotel_id || rec.id));
                        return {
                          ...rec,
                          star_rating: hotel?.star_rating || rec.star_rating || rec.rating,
                          description: hotel?.notes_curated || rec.description,
                          amenities: hotel?.amenities || rec.amenities || [],
                          address: hotel?.address || rec.address,
                          neighborhood: hotel?.neighborhood || rec.neighborhood,
                          primary_city: hotel?.primary_city || rec.city,
                        };
                      });
                    }
                  } catch (error) {
                    console.error('Error fetching hotel data:', error);
                  }
                }
                
                // Transform to HotelRecommendation format
                const transformed: HotelRecommendation[] = enrichedRecommendations.map((rec: any) => {
                  const city = outputData.parsed_request?.city || rec.city || '';
                  const location = rec.location || `${rec.neighborhood || ''}, ${city}`.trim();
                  
                  let averageRate = 'Rate on request';
                  if (rec.rate_estimate) {
                    averageRate = `$${rec.rate_estimate.mid}`;
                  } else if (rec.rate_mid) {
                    averageRate = `$${rec.rate_mid}`;
                  }
                  
                  const matchReasons: string[] = [];
                  if (rec.reason) {
                    matchReasons.push(rec.reason);
                  }
                  if (rec.score_breakdown) {
                    const breakdown = rec.score_breakdown;
                    if (breakdown.budget_fit > 20) {
                      matchReasons.push('Excellent value for your budget');
                    }
                    if (breakdown.neighborhood_match > 10) {
                      matchReasons.push(`Perfect location in ${rec.neighborhood || city}`);
                    }
                  }
                  
                  // Extract dates from parsed request for booking message
                  const parsedDates = outputData.parsed_request?.dates || 
                                    outputData.parsed_request?.check_in || 
                                    outputData.parsed_request?.date_range ||
                                    null;
                  let dateString: string | null = null;
                  if (parsedDates) {
                    if (typeof parsedDates === 'string') {
                      dateString = parsedDates;
                    } else if (parsedDates.check_in && parsedDates.check_out) {
                      // Format dates nicely
                      const checkIn = new Date(parsedDates.check_in);
                      const checkOut = new Date(parsedDates.check_out);
                      dateString = `${checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                    } else if (parsedDates.check_in) {
                      const checkIn = new Date(parsedDates.check_in);
                      dateString = checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    }
                  }

                  return {
                    id: rec.id || rec.hotel_id,
                    hotel_id: rec.hotel_id || rec.id,
                    name: rec.name,
                    location,
                    city: rec.city || city,
                    neighborhood: rec.neighborhood,
                    rating: rec.star_rating || rec.rating || 0,
                    reviewCount: rec.review_count || 0,
                    averageRate,
                    imageUrl: rec.image_hero || rec.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
                    image_hero: rec.image_hero || rec.image_url,
                    pierBenefits: rec.pier_benefits || rec.pierBenefits || [],
                    matchReasons: matchReasons.length > 0 ? matchReasons : ['Great option based on your preferences'],
                    reason: rec.reason,
                    description: rec.description || rec.notes_curated,
                    amenities: rec.amenities || [],
                    rate_estimate: rec.rate_estimate,
                    parsedDates: dateString,
                  };
                });
                
                // Update the processing message with results
                setChatMessages(prev => prev.map(msg => 
                  msg.id === processingMessage.id
                    ? {
                        ...msg,
                        content: `I've found ${transformed.length} perfect match${transformed.length !== 1 ? 'es' : ''} for you.`,
                        recommendations: transformed,
                        isProcessing: false,
                      }
                    : msg
                ));
              } else {
                // No recommendations found
                const processingMsgId = processingMessage.id;
                setChatMessages(prev => prev.map(msg => 
                  msg.id === processingMsgId
                    ? {
                        ...msg,
                        content: 'I couldn\'t find any matches for your request. Would you like to adjust your search criteria?',
                        isProcessing: false,
                      }
                    : msg
                ));
              }
            } else if (updatedTask.status === 'failed') {
              const processingMsgId = processingMessage.id;
              setChatMessages(prev => prev.map(msg => 
                msg.id === processingMsgId
                  ? {
                      ...msg,
                      content: 'I encountered an error processing your request. Please try again.',
                      isProcessing: false,
                    }
                  : msg
              ));
            }
          })
          .subscribe();
        
        // Start polling after channel is created
        startPolling();
        
        // Store subscription info for cleanup
        const subscriptionInfo = { channel, interval: pollInterval };
        activeSubscriptionsRef.current.push(subscriptionInfo);
        
        // Cleanup subscription and polling on unmount or new message
        return () => {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          supabase.removeChannel(channel);
          // Remove from active subscriptions
          activeSubscriptionsRef.current = activeSubscriptionsRef.current.filter(
            sub => sub.channel !== channel
          );
        };
      } else {
        const error = result.error || 'Failed to process your request';
        setErrorMessage(error);
        
        // Add error message
        const errorMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant' as const,
          content: error,
          timestamp: new Date().toISOString(),
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      
      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant' as const,
        content: errorMsg,
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="pt-24 pb-20 bg-background min-h-screen">
        {/* Featured Benefits Carousel - AT THE VERY TOP */}
        <section>
          <FeaturedBenefitsCarousel firstName={user?.first_name} />
        </section>

        {/* Hero Section - Concierge Input */}
        <section className="px-6 py-[3.2rem] md:py-[4.8rem]">
          <ConciergeInput 
            onSend={handleSendMessage} 
            disabled={sendingMessage}
            hideSuggestions={sendingMessage || chatMessages.length > 0}
            membershipLevel={user?.membership_level}
            firstName={user?.first_name}
          />
          
          {/* Chat Messages - Conversational Interface */}
          {chatMessages.length > 0 && (
            <div className="max-w-4xl mx-auto mt-6 md:mt-8">
              <div className="bg-surface/50 border border-border rounded-2xl overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
                  {chatMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user'
                          ? 'bg-surface-elevated'
                          : 'bg-accent/20'
                      }`}>
                        {msg.role === 'user' ? (
                          <UserIcon className="w-4 h-4 text-text-secondary" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-accent" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                        {msg.content && (
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              msg.role === 'user'
                                ? 'bg-accent text-accent-foreground dark:text-background rounded-tr-sm'
                                : 'bg-surface-elevated border border-border rounded-tl-sm'
                            }`}
                            style={{ fontSize: '15px', fontWeight: 300, lineHeight: '1.6' }}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        )}
                        
                        {/* Processing Steps */}
                        {msg.isProcessing && currentTask && (
                          <div className="mt-2">
                            <AIProcessingSteps
                              currentStep={currentTask.ui_state?.current_step || 'understand'}
                              progress={currentTask.ui_state?.progress || 0}
                              isComplete={false}
                            />
                          </div>
                        )}
                        
                        {/* Recommendations */}
                        {msg.recommendations && msg.recommendations.length > 0 && (
                          <div className="mt-3 space-y-4">
                            {msg.recommendations.map((hotel, idx) => (
                              <CompactHotelCard
                                key={hotel.id}
                                hotel={hotel}
                                index={idx}
                                isNew={idx === msg.recommendations!.length - 1 && msg.isProcessing === false}
                                onViewDetails={() => setSelectedHotel(hotel)}
                                onOpenConcierge={() => setSelectedHotel(hotel)}
                              />
                            ))}
                            {/* Streaming indicator when still processing */}
                            {msg.isProcessing && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-center gap-2 py-4"
                              >
                                <div className="flex gap-1.5">
                                  {[0, 1, 2].map((i) => (
                                    <motion.div
                                      key={i}
                                      className="w-1.5 h-1.5 rounded-full bg-accent"
                                      animate={{
                                        opacity: [0.3, 1, 0.3],
                                        scale: [0.8, 1, 0.8],
                                      }}
                                      transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                        ease: 'easeInOut',
                                      }}
                                    />
                                  ))}
                                </div>
                                <span className="text-text-tertiary" style={{ fontSize: '13px', fontWeight: 300 }}>
                                  Loading more options...
                                </span>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Show Recent Requests (completed OR awaiting review) */}
          {recentTasks.filter(task => 
            task.id !== recentTaskId && 
            (task.status === 'completed' || task.status === 'awaiting_human')
          ).length > 0 && (
            <div className="max-w-4xl mx-auto mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-text-secondary" style={{ fontSize: '13px', fontWeight: 400 }}>
                  Recent Requests
                </h3>
                <Link 
                  to="/conversation" 
                  className="text-accent hover:text-[#d4c4a6] transition-colors"
                  style={{ fontSize: '12px', fontWeight: 300 }}
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-2">
                {recentTasks
                  .filter(task => 
                    task.id !== recentTaskId && 
                    (task.status === 'completed' || task.status === 'awaiting_human')
                  )
                  .slice(0, 3) // Show max 3 past tasks
                  .map((task) => (
                    <CompactTaskCard key={task.id} task={task} />
                  ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="max-w-4xl mx-auto mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Perks & Memberships Section */}
        <section className="px-6 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <PerksSection 
              onMembershipClick={(id) => {
                const details = membershipDetails[id];
                if (details) {
                  setSelectedMembership(details);
                }
              }}
              onPerkClick={(id) => {
                const details = perkDetailsData[id];
                if (details) {
                  setSelectedPerk(details);
                }
              }}
            />
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Exclusive Experiences Section */}
        <section className="px-6 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <ExclusiveExperiences />
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Upcoming Events Section */}
        <section className="px-6 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <UpcomingEvents events={upcomingEvents} />
          </div>
        </section>

        {/* Divider */}
        {upcomingTrips.length > 0 && (
          <>
            <div className="max-w-7xl mx-auto px-6">
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            {/* Upcoming Trips Section */}
            <section className="px-6 py-16 md:py-20">
              <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                  <h3 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-text-primary mb-2">
                    Upcoming Trips
                  </h3>
                  <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                    Your next adventures
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} variant="compact" />
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* Divider */}
        {notifications.length > 0 && (
          <>
            <div className="max-w-7xl mx-auto px-6">
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            {/* Notifications Section */}
            <section className="px-6 py-16 md:py-20">
              <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                  <h3 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-text-primary mb-2">
                    Notifications
                  </h3>
                  <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                    Recent updates and alerts
                  </p>
                </div>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkRead={() => loadHomeFeed()}
                    />
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* Footer Section */}
        <footer className="px-6 py-12 mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent mb-12" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div>
                <h2 className="text-[11px] tracking-[0.3em] uppercase text-foreground font-medium mb-2">
                  Pier
                </h2>
                <p className="text-text-tertiary" style={{ fontSize: '13px', fontWeight: 300 }}>
                  Your personal operating system
                </p>
              </div>

              <div className="flex flex-wrap gap-12">
                <div>
                  <h4 className="text-text-secondary mb-3" style={{ fontSize: '12px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Product
                  </h4>
                  <div className="space-y-2">
                    <a href="#" className="block text-text-tertiary hover:text-text-primary transition-colors" style={{ fontSize: '13px', fontWeight: 300 }}>
                      Features
                    </a>
                    <a href="#" className="block text-text-tertiary hover:text-text-primary transition-colors" style={{ fontSize: '13px', fontWeight: 300 }}>
                      Integrations
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="text-text-secondary mb-3" style={{ fontSize: '12px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Support
                  </h4>
                  <div className="space-y-2">
                    <a href="#" className="block text-text-tertiary hover:text-text-primary transition-colors" style={{ fontSize: '13px', fontWeight: 300 }}>
                      Help Center
                    </a>
                    <a href="#" className="block text-text-tertiary hover:text-text-primary transition-colors" style={{ fontSize: '13px', fontWeight: 300 }}>
                      Contact
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border-subtle">
              <p className="text-text-tertiary text-center" style={{ fontSize: '12px', fontWeight: 300 }}>
                © 2025 Pier. Designed for leaders who value their time.
              </p>
            </div>
          </div>
        </footer>

        {/* Human Concierge Floating Button - Only for Premium+ members */}
        {user && (
          <HumanConcierge membershipLevel={user.membership_level || 'Standard'} />
        )}

        {/* Membership Detail Modal */}
        <MembershipDetail
          membership={selectedMembership}
          isOpen={!!selectedMembership}
          onClose={() => setSelectedMembership(null)}
        />

        {/* Perk Detail Modal */}
        <PerkDetail
          perk={selectedPerk}
          isOpen={!!selectedPerk}
          onClose={() => setSelectedPerk(null)}
        />

        {/* Hotel Detail Modal */}
        <AnimatePresence>
          {selectedHotel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              onClick={() => setSelectedHotel(null)}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none" onClick={(e) => e.stopPropagation()}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="pointer-events-auto w-full max-w-4xl"
                >
                  <HotelRecommendationCard
                    hotel={{ ...selectedHotel, __isModal: true } as any}
                    index={0}
                    onOpenConcierge={{
                      close: () => setSelectedHotel(null)
                    } as any}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageLayout>
  );
};

export default HomePage;
