import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ExternalLink, MapPin } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { ANALYTICS_EVENTS, captureAnalytics } from '../../lib/analytics';
import type { CapitalEvent, CapitalEventRsvp } from '../../lib/api/capitalMarkets';
import { conciergeMailto } from '../../lib/conciergeMailto';
import { cn, formatEventDate, formatEventLocation, formatEventTime } from '../../lib/utils';
import { eventTypeLabels } from '../../pages/capital-markets/mockData';

type EventCardProps = {
  event: CapitalEvent;
  rsvp?: CapitalEventRsvp;
  compact?: boolean;
};

function isMultiDayExperience(event: CapitalEvent): boolean {
  if (event.type !== 'experience') return false;
  const start = new Date(event.date).getTime();
  const end = new Date(event.endDate).getTime();
  return end - start > 24 * 60 * 60 * 1000;
}

function getEventInviteHref(event: CapitalEvent): string {
  const date = formatEventDate(event.date, 'long', event.city);
  return conciergeMailto(
    `RSVP: ${event.title}`,
    `I'd like to attend ${event.title} on ${date}. Please let me know if a spot remains.`
  );
}

function getRegisterLabel(event: CapitalEvent): string {
  if (event.registrationUrl?.trim() && event.registrationLabel?.trim()) return event.registrationLabel;
  return isMultiDayExperience(event) ? 'Request details' : 'Request RSVP';
}

const actionLinkClass =
  'flex h-8 w-full items-center justify-center gap-2 rounded-pier-md border border-ink bg-ink px-3 text-[13px] font-medium text-parchment transition-colors hover:bg-ink/90';

