import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { emptyAccreditationDraft, isAccreditationDraftComplete } from '../../lib/accreditation';
import {
  buildOnboardingMemberPreferences,
  buildPersonalContext,
  clampOnboardingStep,
  ONBOARDING_STEP_COUNT,
  onboardingDraftKey,
  parseOnboardingDraft,
  prefillOnboardingFromUser,
  serializeOnboardingDraft,
} from '../../lib/capitalOnboarding';
import type { OnboardingData } from '../../types/onboarding';
import { OnboardingShell } from './OnboardingShell';
import { AccreditationStep } from './steps/AccreditationStep';
import { IdentityStep } from './steps/IdentityStep';
import { IntentStep } from './steps/IntentStep';
import { PrivacyStep } from './steps/PrivacyStep';
import { WelcomeStep } from './steps/WelcomeStep';

export default function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>(() => prefillOnboardingFromUser(user));

  useEffect(() => {
    if (!user?.id) return;
    const draft = parseOnboardingDraft(sessionStorage.getItem(onboardingDraftKey(user.id)));
    if (draft) {
      setData(draft.data);
      setCurrentStep(draft.step);
    } else {
      setData(prefillOnboardingFromUser(user));
    }
    setHydrated(true);
    // Prefill once per user id so typing is not reset when AuthContext refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !hydrated) return;
    sessionStorage.setItem(onboardingDraftKey(user.id), serializeOnboardingDraft(data, currentStep));
  }, [data, currentStep, user?.id, hydrated]);

  const firstName = useMemo(() => {
    return user?.first_name || user?.full_name?.split(' ')[0] || '';
  }, [user]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const finish = async (payload: OnboardingData, skipped: boolean) => {
    if (!user?.id || busy) return;
    setBusy(true);
    setSaveError(null);
    try {
      const result = await completeOnboarding({
        preferences: buildOnboardingMemberPreferences(payload, user.preferences),
        personalContext: buildPersonalContext(
          payload,
          user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          skipped
        ),
      });
      if (result.error) {
        setSaveError(result.error.message);
        setBusy(false);
        return;
      }
      sessionStorage.removeItem(onboardingDraftKey(user.id));
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to finish onboarding.');
      setBusy(false);
    }
  };

  const skip = () => {
    void finish({ ...data, accreditation: emptyAccreditationDraft() }, true);
  };

  const next = () =>
    setCurrentStep((prev) =>
      clampOnboardingStep(Math.min(prev + 1, ONBOARDING_STEP_COUNT - 1), data.capitalRole)
    );
  const back = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const onAccreditationStep = currentStep === ONBOARDING_STEP_COUNT - 1;
  const roleMissing = currentStep === 1 && !data.capitalRole;
  const accreditationMissing = onAccreditationStep && !isAccreditationDraftComplete(data.accreditation);
  const continueDisabled = roleMissing || accreditationMissing;

  return (
    <OnboardingShell
      stepIndex={currentStep}
      totalSteps={ONBOARDING_STEP_COUNT}
      onBack={currentStep > 0 ? back : undefined}
      onContinue={onAccreditationStep ? () => void finish(data, false) : next}
      onSkip={skip}
      continueLabel={onAccreditationStep ? 'Enter Pier' : 'Continue'}
      continueDisabled={continueDisabled}
      continueHint={
        roleMissing
          ? 'Choose allocator or fund manager to continue.'
          : accreditationMissing
            ? data.accreditation.confirmed
              ? 'Select how you qualify, and whether you are a qualified purchaser.'
              : 'Choose yes or no, or verify later.'
            : undefined
      }
      busy={busy}
      saveError={saveError}
      hideContinue={currentStep === 0}
      hideFooter={currentStep === 0}
      skipLabel={onAccreditationStep ? 'Verify later' : 'Skip for now'}
      skipInFooter={onAccreditationStep}
      skipHint={currentStep === 0 ? 'You can finish in Profile anytime.' : undefined}
    >
      {currentStep === 0 ? <WelcomeStep firstName={firstName} onNext={next} busy={busy} /> : null}
      {currentStep === 1 ? (
        <IdentityStep
          data={data}
          updateData={updateData}
          onContinue={next}
          continueDisabled={continueDisabled}
        />
      ) : null}
      {currentStep === 2 ? <IntentStep data={data} updateData={updateData} /> : null}
      {currentStep === 3 ? <PrivacyStep data={data} updateData={updateData} /> : null}
      {currentStep === 4 ? (
        <AccreditationStep
          value={data.accreditation}
          onChange={(accreditation) => updateData({ accreditation })}
        />
      ) : null}
    </OnboardingShell>
  );
}
