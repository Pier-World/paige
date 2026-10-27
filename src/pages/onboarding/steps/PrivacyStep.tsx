import type { OnboardingData } from '../../../types/onboarding';

interface PrivacyStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-[88px] w-full items-start justify-between gap-6 rounded-[6px] border border-border bg-surface p-5 text-left hover:border-ink/30"
    >
      <span>
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        <span className="mt-1 block text-[13px] leading-relaxed text-slate">{description}</span>
      </span>
      <span
        className={`mt-1 h-6 w-11 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-ink bg-ink' : 'border-border bg-parchment'
        }`}
      >
        <span
          className={`mt-0.5 block h-5 w-5 rounded-full bg-parchment transition-transform ${
            checked ? 'translate-x-5 bg-gilt' : 'translate-x-0.5 bg-slate/40'
          }`}
        />
      </span>
    </button>
  );
}

export function PrivacyStep({ data, updateData }: PrivacyStepProps) {
  const isGp = data.capitalRole === 'gp';

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-[36px] leading-[0.95] tracking-[-0.02em] text-ink sm:text-[40px]">
          Privacy
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate">
          {isGp
            ? 'You are hidden by default. Opt in only if you want allocators to know you attend events. Pier does not publish a public directory.'
            : 'Family offices and allocators stay private by default. Other members will not find you in a directory.'}
        </p>
      </div>

      <div className="space-y-3">
        <ToggleRow
          label="Allow introduction requests"
          description="Pier can pass along a request. Nobody messages you directly from the platform."
          checked={data.allowIntroRequests}
          onChange={(allowIntroRequests) => updateData({ allowIntroRequests })}
        />
        <ToggleRow
          label={isGp ? 'Visible to allocators at events I attend' : 'Share event attendance'}
          description={
            isGp
              ? 'Allocators at the same gathering may see that you are attending. Off means you stay unlisted.'
              : 'Other members will not see which dinners you RSVP to unless you turn this on.'
          }
          checked={data.shareEventAttendance}
          onChange={(shareEventAttendance) => updateData({ shareEventAttendance })}
        />
      </div>
    </div>
  );
}
