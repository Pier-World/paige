import React, { useEffect, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { SearchBar } from '../components/ui/SearchBar';
import { TaskCard } from '../components/ui/TaskCard';
import { CalendarEventCard } from '../components/ui/CalendarEventCard';
import { TripCard } from '../components/ui/TripCard';
import { NotificationCard } from '../components/ui/NotificationCard';

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

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'awaiting_human' | 'completed' | 'failed';
  assigned_agent?: string;
  requires_human?: boolean;
  created_at: string;
  due_date?: string;
  priority?: number;
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

interface HomeFeed {
  today: {
    summary: string;
    calendar_events: CalendarEvent[];
    tasks: Task[];
  };
  tomorrow: {
    summary: string;
    calendar_events: CalendarEvent[];
  };
  upcoming_trips: Trip[];
  notifications: Notification[];
}

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHomeFeed();
    }
  }, [user]);

  async function loadHomeFeed() {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Get today's calendar events
      const { data: todayEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time');

      // Get tomorrow's events
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
      const { data: tomorrowEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', tomorrow.toISOString())
        .lt('start_time', tomorrowEnd.toISOString())
        .order('start_time');

      // Get tasks due today
      const { data: todayTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .lte('due_date', tomorrow.toISOString())
        .neq('status', 'completed')
        .order('priority', { ascending: false });

      // Get upcoming trips (7 days) - query entities table
      const { data: trips } = await supabase
        .from('entities')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', 'trip')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get unread notifications
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      setFeed({
        today: {
          summary: generateSummary(todayEvents || [], todayTasks || []),
          calendar_events: todayEvents || [],
          tasks: todayTasks || [],
        },
        tomorrow: {
          summary: generateSummary(tomorrowEvents || []),
          calendar_events: tomorrowEvents || [],
        },
        upcoming_trips: trips || [],
        notifications: notifications || [],
      });
    } catch (error) {
      console.error('Error loading home feed:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateSummary(events?: any[], tasks?: any[]): string {
    const eventCount = events?.length || 0;
    const taskCount = tasks?.length || 0;

    if (eventCount === 0 && taskCount === 0) {
      return 'You have a clear schedule.';
    }

    return `${eventCount} event${eventCount !== 1 ? 's' : ''}, ${taskCount} task${taskCount !== 1 ? 's' : ''}.`;
  }

  const handleSendMessage = async (message: string) => {
    // TODO: Call orchestrator endpoint
    console.log('Sending message:', message);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-900"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Global Search Bar */}
        <div className="mb-8">
          <SearchBar placeholder="Ask Pier anything... ✨" onSend={handleSendMessage} />
        </div>

        {/* Today Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Today</h2>
          <p className="text-lg text-gray-600 italic mb-4">{feed?.today.summary}</p>

          {/* Calendar Events */}
          {feed?.today.calendar_events && feed.today.calendar_events.length > 0 && (
            <div className="space-y-2 mb-4">
              {feed.today.calendar_events.map((event) => (
                <CalendarEventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {/* Tasks Due */}
          {feed?.today.tasks && feed.today.tasks.length > 0 && (
            <div className="space-y-2">
              {feed.today.tasks.map((task) => (
                <TaskCard key={task.id} task={task} variant="compact" />
              ))}
            </div>
          )}

          {(!feed?.today.calendar_events || feed.today.calendar_events.length === 0) &&
            (!feed?.today.tasks || feed.today.tasks.length === 0) && (
              <p className="text-gray-500 text-sm">No events or tasks scheduled for today.</p>
            )}
        </section>

        {/* Tomorrow Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Tomorrow</h2>
          <p className="text-lg text-gray-600 italic mb-4">{feed?.tomorrow.summary}</p>
          {feed?.tomorrow.calendar_events && feed.tomorrow.calendar_events.length > 0 ? (
            <div className="space-y-2">
              {feed.tomorrow.calendar_events.map((event) => (
                <CalendarEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No events scheduled for tomorrow.</p>
          )}
        </section>

        {/* Upcoming Trips */}
        {feed?.upcoming_trips && feed.upcoming_trips.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Upcoming Trips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feed.upcoming_trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* Notifications */}
        {feed?.notifications && feed.notifications.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Notifications</h2>
            <div className="space-y-2">
              {feed.notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={() => loadHomeFeed()}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
};

export default HomePage;
