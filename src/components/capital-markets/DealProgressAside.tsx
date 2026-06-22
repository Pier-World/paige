import type { CapitalDeal } from '../../lib/api/capitalMarkets';
import { formatCurrency } from '../../lib/utils';

type DealProgressAsideProps = {
  deal: Pick<CapitalDeal, 'allocationSubscribedPercent' | 'currencyCode' | 'raisedSize' | 'targetSize'>;
};

export function DealProgressAside({ deal }: DealProgressAsideProps) {
  const progress = Math.min(100, Math.max(0, deal.allocationSubscribedPercent));
  const progressLabel = Number.isInteger(progress) ? progress.toFixed(0) : progress.toFixed(1);

  return (
    <div>
      <p className="eyebrow mb-4">Allocation progress</p>
      <p className="font-mono-data text-[28px] font-medium leading-none text-ink">
        {formatCurrency(deal.raisedSize, deal.currencyCode, true)}
      </p>
      <p className="mt-1 text-[12px] text-slate">
        of {formatCurrency(deal.targetSize, deal.currencyCode, true)} target
      </p>
      <div className="mt-4 h-0.5 w-full rounded-full bg-border">
        <div className="h-full rounded-full bg-gilt" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1.5 text-right text-[12px] font-medium text-ink">{progressLabel}% subscribed</p>
    </div>
  );
}
