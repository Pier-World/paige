import type { CapitalDeal } from '../../lib/api/capitalMarkets';
import { formatDealReturn } from '../../lib/utils';

type DealReturnCellProps = {
  deal: Pick<
    CapitalDeal,
    'returnMetricType' | 'targetIrr' | 'moicTarget' | 'returnDisplay'
  >;
  className?: string;
  label?: boolean;
};

export function DealReturnCell({ deal, className = '', label = false }: DealReturnCellProps) {
  const value = formatDealReturn(
    deal.returnMetricType,
    deal.targetIrr,
    deal.moicTarget,
    deal.returnDisplay
  );

  if (label) {
    return (
      <div className={className}>
        <p className="eyebrow mb-0.5">Return</p>
        <p className="font-mono-data text-ledger">{value}</p>
      </div>
    );
  }

  return <span className={`font-mono-data text-ledger ${className}`.trim()}>{value}</span>;
}
