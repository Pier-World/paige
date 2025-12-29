import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { OnboardingData } from '../../../types/onboarding';

interface GoalsStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const GOAL_OPTIONS = [
  { id: 'maximize-points', label: 'Maximize Points & Miles' },
  { id: 'travel-optimization', label: 'Optimize Travel Experiences' },
  { id: 'track-benefits', label: 'Track Card Benefits' },
  { id: 'discover-opportunities', label: 'Discover Opportunities' },
  { id: 'redeem-rewards', label: 'Redeem Rewards' },
];

export function GoalsStep({ data, updateData, onNext, onBack }: GoalsStepProps) {
  const [selected, setSelected] = useState<string[]>(data.goals);

  useEffect(() => {
    updateData({ goals: selected });
  }, [selected, updateData]);

  const toggleGoal = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (selected.length > 0) {
      onNext();
    }
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
              003
            </div>
            
            <h2 className="text-[28px] md:text-[32px] leading-[1.2] tracking-[-0.02em] text-foreground font-light">
              Primary objectives
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-[1px]">
            {GOAL_OPTIONS.map((goal, index) => {
              const isSelected = selected.includes(goal.id);
              
              return (
                <motion.button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                  className="w-full text-left py-5 border-b border-border transition-all duration-200 group hover:bg-foreground/[0.04] dark:hover:bg-foreground/[0.02] cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-8">
                    <span className={`
                      text-[15px] transition-colors duration-200 font-light
                      ${isSelected ? 'text-foreground' : 'text-foreground/50 group-hover:text-foreground'}
                    `}>
                      {goal.label}
                    </span>
                    
                    <div className={`
                      w-4 h-4 border transition-all duration-200 flex-shrink-0
                      ${isSelected ? 'border-foreground bg-foreground' : 'border-border group-hover:border-foreground/80'}
                    `}>
                      {isSelected && (
                        <svg className="w-full h-full text-background p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
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
            disabled={selected.length === 0}
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90 h-9 px-8 disabled:opacity-20 dark:bg-foreground dark:text-background"
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

