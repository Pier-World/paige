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
  continueHint,
  busy = false,
  saveError,
  hideContinue = false,
  hideFooter = false,
  skipLabel = 'Skip for now',
  skipHint,
  skipInFooter = false,
}: {
  stepIndex: number;
  totalSteps: number;
  children: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  onSkip?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  continueHint?: string;
  busy?: boolean;
  saveError?: string | null;
  hideContinue?: boolean;
  hideFooter?: boolean;
  skipLabel?: string;
  skipHint?: string;
  skipInFooter?: boolean;
}) {
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <div className="relative flex min-h-screen flex-col bg-parchment">
      <div className="fixed left-0 right-0 top-0 z-40 h-1 bg-border">
        <div className="h-full bg-gilt transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="fixed right-6 top-5 z-50 flex flex-col items-end gap-2">
        {onSkip && !skipInFooter ? (
          <button
            type="button"
            onClick={onSkip}
            disabled={busy}
            className="text-[12px] font-medium text-slate hover:text-ink disabled:opacity-50"
          >
            {busy ? 'Saving…' : skipLabel}
          </button>
        ) : null}
        {saveError ? (
          <p className="max-w-xs text-right text-[12px] text-danger" role="alert">
            {saveError}
          </p>
        ) : skipHint ? (
          <p className="max-w-xs text-right text-[11px] text-slate/80">{skipHint}</p>
        ) : null}
      </div>

      <div
        className={`mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-20 sm:px-8 ${hideFooter ? 'pb-16' : skipInFooter ? 'pb-48' : 'pb-32'}`}
      >
        <p className="eyebrow mb-6 text-slate">
          {String(stepIndex + 1).padStart(2, '0')} of {String(totalSteps).padStart(2, '0')}
        </p>
        {children}
      </div>

      {hideFooter ? null : (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-parchment/95 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4">
            {onBack ? (
              <Button type="button" variant="ghost" onClick={onBack} disabled={busy} className="min-h-11 px-0">
                Back
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              {continueHint ? (
                <p className="max-w-[220px] text-right text-[12px] text-slate sm:max-w-xs" role="status">
                  {continueHint}
                </p>
              ) : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                {skipInFooter && onSkip ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onSkip}
                    disabled={busy}
                    className="min-h-11"
                  >
                    {busy ? 'Saving…' : skipLabel}
                  </Button>
                ) : null}
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
        </div>
      )}
    </div>
  );
}
