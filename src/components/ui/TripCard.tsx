import React from 'react';
import { Plane, MapPin, Calendar } from 'lucide-react';

interface Trip {
  id: string;
  data: {
    name?: string;
    start_date?: string;
    end_date?: string;
    destinations?: string[];
    [key: string]: any;
  };
  created_at: string;
}

interface TripCardProps {
  trip: Trip;
  variant?: 'compact' | 'detailed';
}

export const TripCard: React.FC<TripCardProps> = ({ trip, variant = 'compact' }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const tripName = trip.data.name || trip.data.destinations?.[0] || 'Untitled Trip';
  const startDate = formatDate(trip.data.start_date);
  const endDate = formatDate(trip.data.end_date);
  const destination = trip.data.destinations?.[0] || trip.data.destination || 'Unknown';

  if (variant === 'compact') {
    return (
      <div className="bg-surface border border-border rounded-xl p-4 hover:border-[#3a3a3a] transition-all">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
            <Plane className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-text-primary truncate" style={{ fontSize: '14px', fontWeight: 400 }}>
              {tripName}
            </h4>
            <div className="mt-1 space-y-1">
              {startDate && endDate && (
                <div className="flex items-center gap-1.5 text-text-secondary" style={{ fontSize: '12px', fontWeight: 300 }}>
                  <Calendar className="w-3 h-3" />
                  <span>{startDate} - {endDate}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-text-secondary" style={{ fontSize: '12px', fontWeight: 300 }}>
                <MapPin className="w-3 h-3" />
                <span className="truncate">{destination}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 hover:border-[#3a3a3a] transition-all">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
          <Plane className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-text-primary" style={{ fontSize: '18px', fontWeight: 400 }}>
            {tripName}
          </h3>
          <div className="mt-3 space-y-2">
            {startDate && endDate && (
              <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                <Calendar className="w-4 h-4" />
                <span>{startDate} - {endDate}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
              <MapPin className="w-4 h-4" />
              <span>{destination}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

