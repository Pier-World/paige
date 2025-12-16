import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Sparkles, Check, ChevronDown, ChevronUp, Heart, X, Calendar } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { useAuth } from '../../context/AuthContext';
import { HotelProfile } from './HotelProfile';

export interface HotelRecommendation {
  id: string;
  hotel_id: string;
  name: string;
  location: string;
  city: string;
  neighborhood?: string;
  rating?: number;
  reviewCount?: number;
  averageRate: string;
  rateRange?: string;
  imageUrl?: string;
  image_hero?: string;
  pierBenefits: string[];
  matchReasons: string[];
  reason?: string; // Single reason from backend
  description?: string;
  amenities?: string[];
  policies?: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
  };
  nearbyAttractions?: string[];
  membershipMatch?: string;
  rate_estimate?: {
    low: number;
    mid: number;
    high: number;
  };
}

interface HotelRecommendationCardProps {
  hotel: HotelRecommendation;
  index: number;
  onOpenConcierge?: () => void;
}

export function HotelRecommendationCard({ hotel, index, onOpenConcierge }: HotelRecommendationCardProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullDetail, setShowFullDetail] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Check if this is being rendered as a modal (from HomePage)
  const isModal = (hotel as any).__isModal;
  
  // If modal, show detail immediately
  useEffect(() => {
    if (isModal) {
      setShowFullDetail(true);
    }
  }, [isModal]);

  // Check if user has concierge access (Premium, Executive, Founding Member)
  const hasConciergeAccess = user?.membership_level && 
    ['Premium', 'Executive', 'Founding Member'].includes(user.membership_level);

  // WhatsApp booking function
  const handleBookWithConcierge = () => {
    if (!hasConciergeAccess) {
      // If no access, show upgrade message or use onOpenConcierge callback
      if (onOpenConcierge) {
        onOpenConcierge();
      }
      return;
    }

    // Extract dates from hotel data
    const hotelName = hotel.name;
    let dates = (hotel as any).parsedDates;
    
    // If parsedDates is not available, try to format from raw date data
    if (!dates) {
      const hotelData = hotel as any;
      const checkIn = hotelData.check_in || hotelData.dates?.check_in;
      const checkOut = hotelData.check_out || hotelData.dates?.check_out;
      
      if (checkIn && checkOut) {
        // Format dates as "Dec 19th-21st"
        const formatDayWithSuffix = (day: number): string => {
          if (day >= 11 && day <= 13) return `${day}th`;
          switch (day % 10) {
            case 1: return `${day}st`;
            case 2: return `${day}nd`;
            case 3: return `${day}rd`;
            default: return `${day}th`;
          }
        };
        
        try {
          const checkInDate = new Date(checkIn);
          const checkOutDate = new Date(checkOut);
          
          const checkInMonth = checkInDate.toLocaleDateString('en-US', { month: 'short' });
          const checkInDay = formatDayWithSuffix(checkInDate.getDate());
          const checkOutMonth = checkOutDate.toLocaleDateString('en-US', { month: 'short' });
          const checkOutDay = formatDayWithSuffix(checkOutDate.getDate());
          
          // If same month, format as "Dec 19th-21st", otherwise "Dec 19th - Jan 5th"
          if (checkInMonth === checkOutMonth) {
            dates = `${checkInMonth} ${checkInDay}-${checkOutDay}`;
          } else {
            dates = `${checkInMonth} ${checkInDay} - ${checkOutMonth} ${checkOutDay}`;
          }
        } catch (e) {
          console.error('Error formatting dates:', e);
        }
      }
    }
    
    // Fallback if still no dates
    if (!dates) {
      dates = 'your requested dates';
    }
    
    // Create WhatsApp message
    const message = encodeURIComponent(`I'd like to book ${hotelName} for ${dates}`);
    const WHATSAPP_PHONE = '19179354877';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const whatsappLink = isMobile 
      ? `https://wa.me/${WHATSAPP_PHONE}?text=${message}`
      : `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${message}&type=phone_number&app_absent=0`;
    
    window.open(whatsappLink, '_blank', 'noopener,noreferrer');
  };

  const imageUrl = hotel.imageUrl || hotel.image_hero || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
  
  // Calculate average rate with "starting at" format using low rate
  let averageRate = hotel.averageRate || 'Rate on request';
  if (!hotel.averageRate && hotel.rate_estimate && hotel.rate_estimate.low) {
    averageRate = `Starting at $${hotel.rate_estimate.low}`;
  } else if (!hotel.averageRate && (hotel as any).rate_low) {
    averageRate = `Starting at $${(hotel as any).rate_low}`;
  } else if (!hotel.averageRate && hotel.rate_estimate && hotel.rate_estimate.mid) {
    averageRate = `Starting at $${hotel.rate_estimate.mid}`;
  }
  
  const matchReasons = hotel.matchReasons.length > 0 ? hotel.matchReasons : (hotel.reason ? [hotel.reason] : []);

  const handleCloseModal = () => {
    setShowFullDetail(false);
    if (isModal && onOpenConcierge && typeof onOpenConcierge === 'object' && (onOpenConcierge as any).close) {
      (onOpenConcierge as any).close();
    }
  };

  return (
    <>
      {!isModal && (
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.15 }}
        className="rounded-2xl bg-surface border border-border overflow-hidden hover:border-accent/40 transition-all"
      >
        {/* Image */}
        <div 
          className="relative aspect-[16/10] overflow-hidden bg-surface-elevated group cursor-pointer" 
          onClick={() => setShowFullDetail(true)}
        >
          <ImageWithFallback
            src={imageUrl}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Pier Benefits Badge */}
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-accent/95 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-background" />
              <span className="text-background" style={{ fontSize: '11px', fontWeight: 400 }}>
                Pier Benefits
              </span>
            </div>
          </div>

          {/* Rating Overlay */}
          {hotel.rating && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-1.5">
                  <Star size={12} className="text-accent fill-accent" />
                  <span className="text-white" style={{ fontSize: '13px', fontWeight: 400 }}>
                    {hotel.rating}
                  </span>
                  {hotel.reviewCount && (
                    <span className="text-white/60" style={{ fontSize: '11px', fontWeight: 300 }}>
                      ({hotel.reviewCount})
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 
                  className="text-text-primary mb-1 hover:text-accent cursor-pointer transition-colors"
                  style={{ fontSize: '20px', fontWeight: 400, letterSpacing: '-0.01em' }}
                  onClick={() => setShowFullDetail(true)}
                >
                  {hotel.name}
                </h3>
                <div className="flex items-center gap-2 text-text-tertiary" style={{ fontSize: '13px', fontWeight: 300 }}>
                  <MapPin size={14} />
                  <span>{hotel.location || `${hotel.neighborhood || ''}, ${hotel.city}`.trim()}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-text-primary mb-0.5" style={{ fontSize: '18px', fontWeight: 400 }}>
                  {averageRate}
                </p>
                <p className="text-text-tertiary" style={{ fontSize: '11px', fontWeight: 300 }}>
                  avg/night
                </p>
              </div>
            </div>
            {hotel.membershipMatch && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 mt-2">
                <Check size={12} className="text-accent" />
                <span className="text-accent" style={{ fontSize: '11px', fontWeight: 400 }}>
                  {hotel.membershipMatch}
                </span>
              </div>
            )}
          </div>

          {/* Why We Recommend */}
          {matchReasons.length > 0 && (
            <div className="mb-4">
              <p className="text-text-secondary mb-2" style={{ fontSize: '12px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Why We Recommend
              </p>
              <div className="space-y-2">
                {matchReasons.slice(0, 2).map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check size={14} className="text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-text-primary" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.5' }}>
                      {reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pier Benefits */}
          {hotel.pierBenefits && hotel.pierBenefits.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
              <p className="text-accent mb-2" style={{ fontSize: '12px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Pier Benefits
              </p>
              <div className="grid grid-cols-2 gap-2">
                {hotel.pierBenefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <Sparkles size={12} className="text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-text-primary" style={{ fontSize: '12px', fontWeight: 300 }}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expandable Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="pt-2 space-y-3">
                  {hotel.description && (
                    <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300, lineHeight: '1.6' }}>
                      {hotel.description}
                    </p>
                  )}
                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div>
                      <p className="text-text-secondary mb-2" style={{ fontSize: '12px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Amenities
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {hotel.amenities.map((amenity, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1.5 rounded-full bg-surface-elevated border border-border"
                          >
                            <span className="text-text-secondary" style={{ fontSize: '11px', fontWeight: 300 }}>
                              {amenity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-text-primary transition-all flex items-center gap-2"
              style={{ fontSize: '13px', fontWeight: 400 }}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {isExpanded ? 'Less' : 'More'}
            </button>
            <button 
              onClick={() => setIsSaved(!isSaved)}
              className={`px-4 py-2.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border transition-all ${
                isSaved ? 'text-accent' : 'text-text-primary'
              }`}
            >
              <Heart size={14} className={isSaved ? 'fill-current' : ''} />
            </button>
            <button
              onClick={() => setShowFullDetail(true)}
              className="flex-1 px-6 py-2.5 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-all"
              style={{ fontSize: '13px', fontWeight: 400 }}
            >
              View Details
            </button>
          </div>
        </div>
      </motion.div>
      )}

      {/* Full Detail Modal - Use new HotelProfile component */}
      <AnimatePresence>
        {(showFullDetail || isModal) && (
          <HotelProfile
            hotelId={hotel.hotel_id || hotel.id}
            hotelData={{
              id: hotel.hotel_id || hotel.id,
              name: hotel.name,
              neighborhood: hotel.neighborhood || '',
              primary_city: hotel.city || '',
              address: (hotel as any).address || '',
              star_rating: hotel.rating,
              image_hero: hotel.image_hero || hotel.imageUrl,
              notes_curated: hotel.description,
              pier_benefits: hotel.pierBenefits,
              // Add other fields from hotel object if available
              ...(hotel as any),
            }}
            parsedDates={(hotel as any).parsedDates}
            onClose={handleCloseModal}
            onBookWithConcierge={handleBookWithConcierge}
          />
        )}
      </AnimatePresence>
    </>
  );
}

