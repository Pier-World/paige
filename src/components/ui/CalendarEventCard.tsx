import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

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

interface CalendarEventCardProps {
  event: CalendarEvent;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({ event }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const isToday = startDate.toDateString() === new Date().toDateString();

  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-[#3a3a3a] transition-all">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
            isToday ? 'bg-accent/10 text-accent' : 'bg-surface-elevated text-text-secondary'
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
            {event.title || 'Untitled Event'}
          </h4>
          <div className="mt-1 space-y-1">
            {!event.all_day && (
              <p className="text-text-secondary" style={{ fontSize: '12px', fontWeight: 300 }}>
                {formatTime(event.start_time)} - {formatTime(event.end_time)}
              </p>
            )}
            {event.location && (
              <div className="flex items-center gap-1.5 text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                <MapPin className="w-3 h-3" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            {event.description && (
              <p className="text-text-tertiary line-clamp-2" style={{ fontSize: '12px', fontWeight: 300 }}>
                {event.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

