import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import { DashboardConciergeTeaser } from '../../components/capital-markets/DashboardConciergeTeaser';
import { DealReturnCell } from '../../components/capital-markets/DealReturnCell';
import { AnonymizedDealPreview } from '../../components/capital-markets/AnonymizedDealPreview';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  getCapitalDeals,
  getCapitalEvents,
  type CapitalDeal,
  type CapitalEvent,
} from '../../lib/api/capitalMarkets';
import {
  dashboardIntroKey,
  eventMatchesCapitalRole,
  profileNeedsOnboardingDetails,
} from '../../lib/capitalOnboarding';
import { isPierPlus } from '../../lib/membership';
import { CAPITAL_SUPABASE_TIMEOUT_MS, describeCapitalLoadFailure, withTimeout } from '../../lib/async';
import { formatCurrency, formatDate } from '../../lib/utils';
import { eventTypeLabels, typeLabels } from './mockData';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;

function roleCopy(role?: string) {
  if (role === 'gp') {
    return {
      subtitle: 'Private gatherings and allocator context. Introductions stay Pier-mediated.',
      detail: 'Start with an upcoming dinner. Complete your firm and city so we can place you in the right room.',
    };
  }
  if (role === 'lp') {
    return {
      subtitle: 'Private gatherings, curated managers, and capital in context. You stay unlisted by default.',
      detail: 'RSVP to a gathering when you are ready. Deal Flow is available with Pier+.',
    };
  }
  return {
    subtitle: 'A private community of managers and allocators.',
    detail: 'Explore upcoming member gatherings, then finish your profile so Pier can route the right invitations.',
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const pierPlus = isPierPlus(user);
  const capitalRole = user?.preferences?.capital_role;
  const [deals, setDeals] = useState<CapitalDeal[]>([]);
  const [events, setEvents] = useState<CapitalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [introReady, setIntroReady] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setIntroDismissed(window.localStorage.getItem(dashboardIntroKey(user.id)) === '1');
    setIntroReady(true);
  }, [user?.id]);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      try {
        if (!pierPlus) {
          const eventData = await withTimeout(
            getCapitalEvents(),
            CAPITAL_SUPABASE_TIMEOUT_MS,
            'dashboard events'
          );
          if (!ignore) {
            setDeals([]);
            setEvents(eventData);
          }
        } else {
          const [dealData, eventData] = await withTimeout(
            Promise.all([getCapitalDeals(), getCapitalEvents()]),
            CAPITAL_SUPABASE_TIMEOUT_MS,
            'dashboard summary'
          );

          if (!ignore) {
            setDeals(dealData);
            setEvents(eventData);
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(describeCapitalLoadFailure(err, 'Unable to load capital markets dashboard.'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      ignore = true;
    };
  }, [reloadNonce, pierPlus]);

  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const copy = roleCopy(capitalRole);

  const openDeals = deals.filter((deal) => deal.status === 'open' || deal.status === 'closing');
  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((event) => event.upcoming)
      .filter((event) => eventMatchesCapitalRole(event.audience, capitalRole))
      .filter((event) => {
        const t = new Date(event.date).getTime();
        return t >= now && t - now <= THREE_WEEKS_MS;
      })
      .slice(0, 5);
  }, [events, capitalRole]);
  const nextEvent = upcomingEvents[0] ?? events.find((event) => event.upcoming);
  const needsDetails = profileNeedsOnboardingDetails(user?.preferences);
  const showIntro = Boolean(user?.id) && introReady && !introDismissed;

  function dismissIntro() {
    if (!user?.id) return;
    window.localStorage.setItem(dashboardIntroKey(user.id), '1');
    setIntroDismissed(true);
  }

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <div className="mb-10">
        <p className="eyebrow mb-2">Dashboard</p>
        <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">{copy.subtitle}</p>
        <p className="mt-2 max-w-2xl text-[14px] text-slate/80">{copy.detail}</p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {showIntro ? (
        <div className="mb-8 flex items-start justify-between gap-4 rounded-[4px] border border-border bg-surface p-5">
          <div>
            <p className="eyebrow mb-2">Start here</p>
            <p className="text-[14px] text-ink">A short path into Pier this week.</p>
            <div className="mt-3 flex flex-wrap gap-4 text-[13px]">
              <Link to={nextEvent ? `/events#event-${nextEvent.id}` : '/events'} className="font-medium text-ink underline-offset-4 hover:underline">
                {nextEvent ? `RSVP: ${nextEvent.title}` : 'See upcoming events'}
              </Link>
              {needsDetails ? (
                <Link to="/profile" className="font-medium text-ink underline-offset-4 hover:underline">
                  Confirm firm, city, and role
                </Link>
              ) : (
                <Link to="/profile" className="font-medium text-ink underline-offset-4 hover:underline">
                  Review your profile
                </Link>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={dismissIntro}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-slate hover:bg-parchment hover:text-ink"
            aria-label="Dismiss getting started"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {loading ? <LoadingState label="Loading dashboard..." /> : null}
      {error ? (
        <ErrorState message={error} onRetry={() => setReloadNonce((n) => n + 1)} />
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="eyebrow">Upcoming Events</p>
              <Link to="/events" className="flex items-center gap-1 text-[12px] text-slate hover:text-ink">
                All events <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <EmptyState
                title="We’ll invite you to the next gathering."
                description="Nothing is on the calendar in the next three weeks. Add your city in Profile so invitations can meet you there."
              />
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="rounded-[4px] border border-border bg-surface p-5">
                    <p className="text-[16px] font-medium leading-snug text-ink">{event.title}</p>
                    <p className="mt-2 text-[13px] text-slate">
                      {formatDate(event.date, 'month-day')} · {event.city}
                    </p>
                    <p className="mt-1 text-[12px] text-slate">
                      {eventTypeLabels[event.type]}
                      {event.audience ? ` · ${event.audience}` : ''}
                    </p>
                    {event.registrationUrl ? (
                      <a
                        href={event.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative z-20 mt-3 inline-block text-[13px] font-medium text-ink underline-offset-4 hover:underline"
                      >
                        RSVP →
                      </a>
                    ) : (
                      <Link
                        to={`/events#event-${event.id}`}
                        className="relative z-20 mt-3 inline-block text-[13px] font-medium text-ink underline-offset-4 hover:underline"
                      >
                        View event →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-8">
            {pierPlus ? (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <p className="eyebrow">Deal Flow</p>
                  <Link
                    to="/deals"
                    className="flex items-center gap-1 text-[12px] text-slate transition-colors hover:text-ink"
                  >
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {openDeals.length === 0 ? (
                  <EmptyState
                    title="No open opportunities right now."
                    description="When Pier publishes a fund, co-invest, or SPV, it will appear here."
                  />
                ) : (
                  <div className="overflow-hidden rounded-[4px] border border-border bg-surface">
                    {openDeals.slice(0, 4).map((deal) => (
                      <Link
                        key={deal.id}
                        to={`/deals/${deal.id}`}
                        className="block border-b border-border px-4 py-3.5 last:border-0 hover:bg-parchment/60"
                      >
                        <p className="font-medium text-ink">{deal.name}</p>
                        <p className="mt-0.5 text-[12px] text-slate">
                          {deal.manager} · {typeLabels[deal.type]}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[12px] text-slate">
                          <span>{formatCurrency(deal.targetSize, 'USD', true)}</span>
                          <DealReturnCell deal={deal} />
                        </div>
                        <Badge variant={deal.status}>{deal.status}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <AnonymizedDealPreview variant="aside" />
            )}

            {pierPlus ? <DashboardConciergeTeaser /> : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
