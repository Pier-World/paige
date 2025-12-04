import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Sparkles, Check, ChevronDown, ChevronUp, Heart, X, Calendar } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullDetail, setShowFullDetail] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const imageUrl = hotel.imageUrl || hotel.image_hero || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
  const averageRate = hotel.averageRate || (hotel.rate_estimate ? `$${hotel.rate_estimate.mid}` : 'Rate on request');
  const matchReasons = hotel.matchReasons.length > 0 ? hotel.matchReasons : (hotel.reason ? [hotel.reason] : []);

  return (
    <>
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

      {/* Full Detail Modal */}
      <AnimatePresence>
        {showFullDetail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFullDetail(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="min-h-screen px-4 py-8 flex items-start justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-4xl rounded-2xl bg-background border border-border shadow-2xl overflow-hidden my-8"
                >
                  <button
                    onClick={() => setShowFullDetail(false)}
                    className="absolute top-6 right-6 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-surface transition-colors"
                  >
                    <X size={20} className="text-text-primary" />
                  </button>

                  {/* Hero Image */}
                  <div className="relative aspect-[21/9] overflow-hidden bg-surface-elevated">
                    <ImageWithFallback
                      src={imageUrl}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8">
                      <h2 style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-white mb-2">
                        {hotel.name}
                      </h2>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-white/80" style={{ fontSize: '14px', fontWeight: 300 }}>
                          <MapPin size={16} />
                          <span>{hotel.location || `${hotel.neighborhood || ''}, ${hotel.city}`.trim()}</span>
                        </div>
                        {hotel.rating && (
                          <div className="flex items-center gap-1">
                            <Star size={16} className="text-accent fill-accent" />
                            <span className="text-white" style={{ fontSize: '14px', fontWeight: 400 }}>
                              {hotel.rating} {hotel.reviewCount && `(${hotel.reviewCount} reviews)`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Main Content */}
                      <div className="lg:col-span-2 space-y-6">
                        {hotel.description && (
                          <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-3">
                              About
                            </h3>
                            <p className="text-text-secondary" style={{ fontSize: '15px', fontWeight: 300, lineHeight: '1.7' }}>
                              {hotel.description}
                            </p>
                          </div>
                        )}

                        {matchReasons.length > 0 && (
                          <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-3">
                              Why We Recommend This Hotel
                            </h3>
                            <div className="space-y-2">
                              {matchReasons.map((reason, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <Check size={16} className="text-accent mt-0.5 flex-shrink-0" />
                                  <span className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300, lineHeight: '1.6' }}>
                                    {reason}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {hotel.amenities && hotel.amenities.length > 0 && (
                          <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-3">
                              Amenities
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                              {hotel.amenities.map((amenity, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Check size={14} className="text-accent" />
                                  <span className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                                    {amenity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {hotel.nearbyAttractions && hotel.nearbyAttractions.length > 0 && (
                          <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-3">
                              Nearby Attractions
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {hotel.nearbyAttractions.map((attraction, idx) => (
                                <div
                                  key={idx}
                                  className="px-3 py-2 rounded-lg bg-surface border border-border"
                                >
                                  <span className="text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                                    {attraction}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sidebar */}
                      <div className="lg:col-span-1 space-y-6">
                        <div className="rounded-xl bg-surface border border-border p-6">
                          <div className="mb-4">
                            <p className="text-text-tertiary mb-1" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Average Rate
                            </p>
                            <p className="text-text-primary" style={{ fontSize: '28px', fontWeight: 300 }}>
                              {averageRate}
                            </p>
                            <p className="text-text-tertiary" style={{ fontSize: '13px', fontWeight: 300 }}>
                              per night
                            </p>
                          </div>
                          <button
                            onClick={onOpenConcierge}
                            className="w-full px-6 py-3 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-all mb-2"
                            style={{ fontSize: '14px', fontWeight: 400 }}
                          >
                            Book with Concierge
                          </button>
                          <p className="text-text-tertiary text-center" style={{ fontSize: '11px', fontWeight: 300 }}>
                            We'll secure the best rate + benefits
                          </p>
                        </div>

                        {hotel.pierBenefits && hotel.pierBenefits.length > 0 && (
                          <div className="rounded-xl bg-accent/5 border border-accent/20 p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Sparkles size={18} className="text-accent" />
                              <h4 style={{ fontSize: '16px', fontWeight: 400 }} className="text-text-primary">
                                Your Pier Benefits
                              </h4>
                            </div>
                            <div className="space-y-2">
                              {hotel.pierBenefits.map((benefit, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <Check size={14} className="text-accent mt-0.5 flex-shrink-0" />
                                  <span className="text-text-primary" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.5' }}>
                                    {benefit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {hotel.policies && (
                          <div className="rounded-xl bg-surface border border-border p-6">
                            <h4 style={{ fontSize: '16px', fontWeight: 400 }} className="text-text-primary mb-4">
                              Policies
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <p className="text-text-tertiary mb-1" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Check-in
                                </p>
                                <p className="text-text-primary" style={{ fontSize: '13px', fontWeight: 400 }}>
                                  {hotel.policies.checkIn}
                                </p>
                              </div>
                              <div>
                                <p className="text-text-tertiary mb-1" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Check-out
                                </p>
                                <p className="text-text-primary" style={{ fontSize: '13px', fontWeight: 400 }}>
                                  {hotel.policies.checkOut}
                                </p>
                              </div>
                              <div>
                                <p className="text-text-tertiary mb-1" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Cancellation
                                </p>
                                <p className="text-text-primary" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.5' }}>
                                  {hotel.policies.cancellation}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

