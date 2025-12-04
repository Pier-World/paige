import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MapPin, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { HotelRecommendation } from './HotelRecommendationCard';

interface CompactHotelCardProps {
  hotel: HotelRecommendation;
  onOpenConcierge?: () => void;
}

export const CompactHotelCard: React.FC<CompactHotelCardProps> = ({ hotel, onOpenConcierge }) => {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-xl overflow-hidden"
    >
      <div className="flex gap-4">
        {/* Image */}
        <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-l-xl">
          <ImageWithFallback
            src={hotel.imageUrl}
            alt={hotel.name}
            className="w-full h-full object-cover"
            fallbackSrc="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"
          />
          {/* Pier Benefits Badge */}
          {hotel.pierBenefits && hotel.pierBenefits.length > 0 && (
            <div className="absolute top-2 right-2 bg-[#c9b896] text-background px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="text-[10px] font-medium">Pier Benefits</span>
            </div>
          )}
          {/* Rating Overlay */}
          {hotel.rating && (
            <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
              <Star className="w-3 h-3 fill-accent text-accent" />
              <span className="text-xs font-medium text-text-primary">{hotel.rating}</span>
              {hotel.reviewCount && (
                <span className="text-[10px] text-text-tertiary">({hotel.reviewCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-text-primary font-medium text-sm truncate">{hotel.name}</h3>
              <button
                onClick={() => setSaved(!saved)}
                className="flex-shrink-0 p-1 hover:bg-surface-elevated rounded-lg transition-colors"
              >
                <Heart className={`w-4 h-4 ${saved ? 'fill-accent text-accent' : 'text-text-tertiary'}`} />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3 h-3 text-text-tertiary" />
              <span className="text-text-tertiary text-xs">{hotel.location}</span>
              {hotel.averageRate && (
                <>
                  <span className="text-text-tertiary">•</span>
                  <span className="text-text-secondary text-xs font-medium">{hotel.averageRate}/night</span>
                </>
              )}
            </div>

            {/* Match Reasons - Compact */}
            {hotel.matchReasons && hotel.matchReasons.length > 0 && (
              <div className="mb-2">
                <p className="text-text-secondary text-xs line-clamp-1">
                  {hotel.matchReasons[0]}
                </p>
              </div>
            )}

            {/* Pier Benefits - Compact */}
            {hotel.pierBenefits && hotel.pierBenefits.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="bg-[#c9b896]/20 border border-[#c9b896]/30 rounded px-2 py-0.5">
                  <span className="text-[10px] text-[#c9b896] font-medium">
                    {hotel.pierBenefits.slice(0, 2).join(' • ')}
                    {hotel.pierBenefits.length > 2 && ` +${hotel.pierBenefits.length - 2}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-accent text-xs hover:text-[#d4c4a6] transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  More
                </>
              )}
            </button>
            {onOpenConcierge && (
              <button
                onClick={onOpenConcierge}
                className="ml-auto px-3 py-1.5 bg-accent hover:bg-[#d4c4a6] text-background rounded-lg text-xs font-medium transition-colors"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border px-4 py-3"
        >
          {hotel.matchReasons && hotel.matchReasons.length > 1 && (
            <div className="mb-3">
              <h4 className="text-text-secondary text-xs font-medium mb-1.5">Why We Recommend</h4>
              <ul className="space-y-1">
                {hotel.matchReasons.slice(1).map((reason, idx) => (
                  <li key={idx} className="text-text-tertiary text-xs flex items-start gap-1.5">
                    <span className="text-accent mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hotel.description && (
            <p className="text-text-tertiary text-xs leading-relaxed">{hotel.description}</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

