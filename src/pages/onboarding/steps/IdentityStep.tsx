import { applyRoleChange } from '../../../lib/capitalOnboarding';
import type { CapitalRole, OnboardingData } from '../../../types/onboarding';

interface IdentityStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
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

export function IdentityStep({ data, updateData }: IdentityStepProps) {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-[36px] leading-[0.95] tracking-[-0.02em] text-ink sm:text-[40px]">
          Who you are
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate">
          This is the only required step. It helps Pier show the right gatherings and keep
          allocator privacy intact.
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="eyebrow mb-1 block">Firm</span>
          <input
            value={data.firm}
            onChange={(e) => updateData({ firm: e.target.value })}
            placeholder="Optional"
            className="h-11 w-full rounded-[4px] border border-border bg-surface px-3 text-[14px] text-ink outline-none focus:border-ink/30"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-1 block">Title</span>
          <input
            value={data.title}
            onChange={(e) => updateData({ title: e.target.value })}
            placeholder="Optional"
            className="h-11 w-full rounded-[4px] border border-border bg-surface px-3 text-[14px] text-ink outline-none focus:border-ink/30"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-1 block">Primary city</span>
          <input
            value={data.city}
            onChange={(e) => updateData({ city: e.target.value })}
            placeholder="Optional"
            className="h-11 w-full rounded-[4px] border border-border bg-surface px-3 text-[14px] text-ink outline-none focus:border-ink/30"
          />
        </label>
      </div>
    </div>
  );
}
