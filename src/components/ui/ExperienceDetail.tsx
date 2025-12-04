import { X, MapPin, Clock, Calendar, Users, Sparkles, ArrowUpRight, MessageCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageWithFallback } from './ImageWithFallback';
import { useState } from 'react';

export interface ExperienceDetailData {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  date: string;
  dateRange?: string;
  location: string;
  locationDetails?: string;
  duration: string;
  capacity: string;
  spotsLeft: number;
  category: 'dining' | 'travel' | 'wellness' | 'culture' | 'networking';
  price: string;
  priceDetails?: string;
  imageUrl: string;
  additionalImages?: string[];
  featured: boolean;
  highlights?: string[];
  itinerary?: {
    day?: string;
    time: string;
    activity: string;
    description?: string;
  }[];
  included?: string[];
  notIncluded?: string[];
  terms?: string[];
  cancellationPolicy?: string;
  contactInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface ExperienceDetailProps {
  experience: ExperienceDetailData | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestInvitation?: (experienceId: string) => void;
  onOpenConcierge?: () => void;
}

export function ExperienceDetail({ 
  experience, 
  isOpen, 
  onClose, 
  onRequestInvitation,
  onOpenConcierge 
}: ExperienceDetailProps) {
  const [requesting, setRequesting] = useState(false);

  if (!experience) return null;

  const handleRequestInvitation = async () => {
    if (onRequestInvitation) {
      setRequesting(true);
      try {
        await onRequestInvitation(experience.id);
      } finally {
        setRequesting(false);
      }
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
                  src={experience.imageUrl}
                  alt={experience.title}
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
                {experience.featured && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-accent/20">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={12} className="text-accent" />
                      <span className="text-accent" style={{ fontSize: '11px', fontWeight: 400 }}>
                        Featured
                      </span>
                    </div>
                  </div>
                )}

                {/* Spots Left Badge */}
                {experience.spotsLeft <= 3 && (
                  <div className="absolute top-4 right-16 px-3 py-1.5 rounded-full bg-accent/90 backdrop-blur-sm">
                    <span className="text-background" style={{ fontSize: '11px', fontWeight: 400 }}>
                      Only {experience.spotsLeft} spots left
                    </span>
                  </div>
                )}

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-text-primary mb-2">
                    {experience.title}
                  </h2>
                  <p className="text-text-secondary" style={{ fontSize: '16px', fontWeight: 300 }}>
                    {experience.description}
                  </p>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1">
                <div className="p-8">
                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b border-border">
                    <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                      <Calendar size={16} className="text-accent" />
                      <span>{experience.dateRange || experience.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                      <Clock size={16} className="text-accent" />
                      <span>{experience.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                      <MapPin size={16} className="text-accent" />
                      <span>{experience.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                      <Users size={16} className="text-accent" />
                      <span>{experience.capacity}</span>
                    </div>
                  </div>

                  {/* Long Description */}
                  <div className="mb-8">
                    <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-4">
                      About This Experience
                    </h3>
                    <p className="text-text-secondary leading-relaxed" style={{ fontSize: '15px', fontWeight: 300, lineHeight: '1.8' }}>
                      {experience.longDescription}
                    </p>
                  </div>

                  {/* Highlights */}
                  {experience.highlights && experience.highlights.length > 0 && (
                    <div className="mb-8">
                      <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-4">
                        Highlights
                      </h3>
                      <ul className="space-y-2">
                        {experience.highlights.map((highlight, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Itinerary */}
                  {experience.itinerary && experience.itinerary.length > 0 && (
                    <div className="mb-8">
                      <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-4">
                        Itinerary
                      </h3>
                      <div className="space-y-4">
                        {experience.itinerary.map((item, idx) => (
                          <div key={idx} className="flex gap-4 pb-4 border-b border-border/50 last:border-0">
                            <div className="flex-shrink-0 w-20 text-text-tertiary" style={{ fontSize: '13px', fontWeight: 400 }}>
                              {item.day && <div className="mb-1">{item.day}</div>}
                              <div>{item.time}</div>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-text-primary mb-1" style={{ fontSize: '15px', fontWeight: 400 }}>
                                {item.activity}
                              </h4>
                              {item.description && (
                                <p className="text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* What's Included */}
                  {experience.included && experience.included.length > 0 && (
                    <div className="mb-8">
                      <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-4">
                        What's Included
                      </h3>
                      <ul className="space-y-2">
                        {experience.included.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                            <Check size={16} className="text-accent mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* What's Not Included */}
                  {experience.notIncluded && experience.notIncluded.length > 0 && (
                    <div className="mb-8">
                      <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-4">
                        Not Included
                      </h3>
                      <ul className="space-y-2">
                        {experience.notIncluded.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                            <X size={16} className="text-text-tertiary mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Location Details */}
                  {experience.locationDetails && (
                    <div className="mb-8">
                      <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-4">
                        Location Details
                      </h3>
                      <p className="text-text-secondary leading-relaxed" style={{ fontSize: '14px', fontWeight: 300, lineHeight: '1.8' }}>
                        {experience.locationDetails}
                      </p>
                    </div>
                  )}

                  {/* Terms & Conditions */}
                  {experience.terms && experience.terms.length > 0 && (
                    <div className="mb-8">
                      <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-4">
                        Terms & Conditions
                      </h3>
                      <ul className="space-y-2">
                        {experience.terms.map((term, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                            <div className="mt-1.5 w-1 h-1 rounded-full bg-text-tertiary flex-shrink-0" />
                            <span>{term}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cancellation Policy */}
                  {experience.cancellationPolicy && (
                    <div className="mb-8">
                      <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-4">
                        Cancellation Policy
                      </h3>
                      <p className="text-text-secondary leading-relaxed" style={{ fontSize: '14px', fontWeight: 300, lineHeight: '1.8' }}>
                        {experience.cancellationPolicy}
                      </p>
                    </div>
                  )}

                  {/* Contact Info */}
                  {experience.contactInfo && (
                    <div className="mb-8 p-4 rounded-lg bg-surface-elevated border border-border">
                      <h3 style={{ fontSize: '16px', fontWeight: 400 }} className="text-text-primary mb-3">
                        Questions?
                      </h3>
                      <div className="space-y-1 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                        <p>{experience.contactInfo.name}</p>
                        <p>{experience.contactInfo.email}</p>
                        {experience.contactInfo.phone && <p>{experience.contactInfo.phone}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with Price and CTA */}
              <div className="p-6 border-t border-border bg-surface-elevated">
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="text-text-tertiary mb-1" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase' }}>
                      Member Price
                    </p>
                    <p className="text-accent" style={{ fontSize: '24px', fontWeight: 400 }}>
                      {experience.price}
                    </p>
                    {experience.priceDetails && (
                      <p className="text-text-tertiary mt-1" style={{ fontSize: '12px', fontWeight: 300 }}>
                        {experience.priceDetails}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleRequestInvitation}
                    disabled={requesting || experience.spotsLeft === 0}
                    className="px-6 py-3 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ fontSize: '14px', fontWeight: 400 }}
                  >
                    {requesting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background" />
                        <span>Requesting...</span>
                      </>
                    ) : experience.spotsLeft === 0 ? (
                      'Fully Booked'
                    ) : (
                      <>
                        <MessageCircle size={16} />
                        <span>Request Invitation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


