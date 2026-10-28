import { useEffect, useMemo, useState } from 'react';
import { FeaturedPartnerCard, PartnerDetailModal, PartnerListRow } from '../../components/capital-markets/PartnerCards';
import { PageFrame } from '../../components/layout/PageFrame';
import { Chip } from '../../components/ui/Chip';
import {
  getCapitalPartners,
  type CapitalPartner,
  type PartnerCategory,
} from '../../lib/api/capitalMarkets';
import { ANALYTICS_EVENTS, captureAnalytics } from '../../lib/analytics';
import { CAPITAL_SUPABASE_TIMEOUT_MS, withTimeout } from '../../lib/async';
import { useCapitalLoad } from '../../lib/useCapitalLoad';
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
  const [categoryFilter, setCategoryFilter] = useState<'all' | PartnerCategory>('all');
  const [search, setSearch] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<CapitalPartner | null>(null);
  const loaded = useCapitalLoad(
    'partners',
    () => withTimeout(getCapitalPartners(), CAPITAL_SUPABASE_TIMEOUT_MS, 'partners'),
    'Unable to load partners.'
  );
  const partners = useMemo(() => loaded.data ?? [], [loaded.data]);
  const loading = loaded.loading;
  const error = loaded.error;

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

  useEffect(() => {
    if (!selectedPartner) return;
    captureAnalytics(ANALYTICS_EVENTS.partnerViewed, {
      partner_id: selectedPartner.id,
      category: selectedPartner.category,
    });
  }, [selectedPartner]);

  return (
    <PageFrame>
      <div className="mb-10">
        <p className="eyebrow mb-2">Partners</p>
        <h1 className="font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">
          Member partners.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">
          Preferred access and redemption paths across the Pier network.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {loading ? <LoadingState label="Loading partners" variant="cards" /> : null}
      {error ? <ErrorState message={error} onRetry={loaded.reload} /> : null}
      {!loading && !error ? (
        <>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((cat) => (
                <Chip
                  key={cat}
                  active={categoryFilter === cat}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'all' ? 'All' : partnerCategoryLabels[cat] ?? cat}
                </Chip>
              ))}
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search partners..."
              className="h-9 w-full max-w-xs rounded-pier-md border border-border bg-surface px-3 text-[13px] text-ink placeholder:text-slate focus:border-ink focus:outline-none"
            />
          </div>

          <section className="mb-12">
            <p className="eyebrow mb-5">Featured partners</p>
            {featured.length === 0 ? (
              <EmptyState title="No featured partners match." description="Adjust filters or search." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {featured.map((partner) => (
                  <FeaturedPartnerCard key={partner.id} partner={partner} onSelect={setSelectedPartner} />
                ))}
              </div>
            )}
          </section>

          <section>
            <p className="eyebrow mb-5">All partners</p>
            {regular.length === 0 ? (
              <EmptyState title="No additional partners." description="Try a different filter or search term." />
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
    </PageFrame>
  );
}
