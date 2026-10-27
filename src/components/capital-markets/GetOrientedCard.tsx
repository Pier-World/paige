import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export type OrientedStepState = 'done' | 'open' | 'pending';

export type OrientedStep = {
  id: string;
  title: string;
  detail: string;
  href: string;
  state: OrientedStepState;
};

function StepAnchor({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  if (/^https?:/i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

export function GetOrientedCard({
  steps,
  onDismiss,
}: {
  steps: OrientedStep[];
  onDismiss: () => void;
}) {
  const done = steps.filter((step) => step.state === 'done').length;
  const percent = steps.length === 0 ? 0 : Math.round((done / steps.length) * 100);
  const complete = steps.length > 0 && done === steps.length;
  const nextId = steps.find((step) => step.state === 'open')?.id;

  return (
    <section className="mb-10 overflow-hidden rounded-pier-lg border border-border bg-surface shadow-card">
      <div className="px-5 pb-4 pt-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[15px] font-medium text-ink">
              {complete ? "You're oriented." : 'Get oriented'}
            </h2>
            <p className="mt-1 text-[13px] text-slate">
              {complete
                ? 'Pier has what it needs to invite you well.'
                : 'A few details so invitations and introductions can find you.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="font-mono-data text-[12px] text-slate">
              {done} of {steps.length} complete · {percent}%
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="text-[12px] text-slate transition-colors hover:text-ink"
            >
              Hide
            </button>
          </div>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-ink/[0.06]" aria-hidden>
          <div
            className="h-full rounded-full bg-gilt transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="border-t border-border">
        {steps.map((step) => {
          const isNext = step.id === nextId;
          return (
            <li key={step.id} className="border-b border-border last:border-b-0">
              <StepAnchor
                href={step.href}
                className={cn(
                  'flex items-center gap-4 px-5 py-4 transition-colors sm:px-6',
                  isNext ? 'bg-parchment/80' : 'hover:bg-parchment/50'
                )}
              >
                {step.state === 'done' ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ledger text-parchment">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </span>
                ) : step.state === 'pending' ? (
                  <span className="skeleton-shimmer h-6 w-6 shrink-0 rounded-full" />
                ) : (
                  <span className="h-6 w-6 shrink-0 rounded-full border border-ink/15 bg-surface" />
                )}
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-[14px]', step.state === 'done' ? 'text-ink' : 'font-medium text-ink')}>
                    {step.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-slate">{step.detail}</span>
                </span>
                {isNext ? (
                  <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-ink px-3.5 text-[12px] font-medium text-parchment">
                    Continue
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate" />
                )}
              </StepAnchor>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
