import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import {
  createCapitalEventRsvp,
  getCapitalEvents,
  getMyCapitalEventRsvps,
  type CapitalEvent,
  type CapitalEventRsvp,
} from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, describeCapitalLoadFailure, withTimeout } from '../../lib/async';
import { formatDate } from '../../lib/utils';
import { eventTypeLabels } from './mockData';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

export default function CapitalMarketsEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CapitalEvent[]>([]);
  const [rsvps, setRsvps] = useState<CapitalEventRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submittingEventId, setSubmittingEventId] = useState<string | null>(null);
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
          setEvents(eventData.map((event) => ({ ...event, registered: registeredEventIds.has(event.databaseId) })));
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

  const upcoming = events.filter((event) => event.upcoming);
  const past = events.filter((event) => !event.upcoming);
  const rsvpByEventId = new Map(rsvps.map((rsvp) => [rsvp.eventId, rsvp]));

  async function handleRsvp(event: CapitalEvent, waitlist: boolean) {
    if (!user) {
      setSubmitSuccess(null);
      setSubmitError('Please sign in before requesting an RSVP.');
      return;
    }

    setSubmittingEventId(event.databaseId);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await createCapitalEventRsvp({
        eventId: event.databaseId,
        memberId: user.id,
        status: waitlist ? 'waitlisted' : 'requested',
      });
      const [eventData, rsvpData] = await withTimeout(
        Promise.all([getCapitalEvents(), getMyCapitalEventRsvps(user.id)]),
        CAPITAL_SUPABASE_TIMEOUT_MS,
        'events and RSVPs'
      );
      const registeredEventIds = new Set(
        rsvpData
          .filter((rsvp) => rsvp.status === 'confirmed' || rsvp.status === 'attended')
          .map((rsvp) => rsvp.eventId)
      );
      setEvents(eventData.map((item) => ({ ...item, registered: registeredEventIds.has(item.databaseId) })));
      setRsvps(rsvpData);
      setSubmitSuccess(waitlist ? 'Waitlist request submitted.' : 'RSVP request submitted.');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit RSVP request.');
    } finally {
      setSubmittingEventId(null);
    }
  }

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <div className="mb-10">
        <p className="eyebrow mb-2">03 / Events</p>
        <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">
          Invite-only gatherings.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">
          Dinners, summits, and curated tours where capital relationships are built.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {loading ? <LoadingState label="Loading events from Supabase..." /> : null}
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
        <p className="eyebrow mb-5">Upcoming</p>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming events."
            description="There are no published upcoming events yet, or your account cannot see them. An empty calendar is normal until events are published—not a failed load."
          />
        ) : (
          <div className="grid gap-4">
            {upcoming.map((event) => {
            const spotsLeft = event.capacity - event.registeredCount;
            const capacityPercent = event.capacity > 0 ? Math.min(100, (event.registeredCount / event.capacity) * 100) : 0;
            const rsvp = rsvpByEventId.get(event.databaseId);
            const hasRsvp = Boolean(rsvp);
            const waitlist = spotsLeft <= 0;
            return (
              <div
                key={event.id}
                className="grid gap-8 rounded-[4px] border border-border bg-surface p-6 xl:grid-cols-[1fr_280px]"
              >
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant={rsvp?.status === 'confirmed' || event.registered ? 'members' : 'muted'}>
                      {rsvp ? rsvp.status.replace('_', ' ') : eventTypeLabels[event.type]}
                    </Badge>
                    <span className="text-[12px] text-slate">{eventTypeLabels[event.type]}</span>
                  </div>
                  <h2 className="font-display text-[28px] leading-none tracking-[-0.01em] text-ink">
                    {event.title}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-slate">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(event.date, 'long')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(event.date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.city}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {event.registeredCount}/{event.capacity} attending
                    </span>
                  </div>
                  <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-slate">
                    {event.description}
                  </p>
                </div>

                <aside className="flex flex-col justify-between border-border xl:border-l xl:pl-8">
                  <div>
                    <p className="eyebrow mb-1">Location</p>
                    <p className="text-[13px] text-ink">{event.location}</p>
                    <p className="text-[13px] text-slate">{event.city}</p>

                    <div className="mt-4">
                      <p className="eyebrow mb-1">Capacity</p>
                      <div className="mt-1.5 h-0.5 w-full rounded-full bg-border">
                        <div className="h-full rounded-full bg-ink" style={{ width: `${capacityPercent}%` }} />
                      </div>
                      <p className="mt-1.5 text-[12px] text-slate">
                        {spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'Waitlist only'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    {rsvp?.status === 'confirmed' || event.registered ? (
                      <div className="flex items-center gap-2 rounded-[4px] border border-ledger/20 bg-ledger/[0.06] px-3 py-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-ledger" />
                        <span className="text-[13px] font-medium text-ink">You are registered</span>
                      </div>
                    ) : hasRsvp ? (
                      <div className="rounded-[4px] border border-gilt/20 bg-gilt/[0.08] px-3 py-2 text-[13px] font-medium text-ink">
                        {rsvp?.status === 'waitlisted' ? 'Waitlist requested' : 'RSVP requested'}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        loading={submittingEventId === event.databaseId}
                        disabled={submittingEventId !== null}
                        onClick={() => handleRsvp(event, waitlist)}
                      >
                        {waitlist ? 'Join waitlist' : 'Request RSVP'}
                      </Button>
                    )}
                  </div>
                </aside>
              </div>
            );
          })}
          </div>
        )}
      </section>

      <section>
        <p className="eyebrow mb-5">Past Events</p>
        {past.length === 0 ? (
          <EmptyState
            title="No past events."
            description="Completed events you can access will appear here once they exist in the published catalog."
          />
        ) : (
          <div className="grid gap-3">
            {past.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-4 rounded-[4px] border border-border bg-surface px-5 py-4 opacity-70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-mono-data text-[13px] font-medium text-ink">
                      {new Date(event.date).toLocaleString('en-US', { month: 'short' })}
                    </p>
                    <p className="font-mono-data text-[20px] font-medium leading-none text-ink">
                      {new Date(event.date).getDate()}
                    </p>
                  </div>
                  <div className="w-px self-stretch bg-border" />
                  <div>
                    <p className="font-medium text-ink">{event.title}</p>
                    <p className="mt-0.5 text-[13px] text-slate">{event.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {event.registered ? <Badge variant="muted">Attended</Badge> : null}
                  <Badge variant="closed">{eventTypeLabels[event.type]}</Badge>
                </div>
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
