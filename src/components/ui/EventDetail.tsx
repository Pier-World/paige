import { X, MapPin, Clock, Calendar, Tag, ExternalLink, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageWithFallback } from './ImageWithFallback';
import type { Event } from '../../types';

interface EventDetailProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onRSVP?: (eventId: string) => void;
  onOpenConcierge?: () => void;
}

export function EventDetail({ 
  event, 
  isOpen, 
  onClose, 
  onRSVP,
  onOpenConcierge 
}: EventDetailProps) {
  if (!event) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleRSVP = () => {
    if (onRSVP) {
      onRSVP(event.id);
    } else if (event.external_link) {
      window.open(event.external_link, '_blank');
    } else if (onOpenConcierge) {
      onClose();
      onOpenConcierge();
    }
  };

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
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-surface border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Image */}
              <div className="relative aspect-[16/9] overflow-hidden bg-surface-elevated">
                <ImageWithFallback
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
                >
                  <X size={20} className="text-text-primary" />
                </button>

                {/* Featured Badge */}
                {event.featured && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-accent/20">
                    <span className="text-accent" style={{ fontSize: '11px', fontWeight: 400 }}>
                      Featured
                    </span>
                  </div>
                )}

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-text-primary mb-2">
                    {event.title}
                  </h2>
                  <p className="text-text-secondary" style={{ fontSize: '16px', fontWeight: 300 }}>
                    {event.short_description}
                  </p>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1">
                <div className="p-8">
                  {/* Event Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-surface-elevated">
                        <Calendar size={18} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-text-tertiary mb-1" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Date
                        </p>
                        <p className="text-text-primary mb-1" style={{ fontSize: '14px', fontWeight: 400 }}>
                          {formatDate(event.date)}
                        </p>
                        <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                          {event.time}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-surface-elevated">
                        <MapPin size={18} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-text-tertiary mb-1" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Location
                        </p>
                        <p className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                          {event.location}
                        </p>
                        <p className="text-text-secondary mt-1" style={{ fontSize: '14px', fontWeight: 300 }}>
                          {event.city}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-3">
                        <Tag size={16} className="text-text-tertiary" />
                        <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Categories
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-full bg-surface-elevated border border-border text-text-secondary"
                            style={{ fontSize: '12px', fontWeight: 300 }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {event.description && (
                    <div className="mb-8">
                      <p className="text-text-tertiary mb-3" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        About This Event
                      </p>
                      <p className="text-text-secondary whitespace-pre-wrap" style={{ fontSize: '14px', fontWeight: 300, lineHeight: '1.7' }}>
                        {event.description}
                      </p>
                    </div>
                  )}

                  {/* RSVP Instructions */}
                  {event.rsvp_instructions && (
                    <div className="mb-8 p-4 rounded-lg bg-surface-elevated border border-border">
                      <div className="flex items-start gap-3 mb-2">
                        <MessageCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
                        <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          RSVP Instructions
                        </p>
                      </div>
                      <p className="text-text-secondary whitespace-pre-wrap" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.6' }}>
                        {event.rsvp_instructions}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-6 border-t border-border">
                    <button
                      onClick={handleRSVP}
                      className="flex-1 px-6 py-3 rounded-xl bg-accent hover:bg-[#d4c4a6] text-background transition-all flex items-center justify-center gap-2"
                      style={{ fontSize: '14px', fontWeight: 400 }}
                    >
                      {event.external_link ? (
                        <>
                          <ExternalLink size={16} />
                          <span>RSVP Now</span>
                        </>
                      ) : (
                        <span>Request RSVP</span>
                      )}
                    </button>
                    {onOpenConcierge && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenConcierge();
                        }}
                        className="px-6 py-3 rounded-xl bg-surface-elevated border border-border hover:bg-border text-text-primary transition-all flex items-center gap-2"
                        style={{ fontSize: '14px', fontWeight: 400 }}
                      >
                        <MessageCircle size={16} />
                        <span>Contact Concierge</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

