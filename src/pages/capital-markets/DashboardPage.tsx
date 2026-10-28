import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { DashboardEventCard } from '../../components/capital-markets/EventCard';
import { GetOrientedCard } from '../../components/capital-markets/GetOrientedCard';
import { MembershipReveal } from '../../components/capital-markets/MembershipReveal';
import { OpportunityRow } from '../../components/capital-markets/OpportunityRow';
import { UpgradePrompt } from '../../components/capital-markets/UpgradePrompt';
import { PageFrame } from '../../components/layout/PageFrame';
import { useAuth } from '../../context/AuthContext';
import {
  getCapitalDeals,
  getCapitalEvents,
  getMyCapitalEventRsvps,
  type CapitalDeal,
  type CapitalEvent,
  type CapitalEventRsvp,
} from '../../lib/api/capitalMarkets';
import {
  consumeMembershipReveal,
  dashboardIntroKey,
  eventMatchesCapitalRole,
} from '../../lib/capitalOnboarding';
import { buildDashboardOrientedSteps } from '../../lib/orientationSteps';
import { isPierPlus } from '../../lib/membership';
import { CAPITAL_SUPABASE_TIMEOUT_MS, withTimeout } from '../../lib/async';
import { useCapitalLoad } from '../../lib/useCapitalLoad';
import { sortCapitalDealsForDealFlow } from '../../lib/capitalDeals';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;
const ACTIVE_RSVP = new Set(['confirmed', 'requested', 'waitlisted', 'attended']);

function readIntroDismissed(userId?: string) {
  if (!userId) return false;
  try {
    return window.localStorage.getItem(dashboardIntroKey(userId)) === '1';
  } catch {
    return false;
  }
}

async function loadDashboard(pierPlus: boolean, memberId?: string) {
  const rsvps = memberId
    ? getMyCapitalEventRsvps(memberId).catch(() => [] as CapitalEventRsvp[])
    : Promise.resolve([] as CapitalEventRsvp[]);

  if (!pierPlus) {
    const [events, memberRsvps] = await withTimeout(
      Promise.all([getCapitalEvents(), rsvps]),
      CAPITAL_SUPABASE_TIMEOUT_MS,
      'dashboard events'
    );
    return { deals: [] as CapitalDeal[], events, rsvps: memberRsvps };
  }

  const [deals, events, memberRsvps] = await withTimeout(
    Promise.all([getCapitalDeals(), getCapitalEvents(), rsvps]),
    CAPITAL_SUPABASE_TIMEOUT_MS,
    'dashboard summary'
  );
  return { deals, events, rsvps: memberRsvps };
}

