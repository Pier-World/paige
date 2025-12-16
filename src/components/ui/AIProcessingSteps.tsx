import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, Filter, Sparkles, Check } from 'lucide-react';

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  mobileLabel: string;
}

const steps: ProcessingStep[] = [
  { id: 'understand', label: 'Understanding your preferences', mobileLabel: 'Understanding preferences', icon: MessageSquare },
  { id: 'filter', label: 'Searching partner properties', mobileLabel: 'Searching properties', icon: Search },
  { id: 'match', label: 'Checking Pier Benefits availability', mobileLabel: 'Checking benefits', icon: Filter },
  { id: 'present', label: 'Curating recommendations', mobileLabel: 'Curating results', icon: Sparkles },
];

interface AIProcessingStepsProps {
  currentStep?: string;
  progress?: number;
  isComplete?: boolean;
}

export const AIProcessingSteps: React.FC<AIProcessingStepsProps> = ({
  currentStep,
  progress = 0,
  isComplete = false,
}) => {
  const getStepStatus = (stepId: string): 'inactive' | 'active' | 'complete' => {
    if (isComplete) return 'complete';
    if (!currentStep) return 'inactive';
    
    // Map orchestrator step names to our step IDs
    const stepMapping: Record<string, string> = {
      'parsing': 'understand',
      'understanding': 'understand',
      'filtering': 'filter',
      'matching': 'match',
      'ranking': 'match',
      'results_ready': 'present',
      'presenting': 'present',
    };
    
    const mappedStep = stepMapping[currentStep] || currentStep;
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === mappedStep);
    
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'inactive';
  };

  // Calculate progress percentage based on step
  const calculateProgress = () => {
    if (isComplete) return 100;
    if (!currentStep) return 0;
    
    const stepMapping: Record<string, string> = {
      'parsing': 'understand',
      'understanding': 'understand',
      'filtering': 'filter',
      'matching': 'match',
      'ranking': 'match',
      'results_ready': 'present',
      'presenting': 'present',
    };
    
    const mappedStep = stepMapping[currentStep] || currentStep;
    const currentIndex = steps.findIndex(s => s.id === mappedStep);
    
    if (currentIndex === -1) return progress || 0;
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const progressPercent = progress > 0 ? progress : calculateProgress();

  return (
    <div className="w-full">
      <div className="bg-surface/50 border border-border rounded-2xl p-4 md:p-6">
        {/* Header with AI indicator */}
        <div className="flex items-center gap-2.5 mb-4 md:mb-6">
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-accent"
          />
          <span className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '0.02em' }}>
            Pier is thinking
          </span>
        </div>

        {/* Steps - Mobile optimized vertical layout */}
        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0.3, x: -8 }}
                animate={{
                  opacity: status === 'inactive' ? 0.3 : 1,
                  x: 0,
                }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3"
              >
                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <motion.div
                    animate={{
                      scale: status === 'active' ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: status === 'active' ? Infinity : 0,
                      ease: 'easeInOut',
                    }}
                    className={`
                      w-6 h-6 rounded-lg flex items-center justify-center
                      transition-all duration-300
                      ${
                        status === 'complete'
                          ? 'bg-accent/20'
                          : status === 'active'
                          ? 'bg-accent/10'
                          : 'bg-transparent'
                      }
                    `}
                  >
                    {status === 'complete' ? (
                      <Check className="w-4 h-4 text-accent" />
                    ) : status === 'active' ? (
                      <>
                        <Icon className="w-4 h-4 text-accent" />
                        {/* Spinner for active state */}
                        <motion.div
                          className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        >
                          <div className="w-1 h-1 rounded-full bg-accent" />
                        </motion.div>
                      </>
                    ) : (
                      <Icon className="w-4 h-4 text-text-tertiary" />
                    )}
                  </motion.div>
                </div>

                {/* Label */}
                <span
                  className={`
                    flex-1
                    transition-colors duration-300
                    ${
                      status === 'complete'
                        ? 'text-text-secondary'
                        : status === 'active'
                        ? 'text-text-primary'
                        : 'text-text-tertiary'
                    }
                  `}
                  style={{ 
                    fontSize: '14px', 
                    fontWeight: status === 'active' ? 400 : 300,
                    lineHeight: '1.4'
                  }}
                >
                  <span className="hidden md:inline">{step.label}</span>
                  <span className="md:hidden">{step.mobileLabel}</span>
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="h-0.5 bg-surface-elevated rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

