import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WelcomeStep } from './steps/WelcomeStep';
import { PersonalizationStep } from './steps/PersonalizationStep';
import { GoalsStep } from './steps/GoalsStep';
import { MembershipsStep } from './steps/MembershipsStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { FinalStep } from './steps/FinalStep';
import { OnboardingData } from '../../types/onboarding';

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    goals: [],
    memberships: [],
    preferences: {
      travelStyle: [],
      interests: [],
    },
  });

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('OnboardingPage mounted, currentStep:', currentStep);
  }, [currentStep]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const steps = [
    <WelcomeStep key="welcome" onNext={nextStep} />,
    <PersonalizationStep
      key="personalization"
      data={data}
      updateData={updateData}
      onNext={nextStep}
      onBack={prevStep}
    />,
    <GoalsStep
      key="goals"
      data={data}
      updateData={updateData}
      onNext={nextStep}
      onBack={prevStep}
    />,
    <MembershipsStep
      key="memberships"
      data={data}
      updateData={updateData}
      onNext={nextStep}
      onBack={prevStep}
    />,
    <PreferencesStep
      key="preferences"
      data={data}
      updateData={updateData}
      onNext={nextStep}
      onBack={prevStep}
    />,
    <FinalStep key="final" data={data} onBack={prevStep} />,
  ];

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  // Safety check - ensure we have steps
  if (!steps || steps.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading onboarding...</div>
      </div>
    );
  }

  // Safety check - ensure currentStep is valid
  const safeStep = Math.max(0, Math.min(currentStep, steps.length - 1));

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Ultra-Subtle Grid */}
      <div className="fixed inset-0 opacity-[0.008] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Technical Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[1px] bg-transparent z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="h-full bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={safeStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {steps[safeStep]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

