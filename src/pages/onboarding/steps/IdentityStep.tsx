import { applyRoleChange } from '../../../lib/capitalOnboarding';
import type { CapitalRole, OnboardingData } from '../../../types/onboarding';

interface IdentityStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onContinue: () => void;
  continueDisabled: boolean;
}

const ROLES: Array<{ id: CapitalRole; title: string; description: string }> = [
  {
    id: 'lp',
    title: 'Allocator (LP)',
    description: 'Family office, fund of funds, endowment, or other allocator.',
  },
  {
    id: 'gp',
    title: 'Fund manager (GP)',
    description: 'Emerging or established manager raising or deploying capital.',
  },
];

export function IdentityStep({ data, updateData, onContinue, continueDisabled }: IdentityStepProps) {
  return (
    <form
      className="space-y-10"
      onSubmit={(event) => {
        event.preventDefault();
        if (!continueDisabled) onContinue();
      }}
    >
      <div>
        <h1 className="font-display text-[36px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[40px]">
          Who you are
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate">
          Choose allocator or fund manager. This is the only required step — it routes the right
          gatherings and keeps your profile private until you opt in.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ROLES.map((role) => {
          const selected = data.capitalRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => updateData(applyRoleChange(data, role.id))}
              aria-pressed={selected}
              className={`min-h-[120px] rounded-[6px] border p-5 text-left transition-colors ${
                selected
                  ? 'border-ink bg-ink text-parchment'
                  : 'border-border bg-surface text-ink hover:border-ink/30'
              }`}
            >
              <p className="text-[16px] font-medium">{role.title}</p>
              <p className={`mt-2 text-[13px] leading-relaxed ${selected ? 'text-parchment/70' : 'text-slate'}`}>
                {role.description}
              </p>
            </button>
          );
        })}
      </div>

      {data.capitalRole ? (
        <p className="text-[13px] text-slate">
          {data.capitalRole === 'gp'
            ? 'We’ll treat you as a fund manager: dinners and allocator context, unlisted unless you opt in.'
            : 'We’ll treat you as an allocator: dinners and manager context, private by default.'}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="eyebrow mb-1 block">Firm</span>
          <input
            value={data.firm}
            onChange={(e) => updateData({ firm: e.target.value })}
            placeholder="Optional"
            autoComplete="organization"
            className="h-11 w-full rounded-pier-md border border-border bg-surface px-3 text-[14px] text-ink outline-none focus:border-ink/30"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-1 block">Title</span>
          <input
            value={data.title}
            onChange={(e) => updateData({ title: e.target.value })}
            placeholder="Optional"
            autoComplete="organization-title"
            className="h-11 w-full rounded-pier-md border border-border bg-surface px-3 text-[14px] text-ink outline-none focus:border-ink/30"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-1 block">Primary city</span>
          <input
            value={data.city}
            onChange={(e) => updateData({ city: e.target.value })}
            placeholder="Optional"
            autoComplete="address-level2"
            className="h-11 w-full rounded-pier-md border border-border bg-surface px-3 text-[14px] text-ink outline-none focus:border-ink/30"
          />
        </label>
      </div>
    </form>
  );
}
