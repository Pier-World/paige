import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { OnboardingData } from '../../../types/onboarding';

interface PreferencesStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const TRAVEL_STYLES = [
  { id: 'luxury', label: 'Luxury' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'beach', label: 'Beach & Resort' },
  { id: 'city', label: 'City Explorer' },
  { id: 'foodie', label: 'Food & Dining' },
  { id: 'cultural', label: 'Cultural' },
];

const INTERESTS = [
  { id: 'points-maximization', label: 'Points Maximization' },
  { id: 'lounge-access', label: 'Lounge Access' },
  { id: 'status-matching', label: 'Status Matching' },
  { id: 'elite-perks', label: 'Elite Perks' },
  { id: 'hotel-upgrades', label: 'Hotel Upgrades' },
  { id: 'flight-deals', label: 'Flight Deals' },
  { id: 'travel-insurance', label: 'Travel Insurance' },
  { id: 'concierge', label: 'Concierge Services' },
];

export function PreferencesStep({ data, updateData, onNext, onBack }: PreferencesStepProps) {
  const [travelStyle, setTravelStyle] = useState<string[]>(data.preferences.travelStyle || []);
  const [interests, setInterests] = useState<string[]>(data.preferences.interests || []);

  useEffect(() => {
    updateData({ 
      preferences: { 
        travelStyle, 
        interests 
      } 
    });
  }, [travelStyle, interests, updateData]);

  const toggleTravelStyle = (id: string) => {
    setTravelStyle((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto px-6">
      <div className="min-h-screen flex flex-col justify-center">
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-16"
        >
          {/* Question */}
          <div className="space-y-8">
            <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              005
            </div>
            
            <h2 className="text-[28px] md:text-[32px] leading-[1.2] tracking-[-0.02em] text-foreground font-light">
              Travel preferences
            </h2>
          </div>

          {/* Travel Styles */}
          <div className="space-y-6">
            <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              Style
            </div>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_STYLES.map((style, index) => {
                const isSelected = travelStyle.includes(style.id);
                
                return (
                  <motion.button
                    key={style.id}
                    onClick={() => toggleTravelStyle(style.id)}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.04, duration: 0.3 }}
                    className={`
                      px-5 py-2.5 border text-[12px] transition-all duration-200 font-light cursor-pointer
                      ${
                        isSelected
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border text-foreground/60 hover:border-foreground/80 hover:text-foreground hover:bg-foreground/[0.04] dark:hover:bg-foreground/[0.02]'
                      }
                    `}
                  >
                    {style.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-6">
            <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              Interests
            </div>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest, index) => {
                const isSelected = interests.includes(interest.id);
                
                return (
                  <motion.button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.03, duration: 0.3 }}
                    className={`
                      px-5 py-2.5 border text-[12px] transition-all duration-200 font-light cursor-pointer
                      ${
                        isSelected
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border text-foreground/60 hover:border-foreground/80 hover:text-foreground hover:bg-foreground/[0.04] dark:hover:bg-foreground/[0.02]'
                      }
                    `}
                  >
                    {interest.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="fixed bottom-12 left-6 right-6 flex items-center justify-between"
        >
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground h-9 px-0"
          >
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90 h-9 px-8 dark:bg-foreground dark:text-background"
          >
            <span className="text-[10px] tracking-[0.25em] uppercase font-medium">
              Continue
            </span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

