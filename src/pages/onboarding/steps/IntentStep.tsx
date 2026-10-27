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
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-[36px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[40px]">
          What would help first?
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate">
          Optional. Continue without selecting any — this only helps Pier prioritize what to show first.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = data.intents.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              aria-pressed={selected}
              className={`min-h-11 rounded-[6px] border px-4 py-2.5 text-[14px] transition-colors ${
                selected
                  ? 'border-ink bg-ink text-parchment'
                  : 'border-border bg-surface text-ink hover:border-ink/30'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
