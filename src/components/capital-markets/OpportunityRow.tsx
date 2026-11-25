import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { BlurredTerm } from './BlurredTerm';
import { DealReturnCell } from './DealReturnCell';
import { Badge } from '../ui/Badge';
import type { CapitalDeal } from '../../lib/api/capitalMarkets';
import { cn, formatCurrency, formatDate, hasPublicDealAmount, hasPublicDealReturn } from '../../lib/utils';
import { dealStatusLabels, typeLabels } from '../../pages/capital-markets/mockData';

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden">
      <p className="eyebrow mb-0.5">{label}</p>
      <p className="break-words font-mono-data text-[13px] font-medium text-ink">{children}</p>
    </div>
  );
}

export function OpportunityRow({ deal, compact = false }: { deal: CapitalDeal; compact?: boolean }) {
  const isClosing = deal.status === 'closing';
  const isClosed = deal.status === 'closed';
  const termsLocked = deal.termsLocked === true;
  const hints = deal.termHints;
  const displayTitle = deal.company?.name || deal.name;
  const subtitle = deal.publicName || (deal.company?.name ? deal.name : deal.manager);
  const meta = [typeLabels[deal.type], deal.assetClass, deal.company?.roundName, deal.geography]
    .filter(Boolean)
    .join(' · ');
  const reviewLabel = termsLocked
    ? compact
      ? 'Preview'
      : 'Preview opportunity'
    : compact
      ? 'Review'
      : 'Review opportunity';
  const hasReturn = hasPublicDealReturn(
    deal.returnMetricType,
    deal.targetIrr,
    deal.moicTarget,
    deal.returnDisplay
  );
  const metrics = termsLocked
    ? [
        hints?.target ? (
          <Metric key="target" label="Target">
            <BlurredTerm />
          </Metric>
        ) : null,
        hints?.minCommitment ? (
          <Metric key="min" label="Min. commit">
            <BlurredTerm />
          </Metric>
        ) : null,
        hints?.return ? (
          <div key="return" className="min-w-0 overflow-hidden">
            <p className="eyebrow mb-0.5">Return</p>
            <BlurredTerm />
          </div>
        ) : null,
        hints?.closeDate ? (
          <Metric key="close" label="Close">
            <BlurredTerm />
          </Metric>
        ) : null,
      ].filter(Boolean)
    : [
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
      <div key="return" className="min-w-0 overflow-hidden">
        <p className="eyebrow mb-0.5">Return</p>
        <DealReturnCell
          deal={deal}
          className="font-mono-data text-[13px] font-medium text-ink"
        />
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
      state={termsLocked ? { openFundGate: true } : undefined}
      className={cn(
        'group flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-[4px] border bg-surface transition-colors',
        compact ? 'px-4 py-4 sm:px-5' : 'px-5 py-5 sm:px-6 sm:py-5',
        isClosing
          ? 'border-gilt/40 border-l-[3px] border-l-gilt hover:border-gilt/70 hover:border-l-gilt'
          : 'border-border hover:border-ink/40',
        isClosed && 'opacity-80 hover:opacity-100',
        'hover:shadow-card focus-visible:outline-none focus-visible:border-ink/50'
      )}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1.5', compact ? 'mb-2' : 'mb-2.5')}>
            <Badge variant={deal.status}>{dealStatusLabels[deal.status]}</Badge>
            {meta ? <span className="min-w-0 break-words text-[12px] text-slate">{meta}</span> : null}
          </div>
          <h2
            className={cn(
              'font-display leading-[1.1] tracking-[-0.01em] text-ink break-words',
              compact ? 'text-[20px] sm:text-[22px]' : 'text-[24px] sm:text-[26px]'
            )}
          >
            {displayTitle}
          </h2>
          <p className="mt-1 truncate text-[13px] text-slate">{subtitle}</p>
        </div>
        <span className="hidden shrink-0 items-center gap-1 pt-1 text-[13px] font-medium text-ink sm:flex">
          {reviewLabel}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>

      {deal.description ? (
        <p className="mt-3 max-w-full break-words text-[14px] leading-relaxed text-slate line-clamp-2">
          {deal.description}
        </p>
      ) : null}

      {metrics.length > 0 ? (
        <div
          className={cn(
            'mt-4 grid min-w-0 gap-3 overflow-hidden border-t border-border pt-4',
            metrics.length === 1
              ? 'grid-cols-1'
              : metrics.length === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : metrics.length === 3
                  ? 'grid-cols-1 sm:grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-4'
          )}
        >
          {metrics}
        </div>
      ) : null}

      {deal.sectors.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {deal.sectors.slice(0, compact ? 3 : 4).map((sector) => (
            <span key={sector} className="rounded-[2px] bg-border/60 px-2 py-0.5 text-[11px] text-slate">
              {sector}
            </span>
          ))}
        </div>
      ) : null}

      <span className="mt-4 flex items-center gap-1 text-[13px] font-medium text-ink sm:hidden">
        {reviewLabel}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
