import React from 'react';
import { motion } from 'framer-motion';
import { Hotel, MapPin, Star, Check, Sparkles, TrendingUp } from 'lucide-react';

export interface HotelRecommendation {
  id: string;
  name: string;
  score: number;
  score_breakdown: {
    budget_fit: number;
    vibe_match: number;
    neighborhood_match: number;
    loyalty_bonus: number;
    pier_perks: number;
    taste_similarity: number;
  };
  reason: string;
  // Additional hotel data from database
  neighborhood?: string;
  primary_city?: string;
  rate_mid?: number;
  quality_score_internal?: number;
  pier_perk_level?: 'none' | 'preferred' | 'VIP partner';
  pier_benefits?: string[];
}

interface HotelRecommendationCardProps {
  recommendation: HotelRecommendation;
  selected?: boolean;
  onSelect: (hotelId: string) => void;
}

export const HotelRecommendationCard: React.FC<HotelRecommendationCardProps> = ({
  recommendation,
  selected = false,
  onSelect,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getPerkBadgeColor = (level: string) => {
    switch (level) {
      case 'VIP partner':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'preferred':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-white rounded-xl border overflow-hidden transition-all cursor-pointer
        ${selected 
          ? 'border-blue-500 ring-2 ring-blue-100 shadow-lg' 
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
        }
      `}
      onClick={() => onSelect(recommendation.id)}
    >
      {/* Header with score and perks */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Hotel size={18} className="text-slate-600" />
              <h3 className="font-semibold text-slate-900">{recommendation.name}</h3>
            </div>
            {recommendation.neighborhood && (
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin size={14} />
                <span>{recommendation.neighborhood}, {recommendation.primary_city}</span>
              </div>
            )}
          </div>
          
          {/* Match Score */}
          <div className={`px-3 py-1.5 rounded-lg ${getScoreColor(recommendation.score)}`}>
            <div className="flex items-center gap-1">
              <TrendingUp size={14} />
              <span className="text-sm font-semibold">
                {Math.round(recommendation.score * 100)}% match
              </span>
            </div>
          </div>
        </div>

        {/* Pier Perks Badge */}
        {recommendation.pier_perk_level && recommendation.pier_perk_level !== 'none' && (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getPerkBadgeColor(recommendation.pier_perk_level)}`}>
            <Sparkles size={12} />
            <span>Pier {recommendation.pier_perk_level}</span>
          </div>
        )}
      </div>

      {/* Reason/Description */}
      <div className="p-4">
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          {recommendation.reason}
        </p>

        {/* Score Breakdown (Collapsible) */}
        <details className="group">
          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 flex items-center gap-1">
            <span>Match breakdown</span>
            <span className="group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-3 space-y-2 pt-3 border-t border-slate-100">
            {Object.entries(recommendation.score_breakdown).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                  <span className="text-slate-500 w-8 text-right">
                    {Math.round(value * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Footer with price and action */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        {recommendation.rate_mid ? (
          <div>
            <div className="text-xs text-slate-500">From</div>
            <div className="text-lg font-semibold text-slate-900">
              {formatPrice(recommendation.rate_mid)}/night
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Rate available on request</div>
        )}

        <button
          className={`
            px-4 py-2 rounded-lg font-medium text-sm transition-all
            ${selected
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 text-white hover:bg-slate-800'
            }
          `}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(recommendation.id);
          }}
        >
          {selected ? (
            <span className="flex items-center gap-1">
              <Check size={16} />
              Selected
            </span>
          ) : (
            'Select'
          )}
        </button>
      </div>

      {/* Pier Benefits */}
      {recommendation.pier_benefits && recommendation.pier_benefits.length > 0 && (
        <div className="px-4 py-2 bg-purple-50 border-t border-purple-100">
          <div className="flex items-center gap-1 text-xs text-purple-700 mb-1">
            <Sparkles size={12} />
            <span className="font-medium">Pier Benefits:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {recommendation.pier_benefits.map((benefit, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-white border border-purple-200 rounded text-xs text-purple-700"
              >
                {benefit}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

interface HotelRecommendationsListProps {
  recommendations: HotelRecommendation[];
  selectedHotelId?: string;
  onSelectHotel: (hotelId: string) => void;
  filterStats?: {
    total_candidates: number;
    after_hard_filters: number;
    after_scoring: number;
    final_shown: number;
  };
}

export const HotelRecommendationsList: React.FC<HotelRecommendationsListProps> = ({
  recommendations,
  selectedHotelId,
  onSelectHotel,
  filterStats,
}) => {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <Hotel size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          No hotels found
        </h3>
        <p className="text-sm text-slate-500">
          Try adjusting your search criteria or preferences.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {filterStats && (
        <div className="text-xs text-slate-500 mb-4">
          Found {filterStats.final_shown} recommendations from {filterStats.total_candidates} properties
        </div>
      )}

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec) => (
          <HotelRecommendationCard
            key={rec.id}
            recommendation={rec}
            selected={selectedHotelId === rec.id}
            onSelect={onSelectHotel}
          />
        ))}
      </div>
    </div>
  );
};

