import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { DealReturnCell } from '../../components/capital-markets/DealReturnCell';
import { AnonymizedDealPreview } from '../../components/capital-markets/AnonymizedDealPreview';
import { GetOrientedCard, type OrientedStep } from '../../components/capital-markets/GetOrientedCard';
import { PageFrame } from '../../components/layout/PageFrame';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  getCapitalDeals,
  getCapitalEvents,
  getMyCapitalEventRsvps,
  type CapitalDeal,
  type CapitalEvent,
  type CapitalEventRsvp,
} from '../../lib/api/capitalMarkets';
import { dashboardIntroKey, eventMatchesCapitalRole } from '../../lib/capitalOnboarding';
import { isPierPlus } from '../../lib/membership';
import { CAPITAL_SUPABASE_TIMEOUT_MS, withTimeout } from '../../lib/async';
import { useCapitalLoad } from '../../lib/useCapitalLoad';
import { formatCurrency, formatEventDate, hasPublicDealAmount } from '../../lib/utils';
import { typeLabels } from './mockData';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;
const ACTIVE_RSVP = new Set(['confirmed', 'requested', 'waitlisted', 'attended']);
const PROFILE_PERSONAL_HREF = '/profile?edit=personal#personal';

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

function eventMonthDay(event: CapitalEvent) {
  const [month, day] = formatEventDate(event.date, 'month-day', event.city).split(' ');
  return { month, day };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const pierPlus = isPierPlus(user);
  const capitalRole = user?.preferences?.capital_role;
  const [introDismissed, setIntroDismissed] = useState(() => readIntroDismissed(user?.id));
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

  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const subtitle = roleCopy(capitalRole);

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
  const showIntro = Boolean(user?.id) && !introDismissed;
  const roleDone = capitalRole === 'gp' || capitalRole === 'lp';
  const firm = user?.preferences?.firm?.trim() || '';
  const city = user?.preferences?.primary_city?.trim() || '';
  const placeDone = Boolean(firm && city);
  const futureEvents = events.filter((event) => event.upcoming);
  const joinedUpcoming = rsvps.some(
    (rsvp) =>
      ACTIVE_RSVP.has(rsvp.status) && futureEvents.some((event) => event.databaseId === rsvp.eventId)
  );
  const joinedEvent = futureEvents.find((event) =>
    rsvps.some((rsvp) => rsvp.eventId === event.databaseId && ACTIVE_RSVP.has(rsvp.status))
  );

  let gathering: OrientedStep;
  if (loading) {
    gathering = {
      id: 'gathering',
      title: 'Join a gathering',
      detail: 'Checking the calendar.',
      href: '/events',
      state: 'pending',
    };
  } else if (error) {
    gathering = {
      id: 'gathering',
      title: 'Join a gathering',
      detail: 'The calendar didn’t load. Open events to try again.',
      href: '/events',
      state: 'open',
    };
  } else if (joinedUpcoming && joinedEvent) {
    gathering = {
      id: 'gathering',
      title: 'Join a gathering',
      detail: `You're down for ${joinedEvent.title}.`,
      href: `/events#event-${joinedEvent.id}`,
      state: 'done',
    };
  } else if (futureEvents.length === 0) {
    gathering = {
      id: 'gathering',
      title: 'Join a gathering',
      detail: 'Nothing in the next few weeks. We’ll invite you.',
      href: '/events',
      state: 'done',
    };
  } else {
    const target = nextEvent ?? futureEvents[0];
    gathering = {
      id: 'gathering',
      title: 'Join a gathering',
      detail: target ? `${target.title}${target.city ? ` · ${target.city}` : ''}` : 'See what’s coming up.',
      href: target?.registrationUrl || (target ? `/events#event-${target.id}` : '/events'),
      state: 'open',
    };
  }

  const orientedSteps: OrientedStep[] = [
    {
      id: 'role',
      title: 'Confirm your role',
      detail: roleDone
        ? capitalRole === 'gp'
          ? 'You’re set as a general partner.'
          : 'You’re set as an allocator.'
        : 'Tell Pier whether you allocate or manage capital.',
        href: PROFILE_PERSONAL_HREF,
        state: roleDone ? 'done' : 'open',
      },
      {
        id: 'place',
        title: 'Add firm and city',
        detail: placeDone ? `${firm} · ${city}` : 'Where you work, and the city you want to be invited in.',
        href: PROFILE_PERSONAL_HREF,
      state: placeDone ? 'done' : 'open',
    },
    gathering,
  ];

  function dismissIntro() {
    if (!user?.id) return;
    window.localStorage.setItem(dashboardIntroKey(user.id), '1');
    setIntroDismissed(true);
  }

  return (
    <PageFrame>
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
              <div className="grid gap-3">
                {upcomingEvents.map((event) => {
                  const { month, day } = eventMonthDay(event);
                  return (
                    <div
                      key={event.id}
                      className="flex flex-col gap-4 rounded-pier border border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="font-mono-data text-[13px] font-medium text-ink">{month}</p>
                          <p className="font-mono-data text-[20px] font-medium leading-none text-ink">{day}</p>
                        </div>
                        <div className="w-px self-stretch bg-border" />
                        <div>
                          <p className="font-medium text-ink">{event.title}</p>
                          <p className="mt-0.5 text-[13px] text-slate">
                            {event.city}
                            {event.audience ? ` · ${event.audience}` : ''}
                          </p>
                        </div>
                      </div>
                      {event.registrationUrl ? (
                        <a
                          href={event.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] font-medium text-ink underline-offset-4 hover:underline"
                        >
                          {event.registrationLabel || 'Register'} →
                        </a>
                      ) : (
                        <Link
                          to={`/events#event-${event.id}`}
                          className="text-[13px] font-medium text-ink underline-offset-4 hover:underline"
                        >
                          View event →
                        </Link>
                      )}
                    </div>
                  );
                })}
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
                  <div className="overflow-hidden rounded-pier border border-border bg-surface">
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
                          {hasPublicDealAmount(deal.targetSize) ? (
                            <span>{formatCurrency(deal.targetSize, deal.currencyCode, true)}</span>
                          ) : (
                            <span />
                          )}
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
          </aside>
        </div>
      ) : null}
    </PageFrame>
  );
}
