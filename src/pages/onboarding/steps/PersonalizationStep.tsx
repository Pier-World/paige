import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { OnboardingData } from '../../../types/onboarding';

interface PersonalizationStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PersonalizationStep({ data, updateData, onNext, onBack }: PersonalizationStepProps) {
  const [name, setName] = useState(data.name);

  const handleNext = () => {
    if (name.trim()) {
      updateData({ name: name.trim() });
      onNext();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleNext();
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6">
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
              002
            </div>
            
            <h2 className="text-[28px] md:text-[32px] leading-[1.2] tracking-[-0.02em] text-foreground font-light">
              Your name
            </h2>
          </div>

          {/* Input */}
          <div>
            <Input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-14 px-0 border-0 border-b border-border bg-transparent text-[17px] placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:border-foreground transition-colors font-light rounded-none"
              autoFocus
            />
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
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
            disabled={!name.trim()}
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


