import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, Filter, Sparkles, Check, Loader2 } from 'lucide-react';

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const steps: ProcessingStep[] = [
  { id: 'understand', label: 'Understanding request', icon: MessageSquare },
  { id: 'filter', label: 'Filtering options', icon: Filter },
  { id: 'match', label: 'Matching preferences', icon: Sparkles },
  { id: 'present', label: 'Presenting results', icon: Check },
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-text-primary" style={{ fontSize: '16px', fontWeight: 400 }}>
            Processing your request
          </h3>
          {!isComplete && progress > 0 && (
            <span className="text-accent" style={{ fontSize: '14px', fontWeight: 400 }}>
              {progress}%
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center relative">
                  {/* Icon Container */}
                  <div className="relative mb-3">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: status === 'active' ? [1, 1.1, 1] : 1,
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: status === 'active' ? Infinity : 0,
                        ease: 'easeInOut',
                      }}
                      className={`
                        w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center
                        transition-all duration-500
                        ${
                          status === 'complete'
                            ? 'bg-accent/20 border-2 border-accent'
                            : status === 'active'
                            ? 'bg-accent/10 border-2 border-accent/50'
                            : 'bg-surface-elevated border-2 border-border'
                        }
                      `}
                    >
                      {status === 'complete' ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                          <Check className="w-6 h-6 md:w-7 md:h-7 text-accent" />
                        </motion.div>
                      ) : status === 'active' ? (
                        <div className="relative">
                          <Icon className="w-6 h-6 md:w-7 md:h-7 text-accent" />
                          {/* Animated dots */}
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1 h-1 rounded-full bg-accent"
                                animate={{
                                  opacity: [0.3, 1, 0.3],
                                  scale: [0.8, 1, 0.8],
                                }}
                                transition={{
                                  duration: 1.2,
                                  repeat: Infinity,
                                  delay: i * 0.2,
                                  ease: 'easeInOut',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Icon className="w-6 h-6 md:w-7 md:h-7 text-text-tertiary" />
                      )}
                    </motion.div>
                  </div>

                  {/* Label */}
                  <p
                    className={`
                      text-center text-xs md:text-sm font-light
                      transition-colors duration-300
                      ${
                        status === 'complete' || status === 'active'
                          ? 'text-text-primary'
                          : 'text-text-tertiary'
                      }
                    `}
                    style={{ fontWeight: 300 }}
                  >
                    {step.label}
                  </p>
                </div>

                {/* Connector Line - only on desktop */}
                {!isLast && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 z-0">
                    <div className="relative h-full">
                      <div className="absolute top-0 left-0 w-full h-full bg-border" />
                      <motion.div
                        className="absolute top-0 left-0 h-full bg-accent"
                        initial={{ width: 0 }}
                        animate={{
                          width: status === 'complete' ? '100%' : status === 'active' ? '50%' : '0%',
                        }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Progress Bar */}
        {!isComplete && progress > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 pt-6 border-t border-border"
          >
            <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full"
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

