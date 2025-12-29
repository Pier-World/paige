import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { OnboardingData } from '../../../types/onboarding';

interface MembershipsStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const MEMBERSHIP_OPTIONS = [
  { id: 'amex-platinum', name: 'Amex Platinum', issuer: 'AMEX' },
  { id: 'amex-gold', name: 'Amex Gold', issuer: 'AMEX' },
  { id: 'chase-sapphire-reserve', name: 'Sapphire Reserve', issuer: 'CHASE' },
  { id: 'chase-sapphire-preferred', name: 'Sapphire Preferred', issuer: 'CHASE' },
  { id: 'capital-one-venture-x', name: 'Venture X', issuer: 'CAPITAL ONE' },
  { id: 'delta-skymiles', name: 'SkyMiles Reserve', issuer: 'DELTA' },
  { id: 'united-mileageplus', name: 'MileagePlus', issuer: 'UNITED' },
  { id: 'marriott-bonvoy', name: 'Bonvoy Brilliant', issuer: 'MARRIOTT' },
  { id: 'hilton-honors', name: 'Honors Aspire', issuer: 'HILTON' },
];

export function MembershipsStep({ data, updateData, onNext, onBack }: MembershipsStepProps) {
  const [selected, setSelected] = useState<string[]>(data.memberships);

  useEffect(() => {
    updateData({ memberships: selected });
  }, [selected, updateData]);

  const toggleMembership = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    onNext();
  };

  const handleSkip = () => {
    setSelected([]);
    updateData({ memberships: [] });
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto px-6">
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
              004
            </div>
            
            <h2 className="text-[28px] md:text-[32px] leading-[1.2] tracking-[-0.02em] text-foreground font-light">
              Cards & memberships
            </h2>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-[1px] bg-border">
            {MEMBERSHIP_OPTIONS.map((membership, index) => {
              const isSelected = selected.includes(membership.id);
              
              return (
                <motion.button
                  key={membership.id}
                  onClick={() => toggleMembership(membership.id)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.04, duration: 0.4 }}
                  className={`
                    relative bg-background transition-all duration-200 p-6 aspect-[4/3] flex flex-col justify-between group cursor-pointer
                    hover:bg-foreground/[0.04] dark:hover:bg-foreground/[0.02]
                    ${isSelected ? 'bg-foreground/[0.02] dark:bg-foreground/[0.01]' : ''}
                  `}
                >
                  {/* Issuer */}
                  <div className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground text-left">
                    {membership.issuer}
                  </div>
                  
                  {/* Card Name */}
                  <div className={`
                    text-left text-[13px] leading-tight transition-colors duration-200 font-light
                    ${isSelected ? 'text-foreground' : 'text-foreground/60 group-hover:text-foreground'}
                  `}>
                    {membership.name}
                  </div>

                  {/* Selection indicator */}
                  <div className="absolute top-4 right-4">
                    <div className={`
                      w-3.5 h-3.5 border transition-all duration-200
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
          <div className="flex items-center gap-6">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground h-9 px-0"
            >
              Back
            </Button>
            
            <Button
              onClick={handleSkip}
              variant="ghost"
              size="sm"
              className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground h-9 px-0"
            >
              Skip
            </Button>
          </div>
          
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