export function EventCard({ event, rsvp, compact }: EventCardProps) {
  const hasExternalRegister = Boolean(event.registrationUrl?.trim());
  const locationLabel = formatEventLocation(event);
  const hostLabel = event.hostName || (event.hostType === 'pier' ? 'Pier' : 'Partner event');
  const showPierBadge = event.hostType === 'pier' && event.featured;
  const registerLabel = getRegisterLabel(event);
  const coverImageUrl = event.coverImageUrl?.trim() ?? '';

  const rsvpLabel = (() => {
    if (rsvp?.status === 'confirmed' || rsvp?.status === 'attended' || event.registered) return 'Going';
    if (rsvp?.status === 'waitlisted') return 'Waitlist requested';
    if (rsvp?.status === 'requested') return 'RSVP requested';
    return registerLabel;
  })();

  if (compact) {
    return (
      <div className="rounded-[4px] border border-border bg-surface p-4">
        <p className="text-[13px] font-medium leading-snug text-ink">{event.title}</p>
        {event.audience ? <p className="mt-1 text-[12px] text-slate">{event.audience}</p> : null}
        <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-slate">
          <span>{formatEventDate(event.date, 'month-day', event.city)}</span>
          <span>{event.city}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`event-${event.id}`}
      className={cn(
        'grid gap-8 rounded-[4px] border border-border bg-surface p-6',
        coverImageUrl ? 'xl:grid-cols-[180px_1fr_240px]' : 'xl:grid-cols-[1fr_240px]'
      )}
    >
      {coverImageUrl ? (
        <div className="overflow-hidden rounded-[4px] bg-border/40">
          <img src={coverImageUrl} alt="" className="h-40 w-full object-cover xl:h-full" />
        </div>
      ) : null}

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {showPierBadge ? (
            <span className="rounded-[2px] bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-parchment">
              Pier event
            </span>
          ) : null}
          <Badge variant={event.hostType === 'pier' ? 'members' : 'muted'}>{hostLabel}</Badge>
          {event.audience ? (
            <span className="text-[12px] text-slate">{event.audience}</span>
          ) : null}
        </div>
        <h2 className="font-display text-[28px] leading-none tracking-[-0.01em] text-ink">{event.title}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-slate">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatEventDate(event.date, 'long', event.city)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatEventTime(event.date, event.city)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {event.city}
          </span>
          <span>{eventTypeLabels[event.type]}</span>
        </div>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-slate">{event.description}</p>
      </div>

      <aside className="flex flex-col justify-between border-border xl:border-l xl:pl-8">
        <div>
          <p className="eyebrow mb-1">Location</p>
          <p className="text-[13px] text-ink">{locationLabel}</p>
          <p className="text-[13px] text-slate">{event.city}</p>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {rsvp?.status === 'confirmed' || rsvp?.status === 'attended' || event.registered ? (
            <div className="flex items-center gap-2 rounded-[4px] border border-ledger/20 bg-ledger/[0.06] px-3 py-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-ledger" />
              <span className="text-[13px] font-medium text-ink">Going</span>
            </div>
          ) : rsvp ? (
            <div className="rounded-[4px] border border-gilt/20 bg-gilt/[0.08] px-3 py-2 text-[13px] font-medium text-ink">
              {rsvpLabel}
            </div>
          ) : hasExternalRegister ? (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={actionLinkClass}
              onClick={() =>
                captureAnalytics(ANALYTICS_EVENTS.eventRsvpClicked, {
                  event_id: event.databaseId,
                  event_type: event.type,
                  channel: 'external',
                })
              }
            >
              {registerLabel}
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
          ) : (
            <a
              href={getEventInviteHref(event)}
              className={actionLinkClass}
              onClick={() =>
                captureAnalytics(ANALYTICS_EVENTS.eventRsvpClicked, {
                  event_id: event.databaseId,
                  event_type: event.type,
                  channel: 'mailto',
                })
              }
            >
              {registerLabel}
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}

function eventMonthDay(event: CapitalEvent) {
  const [month, day] = formatEventDate(event.date, 'month-day', event.city).split(' ');
  return { month, day };
}

function isGoing(event: CapitalEvent, rsvp?: CapitalEventRsvp) {
  return rsvp?.status === 'confirmed' || rsvp?.status === 'attended' || event.registered;
}

export function DashboardEventCard({
  event,
  rsvp,
}: {
  event: CapitalEvent;
  rsvp?: CapitalEventRsvp;
}) {
  const coverImageUrl = event.coverImageUrl?.trim() ?? '';
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(coverImageUrl) && !coverFailed;
  const { month, day } = eventMonthDay(event);
  const going = isGoing(event, rsvp);
  const hasExternalRegister = Boolean(event.registrationUrl?.trim());
  const registerLabel = getRegisterLabel(event);
  const meta = showCover
    ? [event.city, event.audience].filter(Boolean).join(' · ')
    : event.audience;

  return (
    <article className="overflow-hidden rounded-[4px] border border-border bg-surface">
      {showCover ? (
        <Link to={`/events#event-${event.id}`} className="relative block">
          <div className="aspect-[16/10] w-full overflow-hidden bg-border/40">
            <img
              src={coverImageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              onError={() => setCoverFailed(true)}
            />
          </div>
          <div className="absolute left-3 top-3 rounded-[4px] bg-parchment/95 px-2 py-1.5 text-center shadow-sm">
            <p className="font-mono-data text-[10px] font-medium uppercase tracking-[0.08em] text-slate">
              {month}
            </p>
            <p className="font-mono-data text-[16px] font-medium leading-none text-ink">{day}</p>
          </div>
        </Link>
      ) : null}

      <div className="p-4">
        {showCover ? null : (
          <div className="mb-3 flex items-center gap-3">
            <div className="text-center">
              <p className="font-mono-data text-[11px] font-medium uppercase tracking-[0.08em] text-slate">
                {month}
              </p>
              <p className="font-mono-data text-[18px] font-medium leading-none text-ink">{day}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <p className="text-[12px] text-slate">{event.city}</p>
          </div>
        )}

        <Link to={`/events#event-${event.id}`} className="block">
          <p className="font-medium leading-snug text-ink hover:underline hover:underline-offset-4">
            {event.title}
          </p>
        </Link>
        {meta ? <p className="mt-1 text-[12px] leading-snug text-slate">{meta}</p> : null}

        <div className="mt-3">
          {going ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ledger">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-ledger" />
              Going
            </span>
          ) : rsvp ? (
            <span className="text-[13px] font-medium text-ink">
              {rsvp.status === 'waitlisted' ? 'Waitlist requested' : 'RSVP requested'}
            </span>
          ) : hasExternalRegister ? (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-ink underline-offset-4 hover:underline"
              onClick={() =>
                captureAnalytics(ANALYTICS_EVENTS.eventRsvpClicked, {
                  event_id: event.databaseId,
                  event_type: event.type,
                  channel: 'external',
                })
              }
            >
              {event.registrationLabel || 'Register'}
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          ) : (
            <Link
              to={`/events#event-${event.id}`}
              className="text-[13px] font-medium text-ink underline-offset-4 hover:underline"
            >
              {registerLabel} →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
