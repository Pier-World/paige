import type { KeyboardEvent, ReactNode } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { ANALYTICS_EVENTS, captureAnalytics } from '../../lib/analytics';
import type { CapitalPartner } from '../../lib/api/capitalMarkets';
import { partnerAccessLabel } from '../../lib/partnerAccess';
import { cn } from '../../lib/utils';
import { partnerCategoryLabels } from '../../pages/capital-markets/mockData';

function displayWebsite(website: string) {
  return website.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'Website';
}

function locationLine(partner: CapitalPartner) {
  return [partnerCategoryLabels[partner.category], partner.location].filter(Boolean).join(' · ');
}

function summaryLine(partner: CapitalPartner) {
  return partner.description.trim() || partner.benefit.trim();
}

function showVisitLink(partner: CapitalPartner) {
  return partner.website && partner.website !== partner.ctaHref;
}

function handleCardKeyDown(event: KeyboardEvent, partner: CapitalPartner, onSelect: (partner: CapitalPartner) => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onSelect(partner);
  }
}

function trackPartnerCta(event: { stopPropagation(): void }, partner: CapitalPartner) {
  event.stopPropagation();
  captureAnalytics(ANALYTICS_EVENTS.partnerCtaClicked, {
    partner_id: partner.id,
    category: partner.category,
  });
}

function PartnerCover({ src, ratioClass }: { src: string; ratioClass: string }) {
  return (
    <div className={cn('relative w-full shrink-0 overflow-hidden bg-parchment', ratioClass)}>
      {src ? (
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
      ) : null}
    </div>
  );
}

function PierPlusMark() {
  return (
    <span className="inline-flex h-5 shrink-0 items-center font-display text-[15px] leading-none tracking-[-0.03em] text-ink">
      Pier+
    </span>
  );
}

function PartnerActions({ partner, stacked = false }: { partner: CapitalPartner; stacked?: boolean }) {
  const visit = showVisitLink(partner) ? (
    <a
      href={partner.website}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      className={cn(
        'inline-flex items-center justify-center gap-1 text-[12px] text-slate hover:text-ink',
        stacked && 'h-9 rounded-[6px] border border-border bg-surface text-ink hover:border-ink/30'
      )}
    >
      Visit site
      <ExternalLink className="h-3 w-3" />
    </a>
  ) : null;

  const primary = (
    <a
      href={partner.ctaHref}
      target={partner.ctaExternal ? '_blank' : undefined}
      rel={partner.ctaExternal ? 'noreferrer' : undefined}
      onClick={(event) => trackPartnerCta(event, partner)}
      className={cn(
        'inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] border border-ink bg-ink px-3.5 text-[12px] text-parchment hover:bg-ink/90',
        stacked && 'h-9 w-full'
      )}
    >
      {partner.ctaLabel}
      {partner.ctaExternal ? <ExternalLink className="h-3 w-3" /> : null}
    </a>
  );

  return (
    <div className={cn('flex items-center gap-4', stacked && 'flex-col items-stretch gap-2')}>
      {stacked ? (
        <>
          {primary}
          {visit}
        </>
      ) : (
        <>
          {visit}
          {primary}
        </>
      )}
    </div>
  );
}

type PartnerSelectProps = {
  partner: CapitalPartner;
  onSelect: (partner: CapitalPartner) => void;
};

function SelectableSurface({
  partner,
  onSelect,
  className,
  children,
}: PartnerSelectProps & { className: string; children: ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(partner)}
      onKeyDown={(event) => handleCardKeyDown(event, partner, onSelect)}
      className={className}
    >
      {children}
    </div>
  );
}

export function FeaturedPartnerCard({ partner, onSelect }: PartnerSelectProps) {
  const accessLabel = partnerAccessLabel(partner.minimumLevel);
  const offer = summaryLine(partner);
  const meta = locationLine(partner);

  return (
    <SelectableSurface
      partner={partner}
      onSelect={onSelect}
      className="flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-[4px] border border-border bg-surface transition-colors hover:border-ink/30 focus:border-ink/40 focus:outline-none"
    >
      <PartnerCover src={partner.imageUrl} ratioClass="aspect-[16/9]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow">{meta || 'Partner'}</p>
          {accessLabel ? <PierPlusMark /> : null}
        </div>
        <h2 className="mt-3 line-clamp-2 min-h-[2.1em] font-display text-[26px] leading-[1.05] tracking-[-0.02em] text-ink">
          {partner.name}
        </h2>
        <p className="mt-3 line-clamp-2 min-h-[2.75em] text-[14px] leading-snug text-ink">{offer}</p>
        <div className="mt-auto flex justify-end pt-5">
          <PartnerActions partner={partner} />
        </div>
      </div>
    </SelectableSurface>
  );
}

