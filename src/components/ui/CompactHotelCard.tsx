import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MapPin, Star, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { HotelRecommendation } from './HotelRecommendationCard';

interface CompactHotelCardProps {
  hotel: HotelRecommendation;
  index?: number;
  onOpenConcierge?: () => void;
  onViewDetails?: () => void;
  isNew?: boolean;
}

export const CompactHotelCard: React.FC<CompactHotelCardProps> = ({ 
  hotel, 
  index = 0,
  onOpenConcierge,
  onViewDetails
}) => {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  // Calculate match score from hotel data (if available)
  const matchScore = (hotel as any).matchScore || (hotel as any).score || null;

  // Calculate average rate with "starting at" format using low rate
  let averageRate = hotel.averageRate || 'Rate on request';
  if (!hotel.averageRate && hotel.rate_estimate && hotel.rate_estimate.low) {
    averageRate = `Starting at $${hotel.rate_estimate.low}`;
  } else if (!hotel.averageRate && (hotel as any).rate_low) {
    averageRate = `Starting at $${(hotel as any).rate_low}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }}
      className="bg-surface/40 border border-border rounded-2xl overflow-hidden hover:border-accent/40 transition-all cursor-pointer"
      onClick={(e) => {
        // Only trigger if not clicking on a button
        if (!(e.target as HTMLElement).closest('button')) {
          onViewDetails?.();
        }
      }}
    >
      {/* Image Section - Full Width */}
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
        <ImageWithFallback
          src={hotel.imageUrl || hotel.image_hero}
          alt={hotel.name}
          className="w-full h-full object-cover"
          fallbackSrc="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Pier Benefits Badge */}
        {hotel.pierBenefits && hotel.pierBenefits.length > 0 && (
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-accent/95 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-background" />
              <span className="text-background" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em' }}>
                Pier Benefits
              </span>
            </div>
          </div>
        )}

        {/* Match Score Badge */}
        {matchScore && (
          <div className="absolute top-3 right-3 bg-background/85 backdrop-blur-sm rounded-lg px-3 py-2 border border-accent/30">
            <div className="flex flex-col items-center">
              <span className="text-accent" style={{ fontSize: '18px', fontWeight: 600, lineHeight: 1 }}>
                {matchScore}%
              </span>
              <span className="text-text-tertiary" style={{ fontSize: '9px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                match
              </span>
            </div>
          </div>
        )}

        {/* Rating Overlay */}
        {hotel.rating && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-white/10">
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
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 
                className="text-text-primary mb-1.5"
                style={{ fontSize: '20px', fontWeight: 400, letterSpacing: '-0.01em', lineHeight: '1.3' }}
              >
                {hotel.name}
              </h3>
              <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                <MapPin size={14} />
                <span>{hotel.location || `${hotel.neighborhood || ''}, ${hotel.city}`.trim()}</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSaved(!saved);
              }}
              className="flex-shrink-0 p-2 hover:bg-surface-elevated rounded-lg transition-colors"
            >
              <Heart 
                size={20} 
                className={saved ? 'fill-accent text-accent' : 'text-text-tertiary'} 
              />
            </button>
          </div>

          {/* Rating and Price Row */}
          <div className="flex items-center gap-3 mb-3">
            {hotel.rating && (
              <div className="flex items-center gap-1.5">
                <div className="px-2 py-1 rounded bg-accent/20">
                  <span className="text-accent" style={{ fontSize: '14px', fontWeight: 600 }}>
                    {hotel.rating}
                  </span>
                </div>
                <span className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                  {hotel.rating >= 4.5 ? 'Exceptional' : hotel.rating >= 4 ? 'Excellent' : 'Good'}
                </span>
              </div>
            )}
            {averageRate && (
              <span className="text-accent ml-auto" style={{ fontSize: '16px', fontWeight: 400 }}>
                {averageRate}
                <span className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                  {averageRate !== 'Rate on request' ? '/night' : ''}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Pier Benefits - Horizontal Chips */}
        {hotel.pierBenefits && hotel.pierBenefits.length > 0 && (
          <div className="mb-4">
            <p className="text-text-secondary mb-2" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Your Pier Benefits
            </p>
            <div className="flex flex-wrap gap-2">
              {hotel.pierBenefits.slice(0, expanded ? undefined : 2).map((benefit, i) => (
                <span 
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent"
                  style={{ fontSize: '13px', fontWeight: 400 }}
                >
                  {benefit}
                </span>
              ))}
              {!expanded && hotel.pierBenefits.length > 2 && (
                <button
                  onClick={() => setExpanded(true)}
                  className="px-3 py-1.5 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
                  style={{ fontSize: '13px', fontWeight: 400 }}
                >
                  +{hotel.pierBenefits.length - 2} more
                </button>
              )}
            </div>
          </div>
        )}

        {/* Match Reasons - Compact */}
        {hotel.matchReasons && hotel.matchReasons.length > 0 && !expanded && (
          <div className="mb-4">
            <p className="text-text-secondary text-xs mb-1.5 line-clamp-2" style={{ fontWeight: 300, lineHeight: '1.5' }}>
              {hotel.matchReasons[0]}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-border-subtle">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-accent hover:text-[#d4c4a6] transition-colors"
            style={{ fontSize: '13px', fontWeight: 400 }}
          >
            {expanded ? (
              <>
                <ChevronUp size={16} />
                Less
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                More
              </>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.();
            }}
            className="ml-auto px-5 py-2.5 bg-accent hover:bg-[#d4c4a6] text-background rounded-lg transition-all"
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            View Details
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border px-5 py-4 bg-surface-elevated/30"
        >
          {hotel.matchReasons && hotel.matchReasons.length > 1 && (
            <div className="mb-4">
              <h4 className="text-text-secondary mb-2" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Why We Recommend
              </h4>
              <ul className="space-y-2">
                {hotel.matchReasons.slice(1).map((reason, idx) => (
                  <li key={idx} className="text-text-primary flex items-start gap-2" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.6' }}>
                    <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hotel.description && (
            <p className="text-text-secondary" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.6' }}>
              {hotel.description}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

