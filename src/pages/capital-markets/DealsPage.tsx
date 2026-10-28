import { useMemo, useState } from 'react';
import { OpportunityRow } from '../../components/capital-markets/OpportunityRow';
import { PageFrame } from '../../components/layout/PageFrame';
import { Chip } from '../../components/ui/Chip';
import { getCapitalDeals, type DealType } from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, withTimeout } from '../../lib/async';
import { sortCapitalDealsForDealFlow } from '../../lib/capitalDeals';
import { useCapitalLoad } from '../../lib/useCapitalLoad';
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

  const filteredDeals = useMemo(() => {
    const next = activeFilter === 'all' ? deals : deals.filter((deal) => deal.type === activeFilter);
    return sortCapitalDealsForDealFlow(next);
  }, [activeFilter, deals]);

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

      {loading ? <LoadingState label="Loading deal flow" variant="rows" /> : null}
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
            <div className="grid gap-4">
              {filteredDeals.map((deal) => (
                <OpportunityRow key={deal.id} deal={deal} />
              ))}
            </div>
          )}
        </>
      ) : null}
    </PageFrame>
  );
}
