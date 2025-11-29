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
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
            isToday ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">{event.title || 'Untitled Event'}</h4>
          <div className="mt-1 space-y-1">
            {!event.all_day && (
              <p className="text-xs text-gray-600">
                {formatTime(event.start_time)} - {formatTime(event.end_time)}
              </p>
            )}
            {event.location && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            {event.description && (
              <p className="text-xs text-gray-500 line-clamp-2">{event.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

