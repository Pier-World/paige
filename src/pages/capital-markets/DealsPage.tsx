import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { DealReturnCell } from '../../components/capital-markets/DealReturnCell';
import { Badge } from '../../components/ui/Badge';
import { getCapitalDeals, type CapitalDeal, type DealType } from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, describeCapitalLoadFailure, withTimeout } from '../../lib/async';
import { formatCurrency, formatDate } from '../../lib/utils';
import { typeLabels } from './mockData';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

const filters: Array<'all' | DealType> = ['all', 'fund', 'co-invest', 'secondary', 'spv'];

export default function DealsPage() {
  const [deals, setDeals] = useState<CapitalDeal[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | DealType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadDeals() {
      setLoading(true);
      setError(null);

      try {
        const data = await withTimeout(
          getCapitalDeals(),
          CAPITAL_SUPABASE_TIMEOUT_MS,
          'capital deals'
        );
        if (!ignore) setDeals(data);
      } catch (err) {
        if (!ignore) setError(describeCapitalLoadFailure(err, 'Unable to load capital deals.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDeals();

    return () => {
      ignore = true;
    };
  }, [reloadNonce]);

  const filteredDeals =
    activeFilter === 'all' ? deals : deals.filter((deal) => deal.type === activeFilter);
  const aggregateCurrency =
    deals.length > 0 && deals.every((deal) => deal.currencyCode === deals[0].currencyCode)
      ? deals[0].currencyCode
      : null;
  const aggregateTarget = aggregateCurrency
    ? formatCurrency(
        deals.reduce((sum, deal) => sum + deal.targetSize, 0),
        aggregateCurrency,
        true
      )
    : 'Mixed currencies';

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <div className="mb-10">
        <p className="eyebrow mb-2">Deal Flow</p>
        <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">
          Curated opportunities.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">
          Selected fund access, co-investments, secondaries, and SPVs reviewed for Pier members.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total opportunities', value: deals.length.toString() },
          { label: 'Open now', value: deals.filter((deal) => deal.status === 'open').length.toString() },
          {
            label: 'Closing soon',
            value: deals.filter((deal) => deal.status === 'closing').length.toString(),
          },
          {
            label: 'Aggregate target',
            value: aggregateTarget,
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[4px] border border-border bg-surface px-4 py-3">
            <p className="eyebrow mb-1">{stat.label}</p>
            <p className="font-mono-data text-[20px] font-medium text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      {loading ? <LoadingState label="Loading deal flow..." /> : null}
      {error ? (
        <ErrorState message={error} onRetry={() => setReloadNonce((n) => n + 1)} />
      ) : null}

      {!loading && !error ? (
        <>
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
              activeFilter === filter
                ? 'border-gilt bg-gilt/15 text-ink'
                : 'border-border bg-transparent text-slate hover:border-ink/30 hover:text-ink'
            }`}
          >
            {filter === 'all' ? 'All' : typeLabels[filter]}
          </button>
        ))}
      </div>

      {filteredDeals.length === 0 ? (
        <EmptyState
          title="No matching opportunities."
          description="Either no deals are published for members yet, or none match this filter. Empty lists are normal until your team publishes rows—not a broken connection."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredDeals.map((deal) => (
            <Link
              key={deal.id}
              to={`/deals/${deal.id}`}
              className="group flex flex-col rounded-[4px] border border-border bg-surface p-6 transition-colors hover:border-ink/40"
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] text-slate">{deal.manager}</p>
                  <p className="mt-0.5 font-medium leading-snug text-ink transition-colors group-hover:text-gilt">
                    {deal.name}
                  </p>
                </div>
                <Badge variant={deal.status}>{deal.status}</Badge>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                <div>
                  <p className="eyebrow mb-0.5">Type</p>
                  <p className="text-ink">{typeLabels[deal.type]}</p>
                </div>
                <div>
                  <p className="eyebrow mb-0.5">Asset Class</p>
                  <p className="text-ink">{deal.assetClass}</p>
                </div>
                <div>
                  <p className="eyebrow mb-0.5">Target Size</p>
                  <p className="font-mono-data text-ink">
                    {formatCurrency(deal.targetSize, deal.currencyCode, true)}
                  </p>
                </div>
                <DealReturnCell deal={deal} label className="text-[13px]" />
                <div>
                  <p className="eyebrow mb-0.5">Min. Commit</p>
                  <p className="font-mono-data text-ink">
                    {formatCurrency(deal.minCommitment, deal.currencyCode, true)}
                  </p>
                </div>
                <div>
                  <p className="eyebrow mb-0.5">Close</p>
                  <p className="font-mono-data text-ink">{formatDate(deal.closeDate, 'month-day')}</p>
                </div>
              </div>

              <p className="mb-2 flex-1 text-[13px] leading-relaxed text-slate">{deal.description}</p>
              {deal.holdingPeriodYears ? (
                <p className="mb-4 text-[12px] text-slate">
                  Holding period: ~{deal.holdingPeriodYears} years
                  {deal.liquidityNote ? ` · ${deal.liquidityNote}` : ''}
                </p>
              ) : deal.liquidityNote ? (
                <p className="mb-4 text-[12px] text-slate">{deal.liquidityNote}</p>
              ) : (
                <div className="mb-4" />
              )}

              <div className="mb-4 flex flex-wrap gap-1.5">
                {deal.sectors.slice(0, 3).map((sector) => (
                  <span key={sector} className="rounded-[2px] bg-border/60 px-2 py-0.5 text-[11px] text-slate">
                    {sector}
                  </span>
                ))}
              </div>

              <div className="divider mb-4" />
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate">{deal.geography}</span>
                <span className="flex items-center gap-1 font-medium text-ink">
                  Review opportunity
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
        </>
      ) : null}
    </div>
  );
}
