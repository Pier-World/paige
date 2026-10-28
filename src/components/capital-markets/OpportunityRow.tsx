import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { DealReturnCell } from './DealReturnCell';
import { Badge } from '../ui/Badge';
import type { CapitalDeal } from '../../lib/api/capitalMarkets';
import { cn, formatCurrency, formatDate, hasPublicDealAmount, hasPublicDealReturn } from '../../lib/utils';
import { dealStatusLabels, typeLabels } from '../../pages/capital-markets/mockData';

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="eyebrow mb-0.5">{label}</p>
      <p className="truncate font-mono-data text-[13px] font-medium text-ink">{children}</p>
    </div>
  );
}

export function OpportunityRow({ deal }: { deal: CapitalDeal }) {
  const isClosing = deal.status === 'closing';
  const isClosed = deal.status === 'closed';
  const meta = [typeLabels[deal.type], deal.assetClass, deal.geography].filter(Boolean).join(' · ');
  const hasReturn = hasPublicDealReturn(
    deal.returnMetricType,
    deal.targetIrr,
    deal.moicTarget,
    deal.returnDisplay
  );
  const metrics = [
    hasPublicDealAmount(deal.targetSize) ? (
      <Metric key="target" label="Target">
        {formatCurrency(deal.targetSize, deal.currencyCode, true)}
      </Metric>
    ) : null,
    hasPublicDealAmount(deal.minCommitment) ? (
      <Metric key="min" label="Min. commit">
        {formatCurrency(deal.minCommitment, deal.currencyCode, true)}
      </Metric>
    ) : null,
    hasReturn ? (
      <div key="return" className="min-w-0">
        <p className="eyebrow mb-0.5">Return</p>
        <DealReturnCell deal={deal} className="truncate text-[13px] font-medium" />
      </div>
    ) : null,
    deal.closeDate ? (
      <Metric key="close" label="Close">
        {formatDate(deal.closeDate, 'month-day')}
      </Metric>
    ) : null,
  ].filter(Boolean);

  return (
    <Link
      to={`/deals/${deal.id}`}
      className={cn(
        'group flex flex-col rounded-[4px] border bg-surface px-5 py-5 transition-colors sm:px-6 sm:py-5',
        isClosing
          ? 'border-gilt/40 border-l-[3px] border-l-gilt hover:border-gilt/70 hover:border-l-gilt'
          : 'border-border hover:border-ink/40',
        isClosed && 'opacity-80 hover:opacity-100',
        'hover:shadow-card focus-visible:outline-none focus-visible:border-ink/50'
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <Badge variant={deal.status}>{dealStatusLabels[deal.status]}</Badge>
            {meta ? <span className="text-[12px] text-slate">{meta}</span> : null}
          </div>
          <h2 className="font-display text-[24px] leading-[1.1] tracking-[-0.01em] text-ink sm:text-[26px]">
            {deal.name}
          </h2>
          <p className="mt-1 text-[13px] text-slate">{deal.manager}</p>
        </div>
        <span className="hidden shrink-0 items-center gap-1 pt-1 text-[13px] font-medium text-ink sm:flex">
          Review opportunity
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>

      {deal.description ? (
        <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-slate line-clamp-2">
          {deal.description}
        </p>
      ) : null}

      {metrics.length > 0 ? (
        <div
          className={cn(
            'mt-4 grid gap-3 border-t border-border pt-4',
            metrics.length === 1
              ? 'grid-cols-1'
              : metrics.length === 2
                ? 'grid-cols-2'
                : metrics.length === 3
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-4'
          )}
        >
          {metrics}
        </div>
      ) : null}

      {deal.sectors.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {deal.sectors.slice(0, 4).map((sector) => (
            <span key={sector} className="rounded-[2px] bg-border/60 px-2 py-0.5 text-[11px] text-slate">
              {sector}
            </span>
          ))}
        </div>
      ) : null}

      <span className="mt-4 flex items-center gap-1 text-[13px] font-medium text-ink sm:hidden">
        Review opportunity
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
