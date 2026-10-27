import { useId, type ReactNode } from 'react';
import {
  ACCREDITATION_BASES,
  QUALIFIED_PURCHASER_DESCRIPTION,
  answerAccredited,
  answerBasis,
  answerQualifiedPurchaser,
} from '../../lib/accreditation';
import type { AccreditationDraft } from '../../types/onboarding';
import { cn } from '../../lib/utils';

function ChoiceButton({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'min-h-11 rounded-[6px] border px-4 py-2.5 text-left text-[14px] transition-colors',
        selected
          ? 'border-ink bg-ink text-parchment'
          : 'border-border bg-surface text-ink hover:border-ink/30',
        className
      )}
    >
      {children}
    </button>
  );
}

export function AccreditationForm({ value, onChange }: { value: AccreditationDraft; onChange: (next: AccreditationDraft) => void }) {
  const saidYes = value.confirmed && !value.declined;
  const questionId = useId();
  const qualifyId = useId();
  const purchaserId = useId();

  return (
    <div className="space-y-6">
      <div>
        <p id={questionId} className="text-[15px] font-medium text-ink">
          Are you an accredited investor?
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-slate">
          Pier records your representation and does not collect tax returns or account statements.
        </p>
        <div className="mt-3 flex gap-2" role="group" aria-labelledby={questionId}>
          <ChoiceButton
            selected={saidYes}
            onClick={() => onChange(answerAccredited(value, true))}
            className="flex-1"
          >
            Yes, I am
          </ChoiceButton>
          <ChoiceButton
            selected={value.declined}
            onClick={() => onChange(answerAccredited(value, false))}
            className="flex-1"
          >
            No, I am not
          </ChoiceButton>
        </div>
      </div>

      {saidYes ? (
        <>
          <div className="space-y-2">
            <p id={qualifyId} className="eyebrow">
              How you qualify
            </p>
            <p className="text-[13px] leading-relaxed text-slate">One test is enough.</p>
            <div className="space-y-2" role="group" aria-labelledby={qualifyId}>
              {ACCREDITATION_BASES.map((option) => {
                const selected = value.basis === option.id;
                return (
                  <ChoiceButton
                    key={option.id}
                    selected={selected}
                    onClick={() => onChange(answerBasis(value, option.id))}
                    className="w-full"
                  >
                    <span className="block font-medium">{option.label}</span>
                    <span
                      className={cn(
                        'mt-1 block text-[12px] leading-relaxed font-normal',
                        selected ? 'text-parchment/80' : 'text-slate'
                      )}
                    >
                      {option.description}
                    </span>
                  </ChoiceButton>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p id={purchaserId} className="eyebrow">
              Qualified purchaser
            </p>
            <p className="text-[13px] leading-relaxed text-slate">{QUALIFIED_PURCHASER_DESCRIPTION}</p>
            <div className="flex gap-2" role="group" aria-labelledby={purchaserId}>
              <ChoiceButton
                selected={value.qualifiedPurchaser === true}
                onClick={() => onChange(answerQualifiedPurchaser(value, true))}
                className="flex-1"
              >
                Yes
              </ChoiceButton>
              <ChoiceButton
                selected={value.qualifiedPurchaser === false}
                onClick={() => onChange(answerQualifiedPurchaser(value, false))}
                className="flex-1"
              >
                No
              </ChoiceButton>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
