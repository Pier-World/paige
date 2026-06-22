import { useEffect, useMemo, useState } from 'react';
import { FeaturedPartnerCard, PartnerDetailModal, PartnerListRow } from '../../components/capital-markets/PartnerCards';
import {
  getCapitalPartners,
  type CapitalPartner,
  type PartnerCategory,
} from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, describeCapitalLoadFailure, withTimeout } from '../../lib/async';
import { cn } from '../../lib/utils';
import { partnerCategoryLabels } from './mockData';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

const categorySortOrder: PartnerCategory[] = [
  'dining',
  'dining-platform',
  'hotels',
  'travel',
  'transportation',
  'wellness',
  'business',
  'coworking',
  'experiences',
  'retail',
  'services',
  'lifestyle',
  'finance',
  'health',
  'restaurants',
];

export default function PartnersPage() {
  const [partners, setPartners] = useState<CapitalPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | PartnerCategory>('all');
  const [search, setSearch] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selectedPartner, setSelectedPartner] = useState<CapitalPartner | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadPartners() {
      setLoading(true);
      setError(null);

      try {
        const partnerData = await withTimeout(
          getCapitalPartners(),
          CAPITAL_SUPABASE_TIMEOUT_MS,
          'perks'
        );

        if (!ignore) {
          setPartners(partnerData);
        }
      } catch (err) {
        if (!ignore) setError(describeCapitalLoadFailure(err, 'Unable to load member perks.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadPartners();

    return () => {
      ignore = true;
    };
  }, [reloadNonce]);

  const query = search.trim().toLowerCase();

  const categoryFilters = useMemo<Array<'all' | PartnerCategory>>(() => {
    const categories = Array.from(new Set(partners.map((partner) => partner.category)));
    categories.sort((a, b) => {
      const aIndex = categorySortOrder.indexOf(a);
      const bIndex = categorySortOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    return ['all', ...categories];
  }, [partners]);

  const filtered = useMemo(() => {
    return partners.filter((partner) => {
      if (categoryFilter !== 'all' && partner.category !== categoryFilter) return false;
      if (!query) return true;
      const haystack = [
        partner.name,
        partner.description,
        partner.benefit,
        partner.benefits.join(' '),
        partner.location,
        partner.minimumLevel,
        partner.redemptionInstructions,
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [partners, categoryFilter, query]);

  const featured = filtered.filter((partner) => partner.featured);
  const regular = filtered.filter((partner) => !partner.featured);

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <div className="mb-10">
        <p className="eyebrow mb-2">Perks</p>
        <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">
          Member benefits.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">
          Preferred access, member perks, and redemption paths across the Pier network.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {loading ? <LoadingState label="Loading perks..." /> : null}
      {error ? <ErrorState message={error} onRetry={() => setReloadNonce((n) => n + 1)} /> : null}
      {!loading && !error ? (
        <>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[12px] transition-colors',
                    categoryFilter === cat
                      ? 'border-gilt bg-gilt/15 text-ink'
                      : 'border-border text-slate hover:border-ink/30 hover:text-ink'
                  )}
                >
                  {cat === 'all' ? 'All' : partnerCategoryLabels[cat] ?? cat}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search perks..."
              className="h-9 w-full max-w-xs rounded-[6px] border border-border bg-surface px-3 text-[13px] text-ink placeholder:text-slate focus:border-ink focus:outline-none"
            />
          </div>

          <section className="mb-12">
            <p className="eyebrow mb-5">Featured perks</p>
            {featured.length === 0 ? (
              <EmptyState title="No featured perks match." description="Adjust filters or search." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {featured.map((partner) => (
                  <FeaturedPartnerCard key={partner.id} partner={partner} onSelect={setSelectedPartner} />
                ))}
              </div>
            )}
          </section>

          <section>
            <p className="eyebrow mb-5">All perks</p>
            {regular.length === 0 ? (
              <EmptyState title="No additional perks." description="Try a different filter or search term." />
            ) : (
              <div className="grid gap-3">
                {regular.map((partner) => (
                  <PartnerListRow
                    key={partner.id}
                    partner={partner}
                    onSelect={setSelectedPartner}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
      <PartnerDetailModal partner={selectedPartner} onClose={() => setSelectedPartner(null)} />
    </div>
  );
}
