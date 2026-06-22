import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { EventCard } from '../../components/capital-markets/EventCard';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  getCapitalEvents,
  getMyCapitalEventRsvps,
  type CapitalEvent,
  type CapitalEventRsvp,
} from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, describeCapitalLoadFailure, withTimeout } from '../../lib/async';
import { cn, formatEventDate } from '../../lib/utils';
import { eventTypeLabels } from './mockData';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

type EventFilter =
  | 'all'
  | 'pier'
  | 'partner'
  | 'dinner'
  | 'summit'
  | 'experience'
  | 'gp'
  | 'lp'
  | 'founders';

const filterOptions: Array<{ id: EventFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'pier', label: 'Pier hosted' },
  { id: 'partner', label: 'Partner events' },
  { id: 'dinner', label: 'Dinners' },
  { id: 'summit', label: 'Summits' },
  { id: 'experience', label: 'Experiences' },
  { id: 'gp', label: 'GPs' },
  { id: 'lp', label: 'LPs' },
  { id: 'founders', label: 'Founders' },
];

function matchesAudienceFilter(event: CapitalEvent, filter: EventFilter): boolean {
  const aud = event.audience.toLowerCase();
  if (filter === 'gp') return aud.includes('gp');
  if (filter === 'lp') return aud.includes('lp');
  if (filter === 'founders') return aud.includes('founder');
  return true;
}

function matchesFilter(event: CapitalEvent, filter: EventFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'pier') return event.hostType === 'pier';
  if (filter === 'partner') return event.hostType === 'partner';
  if (filter === 'dinner' || filter === 'summit' || filter === 'experience') {
    return event.type === filter;
  }
  return matchesAudienceFilter(event, filter);
}

function getLocalStartOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function getEventTime(event: CapitalEvent): number {
  return new Date(event.date).getTime();
}

function isPastEvent(event: CapitalEvent, localStartOfToday: number): boolean {
  return getEventTime(event) < localStartOfToday;
}

function getEventMonthDay(event: CapitalEvent): { month: string; day: string } {
  const [month, day] = formatEventDate(event.date, 'month-day', event.city).split(' ');
  return { month, day };
}

export default function CapitalMarketsEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CapitalEvent[]>([]);
  const [rsvps, setRsvps] = useState<CapitalEventRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadEvents() {
      setLoading(true);
      setError(null);

      try {
        const [eventData, rsvpData] = await withTimeout(
          user?.id
            ? Promise.all([getCapitalEvents(), getMyCapitalEventRsvps(user.id)])
            : Promise.all([getCapitalEvents(), Promise.resolve([] as CapitalEventRsvp[])]),
          CAPITAL_SUPABASE_TIMEOUT_MS,
          'events and RSVPs'
        );
        const registeredEventIds = new Set(
          rsvpData
            .filter((rsvp) => rsvp.status === 'confirmed' || rsvp.status === 'attended')
            .map((rsvp) => rsvp.eventId)
        );

        if (!ignore) {
          setEvents(
            eventData.map((event) => ({
              ...event,
              registered: registeredEventIds.has(event.databaseId),
            }))
          );
          setRsvps(rsvpData);
        }
      } catch (err) {
        if (!ignore) setError(describeCapitalLoadFailure(err, 'Unable to load capital events.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadEvents();

    return () => {
      ignore = true;
    };
  }, [user?.id, reloadNonce]);

  const rsvpByEventId = new Map(rsvps.map((rsvp) => [rsvp.eventId, rsvp]));
  const localStartOfToday = getLocalStartOfToday();

  const upcoming = useMemo(() => {
    return events
      .filter((event) => !isPastEvent(event, localStartOfToday) && matchesFilter(event, activeFilter))
      .slice()
      .sort((a, b) => getEventTime(a) - getEventTime(b));
  }, [events, activeFilter, localStartOfToday]);

  const pierUpcoming = upcoming.filter((e) => e.hostType === 'pier');
  const partnerUpcoming = upcoming.filter((e) => e.hostType === 'partner');
  const past = useMemo(() => {
    return events
      .filter((event) => isPastEvent(event, localStartOfToday) && matchesFilter(event, activeFilter))
      .slice()
      .sort((a, b) => getEventTime(b) - getEventTime(a));
  }, [events, activeFilter, localStartOfToday]);

  function renderEventList(list: CapitalEvent[]) {
    if (list.length === 0) {
      return (
        <EmptyState
          title="No events match this filter."
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

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <div className="mb-10">
        <p className="eyebrow mb-2">Events</p>
        <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">
          Invite-only gatherings.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">
          Dinners, summits, and curated experiences where capital relationships are built.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {loading ? <LoadingState label="Loading events..." /> : null}
      {error ? <ErrorState message={error} onRetry={() => setReloadNonce((n) => n + 1)} /> : null}

      {!loading && !error ? (
        <>
          <div className="mb-8 flex flex-wrap gap-2">
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveFilter(opt.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[12px] transition-colors',
                  activeFilter === opt.id
                    ? 'border-gilt bg-gilt/15 text-ink'
                    : 'border-border bg-transparent text-slate hover:border-ink/30 hover:text-ink'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <section className="mb-12">
            <p className="eyebrow mb-5">Pier-hosted events</p>
            {renderEventList(pierUpcoming)}
          </section>

          <section className="mb-12">
            <p className="eyebrow mb-5">Partner & network events</p>
            {renderEventList(partnerUpcoming)}
          </section>

          <section>
            <p className="eyebrow mb-5">Past events</p>
            {past.length === 0 ? (
              <EmptyState title="No past events." description="Completed events will appear here." />
            ) : (
              <div className="grid gap-3">
                {past.map((event) => (
                  (() => {
                    const { month, day } = getEventMonthDay(event);

                    return (
                      <div
                        key={event.id}
                        className="flex flex-col gap-4 rounded-[4px] border border-border bg-surface px-5 py-4 opacity-70 sm:flex-row sm:items-center sm:justify-between"
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
                  })()
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
