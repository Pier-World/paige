import { Calendar, MapPin, Clock, Plane, Users, Video, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface Event {
  id: string;
  type: 'dinner' | 'flight' | 'meeting' | 'experience';
  title: string;
  date: string;
  time: string;
  endTime?: string;
  location?: string;
  attendees?: number;
  description?: string;
}

const events: Event[] = [
  {
    id: '1',
    type: 'flight',
    title: 'Flight to New York',
    date: '2025-12-01',
    time: '9:30 AM',
    endTime: '6:15 PM',
    location: 'SFO → JFK',
  },
  {
    id: '2',
    type: 'meeting',
    title: 'Board Meeting - Series A Review',
    date: '2025-12-01',
    time: '2:00 PM',
    endTime: '3:30 PM',
    location: 'Virtual',
    attendees: 8,
  },
  {
    id: '3',
    type: 'dinner',
    title: 'Dinner at The French Laundry',
    date: '2025-12-02',
    time: '7:00 PM',
    endTime: '10:00 PM',
    location: 'Yountville, CA',
    attendees: 4,
  },
  {
    id: '4',
    type: 'meeting',
    title: 'Investment Committee Meeting',
    date: '2025-12-03',
    time: '2:00 PM',
    endTime: '4:00 PM',
    location: 'Virtual',
    attendees: 6,
  },
  {
    id: '5',
    type: 'experience',
    title: 'Private Wine Tasting Experience',
    date: '2025-12-05',
    time: '4:00 PM',
    endTime: '7:00 PM',
    location: 'Napa Valley',
    attendees: 8,
  },
  {
    id: '6',
    type: 'meeting',
    title: 'CEO Roundtable',
    date: '2025-12-06',
    time: '10:00 AM',
    endTime: '11:30 AM',
    location: 'San Francisco',
    attendees: 12,
  },
  {
    id: '7',
    type: 'flight',
    title: 'Return Flight to San Francisco',
    date: '2025-12-08',
    time: '3:45 PM',
    endTime: '11:30 PM',
    location: 'JFK → SFO',
  },
];

const iconMap = {
  dinner: Users,
  flight: Plane,
  meeting: Video,
  experience: MapPin,
};

export function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const sortedDates = Object.keys(eventsByDate).sort();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-[#e8e8e8] mb-2">
                Your Calendar
              </h1>
              <p className="text-[#a0a0a0]" style={{ fontSize: '16px', fontWeight: 300 }}>
                Unified view across all calendars and commitments
              </p>
            </div>
            <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#c9b896] hover:bg-[#d4c4a6] text-[#0a0a0a] transition-all">
              <Plus size={18} />
              <span style={{ fontSize: '14px', fontWeight: 400 }}>Add Event</span>
            </button>
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#141414] border border-[#2a2a2a]">
            <button className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors">
              <ChevronLeft size={20} className="text-[#a0a0a0]" />
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 400 }} className="text-[#e8e8e8]">
              December 2025
            </h2>
            <button className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors">
              <ChevronRight size={20} className="text-[#a0a0a0]" />
            </button>
          </div>
        </div>

        {/* Timeline View */}
        <div className="space-y-8">
          {sortedDates.map((date) => {
            const dateObj = new Date(date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const dayNumber = dateObj.getDate();
            const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' });

            return (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-6"
              >
                {/* Date Sidebar */}
                <div className="w-32 flex-shrink-0 pt-1">
                  <div className="sticky top-28">
                    <p className="text-[#6a6a6a] mb-1" style={{ fontSize: '13px', fontWeight: 300 }}>
                      {dayName}
                    </p>
                    <p style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-[#e8e8e8]">
                      {dayNumber}
                    </p>
                    <p className="text-[#a0a0a0]" style={{ fontSize: '13px', fontWeight: 300 }}>
                      {monthName}
                    </p>
                  </div>
                </div>

                {/* Events for this date */}
                <div className="flex-1 space-y-3">
                  {eventsByDate[date].map((event, index) => {
                    const Icon = iconMap[event.type];
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                        className="group rounded-xl bg-[#141414] border border-[#2a2a2a] hover:border-[#3a3a3a] p-6 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-[#1a1a1a] group-hover:bg-[#c9b896]/10 transition-colors">
                            <Icon size={20} className="text-[#c9b896]" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h4 style={{ fontSize: '18px', fontWeight: 400 }} className="text-[#e8e8e8]">
                                {event.title}
                              </h4>
                              <span className="text-[#6a6a6a] ml-4" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {event.type}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-[#a0a0a0] mb-3" style={{ fontSize: '14px', fontWeight: 300 }}>
                              <div className="flex items-center gap-1.5">
                                <Clock size={14} />
                                <span>{event.time}{event.endTime ? ` - ${event.endTime}` : ''}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={14} />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              {event.attendees && (
                                <div className="flex items-center gap-1.5">
                                  <Users size={14} />
                                  <span>{event.attendees} attendees</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#e8e8e8] transition-colors" style={{ fontSize: '13px', fontWeight: 400 }}>
                                View Details
                              </button>
                              <button className="px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#e8e8e8] transition-colors" style={{ fontSize: '13px', fontWeight: 400 }}>
                                Reschedule
                              </button>
                              <button className="px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#a0a0a0] hover:text-[#c9b896] transition-colors" style={{ fontSize: '13px', fontWeight: 400 }}>
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

        {/* Integration Status */}
        <div className="mt-12 p-6 rounded-xl bg-[#141414] border border-[#2a2a2a]">
          <h3 style={{ fontSize: '16px', fontWeight: 400 }} className="text-[#e8e8e8] mb-4">
            Connected Calendars
          </h3>
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
              <span className="text-[#a0a0a0]" style={{ fontSize: '13px', fontWeight: 300 }}>
                Google Calendar
              </span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
              <span className="text-[#a0a0a0]" style={{ fontSize: '13px', fontWeight: 300 }}>
                Outlook
              </span>
            </div>
            <button className="px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#c9b896]/40 hover:bg-[#c9b896]/10 text-[#c9b896] transition-all" style={{ fontSize: '13px', fontWeight: 400 }}>
              + Add Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
