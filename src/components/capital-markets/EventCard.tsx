import { Calendar, Clock, ExternalLink, MapPin } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { CapitalEvent, CapitalEventRsvp } from '../../lib/api/capitalMarkets';
import { cn, formatDate, formatEventLocation, formatEventTime } from '../../lib/utils';
import { eventTypeLabels } from '../../pages/capital-markets/mockData';

type EventCardProps = {
  event: CapitalEvent;
  rsvp?: CapitalEventRsvp;
  submitting?: boolean;
  onRequestRsvp?: (event: CapitalEvent, waitlist: boolean) => void;
  compact?: boolean;
};

function isMultiDayExperience(event: CapitalEvent): boolean {
  if (event.type !== 'experience') return false;
  const start = new Date(event.date).getTime();
  const end = new Date(event.endDate).getTime();
  return end - start > 24 * 60 * 60 * 1000;
}

export function EventCard({ event, rsvp, submitting, onRequestRsvp, compact }: EventCardProps) {
  const hasExternalRegister = Boolean(event.registrationUrl?.trim());
  const isTrip = isMultiDayExperience(event);
  const locationLabel = formatEventLocation(event);
  const hostLabel = event.hostName || (event.hostType === 'pier' ? 'Pier' : 'Partner event');
  const showPierBadge = event.hostType === 'pier' && event.featured;

  const rsvpLabel = (() => {
    if (rsvp?.status === 'confirmed' || rsvp?.status === 'attended' || event.registered) return 'Going';
    if (rsvp?.status === 'waitlisted') return 'Waitlist requested';
    if (rsvp?.status === 'requested') return 'RSVP requested';
    if (isTrip && !hasExternalRegister) return 'Request details';
    if (!hasExternalRegister && !onRequestRsvp) return 'Details coming soon';
    return 'Request RSVP';
  })();

  if (compact) {
    return (
      <div className="rounded-[4px] border border-border bg-surface p-4">
        <p className="text-[13px] font-medium leading-snug text-ink">{event.title}</p>
        {event.audience ? <p className="mt-1 text-[12px] text-slate">{event.audience}</p> : null}
        <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-slate">
          <span>{formatDate(event.date, 'month-day')}</span>
          <span>{event.city}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`event-${event.id}`}
      className="grid gap-8 rounded-[4px] border border-border bg-surface p-6 xl:grid-cols-[1fr_280px]"
    >
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
            {formatDate(event.date, 'long')}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatEventTime(event.date)}
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
          {hasExternalRegister ? (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex h-8 w-full items-center justify-center gap-2 rounded-[6px] border border-ink bg-ink px-3 text-[13px] font-medium text-parchment transition-colors hover:bg-ink/90'
              )}
            >
              {event.registrationLabel}
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
          ) : null}

          {rsvp?.status === 'confirmed' || rsvp?.status === 'attended' || event.registered ? (
            <div className="flex items-center gap-2 rounded-[4px] border border-ledger/20 bg-ledger/[0.06] px-3 py-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-ledger" />
              <span className="text-[13px] font-medium text-ink">Going</span>
            </div>
          ) : rsvp ? (
            <div className="rounded-[4px] border border-gilt/20 bg-gilt/[0.08] px-3 py-2 text-[13px] font-medium text-ink">
              {rsvpLabel}
            </div>
          ) : isTrip && !hasExternalRegister ? (
            <Button
              size="sm"
              variant="primary"
              className="w-full"
              loading={submitting}
              disabled={!onRequestRsvp || submitting}
              onClick={() => onRequestRsvp?.(event, false)}
            >
              Request details
            </Button>
          ) : onRequestRsvp ? (
            <Button
              size="sm"
              variant={hasExternalRegister ? 'outline' : 'primary'}
              className="w-full"
              loading={submitting}
              disabled={submitting}
              onClick={() => onRequestRsvp(event, false)}
            >
              Request RSVP
            </Button>
          ) : (
            <div className="rounded-[4px] border border-border px-3 py-2 text-center text-[13px] text-slate">
              Details coming soon
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
