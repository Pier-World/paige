import { intentsForRole } from '../../../lib/capitalOnboarding';
import type { OnboardingData } from '../../../types/onboarding';

interface IntentStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

export function IntentStep({ data, updateData }: IntentStepProps) {
  const options = intentsForRole(data.capitalRole);

  function toggle(id: string) {
    updateData({
      intents: data.intents.includes(id)
        ? data.intents.filter((item) => item !== id)
        : [...data.intents, id],
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[36px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[40px]">
          What's most important to you?
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate">
          {data.capitalRole === 'gp'
            ? "Optional. Continue without selecting any — this only helps Pier understand what's most valuable to you and your firm."
            : 'Optional. Continue without selecting any — this only helps Pier prioritize what to show first.'}
        </p>
      </div>

      <div className="flex max-w-xl flex-col gap-3 pb-6">
        {options.map((option) => {
          const selected = data.intents.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              aria-pressed={selected}
              className={`relative w-full rounded-[6px] border px-5 py-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gilt/50 ${
                selected
                  ? 'border-ink bg-surface shadow-[inset_3px_0_0_0_var(--gilt)]'
                  : 'border-border bg-surface hover:border-ink/30'
              }`}
            >
              <p className="text-[16px] font-medium text-ink">{option.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
