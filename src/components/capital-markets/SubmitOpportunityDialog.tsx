import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ANALYTICS_EVENTS, captureAnalytics } from '../../lib/analytics';
import { markOpportunityShared } from '../../lib/capitalOnboarding';
import { submitOpportunityMailto } from '../../lib/conciergeMailto';
import { Button } from '../ui/Button';

const RULES = [
  {
    title: 'Review',
    detail: 'Pier and Vestera review every opportunity before it reaches members.',
  },
  {
    title: 'NDA',
    detail: 'All members are under NDA. Do not share deals outside Pier.',
  },
  {
    title: 'Co-invest',
    detail: 'Only share companies you are already invested in.',
  },
  {
    title: 'Funds',
    detail: 'Submit your own fund for review, or vouch for someone else’s.',
  },
  {
    title: 'Fees / carry',
    detail: 'Charging fees or carry to Pier members is reserved for Pier+.',
  },
] as const;

export function SubmitOpportunityDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-ink/70 backdrop-blur-sm">
      <div
        className="flex min-h-full items-center justify-center px-4 py-8"
        onClick={onClose}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="w-full max-w-lg rounded-pier-md border border-border bg-parchment p-6 shadow-2xl outline-none sm:p-8"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">Pier dealflow</p>
              <h2
                id={titleId}
                className="font-display text-[28px] leading-none tracking-[-0.02em] text-ink"
              >
                Before you submit
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-slate hover:border-ink/30 hover:text-ink"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mb-5 text-[14px] leading-relaxed text-slate">
            A few rules keep dealflow trusted for the community. Confirm you can meet them,
            then compose your submission.
          </p>

          <ol className="space-y-4">
            {RULES.map((rule, index) => (
              <li key={rule.title} className="flex gap-3">
                <span className="font-mono-data mt-0.5 w-5 shrink-0 text-[12px] text-gilt">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-[14px] font-medium text-ink">{rule.title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-slate">{rule.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-border/60 pt-5">
            <a
              href={submitOpportunityMailto()}
              onClick={() => {
                captureAnalytics(ANALYTICS_EVENTS.dealOpportunitySubmitComposed);
                markOpportunityShared(user?.id);
                onClose();
              }}
              className="inline-flex h-11 items-center justify-center rounded-pier-md border border-ink bg-ink px-5 text-[14px] text-parchment transition-colors hover:bg-ink/90"
            >
              Compose submission
            </a>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
