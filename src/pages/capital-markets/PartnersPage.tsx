import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  createCapitalPartnerIntro,
  getCapitalPartners,
  getMyCapitalPartnerIntros,
  type CapitalPartner,
  type CapitalPartnerIntro,
} from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, describeCapitalLoadFailure, withTimeout } from '../../lib/async';
import { partnerCategoryLabels } from './mockData';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

function displayWebsite(website: string) {
  return website.replace(/^https?:\/\//, '') || 'Website pending';
}

export default function PartnersPage() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<CapitalPartner[]>([]);
  const [intros, setIntros] = useState<CapitalPartnerIntro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submittingPartnerId, setSubmittingPartnerId] = useState<string | null>(null);
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

  const featured = partners.filter((partner) => partner.featured);
  const regular = partners.filter((partner) => !partner.featured);
  const introByPartnerId = new Map(intros.map((intro) => [intro.partnerId, intro]));

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
        <p className="eyebrow mb-2">04 / Partners</p>
        <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">
          Member benefits.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">
          Access and introductions that make the membership valuable beyond capital.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {loading ? <LoadingState label="Loading partners from Supabase..." /> : null}
      {error ? (
        <ErrorState message={error} onRetry={() => setReloadNonce((n) => n + 1)} />
      ) : null}
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
      <section className="mb-12">
        <p className="eyebrow mb-5">Featured Partners</p>
        {featured.length === 0 ? (
          <EmptyState
            title="No featured partners."
            description="Featured partners appear when your team marks them in the catalog. If none are configured yet, this section stays empty on purpose."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {featured.map((partner) => (
            <div key={partner.id} className="rounded-[4px] border border-border bg-midnight p-7">
              {(() => {
                const intro = introByPartnerId.get(partner.databaseId);
                return (
                  <>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow mb-1 text-gilt">{partnerCategoryLabels[partner.category]}</p>
                  <h2 className="font-display text-[28px] leading-none tracking-[-0.01em] text-parchment">
                    {partner.name}
                  </h2>
                  <p className="mt-1 text-[13px] text-parchment/50">{partner.tagline}</p>
                </div>
                <Badge variant="members">Featured</Badge>
              </div>
              <p className="mb-5 text-[14px] leading-relaxed text-parchment/70">
                {partner.description}
              </p>
              <div className="rounded-[2px] border border-gilt/20 bg-gilt/[0.08] px-4 py-3">
                <p className="eyebrow mb-1 text-parchment/60">Member Benefit</p>
                <p className="text-[13px] text-parchment">{partner.benefit}</p>
              </div>
              <div className="mt-4 flex flex-col gap-3 text-[12px] sm:flex-row sm:items-center sm:justify-between">
                <a
                  href={partner.website || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-gilt hover:underline"
                >
                  {displayWebsite(partner.website)}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  type="button"
                  disabled={submittingPartnerId !== null || Boolean(intro)}
                  onClick={() => handleIntroRequest(partner)}
                  className="text-left text-parchment/50 hover:text-gilt disabled:hover:text-parchment/50 sm:text-right"
                >
                  {submittingPartnerId === partner.databaseId
                    ? 'Submitting...'
                    : intro
                      ? `Intro ${intro.status.replace('_', ' ')}`
                      : 'Request introduction'}
                </button>
              </div>
                  </>
                );
              })()}
            </div>
          ))}
          </div>
        )}
      </section>

      <section>
        <p className="eyebrow mb-5">All Partners</p>
        {regular.length === 0 ? (
          <EmptyState
            title="No additional partners."
            description="No other active partners are visible to your account right now. That can mean the directory is intentionally small—not a connection failure."
          />
        ) : (
          <div className="grid gap-3">
            {regular.map((partner) => (
            <div
              key={partner.id}
              className="group flex flex-col gap-5 rounded-[4px] border border-border bg-surface p-5 transition-colors hover:border-ink/30 xl:flex-row xl:items-start xl:justify-between"
            >
              {(() => {
                const intro = introByPartnerId.get(partner.databaseId);
                return (
                  <>
              <div className="grid flex-1 gap-5 lg:grid-cols-[180px_1fr_1fr]">
                <div>
                  <p className="eyebrow mb-0.5">{partnerCategoryLabels[partner.category]}</p>
                  <p className="font-medium text-ink">{partner.name}</p>
                  <p className="mt-0.5 text-[12px] text-slate">{partner.tagline}</p>
                </div>
                <p className="text-[13px] leading-relaxed text-slate">{partner.description}</p>
                <div>
                  <p className="eyebrow mb-1">Benefit</p>
                  <p className="text-[13px] text-ink">{partner.benefit}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={partner.website || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 items-center justify-center rounded-[6px] border border-border bg-parchment px-3 text-[12px] text-slate hover:border-ink/30 hover:text-ink"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Visit
                </a>
                <button
                  type="button"
                  disabled={submittingPartnerId !== null || Boolean(intro)}
                  onClick={() => handleIntroRequest(partner)}
                  className="flex h-8 items-center justify-center rounded-[6px] border border-ink bg-ink px-3 text-[12px] text-parchment hover:bg-ink/90 disabled:opacity-50"
                >
                  {submittingPartnerId === partner.databaseId
                    ? 'Submitting...'
                    : intro
                      ? `Intro ${intro.status.replace('_', ' ')}`
                      : 'Intro'}
                </button>
              </div>
                  </>
                );
              })()}
            </div>
          ))}
          </div>
        )}
      </section>
        </>
      ) : null}
    </div>
  );
}
