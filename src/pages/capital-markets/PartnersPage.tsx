import { useEffect, useMemo, useState } from 'react';
import { FeaturedPartnerCard, PartnerListRow } from '../../components/capital-markets/PartnerCards';
import { useAuth } from '../../context/AuthContext';
import {
  createCapitalPartnerIntro,
  getCapitalPartners,
  getMyCapitalPartnerIntros,
  type CapitalPartner,
  type CapitalPartnerIntro,
  type PartnerCategory,
} from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, describeCapitalLoadFailure, withTimeout } from '../../lib/async';
import { cn } from '../../lib/utils';
import { partnerCategoryLabels } from './mockData';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

const categoryFilters: Array<'all' | PartnerCategory> = [
  'all',
  'hotels',
  'restaurants',
  'travel',
  'health',
  'finance',
  'lifestyle',
];

export default function PartnersPage() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<CapitalPartner[]>([]);
  const [intros, setIntros] = useState<CapitalPartnerIntro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submittingPartnerId, setSubmittingPartnerId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | PartnerCategory>('all');
  const [search, setSearch] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadPartners() {
      setLoading(true);
      setError(null);

      try {
        const [partnerData, introData] = await withTimeout(
          user?.id
            ? Promise.all([getCapitalPartners(), getMyCapitalPartnerIntros(user.id)])
            : Promise.all([getCapitalPartners(), Promise.resolve([] as CapitalPartnerIntro[])]),
          CAPITAL_SUPABASE_TIMEOUT_MS,
          'partners and introductions'
        );

        if (!ignore) {
          setPartners(partnerData);
          setIntros(introData);
        }
      } catch (err) {
        if (!ignore) setError(describeCapitalLoadFailure(err, 'Unable to load capital partners.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadPartners();

    return () => {
      ignore = true;
    };
  }, [user?.id, reloadNonce]);

  const introByPartnerId = new Map(intros.map((intro) => [intro.partnerId, intro]));
  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    return partners.filter((partner) => {
      if (categoryFilter !== 'all' && partner.category !== categoryFilter) return false;
      if (!query) return true;
      const haystack = `${partner.name} ${partner.description} ${partner.benefit} ${partner.location}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [partners, categoryFilter, query]);

  const featured = filtered.filter((partner) => partner.featured);
  const regular = filtered.filter((partner) => !partner.featured);

  async function handleIntroRequest(partner: CapitalPartner) {
    if (!user) {
      setSubmitSuccess(null);
      setSubmitError('Please sign in before requesting a partner introduction.');
      return;
    }

    setSubmittingPartnerId(partner.databaseId);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await createCapitalPartnerIntro({
        partnerId: partner.databaseId,
        memberId: user.id,
      });
      const updatedIntros = await withTimeout(
        getMyCapitalPartnerIntros(user.id),
        CAPITAL_SUPABASE_TIMEOUT_MS,
        'partner introductions'
      );
      setIntros(updatedIntros);
      setSubmitSuccess(`Introduction request submitted for ${partner.name}.`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit partner intro request.');
    } finally {
      setSubmittingPartnerId(null);
    }
  }

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <div className="mb-10">
        <p className="eyebrow mb-2">Partners</p>
        <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">
          Member benefits.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">
          Preferred access and trusted introductions across the Pier network.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {loading ? <LoadingState label="Loading partners..." /> : null}
      {error ? <ErrorState message={error} onRetry={() => setReloadNonce((n) => n + 1)} /> : null}
      {submitSuccess ? (
        <div className="mb-6 rounded-[4px] border border-ledger/20 bg-ledger/[0.04] p-4 text-[13px] text-ledger">
          {submitSuccess}
        </div>
      ) : null}
      {submitError ? (
        <div className="mb-6 rounded-[4px] border border-danger/20 bg-danger/[0.04] p-4 text-[13px] text-danger">
          {submitError}
        </div>
      ) : null}

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
                  {cat === 'all' ? 'All' : partnerCategoryLabels[cat]}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search partners..."
              className="h-9 w-full max-w-xs rounded-[6px] border border-border bg-surface px-3 text-[13px] text-ink placeholder:text-slate focus:border-ink focus:outline-none"
            />
          </div>

          <section className="mb-12">
            <p className="eyebrow mb-5">Featured partners</p>
            {featured.length === 0 ? (
              <EmptyState title="No featured partners match." description="Adjust filters or search." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {featured.map((partner) => (
                  <FeaturedPartnerCard key={partner.id} partner={partner} onIntro={handleIntroRequest} />
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
                    intro={introByPartnerId.get(partner.databaseId)}
                    submitting={submittingPartnerId === partner.databaseId}
                    onIntro={handleIntroRequest}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
