import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, DollarSign, TrendingUp, Users } from 'lucide-react';
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
import { formatCurrency, formatDate, formatPercent } from '../../lib/utils';
import { typeLabels } from './mockData';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

export default function DashboardPage() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<CapitalDeal[]>([]);
  const [events, setEvents] = useState<CapitalEvent[]>([]);
  const [members, setMembers] = useState<CapitalMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      try {
        const [dealData, eventData, memberData] = await Promise.all([
          getCapitalDeals(),
          getCapitalEvents(),
          getCapitalMembers(),
        ]);

        if (!ignore) {
          setDeals(dealData);
          setEvents(eventData);
          setMembers(memberData);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Unable to load capital markets dashboard.');
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
  }, []);

  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const upcomingEvents = events.filter((event) => event.upcoming).slice(0, 2);
  const openDeals = deals.filter((deal) => deal.status === 'open' || deal.status === 'closing');
  const openCoinvests = deals.filter((deal) => deal.type === 'co-invest' || deal.type === 'spv');
  const aggregateTarget = deals.reduce((sum, deal) => sum + deal.targetSize, 0);
  const nextEvent = upcomingEvents[0];

  const kpis = [
    {
      label: 'Aggregate Target',
      value: formatCurrency(aggregateTarget, 'USD', true),
      delta: `${deals.length} listings`,
      note: 'Published opportunities',
      icon: DollarSign,
    },
    {
      label: 'Active Funds',
      value: openDeals.length.toString(),
      delta: `${formatPercent(deals.length ? (openDeals.length / deals.length) * 100 : 0, 0)} of listings`,
      note: 'Still raising',
      icon: TrendingUp,
    },
    {
      label: 'Open Co-Invests',
      value: openCoinvests.length.toString(),
      delta: `${openCoinvests.filter((deal) => deal.status === 'closing').length} closing`,
      note: 'Co-invest and SPV listings',
      icon: DollarSign,
    },
    {
      label: 'Events',
      value: upcomingEvents.length.toString(),
      delta: nextEvent ? `Next: ${formatDate(nextEvent.date, 'month-day')}` : 'No upcoming events',
      note: nextEvent ? nextEvent.city : 'Calendar pending',
      icon: Calendar,
    },
  ];

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <div className="mb-10">
        <p className="eyebrow mb-2">01 / Dashboard</p>
        <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-3 text-[15px] text-slate">
          Members-only access to emerging managers, allocators, and capital in context.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {loading ? <LoadingState label="Loading dashboard from Supabase..." /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error ? (
        <>
          <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-[4px] border border-border bg-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="eyebrow">{kpi.label}</p>
                <Icon className="h-4 w-4 stroke-[1.25] text-slate" />
              </div>
              <p className="font-mono-data text-[28px] font-medium leading-none text-ink">
                {kpi.value}
              </p>
              <p className="mt-2 text-[12px] font-medium text-ledger">{kpi.delta}</p>
              <p className="mt-1 text-[12px] text-slate">{kpi.note}</p>
            </div>
          );
        })}
          </div>

          <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <p className="eyebrow">Recent Deal Flow</p>
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
                  description="Published open, closing, and closed deals from Supabase will appear here."
                />
              ) : (
                <div className="overflow-hidden rounded-[4px] border border-border bg-surface">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-[13px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="eyebrow px-5 py-3 text-left">Fund</th>
                          <th className="eyebrow px-4 py-3 text-left">Type</th>
                          <th className="eyebrow px-4 py-3 text-left">Asset Class</th>
                          <th className="eyebrow px-4 py-3 text-right">Target Size</th>
                          <th className="eyebrow px-4 py-3 text-right">Target IRR</th>
                          <th className="eyebrow px-4 py-3 text-right">Close</th>
                          <th className="eyebrow px-4 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deals.slice(0, 4).map((deal) => (
                          <tr key={deal.id} className="border-b border-border last:border-0 hover:bg-ink/[0.02]">
                            <td className="px-5 py-3.5">
                              <Link to={`/deals/${deal.id}`} className="font-medium text-ink hover:text-gilt">
                                {deal.name}
                              </Link>
                              <p className="mt-0.5 text-[12px] text-slate">{deal.manager}</p>
                            </td>
                            <td className="px-4 py-3.5 text-slate">{typeLabels[deal.type]}</td>
                            <td className="px-4 py-3.5 text-slate">{deal.assetClass}</td>
                            <td className="font-mono-data px-4 py-3.5 text-right">
                              {formatCurrency(deal.targetSize, 'USD', true)}
                            </td>
                            <td className="font-mono-data px-4 py-3.5 text-right text-ledger">
                              {formatPercent(deal.targetIrr, 0)}
                            </td>
                            <td className="font-mono-data px-4 py-3.5 text-right text-slate">
                              {formatDate(deal.closeDate, 'month-day')}
                            </td>
                            <td className="px-4 py-3.5">
                              <Badge variant={deal.status}>{deal.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

        <aside className="space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow">Events</p>
              <Link to="/events" className="flex items-center gap-1 text-[12px] text-slate hover:text-ink">
                All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <EmptyState title="No upcoming events." description="Upcoming published events will appear here." />
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="rounded-[4px] border border-border bg-surface p-4">
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <p className="text-[13px] font-medium leading-snug text-ink">{event.title}</p>
                      {event.registered ? <Badge variant="members">Registered</Badge> : null}
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-slate">
                      <span>{formatDate(event.date, 'month-day')}</span>
                      <span>{event.city}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

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
              <div className="mt-4 space-y-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-parchment/60">GPs</span>
                  <span className="font-mono-data text-parchment">
                    {members.filter((member) => member.role === 'gp').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-parchment/60">LPs</span>
                  <span className="font-mono-data text-parchment">
                    {members.filter((member) => member.role === 'lp').length}
                  </span>
                </div>
              </div>
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