function roleCopy(role?: string) {
  if (role === 'gp') {
    return 'Private gatherings and allocator context. Introductions stay Pier-mediated.';
  }
  if (role === 'lp') {
    return 'Private gatherings, curated managers, and capital in context. You stay unlisted by default.';
  }
  return 'A private community of managers and allocators.';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fromOnboarding =
    (location.state as { fromOnboarding?: boolean } | null)?.fromOnboarding === true;
  const pierPlus = isPierPlus(user);
  const capitalRole = user?.preferences?.capital_role;
  const [introDismissed, setIntroDismissed] = useState(() => readIntroDismissed(user?.id));
  const [showReveal, setShowReveal] = useState(() =>
    consumeMembershipReveal(user?.id, fromOnboarding)
  );
  const loaded = useCapitalLoad(
    `dashboard:${user?.id ?? 'anon'}:${pierPlus ? 'plus' : 'community'}`,
    () => loadDashboard(pierPlus, user?.id),
    'Unable to load the dashboard.'
  );
  const deals = useMemo(() => loaded.data?.deals ?? [], [loaded.data]);
  const events = useMemo(() => loaded.data?.events ?? [], [loaded.data]);
  const rsvps = useMemo(() => loaded.data?.rsvps ?? [], [loaded.data]);
  const loading = loaded.loading;
  const error = loaded.error;

  useEffect(() => {
    setIntroDismissed(readIntroDismissed(user?.id));
  }, [user?.id]);

  useEffect(() => {
    if (!fromOnboarding) return;
    navigate('.', { replace: true, state: {} });
  }, [fromOnboarding, navigate]);

  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const subtitle = roleCopy(capitalRole);

  const openDeals = sortCapitalDealsForDealFlow(
    deals.filter((deal) => deal.status === 'open' || deal.status === 'closing')
  );
  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((event) => event.upcoming)
      .filter((event) => eventMatchesCapitalRole(event.audience, capitalRole))
      .filter((event) => {
        const t = new Date(event.date).getTime();
        return t >= now && t - now <= THREE_WEEKS_MS;
      })
      .slice(0, 4);
  }, [events, capitalRole]);
  const showIntro = Boolean(user?.id) && !introDismissed;
  const firm = user?.preferences?.firm?.trim() || '';
  const city = user?.preferences?.primary_city?.trim() || '';
  const futureEvents = events.filter((event) => event.upcoming);
  const joinedUpcoming = rsvps.some(
    (rsvp) =>
      ACTIVE_RSVP.has(rsvp.status) && futureEvents.some((event) => event.databaseId === rsvp.eventId)
  );
  const joinedEvent = futureEvents.find((event) =>
    rsvps.some((rsvp) => rsvp.eventId === event.databaseId && ACTIVE_RSVP.has(rsvp.status))
  );
  const orientedSteps = buildDashboardOrientedSteps({
    loading,
    calendarError: Boolean(error),
    capitalRole,
    firm,
    city,
    joinedEvent: joinedUpcoming && joinedEvent ? { id: joinedEvent.id, title: joinedEvent.title } : null,
    hasUpcoming: futureEvents.length > 0,
    preferences: user?.preferences,
  });

  function dismissIntro() {
    if (!user?.id) return;
    window.localStorage.setItem(dashboardIntroKey(user.id), '1');
    setIntroDismissed(true);
  }

  return (
    <PageFrame>
      {showReveal ? <MembershipReveal onComplete={() => setShowReveal(false)} /> : null}
      <div className="mb-10">
        <p className="eyebrow mb-2">Dashboard</p>
        <h1 className="font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">{subtitle}</p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {showIntro ? <GetOrientedCard steps={orientedSteps} onDismiss={dismissIntro} /> : null}

      {loading ? <LoadingState label="Loading dashboard" variant="dashboard" /> : null}
      {error ? (
        <ErrorState message={error} onRetry={loaded.reload} />
      ) : null}

      {!loading && !error ? (
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="eyebrow">Deal Flow</p>
              {pierPlus ? (
                <Link
                  to="/deals"
                  className="flex items-center gap-1 text-[12px] text-slate transition-colors hover:text-ink"
                >
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
            {pierPlus ? (
              openDeals.length === 0 ? (
                <EmptyState
                  title="No open opportunities right now."
                  description="When Pier publishes a fund, co-invest, or SPV, it will appear here."
                />
              ) : (
                <div className="grid gap-4">
                  {openDeals.slice(0, 3).map((deal) => (
                    <OpportunityRow key={deal.id} deal={deal} compact />
                  ))}
                </div>
              )
            ) : (
              <UpgradePrompt
                variant="inline"
                title="Opportunities are included with Pier+"
                description="Names, terms, contacts, and documents stay with Pier+. Events and Partners remain available on Standard."
              />
            )}
          </section>

          <aside className="lg:sticky lg:top-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="eyebrow">Upcoming events</p>
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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {upcomingEvents.map((event) => (
                  <DashboardEventCard
                    key={event.id}
                    event={event}
                    rsvp={rsvps.find((item) => item.eventId === event.databaseId)}
                  />
                ))}
              </div>
            )}
          </aside>
        </div>
      ) : null}
    </PageFrame>
  );
}