export function PartnerListRow({ partner, onSelect }: PartnerSelectProps) {
  const accessLabel = partnerAccessLabel(partner.minimumLevel);
  const offer = summaryLine(partner);
  const meta = locationLine(partner);

  return (
    <SelectableSurface
      partner={partner}
      onSelect={onSelect}
      className="flex w-full min-w-0 cursor-pointer flex-col gap-4 rounded-[4px] border border-border bg-surface p-4 transition-colors hover:border-ink/30 focus:border-ink/40 focus:outline-none sm:flex-row sm:items-center sm:gap-5 sm:px-5"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {partner.imageUrl ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[3px] bg-parchment">
            <img src={partner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="font-display text-[22px] leading-none tracking-[-0.02em] text-ink">{partner.name}</p>
          {meta || accessLabel ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {meta ? <p className="eyebrow">{meta}</p> : null}
              {accessLabel ? <PierPlusMark /> : null}
            </div>
          ) : null}
          {offer ? <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-slate sm:line-clamp-1">{offer}</p> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:shrink-0 sm:flex-nowrap">
        <PartnerActions partner={partner} />
      </div>
    </SelectableSurface>
  );
}

type PartnerDetailModalProps = {
  partner: CapitalPartner | null;
  onClose: () => void;
};

export function PartnerDetailModal({ partner, onClose }: PartnerDetailModalProps) {
  if (!partner) return null;

  const accessLabel = partnerAccessLabel(partner.minimumLevel);
  const meta = locationLine(partner);
  const description = partner.description.trim();
  const benefits = partner.benefits.map((benefit) => benefit.trim()).filter(Boolean);
  const showOverview = Boolean(description) && !(benefits.length === 1 && benefits[0] === description);
  const tagline = partner.tagline.trim();
  const showTagline = Boolean(tagline) && tagline !== description && tagline !== partner.benefit.trim();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/70 px-4 py-8 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-detail-title"
        className="mx-auto w-full max-w-3xl overflow-hidden rounded-pier-md border border-border bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {partner.imageUrl ? <PartnerCover src={partner.imageUrl} ratioClass="aspect-[16/7]" /> : null}

        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4">
              <p className="eyebrow">{meta || 'Partner'}</p>
              <div className="flex shrink-0 items-center gap-3">
                {accessLabel ? <PierPlusMark /> : null}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-slate hover:border-ink/30 hover:text-ink"
                  aria-label="Close partner details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <h2 id="partner-detail-title" className="mt-3 max-w-xl font-display text-[36px] leading-[0.95] tracking-[-0.02em] text-ink">
              {partner.name}
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
            <div className="space-y-6">
              {showOverview ? (
                <p className="text-[15px] leading-relaxed text-ink">{description}</p>
              ) : null}

              {showTagline ? (
                <p className="text-[14px] leading-relaxed text-slate">{tagline}</p>
              ) : null}

              {benefits.length > 0 ? (
                <section>
                  <p className="eyebrow mb-3">Included</p>
                  <ul className="border-y border-border">
                    {benefits.map((benefit) => (
                      <li key={benefit} className="border-b border-border py-3 text-[14px] leading-relaxed text-ink last:border-b-0">
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <aside className="h-fit rounded-[4px] border border-border bg-parchment p-4">
              <p className="eyebrow mb-2">How to redeem</p>
              <p className="text-[13px] leading-relaxed text-slate">
                {partner.redemptionInstructions || 'Contact the Pier team to redeem this benefit.'}
              </p>
              {partner.website ? (
                <p className="mt-3 text-[12px] text-ink">{displayWebsite(partner.website)}</p>
              ) : null}
              <div className="mt-4">
                <PartnerActions partner={partner} stacked />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
