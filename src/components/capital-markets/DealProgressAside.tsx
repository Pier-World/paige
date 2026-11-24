import type { CapitalDeal } from '../../lib/api/capitalMarkets';
import { formatCurrency, hasPublicDealAmount } from '../../lib/utils';
import { BlurredTerm } from './BlurredTerm';

type DealProgressAsideProps = {
  deal: Pick<CapitalDeal, 'allocationSubscribedPercent' | 'currencyCode' | 'raisedSize' | 'targetSize'>;
  locked?: boolean;
  onUnlock?: () => void;
};

export function DealProgressAside({ deal, locked = false, onUnlock }: DealProgressAsideProps) {
  if (locked) {
    return (
      <button type="button" onClick={onUnlock} className="w-full text-left" aria-label="Allocation progress is included with Pier+">
        <p className="eyebrow mb-4">Allocation progress</p>
        <BlurredTerm />
        <div aria-hidden className="mt-4 h-0.5 w-full rounded-full bg-border">
          <div className="h-full w-1/2 rounded-full bg-ink/30 blur-[3px]" />
        </div>
      </button>
    );
  }

  const hasTarget = hasPublicDealAmount(deal.targetSize);
  const hasRaised = hasPublicDealAmount(deal.raisedSize);
  const hasProgress = deal.allocationSubscribedPercent > 0;

  if (!hasTarget && !hasRaised && !hasProgress) return null;

  const progress = Math.min(100, Math.max(0, deal.allocationSubscribedPercent));
  const progressLabel = Number.isInteger(progress) ? progress.toFixed(0) : progress.toFixed(1);

  return (
    <div>
      <p className="eyebrow mb-4">Allocation progress</p>
      {hasRaised ? (
        <p className="font-mono-data text-[28px] font-medium leading-none text-ink">
          {formatCurrency(deal.raisedSize, deal.currencyCode, true)}
        </p>
      ) : null}
      {hasTarget ? (
        <p className={hasRaised ? 'mt-1 text-[12px] text-slate' : 'font-mono-data text-[28px] font-medium leading-none text-ink'}>
          {hasRaised ? `of ${formatCurrency(deal.targetSize, deal.currencyCode, true)} target` : formatCurrency(deal.targetSize, deal.currencyCode, true)}
        </p>
      ) : null}
      {hasProgress ? (
        <>
          <div className="mt-4 h-0.5 w-full rounded-full bg-border">
            <div className="h-full rounded-full bg-gilt" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-right text-[12px] font-medium text-ink">{progressLabel}% subscribed</p>
        </>
      ) : null}
    </div>
  );
}
