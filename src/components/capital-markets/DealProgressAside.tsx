import type { CapitalDeal } from '../../lib/api/capitalMarkets';
import { formatCurrency } from '../../lib/utils';

type DealProgressAsideProps = {
  deal: Pick<CapitalDeal, 'raisedSize' | 'targetSize'>;
};

export function DealProgressAside({ deal }: DealProgressAsideProps) {
  const progress =
    deal.targetSize > 0 ? Math.min(100, Math.round((deal.raisedSize / deal.targetSize) * 100)) : 0;

  return (
    <div>
      <p className="eyebrow mb-4">Allocation progress</p>
      <p className="font-mono-data text-[28px] font-medium leading-none text-ink">
        {formatCurrency(deal.raisedSize, 'USD', true)}
      </p>
      <p className="mt-1 text-[12px] text-slate">
        of {formatCurrency(deal.targetSize, 'USD', true)} target
      </p>
      <div className="mt-4 h-0.5 w-full rounded-full bg-border">
        <div className="h-full rounded-full bg-gilt" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1.5 text-right text-[12px] font-medium text-ink">{progress}% subscribed</p>
    </div>
  );
}
