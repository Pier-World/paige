import { Calendar, MapPin, Clock, Plane, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface Event {
  id: string;
  type: 'dinner' | 'flight' | 'meeting' | 'experience';
  title: string;
  date: string;
  time: string;
  location?: string;
  attendees?: number;
}

const events: Event[] = [
  {
    id: '1',
    type: 'flight',
    title: 'Flight to New York',
    date: 'Tomorrow',
    time: '9:30 AM',
    location: 'SFO → JFK',
  },
  {
    id: '2',
    type: 'dinner',
    title: 'Dinner at The French Laundry',
    date: 'Dec 2',
    time: '7:00 PM',
    location: 'Yountville, CA',
    attendees: 4,
  },
  {
    id: '3',
    type: 'meeting',
    title: 'Investment Committee Meeting',
    date: 'Dec 3',
    time: '2:00 PM',
    location: 'Virtual',
  },
  {
    id: '4',
    type: 'experience',
    title: 'Private Wine Tasting Experience',
    date: 'Dec 5',
    time: '4:00 PM',
    location: 'Napa Valley',
    attendees: 8,
  },
];

const iconMap = {
  dinner: Users,
  flight: Plane,
  meeting: Calendar,
  experience: MapPin,
};

export function UpcomingEvents() {
  return (
    <div className="w-full">
      <div className="mb-8">
        <h3 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-[#e8e8e8] mb-2">
          Your Upcoming Life
        </h3>
        <p className="text-[#a0a0a0]" style={{ fontSize: '14px', fontWeight: 300 }}>
          Next 7 days across all calendars
        </p>
      </div>

      <div className="space-y-3">
        {events.map((event, index) => {
          const Icon = iconMap[event.type];
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              className="group rounded-xl bg-[#141414] border border-[#2a2a2a] hover:border-[#3a3a3a] p-5 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-[#1a1a1a] group-hover:bg-[#c9b896]/10 transition-colors">
                  <Icon size={20} className="text-[#c9b896]" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 style={{ fontSize: '16px', fontWeight: 400 }} className="text-[#e8e8e8] mb-1">
                    {event.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 text-[#a0a0a0]" style={{ fontSize: '13px', fontWeight: 300 }}>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{event.time}</span>
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
                        <span>{event.attendees} guests</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#e8e8e8] transition-colors" style={{ fontSize: '12px', fontWeight: 400 }}>
                    Details
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
