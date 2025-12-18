import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, MapPin, Check, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (city: string) => void;
  selectedCities: string[];
  maxCities: number;
}

// Available cities from the hotels table enum
const AVAILABLE_CITIES = [
  { value: 'NYC', label: 'New York City' },
  { value: 'LA', label: 'Los Angeles' },
  { value: 'Miami', label: 'Miami' },
  { value: 'SF', label: 'San Francisco' },
  { value: 'London', label: 'London' },
  { value: 'Austin', label: 'Austin' },
];

export function CitySelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedCities,
  maxCities,
}: CitySelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableCities, setAvailableCities] = useState(AVAILABLE_CITIES);

  useEffect(() => {
    // Fetch unique cities from hotels table as fallback
    const fetchCities = async () => {
      try {
        const { data } = await supabase
          .from('hotels')
          .select('primary_city')
          .eq('is_active', true);

        if (data) {
          const uniqueCities = Array.from(new Set(data.map(h => h.primary_city)))
            .filter(Boolean)
            .map(city => {
              const existing = AVAILABLE_CITIES.find(c => c.value === city);
              return existing || { value: city, label: city };
            });
          setAvailableCities(uniqueCities);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };

    if (isOpen) {
      fetchCities();
    }
  }, [isOpen]);

  const filteredCities = availableCities.filter(city =>
    city.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedCities.includes(city.value)
  );

  const isAtMax = selectedCities.length >= maxCities;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-subtle">
                <div className="flex items-center justify-between mb-4">
                  <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary">
                    Add Preferred City
                  </h3>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
                  >
                    <X size={20} className="text-text-tertiary" />
                  </button>
                </div>
                {isAtMax && (
                  <p className="text-text-secondary text-sm mb-4">
                    You've reached the maximum of {maxCities} cities. Remove one to add another.
                  </p>
                )}
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cities..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-accent"
                    style={{ fontSize: '14px', fontWeight: 400 }}
                  />
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto p-4">
                {filteredCities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-text-tertiary" style={{ fontSize: '14px', fontWeight: 300 }}>
                      {searchQuery ? 'No cities found' : 'All available cities are already selected'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCities.map((city) => (
                      <button
                        key={city.value}
                        onClick={() => {
                          if (!isAtMax) {
                            onSelect(city.value);
                            setSearchQuery('');
                          }
                        }}
                        disabled={isAtMax}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                          isAtMax
                            ? 'bg-surface-elevated border-border opacity-60 cursor-not-allowed'
                            : 'bg-surface-elevated border-border hover:border-accent/40 hover:bg-surface'
                        }`}
                      >
                        <MapPin size={18} className="text-accent flex-shrink-0" />
                        <span className="text-text-primary flex-1" style={{ fontSize: '14px', fontWeight: 400 }}>
                          {city.label}
                        </span>
                        {!isAtMax && (
                          <div className="w-5 h-5 rounded-full border-2 border-accent/30 flex items-center justify-center">
                            <Plus size={12} className="text-accent" />
                          </div>
                        )}
                      </button>
                    ))}
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

