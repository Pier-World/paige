import { useState } from 'react';
import { ANALYTICS_EVENTS, captureAnalytics } from '../../lib/analytics';
import { SubmitOpportunityDialog } from './SubmitOpportunityDialog';

const TYPE_LABELS = ['Fund', 'Co-invest', 'Secondary / SPV'] as const;

export function SubmitOpportunityModule() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <section className="mb-8 overflow-hidden rounded-pier-lg border border-border border-l-[3px] border-l-gilt bg-surface shadow-card">
        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="eyebrow mb-2">Member contribution</p>
            <h2 className="text-[20px] font-medium leading-snug tracking-[-0.01em] text-ink sm:text-[22px]">
              Submit an opportunity to Pier dealflow
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate sm:text-[14px]">
              Share a fund, co-invest, or related opportunity with the community. Pier and Vestera
              review every submission before it appears in dealflow.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TYPE_LABELS.map((label) => (
                <span
                  key={label}
                  className="rounded-[2px] border border-border bg-parchment px-2 py-0.5 text-[11px] uppercase tracking-[0.06em] text-slate"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              captureAnalytics(ANALYTICS_EVENTS.dealOpportunitySubmitStarted);
              setDialogOpen(true);
            }}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-pier-md border border-ink bg-ink px-5 text-[14px] text-parchment transition-colors hover:bg-ink/90"
          >
            Submit opportunity
          </button>
        </div>
      </section>

      <SubmitOpportunityDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
