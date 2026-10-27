import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { DealReturnCell } from '../../components/capital-markets/DealReturnCell';
import { PageFrame } from '../../components/layout/PageFrame';
import { Badge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';
import { getCapitalDeals, type DealType } from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, withTimeout } from '../../lib/async';
import { useCapitalLoad } from '../../lib/useCapitalLoad';
import { formatCurrency, formatDate, hasPublicDealAmount } from '../../lib/utils';
import { typeLabels } from './mockData';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

const filters: Array<'all' | DealType> = ['all', 'fund', 'co-invest', 'secondary', 'spv'];

export default function DealsPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | DealType>('all');
  const loaded = useCapitalLoad(
    'deals',
    () => withTimeout(getCapitalDeals(), CAPITAL_SUPABASE_TIMEOUT_MS, 'capital deals'),
    'Unable to load capital deals.'
  );
  const deals = loaded.data ?? [];
  const loading = loaded.loading;
  const error = loaded.error;

  const filteredDeals =
    activeFilter === 'all' ? deals : deals.filter((deal) => deal.type === activeFilter);

  return (
    <PageFrame>
      <div className="mb-10">
        <p className="eyebrow mb-2">Deal Flow</p>
        <h1 className="font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">
          Curated opportunities.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">
          Selected fund access, co-investments, secondaries, and SPVs reviewed for Pier members.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {loading ? <LoadingState label="Loading deal flow" variant="cards" /> : null}
      {error ? <ErrorState message={error} onRetry={loaded.reload} /> : null}

      {!loading && !error ? (
        <>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          { label: 'Total opportunities', value: deals.length.toString() },
          { label: 'Open now', value: deals.filter((deal) => deal.status === 'open').length.toString() },
          {
            label: 'Closing soon',
            value: deals.filter((deal) => deal.status === 'closing').length.toString(),
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-pier border border-border bg-surface px-4 py-3">
            <p className="eyebrow mb-1">{stat.label}</p>
            <p className="font-mono-data text-[20px] font-medium text-ink">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Chip
            key={filter}
            active={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
          >
            {filter === 'all' ? 'All' : typeLabels[filter]}
          </Chip>
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
                  <p className="mt-0.5 font-medium leading-snug text-ink">
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
                {hasPublicDealAmount(deal.targetSize) ? (
                  <div>
                    <p className="eyebrow mb-0.5">Target Size</p>
                    <p className="font-mono-data text-ink">
                      {formatCurrency(deal.targetSize, deal.currencyCode, true)}
                    </p>
                  </div>
                ) : null}
                <DealReturnCell deal={deal} label className="text-[13px]" />
                {hasPublicDealAmount(deal.minCommitment) ? (
                  <div>
                    <p className="eyebrow mb-0.5">Min. Commit</p>
                    <p className="font-mono-data text-ink">
                      {formatCurrency(deal.minCommitment, deal.currencyCode, true)}
                    </p>
                  </div>
                ) : null}
                {deal.closeDate ? (
                  <div>
                    <p className="eyebrow mb-0.5">Close</p>
                    <p className="font-mono-data text-ink">{formatDate(deal.closeDate, 'month-day')}</p>
                  </div>
                ) : null}
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
    </PageFrame>
  );
}
