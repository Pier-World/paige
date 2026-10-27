import { AccreditationForm } from '../../../components/accreditation/AccreditationForm';
import type { AccreditationDraft } from '../../../types/onboarding';

export function AccreditationStep({
  value,
  onChange,
}: {
  value: AccreditationDraft;
  onChange: (next: AccreditationDraft) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[36px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[40px]">
          Accreditation
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate">
          This is optional. You can verify later in Profile.
        </p>
      </div>
      <AccreditationForm value={value} onChange={onChange} />
    </div>
  );
}
