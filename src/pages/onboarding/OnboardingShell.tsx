import type { ReactNode } from 'react';
import { Button } from '../../components/ui/Button';

export function OnboardingShell({
  stepIndex,
  totalSteps,
  children,
  onBack,
  onContinue,
  onSkip,
  continueLabel = 'Continue',
  continueDisabled = false,
  busy = false,
  hideContinue = false,
  skipLabel = 'Do this later',
}: {
  stepIndex: number;
  totalSteps: number;
  children: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  onSkip?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  busy?: boolean;
  hideContinue?: boolean;
  skipLabel?: string;
}) {
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <div className="relative flex min-h-screen flex-col bg-parchment">
      <div className="fixed left-0 right-0 top-0 z-40 h-1 bg-border">
        <div className="h-full bg-gilt transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>

      {onSkip ? (
        <button
          type="button"
          onClick={onSkip}
          disabled={busy}
          className="fixed right-6 top-6 z-50 text-[12px] font-medium text-slate hover:text-ink disabled:opacity-50"
        >
          {busy ? 'Saving…' : skipLabel}
        </button>
      ) : null}

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pb-32 pt-20 sm:px-8">
        <p className="eyebrow mb-6 text-slate">
          {String(stepIndex + 1).padStart(2, '0')} of {String(totalSteps).padStart(2, '0')}
        </p>
        {children}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-parchment/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4">
          {onBack ? (
            <Button type="button" variant="ghost" onClick={onBack} disabled={busy} className="min-h-11 px-0">
              Back
            </Button>
          ) : (
            <span />
          )}
          {hideContinue ? null : (
            <Button
              type="button"
              onClick={onContinue}
              disabled={continueDisabled || busy}
              loading={busy}
              className="min-h-11 min-w-[140px]"
            >
              {continueLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
