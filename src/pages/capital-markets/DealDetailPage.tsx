import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, MapPin } from 'lucide-react';
import { DealProgressAside } from '../../components/capital-markets/DealProgressAside';
import { Badge } from '../../components/ui/Badge';
import { ANALYTICS_EVENTS, captureAnalytics } from '../../lib/analytics';
import { getCapitalDealDocumentUrl, getCapitalDealBySlugOrId, type CapitalDeal, type CapitalDealDocument } from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, withTimeout } from '../../lib/async';
import { dataRoomMailto } from '../../lib/conciergeMailto';
import { useCapitalLoad } from '../../lib/useCapitalLoad';
import { formatCurrency, formatDate, formatDealReturn, hasPublicDealAmount, hasPublicDealReturn } from '../../lib/utils';
import { ErrorState, LoadingState } from './PageStates';

export default function DealDetailPage() {
  const { id } = useParams();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const loaded = useCapitalLoad(
    id ? `deal:${id}` : 'deal:missing',
    async () => {
      if (!id) return { deal: null as CapitalDeal | null };
      const deal = await withTimeout(
        getCapitalDealBySlugOrId(id),
        CAPITAL_SUPABASE_TIMEOUT_MS,
        'capital deal'
      );
      return { deal };
    },
    'Unable to load capital deal.'
  );
  const deal = loaded.data?.deal ?? null;
  const loading = loaded.loading;
  const error = loaded.error;

  useEffect(() => {
    if (!deal) return;
    captureAnalytics(ANALYTICS_EVENTS.dealViewed, {
      deal_id: deal.databaseId,
      deal_type: deal.type,
      status: deal.status,
    });
  }, [deal]);

  if (loading) {
    return (
      <div className="page-frame">
        <Link to="/deals" className="mb-8 flex items-center gap-1.5 text-[13px] text-slate hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" />
          Deal Flow
        </Link>
        <LoadingState label="Loading opportunity" variant="detail" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-frame">
        <Link to="/deals" className="mb-8 flex items-center gap-1.5 text-[13px] text-slate hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" />
          Deal Flow
        </Link>
        <ErrorState message={error} onRetry={loaded.reload} />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="page-frame">
        <Link to="/deals" className="mb-8 flex items-center gap-1.5 text-[13px] text-slate hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" />
          Deal Flow
        </Link>
        <p className="eyebrow mb-2">Deal not found</p>
        <h1 className="font-display text-[36px] leading-none text-ink">This opportunity is unavailable.</h1>
      </div>
    );
  }

  const loadedDeal = deal;
  const returnValue = formatDealReturn(
    loadedDeal.returnMetricType,
    loadedDeal.targetIrr,
    loadedDeal.moicTarget,
    loadedDeal.returnDisplay
  );

  async function handleOpenDocument(document: CapitalDealDocument) {
    setOpeningDocumentId(document.id);
    setRequestError(null);

    try {
      const url = await getCapitalDealDocumentUrl(document);
      captureAnalytics(ANALYTICS_EVENTS.dealDocumentOpened, {
        deal_id: loadedDeal.databaseId,
        document_id: document.id,
        document_type: document.type,
        access_level: document.accessLevel,
      });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Unable to open this document.');
    } finally {
      setOpeningDocumentId(null);
    }
  }

  const showProgress =
    hasPublicDealAmount(deal.targetSize) ||
    hasPublicDealAmount(deal.raisedSize) ||
    deal.allocationSubscribedPercent > 0;
  const metricRows = [
    ...(hasPublicDealAmount(deal.minCommitment)
      ? [{ label: 'Min. commitment', value: formatCurrency(deal.minCommitment, deal.currencyCode, true) }]
      : []),
    ...(hasPublicDealReturn(deal.returnMetricType, deal.targetIrr, deal.moicTarget, deal.returnDisplay)
      ? [{ label: 'Return', value: returnValue }]
      : []),
    ...(deal.returnMetricType === 'irr' && deal.moicTarget > 0
      ? [{ label: 'Target MOIC', value: `${deal.moicTarget}x` }]
      : []),
    ...(deal.closeDate ? [{ label: 'Close date', value: formatDate(deal.closeDate, 'long') }] : []),
    ...(deal.vintage > 0 ? [{ label: 'Vintage', value: deal.vintage.toString() }] : []),
    ...(deal.geography ? [{ label: 'Geography', value: deal.geography }] : []),
    ...(deal.holdingPeriodYears
      ? [{ label: 'Holding period', value: `~${deal.holdingPeriodYears} years` }]
      : []),
    ...(deal.liquidityNote ? [{ label: 'Liquidity', value: deal.liquidityNote }] : []),
  ];

  return (
    <div className="page-frame">
      <Link to="/deals" className="mb-8 flex items-center gap-1.5 text-[13px] text-slate hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" />
        Deal Flow
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[36px] leading-[1] tracking-[-0.02em] text-ink">{deal.name}</h1>
          <p className="mt-1.5 text-[15px] text-slate">
            {deal.manager} / {deal.geography}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant={deal.status}>{deal.status}</Badge>
        </div>
      </div>

      <div className="gilt-rule mb-10 w-12" />

      <div className="mb-10 grid gap-10 xl:grid-cols-[1fr_340px]">
        <div>
          <p className="max-w-3xl text-[15px] leading-relaxed text-ink/80">{deal.description}</p>
        </div>

        <aside className="rounded-[4px] border border-border bg-surface p-6">
          {showProgress ? <DealProgressAside deal={deal} /> : null}
          {showProgress && metricRows.length > 0 ? <div className="divider my-5" /> : null}
          {metricRows.length > 0 ? (
            <div className="space-y-3 text-[13px]">
              {metricRows.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-slate">{label}</span>
                  <span className="font-mono-data text-right font-medium text-ink">{value}</span>
                </div>
              ))}
            </div>
          ) : null}
          {showProgress || metricRows.length > 0 ? <div className="divider my-5" /> : null}
          <a
            href={dataRoomMailto(deal.name)}
            onClick={() =>
              captureAnalytics(ANALYTICS_EVENTS.dealDataRoomRequested, {
                deal_id: deal.databaseId,
                deal_type: deal.type,
              })
            }
            className="inline-flex h-11 w-full select-none items-center justify-center gap-2 rounded-pier-md border border-ink bg-ink px-5 text-[14px] font-medium text-parchment transition-colors duration-150 hover:bg-ink/90"
          >
            Request data room
          </a>
          {requestError ? <p className="mt-3 text-center text-[11px] text-danger">{requestError}</p> : null}
        </aside>
      </div>

      {deal.whyPierSelected ? (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-4">
            <p className="eyebrow">Why Pier selected this</p>
            <div className="divider flex-1" />
          </div>
          <p className="max-w-3xl text-[15px] leading-relaxed text-ink/80">{deal.whyPierSelected}</p>
        </section>
      ) : null}

      {deal.sectors.length > 0 ? (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-4">
            <p className="eyebrow">Focus sectors</p>
            <div className="divider flex-1" />
          </div>
          <div className="flex flex-wrap gap-2">
            {deal.sectors.map((sector) => (
              <span key={sector} className="rounded-[2px] border border-border bg-surface px-3 py-1.5 text-[13px] text-ink">
                {sector}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {deal.eligibleInvestorRequirements || deal.disclaimer ? (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-4">
            <p className="eyebrow">Investor information</p>
            <div className="divider flex-1" />
          </div>
          <div className="grid max-w-4xl gap-4 md:grid-cols-2">
            {deal.eligibleInvestorRequirements ? (
              <div className="rounded-[4px] border border-border bg-surface p-4">
                <p className="eyebrow mb-2">Eligibility</p>
                <p className="text-[13px] leading-relaxed text-slate">{deal.eligibleInvestorRequirements}</p>
              </div>
            ) : null}
            {deal.disclaimer ? (
              <div className="rounded-[4px] border border-border bg-surface p-4">
                <p className="eyebrow mb-2">Important note</p>
                <p className="text-[13px] leading-relaxed text-slate">{deal.disclaimer}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {deal.documents.length > 0 ? (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-4">
            <p className="eyebrow">Documents</p>
            <div className="divider flex-1" />
          </div>
          <div className="grid max-w-3xl gap-3 md:grid-cols-3">
            {deal.documents.map((document) => (
              <button
                key={document.id}
                type="button"
                disabled={openingDocumentId !== null}
                onClick={() => handleOpenDocument(document)}
                className="group flex items-center justify-between rounded-[4px] border border-border bg-midnight p-4 text-left transition-colors hover:border-gilt disabled:opacity-80"
              >
                <div>
                  <p className="eyebrow mb-1 text-parchment/60">{document.type}</p>
                  <p className="text-[13px] font-medium text-parchment">{document.label}</p>
                  <p className="mt-0.5 text-[11px] text-parchment/40">
                    {document.externalUrl ? 'External link' : document.size}
                  </p>
                </div>
                {openingDocumentId === document.id ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gilt border-t-transparent" />
                ) : document.externalUrl ? (
                  <ExternalLink className="h-4 w-4 text-gilt opacity-60" />
                ) : (
                  <Download className="h-4 w-4 text-gilt opacity-60" />
                )}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className={deal.contacts.length > 0 ? 'grid gap-6 lg:grid-cols-[1fr_320px]' : undefined}>
        {deal.contacts.length > 0 ? (
          <div>
            <div className="mb-4 flex items-center gap-4">
              <p className="eyebrow">Key contacts</p>
              <div className="divider flex-1" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {deal.contacts.map((contact) => (
                <div key={`${contact.email}-${contact.name}`} className="rounded-[4px] border border-border bg-surface p-4">
                  <p className="font-medium text-ink">{contact.name || 'Deal contact'}</p>
                  <p className="mt-0.5 text-[13px] text-slate">{contact.role || 'Capital markets'}</p>
                  <p className="mt-2 font-mono-data text-[11px] text-slate">
                    {contact.email || 'Contact via concierge'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {deal.geography ? (
          <div>
            <div className="mb-4 flex items-center gap-4">
              <p className="eyebrow">Location</p>
              <div className="divider flex-1" />
            </div>
            <div className="flex items-center gap-2 text-[14px] text-slate">
              <MapPin className="h-4 w-4 stroke-[1.25]" />
              {deal.geography}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
