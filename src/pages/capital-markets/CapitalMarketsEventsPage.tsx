import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { EventCard } from '../../components/capital-markets/EventCard';
import { PageFrame } from '../../components/layout/PageFrame';
import { Badge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';
import { useAuth } from '../../context/AuthContext';
import {
  getCapitalEvents,
  getMyCapitalEventRsvps,
  isRecentCapitalEvent,
  isUpcomingCapitalEvent,
  type CapitalEvent,
  type CapitalEventRsvp,
} from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, withTimeout } from '../../lib/async';
import { useCapitalLoad } from '../../lib/useCapitalLoad';
import { formatEventDate } from '../../lib/utils';
import { eventTypeLabels } from './mockData';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

type EventFilter = 'all' | 'pier' | 'partner' | 'past';

const filterOptions: Array<{ id: EventFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'pier', label: 'Pier' },
  { id: 'partner', label: 'Partners' },
  { id: 'past', label: 'Past' },
];

function getEventTime(event: CapitalEvent): number {
  return new Date(event.date).getTime();
}

function getEventMonthDay(event: CapitalEvent): { month: string; day: string } {
  const [month, day] = formatEventDate(event.date, 'month-day', event.city).split(' ');
  return { month, day };
}

export default function CapitalMarketsEventsPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');
  const loaded = useCapitalLoad(
    `events:${user?.id ?? 'anon'}`,
    async () => {
      const rsvps = user?.id
        ? getMyCapitalEventRsvps(user.id).catch(() => [] as CapitalEventRsvp[])
        : Promise.resolve([] as CapitalEventRsvp[]);
      const [eventData, rsvpData] = await withTimeout(
        Promise.all([getCapitalEvents(), rsvps]),
        CAPITAL_SUPABASE_TIMEOUT_MS,
        'events'
      );
      const registeredEventIds = new Set(
        rsvpData
          .filter((rsvp) => rsvp.status === 'confirmed' || rsvp.status === 'attended')
          .map((rsvp) => rsvp.eventId)
      );
      return {
        events: eventData.map((event) => ({
          ...event,
          registered: registeredEventIds.has(event.databaseId),
        })),
        rsvps: rsvpData,
      };
    },
    'Unable to load capital events.'
  );
  const events = useMemo(() => loaded.data?.events ?? [], [loaded.data]);
  const rsvps = useMemo(() => loaded.data?.rsvps ?? [], [loaded.data]);
  const loading = loaded.loading;
  const error = loaded.error;

  useEffect(() => {
    if (loading || error) return;
    const id = window.location.hash.replace(/^#/, '');
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, error, events]);

  const rsvpByEventId = new Map(rsvps.map((rsvp) => [rsvp.eventId, rsvp]));

  const upcoming = useMemo(() => {
    return events
      .filter((event) => isUpcomingCapitalEvent(event))
      .slice()
      .sort((a, b) => getEventTime(a) - getEventTime(b));
  }, [events]);

  const pierUpcoming = upcoming.filter((e) => e.hostType === 'pier');
  const partnerUpcoming = upcoming.filter((e) => e.hostType === 'partner');
  const past = useMemo(() => {
    return events
      .filter((event) => isRecentCapitalEvent(event))
      .slice()
      .sort((a, b) => getEventTime(b) - getEventTime(a));
  }, [events]);

  function renderEventList(list: CapitalEvent[], emptyTitle: string) {
    if (list.length === 0) {
      return (
        <EmptyState
          title={emptyTitle}
          description="Try another filter or check back when new gatherings are published."
        />
      );
    }

    return (
      <div className="grid gap-4">
        {list.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            rsvp={rsvpByEventId.get(event.databaseId)}
          />
        ))}
      </div>
    );
  }

  function renderPastList() {
    if (past.length === 0) {
      return <EmptyState title="No past events." description="Completed events will appear here." />;
    }

    return (
      <div className="grid gap-3">
        {past.map((event) => {
          const { month, day } = getEventMonthDay(event);

          return (
            <div
              key={event.id}
              className="flex flex-col gap-4 rounded-pier border border-border bg-surface px-5 py-4 opacity-70 sm:flex-row sm:items-center sm:justify-between"
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
              <div className="flex flex-wrap items-center gap-3">
                {event.registered ? <Badge variant="muted">Attended</Badge> : null}
                <Badge variant="closed">{eventTypeLabels[event.type]}</Badge>
                {event.recapUrl?.trim() ? (
                  <a
                    href={event.recapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink underline-offset-4 hover:underline"
                  >
                    Recap
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const showPier = activeFilter === 'all' || activeFilter === 'pier';
  const showPartner = activeFilter === 'all' || activeFilter === 'partner';
  const showPast = activeFilter === 'all' || activeFilter === 'past';
  const forceEmptyPier = activeFilter === 'pier' && pierUpcoming.length === 0;
  const forceEmptyPartner = activeFilter === 'partner' && partnerUpcoming.length === 0;
  const forceEmptyPast = activeFilter === 'past' && past.length === 0;

  return (
    <PageFrame>
      <div className="mb-10">
        <p className="eyebrow mb-2">Events</p>
        <h1 className="font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">
          Invite-only gatherings.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">
          Dinners, summits, and curated experiences where capital relationships are built.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {loading ? <LoadingState label="Loading events" variant="list" /> : null}
      {error ? <ErrorState message={error} onRetry={loaded.reload} /> : null}

      {!loading && !error ? (
        <>
          <div className="mb-8 flex flex-wrap gap-2">
            {filterOptions.map((opt) => (
              <Chip
                key={opt.id}
                active={activeFilter === opt.id}
                onClick={() => setActiveFilter(opt.id)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>

          {showPier && (pierUpcoming.length > 0 || forceEmptyPier) ? (
            <section className="mb-12">
              <p className="eyebrow mb-5">Pier-hosted events</p>
              {renderEventList(pierUpcoming, 'No upcoming Pier events.')}
            </section>
          ) : null}

          {showPartner && (partnerUpcoming.length > 0 || forceEmptyPartner) ? (
            <section className="mb-12">
              <p className="eyebrow mb-5">Partner & network events</p>
              {renderEventList(partnerUpcoming, 'No upcoming partner events.')}
            </section>
          ) : null}

          {showPast && (past.length > 0 || forceEmptyPast) ? (
            <section>
              <p className="eyebrow mb-5">Past events</p>
              {renderPastList()}
            </section>
          ) : null}

          {activeFilter === 'all' && pierUpcoming.length === 0 && partnerUpcoming.length === 0 && past.length === 0 ? (
            <EmptyState
              title="No events yet."
              description="New gatherings will appear here when they are published."
            />
          ) : null}
        </>
      ) : null}
    </PageFrame>
  );
}
