import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { dailyConciergeQuoteSeed, pickConciergeQuote } from '../../lib/capitalMarkets/conciergeQuotes';

export function DashboardConciergeTeaser() {
  const quote = useMemo(
    () => pickConciergeQuote(dailyConciergeQuoteSeed()),
    []
  );

  return (
    <section>
      <p className="eyebrow mb-3">Member Concierge</p>
      <div className="rounded-[4px] border border-border bg-surface p-5">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 stroke-[1.25] text-gilt" />
          <p className="text-[13px] font-medium text-ink">Your Pier Concierge</p>
        </div>
        <p className="text-[13px] leading-relaxed text-slate">
          A direct line to the Pier team for access, planning, and support across the network.
        </p>
        <blockquote className="mt-4 border-l-2 border-gilt/40 pl-3 text-[12px] italic leading-relaxed text-slate">
          {quote}
        </blockquote>
        <Link
          to="/concierge"
          className="mt-5 flex h-8 w-full items-center justify-center rounded-[6px] border border-ink bg-ink text-[13px] text-parchment transition-colors hover:bg-ink/90"
        >
          Open concierge
        </Link>
      </div>
    </section>
  );
}
