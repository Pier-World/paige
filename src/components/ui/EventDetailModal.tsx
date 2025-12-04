import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, Users, Calendar, Video, Plane, UtensilsCrossed } from 'lucide-react';

interface EventDetailModalProps {
  event: {
    id: string;
    title: string;
    type: 'dinner' | 'flight' | 'meeting' | 'experience';
    time: string;
    endTime?: string;
    location?: string;
    attendees?: string[];
    description?: string;
    date: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const iconMap = {
  dinner: UtensilsCrossed,
  flight: Plane,
  meeting: Video,
  experience: Calendar,
};

export function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  const Icon = iconMap[event.type];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-border">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-surface-elevated">
                    <Icon size={24} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 
                      style={{ fontSize: '24px', fontWeight: 400, letterSpacing: '-0.01em' }} 
                      className="text-text-primary mb-2"
                    >
                      {event.title}
                    </h2>
                    <span 
                      className="inline-block px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent"
                      style={{ fontSize: '11px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                      {event.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-elevated transition-colors ml-4"
                >
                  <X size={20} className="text-text-secondary" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-text-tertiary mb-1" style={{ fontSize: '12px', fontWeight: 300 }}>
                      Date & Time
                    </p>
                    <p className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                      {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-text-secondary mt-1" style={{ fontSize: '14px', fontWeight: 300 }}>
                      {event.time}{event.endTime ? ` - ${event.endTime}` : ''}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-text-tertiary mb-1" style={{ fontSize: '12px', fontWeight: 300 }}>
                        Location
                      </p>
                      <p className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                        {event.location}
                      </p>
                    </div>
                  </div>
                )}

                {/* Attendees */}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Users size={18} className="text-accent mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-text-tertiary mb-2" style={{ fontSize: '12px', fontWeight: 300 }}>
                        Attendees ({event.attendees.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {event.attendees.map((attendee, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-text-primary"
                            style={{ fontSize: '13px', fontWeight: 300 }}
                          >
                            {attendee.includes('@') ? attendee.split('@')[0] : attendee}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <div>
                    <p className="text-text-tertiary mb-2" style={{ fontSize: '12px', fontWeight: 300 }}>
                      Description
                    </p>
                    <p className="text-text-secondary whitespace-pre-wrap" style={{ fontSize: '14px', fontWeight: 300, lineHeight: '1.6' }}>
                      {event.description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

