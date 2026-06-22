import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, MapPin } from 'lucide-react';
import { DealProgressAside } from '../../components/capital-markets/DealProgressAside';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import {
  createCapitalDealInterest,
  getCapitalDealDocumentUrl,
  getCapitalDealBySlugOrId,
  getMyCapitalDealInterests,
  type CapitalDeal,
  type CapitalDealDocument,
  type CapitalDealInterest,
  type CapitalDealInterestRequestType,
} from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, describeCapitalLoadFailure, withTimeout } from '../../lib/async';
import { formatCurrency, formatDate, formatDealReturn } from '../../lib/utils';
import { typeLabels } from './mockData';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

export default function DealDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [deal, setDeal] = useState<CapitalDeal | null>(null);
  const [interests, setInterests] = useState<CapitalDealInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState<CapitalDealInterestRequestType | null>(null);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadDeal() {
      if (!id) {
        setDeal(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await withTimeout(
          getCapitalDealBySlugOrId(id),
          CAPITAL_SUPABASE_TIMEOUT_MS,
          'capital deal'
        );
        if (ignore) return;

        setDeal(data);

        if (data && user?.id) {
          try {
            const interestData = await withTimeout(
              getMyCapitalDealInterests(user.id, data.databaseId),
              CAPITAL_SUPABASE_TIMEOUT_MS,
              'deal interest requests'
            );
            if (!ignore) setInterests(interestData);
          } catch {
            if (!ignore) setInterests([]);
          }
        } else {
          setInterests([]);
        }
      } catch (err) {
        if (!ignore) setError(describeCapitalLoadFailure(err, 'Unable to load capital deal.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDeal();

    return () => {
      ignore = true;
    };
  }, [id, user?.id, reloadNonce]);

  if (loading) {
    return (
      <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
        <Link to="/deals" className="mb-8 flex items-center gap-1.5 text-[13px] text-slate hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" />
          Deal Flow
        </Link>
        <LoadingState label="Loading opportunity..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
        <Link to="/deals" className="mb-8 flex items-center gap-1.5 text-[13px] text-slate hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" />
          Deal Flow
        </Link>
        <ErrorState message={error} onRetry={() => setReloadNonce((n) => n + 1)} />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
        <Link to="/deals" className="mb-8 flex items-center gap-1.5 text-[13px] text-slate hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" />
          Deal Flow
        </Link>
        <p className="eyebrow mb-2">Deal not found</p>
        <h1 className="font-display text-[36px] leading-none text-ink">This opportunity is unavailable.</h1>
      </div>
    );
  }

  const submittedRequestTypes = new Set(interests.map((interest) => interest.requestType));
  const returnValue = formatDealReturn(
    deal.returnMetricType,
    deal.targetIrr,
    deal.moicTarget,
    deal.returnDisplay
  );

  async function handleDealRequest(requestType: CapitalDealInterestRequestType) {
    if (!user) {
      setRequestSuccess(null);
      setRequestError('Please sign in before submitting a deal request.');
      return;
    }
    if (!deal) return;

    setSubmittingRequest(requestType);
    setRequestError(null);
    setRequestSuccess(null);

    try {
      await createCapitalDealInterest({
        dealId: deal.databaseId,
        memberId: user.id,
        requestType,
      });
      const updatedInterests = await withTimeout(
        getMyCapitalDealInterests(user.id, deal.databaseId),
        CAPITAL_SUPABASE_TIMEOUT_MS,
        'deal interest requests'
      );
      setInterests(updatedInterests);
      setRequestSuccess(
        requestType === 'request_documents'
          ? 'Materials request submitted. The Pier team will follow up.'
          : requestType === 'schedule_call'
            ? 'Call request submitted. The Pier team will follow up.'
            : 'Interest submitted. The Pier team will follow up.'
      );
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Unable to submit this request.');
    } finally {
      setSubmittingRequest(null);
    }
  }

  async function handleOpenDocument(document: CapitalDealDocument) {
    setOpeningDocumentId(document.id);
    setRequestError(null);

    try {
      const url = await getCapitalDealDocumentUrl(document);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Unable to open this document.');
    } finally {
      setOpeningDocumentId(null);
    }
  }

  const metricRows = [
    { label: 'Min. commitment', value: formatCurrency(deal.minCommitment, deal.currencyCode, true) },
    { label: 'Return', value: returnValue },
    ...(deal.returnMetricType === 'irr' && deal.moicTarget > 0
      ? [{ label: 'Target MOIC', value: `${deal.moicTarget}x` }]
      : []),
    { label: 'Close date', value: formatDate(deal.closeDate, 'long') },
    { label: 'Vintage', value: deal.vintage.toString() },
    { label: 'Geography', value: deal.geography },
    ...(deal.holdingPeriodYears
      ? [{ label: 'Holding period', value: `~${deal.holdingPeriodYears} years` }]
      : []),
    ...(deal.liquidityNote ? [{ label: 'Liquidity', value: deal.liquidityNote }] : []),
  ];

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
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
          <span className="eyebrow">{deal.assetClass}</span>
          <span className="eyebrow">{typeLabels[deal.type]}</span>
        </div>
      </div>

      <div className="gilt-rule mb-10 w-12" />

      <div className="mb-10 grid gap-10 xl:grid-cols-[1fr_340px]">
        <div>
          <p className="max-w-3xl text-[15px] leading-relaxed text-ink/80">{deal.description}</p>
        </div>

        <aside className="rounded-[4px] border border-border bg-surface p-6">
          <DealProgressAside deal={deal} />
          <div className="divider my-5" />
          <div className="space-y-3 text-[13px]">
            {metricRows.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-slate">{label}</span>
                <span className="font-mono-data text-right font-medium text-ink">{value}</span>
              </div>
            ))}
          </div>
          <div className="divider my-5" />
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              loading={submittingRequest === 'express_interest'}
              disabled={submittingRequest !== null || submittedRequestTypes.has('express_interest')}
              onClick={() => handleDealRequest('express_interest')}
            >
              {submittedRequestTypes.has('express_interest') ? 'Interest submitted' : 'Express interest'}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              loading={submittingRequest === 'request_documents'}
              disabled={submittingRequest !== null || submittedRequestTypes.has('request_documents')}
              onClick={() => handleDealRequest('request_documents')}
            >
              {submittedRequestTypes.has('request_documents')
                ? 'Materials requested'
                : 'Request materials'}
            </Button>
          </div>
          {!user ? (
            <p className="mt-3 text-center text-[11px] text-slate">Sign in to express interest.</p>
          ) : null}
          {requestSuccess ? <p className="mt-3 text-center text-[11px] text-ledger">{requestSuccess}</p> : null}
          {requestError ? <p className="mt-3 text-center text-[11px] text-danger">{requestError}</p> : null}
        </aside>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-4">
          <p className="eyebrow">Why Pier selected this</p>
          <div className="divider flex-1" />
        </div>
        <p className="max-w-3xl text-[15px] leading-relaxed text-ink/80">{deal.whyPierSelected}</p>
      </section>

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

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-4">
          <p className="eyebrow">Documents</p>
          <div className="divider flex-1" />
        </div>
        {deal.documents.length === 0 ? (
          <EmptyState
            title="No documents available"
            description="Documents are locked until the Pier team approves your request for materials."
          />
        ) : (
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
                  <p className="mt-0.5 text-[11px] text-parchment/40">{document.size}</p>
                </div>
                {openingDocumentId === document.id ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gilt border-t-transparent" />
                ) : (
                  <Download className="h-4 w-4 text-gilt opacity-60" />
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-4 flex items-center gap-4">
            <p className="eyebrow">Key contacts</p>
            <div className="divider flex-1" />
          </div>
          {deal.contacts.length === 0 ? (
            <EmptyState title="No contacts listed." description="Key contacts will appear when added to the deal." />
          ) : (
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
          )}
        </div>

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
      </section>
    </div>
  );
}
