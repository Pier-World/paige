import React from 'react';
import { Plane, Clock, DollarSign, TrendingUp, Star } from 'lucide-react';

interface Flight {
  id?: string;
  airline?: string;
  flight_number?: string;
  origin?: string;
  destination?: string;
  departure_time?: string;
  arrival_time?: string;
  duration?: string;
  price?: number;
  currency?: string;
  cabin_class?: string;
  stops?: number;
  aircraft?: string;
  score?: number;
  recommendation_reason?: string;
}

interface FlightComparisonGridProps {
  flights: Flight[];
  searchParams?: {
    origin?: string;
    destination?: string;
    date?: string;
    passengers?: number;
  };
  recommendation?: {
    flight_id: string;
    reason: string;
  };
  onSelect?: (flight: Flight) => void;
}

export const FlightComparisonGrid: React.FC<FlightComparisonGridProps> = ({
  flights,
  searchParams,
  recommendation,
  onSelect,
}) => {
  if (!flights || flights.length === 0) {
    return (
      <div className="mt-4 p-6 bg-neutral-800 border border-border rounded-xl text-center">
        <p className="text-text-secondary">No flights found</p>
      </div>
    );
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return 'N/A';
    const symbol = currency === 'USD' ? '$' : currency || '$';
    return `${symbol}${price.toLocaleString()}`;
  };

  const getStopsLabel = (stops?: number) => {
    if (stops === 0 || stops === undefined) return 'Nonstop';
    if (stops === 1) return '1 stop';
    return `${stops} stops`;
  };

  const topFlight = recommendation 
    ? flights.find(f => f.id === recommendation.flight_id || f.flight_number === recommendation.flight_id)
    : flights[0];

  return (
    <div className="mt-4 space-y-3">
      {/* Search Summary */}
      {searchParams && (
        <div className="px-4 py-2 bg-neutral-800 rounded-lg">
          <p className="text-sm text-text-secondary">
            {searchParams.origin || 'Origin'} → {searchParams.destination || 'Destination'}
            {searchParams.date && ` • ${new Date(searchParams.date).toLocaleDateString()}`}
            {searchParams.passengers && searchParams.passengers > 1 && ` • ${searchParams.passengers} passengers`}
          </p>
        </div>
      )}

      {/* Recommendation Banner */}
      {recommendation && topFlight && (
        <div className="p-4 bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30 rounded-xl">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-accent mb-1">Recommended Flight</p>
              <p className="text-xs text-text-secondary">{recommendation.reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Flight Grid */}
      <div className="space-y-2">
        {flights.slice(0, 10).map((flight, index) => {
          const isRecommended = recommendation?.flight_id === flight.id || 
                                recommendation?.flight_id === flight.flight_number ||
                                (index === 0 && !recommendation);
          
          return (
            <div
              key={flight.id || flight.flight_number || index}
              className={`p-4 bg-surface border rounded-xl transition-all cursor-pointer hover:border-accent ${
                isRecommended 
                  ? 'border-accent/50 bg-accent/5' 
                  : 'border-border'
              }`}
              onClick={() => onSelect && onSelect(flight)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary">
                      {flight.airline || 'Unknown Airline'}
                    </span>
                    {isRecommended && (
                      <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {flight.flight_number || 'N/A'} • {flight.cabin_class || 'Economy'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-text-primary">
                    {formatPrice(flight.price, flight.currency)}
                  </div>
                  {flight.score && (
                    <div className="text-xs text-text-secondary">
                      Score: {Math.round(flight.score)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                {/* Departure */}
                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <div className="font-medium text-text-primary">
                      {formatTime(flight.departure_time)}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {flight.origin || 'Origin'}
                    </div>
                  </div>
                </div>

                {/* Duration & Stops */}
                <div className="flex-1 flex items-center gap-2 px-3">
                  <div className="flex-1 h-px bg-border"></div>
                  <div className="text-center">
                    <div className="text-xs text-text-secondary flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {flight.duration || 'N/A'}
                    </div>
                    <div className="text-xs text-text-tertiary mt-0.5">
                      {getStopsLabel(flight.stops)}
                    </div>
                  </div>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                {/* Arrival */}
                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <div className="font-medium text-text-primary">
                      {formatTime(flight.arrival_time)}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {flight.destination || 'Destination'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {(flight.aircraft || flight.recommendation_reason) && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    {flight.aircraft && (
                      <div className="flex items-center gap-1">
                        <Plane className="w-3 h-3" />
                        <span>{flight.aircraft}</span>
                      </div>
                    )}
                    {flight.recommendation_reason && !isRecommended && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{flight.recommendation_reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {flights.length > 10 && (
        <div className="text-center pt-2">
          <p className="text-xs text-text-secondary">
            Showing 10 of {flights.length} flights
          </p>
        </div>
      )}
    </div>
  );
};

