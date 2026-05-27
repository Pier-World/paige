import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, DollarSign, TrendingUp, Users } from 'lucide-react';
import { DashboardConciergeTeaser } from '../../components/capital-markets/DashboardConciergeTeaser';
import { DealReturnCell } from '../../components/capital-markets/DealReturnCell';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  getCapitalDeals,
  getCapitalEvents,
  getCapitalMembers,
  type CapitalDeal,
  type CapitalEvent,
  type CapitalMember,
} from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, describeCapitalLoadFailure, withTimeout } from '../../lib/async';
import { formatCurrency, formatDate } from '../../lib/utils';
import { eventTypeLabels, typeLabels } from './mockData';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;

export default function DashboardPage() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<CapitalDeal[]>([]);
  const [events, setEvents] = useState<CapitalEvent[]>([]);
  const [members, setMembers] = useState<CapitalMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      try {
        const [dealData, eventData, memberData] = await withTimeout(
          Promise.all([getCapitalDeals(), getCapitalEvents(), getCapitalMembers()]),
          CAPITAL_SUPABASE_TIMEOUT_MS,
          'dashboard summary'
        );

        if (!ignore) {
          setDeals(dealData);
          setEvents(eventData);
          setMembers(memberData);
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
  }, [reloadNonce]);

  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const openDeals = deals.filter((deal) => deal.status === 'open' || deal.status === 'closing');
  const now = Date.now();
  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => event.upcoming)
        .filter((event) => {
          const t = new Date(event.date).getTime();
          return t >= now && t - now <= THREE_WEEKS_MS;
        })
        .slice(0, 5),
    [events, now]
  );
  const nextEvent = events.find((event) => event.upcoming);

  const kpis = [
    {
      label: 'Members',
      value: '4,800+',
      delta: `${members.length} verified in directory`,
      note: 'GPs, LPs, and allocators',
      icon: Users,
      href: '/members',
      cta: 'Member network',
    },
    {
      label: 'Active opportunities',
      value: openDeals.length.toString(),
      delta: `${deals.length} total listings`,
      note: 'Funds, SPVs, and co-invests',
      icon: TrendingUp,
      href: '/deals',
      cta: 'View opportunities',
    },
    {
      label: 'Upcoming events',
      value: events.filter((e) => e.upcoming).length.toString(),
      delta: nextEvent ? `Next: ${formatDate(nextEvent.date, 'month-day')}` : 'Calendar pending',
      note: nextEvent ? nextEvent.city : 'Member gatherings',
      icon: Calendar,
      href: '/events',
      cta: 'View events',
    },
    {
      label: 'Network AUM',
      value: '$1T+',
      delta: 'Across Pier',
      note: 'Allocator and manager relationships',
      icon: DollarSign,
      href: '/members',
      cta: 'Browse network',
    },
  ];

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <div className="mb-10">
        <p className="eyebrow mb-2">01 / Dashboard</p>
        <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">
          Private access to capital, managers, and relationships in motion.
        </p>
        <p className="mt-2 max-w-2xl text-[14px] text-slate/80">
          Explore current allocation opportunities, upcoming member gatherings, and curated activity
          across the Pier network.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {loading ? <LoadingState label="Loading dashboard..." /> : null}
      {error ? (
        <ErrorState message={error} onRetry={() => setReloadNonce((n) => n + 1)} />
      ) : null}

      {!loading && !error ? (
        <>
          <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="flex flex-col rounded-[4px] border border-border bg-surface p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="eyebrow">{kpi.label}</p>
                    <Icon className="h-4 w-4 stroke-[1.25] text-slate" />
                  </div>
                  <p className="font-mono-data text-[28px] font-medium leading-none text-ink">{kpi.value}</p>
                  <p className="mt-2 text-[12px] font-medium text-ledger">{kpi.delta}</p>
                  <p className="mt-1 text-[12px] text-slate">{kpi.note}</p>
                  <Link
                    to={kpi.href}
                    className="mt-4 text-[12px] font-medium text-ink underline-offset-4 hover:underline"
                  >
                    {kpi.cta} →
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <p className="eyebrow">New Deal Flow</p>
                <Link
                  to="/deals"
                  className="flex items-center gap-1 text-[12px] text-slate transition-colors hover:text-ink"
                >
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {deals.length === 0 ? (
                <EmptyState
                  title="No published opportunities yet."
                  description="The deal table can be empty until listings are published for members."
                />
              ) : (
                <div className="overflow-hidden rounded-[4px] border border-border bg-surface">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-[13px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="eyebrow px-5 py-3 text-left">Opportunity</th>
                          <th className="eyebrow px-4 py-3 text-left">Type</th>
                          <th className="eyebrow px-4 py-3 text-left">Strategy</th>
                          <th className="eyebrow px-4 py-3 text-right">Target size</th>
                          <th className="eyebrow px-4 py-3 text-right">Return</th>
                          <th className="eyebrow px-4 py-3 text-right">Close</th>
                          <th className="eyebrow px-4 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deals.slice(0, 8).map((deal) => (
                          <tr key={deal.id} className="group relative border-b border-border last:border-0">
                            <td className="relative px-5 py-3.5">
                              <Link
                                to={`/deals/${deal.id}`}
                                className="absolute inset-0 z-10"
                                aria-label={`Review ${deal.name}`}
                              />
                              <p className="relative font-medium text-ink group-hover:text-gilt">{deal.name}</p>
                              <p className="relative mt-0.5 text-[12px] text-slate">{deal.manager}</p>
                            </td>
                            <td className="relative px-4 py-3.5 text-slate">{typeLabels[deal.type]}</td>
                            <td className="relative px-4 py-3.5 text-slate">{deal.assetClass}</td>
                            <td className="relative px-4 py-3.5 text-right font-mono-data">
                              {formatCurrency(deal.targetSize, 'USD', true)}
                            </td>
                            <td className="relative px-4 py-3.5 text-right">
                              <DealReturnCell deal={deal} />
                            </td>
                            <td className="relative px-4 py-3.5 text-right font-mono-data text-slate">
                              {formatDate(deal.closeDate, 'month-day')}
                            </td>
                            <td className="relative px-4 py-3.5">
                              <Badge variant={deal.status}>{deal.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="border-t border-border px-5 py-4 text-[13px] text-slate">
                    Looking for something specific?{' '}
                    <Link to="/concierge" className="font-medium text-ink underline-offset-4 hover:underline">
                      Contact us
                    </Link>
                  </p>
                </div>
              )}
            </section>

            <aside className="space-y-8">
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <p className="eyebrow">Upcoming Events</p>
                  <Link to="/events" className="flex items-center gap-1 text-[12px] text-slate hover:text-ink">
                    All events → <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {upcomingEvents.length === 0 ? (
                  <EmptyState
                    title="No events in the next 3 weeks."
                    description="When upcoming events are published, they will show here."
                  />
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="rounded-[4px] border border-border bg-surface p-5">
                        <p className="text-[14px] font-medium leading-snug text-ink">{event.title}</p>
                        <p className="mt-2 text-[12px] text-slate">
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
                            className="relative z-20 mt-3 inline-block text-[12px] font-medium text-ink underline-offset-4 hover:underline"
                          >
                            View event →
                          </a>
                        ) : (
                          <Link
                            to={`/events#event-${event.id}`}
                            className="relative z-20 mt-3 inline-block text-[12px] font-medium text-ink underline-offset-4 hover:underline"
                          >
                            View event →
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <DashboardConciergeTeaser />

              <section>
                <p className="eyebrow mb-3">Network</p>
                <div className="rounded-[4px] border border-border bg-midnight p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 stroke-[1.25] text-gilt" />
                    <p className="eyebrow text-parchment/60">Member network</p>
                  </div>
                  <p className="font-mono-data text-[32px] font-medium leading-none text-parchment">
                    {members.length}
                  </p>
                  <p className="mt-1.5 text-[12px] text-parchment/60">Verified GPs & LPs</p>
                  <Link
                    to="/members"
                    className="mt-5 flex h-8 w-full items-center justify-center rounded-[6px] border border-parchment/20 text-[13px] text-parchment transition-colors hover:border-parchment/40 hover:bg-parchment/[0.08]"
                  >
                    Browse network
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
}
