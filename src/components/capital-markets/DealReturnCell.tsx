import type { CapitalDeal } from '../../lib/api/capitalMarkets';
import { cn, formatDealReturn, hasPublicDealReturn } from '../../lib/utils';

type DealReturnCellProps = {
  deal: Pick<
    CapitalDeal,
    'returnMetricType' | 'targetIrr' | 'moicTarget' | 'returnDisplay'
  >;
  className?: string;
  label?: boolean;
};

export function DealReturnCell({ deal, className = '', label = false }: DealReturnCellProps) {
  if (
    !hasPublicDealReturn(
      deal.returnMetricType,
      deal.targetIrr,
      deal.moicTarget,
      deal.returnDisplay
    )
  ) {
    return null;
  }

  const value = formatDealReturn(
    deal.returnMetricType,
    deal.targetIrr,
    deal.moicTarget,
    deal.returnDisplay
  );

  if (label) {
    return (
      <div className={cn('min-w-0 overflow-hidden', className)}>
        <p className="eyebrow mb-0.5">Return</p>
        <p className="break-words font-mono-data text-ledger" title={value}>
          {value}
        </p>
      </div>
    );
  }

  return (
    <span
      className={cn('block min-w-0 max-w-full break-words font-mono-data text-ledger', className)}
      title={value}
    >
      {value}
    </span>
  );
}
