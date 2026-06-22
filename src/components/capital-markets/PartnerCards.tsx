import type { KeyboardEvent } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { CapitalPartner } from '../../lib/api/capitalMarkets';
import { partnerCategoryLabels } from '../../pages/capital-markets/mockData';

function displayWebsite(website: string) {
  return website.replace(/^https?:\/\//, '') || 'Website';
}

function sourceLabel(partner: CapitalPartner) {
  return partner.minimumLevel || 'Member perk';
}

function showVisitLink(partner: CapitalPartner) {
  return partner.website && partner.website !== partner.ctaHref;
}

type FeaturedPartnerCardProps = {
  partner: CapitalPartner;
  onSelect: (partner: CapitalPartner) => void;
};

function handleCardKeyDown(event: KeyboardEvent, partner: CapitalPartner, onSelect: (partner: CapitalPartner) => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onSelect(partner);
  }
}

export function FeaturedPartnerCard({ partner, onSelect }: FeaturedPartnerCardProps) {
  const locationLine = [partnerCategoryLabels[partner.category], partner.location]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(partner)}
      onKeyDown={(event) => handleCardKeyDown(event, partner, onSelect)}
      className="flex h-full cursor-pointer flex-col rounded-[4px] border border-border bg-surface p-5 transition-colors hover:border-ink/30 focus:border-ink/40 focus:outline-none"
    >
      {partner.imageUrl ? (
        <div className="mb-4 aspect-[16/9] overflow-hidden rounded-[3px] border border-border bg-parchment">
          <img src={partner.imageUrl} alt={partner.name} className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : null}
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="eyebrow text-gilt">{locationLine}</p>
        <Badge variant="members">{sourceLabel(partner)}</Badge>
      </div>
      <h2 className="font-display text-[22px] leading-tight tracking-[-0.01em] text-ink">{partner.name}</h2>
      <p className="mt-3 flex-1 text-[13px] leading-relaxed text-slate">{partner.description}</p>
      <div className="mt-4 rounded-[2px] border border-gilt/20 bg-gilt/[0.06] px-3 py-2.5">
        <p className="eyebrow mb-1 text-slate">Member benefit</p>
        <p className="text-[13px] text-ink">{partner.benefit}</p>
      </div>
      {partner.redemptionInstructions ? (
        <p className="mt-3 text-[12px] leading-relaxed text-slate">{partner.redemptionInstructions}</p>
      ) : null}
      <div className="mt-4 flex flex-col gap-2">
        {showVisitLink(partner) ? (
          <a
            href={partner.website}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="flex h-8 items-center justify-center gap-1 rounded-[6px] border border-border bg-parchment text-[12px] text-ink hover:border-ink/30"
          >
            Visit {displayWebsite(partner.website)}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
        <a
          href={partner.ctaHref}
          target={partner.ctaExternal ? '_blank' : undefined}
          rel={partner.ctaExternal ? 'noreferrer' : undefined}
          onClick={(event) => event.stopPropagation()}
          className="flex h-8 items-center justify-center gap-1 rounded-[6px] border border-ink bg-ink text-[12px] text-parchment hover:bg-ink/90"
        >
          {partner.ctaLabel}
          {partner.ctaExternal ? <ExternalLink className="h-3 w-3" /> : null}
        </a>
      </div>
    </div>
  );
}

type PartnerListRowProps = {
  partner: CapitalPartner;
  onSelect: (partner: CapitalPartner) => void;
};

export function PartnerListRow({ partner, onSelect }: PartnerListRowProps) {
  const locationLine = [partnerCategoryLabels[partner.category], partner.location]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(partner)}
      onKeyDown={(event) => handleCardKeyDown(event, partner, onSelect)}
      className="group flex cursor-pointer flex-col gap-5 rounded-[4px] border border-border bg-surface p-5 transition-colors hover:border-ink/30 focus:border-ink/40 focus:outline-none xl:flex-row xl:items-start xl:justify-between"
    >
      <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(140px,180px)_1fr_minmax(160px,200px)]">
        <div>
          <p className="eyebrow mb-0.5">{locationLine}</p>
          <p className="font-medium text-ink">{partner.name}</p>
          <p className="mt-1 text-[12px] text-slate">{sourceLabel(partner)}</p>
        </div>
        <p className="text-[13px] leading-relaxed text-slate">{partner.description}</p>
        <div>
          <p className="eyebrow mb-1">Member benefit</p>
          <p className="text-[13px] text-ink">{partner.benefit}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:min-w-[140px]">
        {showVisitLink(partner) ? (
          <a
            href={partner.website}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="flex h-8 items-center justify-center gap-1 rounded-[6px] border border-border bg-parchment text-[12px] text-slate hover:border-ink/30 hover:text-ink"
          >
            <ExternalLink className="h-3 w-3" />
            Visit
          </a>
        ) : null}
        <a
          href={partner.ctaHref}
          target={partner.ctaExternal ? '_blank' : undefined}
          rel={partner.ctaExternal ? 'noreferrer' : undefined}
          onClick={(event) => event.stopPropagation()}
          className="flex h-8 items-center justify-center gap-1 rounded-[6px] border border-ink bg-ink text-[12px] text-parchment hover:bg-ink/90"
        >
          {partner.ctaLabel}
          {partner.ctaExternal ? <ExternalLink className="h-3 w-3" /> : null}
        </a>
      </div>
    </div>
  );
}

type PartnerDetailModalProps = {
  partner: CapitalPartner | null;
  onClose: () => void;
};

export function PartnerDetailModal({ partner, onClose }: PartnerDetailModalProps) {
  if (!partner) return null;

  const locationLine = [partnerCategoryLabels[partner.category], partner.location]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/70 px-4 py-8 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="perk-detail-title"
        className="mx-auto w-full max-w-3xl overflow-hidden rounded-[6px] border border-border bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {partner.imageUrl ? (
          <div className="relative aspect-[16/7] bg-parchment">
            <img src={partner.imageUrl} alt={partner.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
          </div>
        ) : null}

        <div className="p-6 sm:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-2 text-gilt">{locationLine || 'Member perk'}</p>
              <h2 id="perk-detail-title" className="font-display text-[32px] leading-none tracking-[-0.02em] text-ink">
                {partner.name}
              </h2>
              {partner.minimumLevel ? <p className="mt-2 text-[13px] text-slate">{partner.minimumLevel}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-slate hover:border-ink/30 hover:text-ink"
              aria-label="Close perk details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
            <div className="space-y-6">
              <section>
                <p className="eyebrow mb-2">Overview</p>
                <p className="text-[14px] leading-relaxed text-slate">{partner.description}</p>
              </section>

              {partner.tagline && partner.tagline !== partner.description ? (
                <section>
                  <p className="eyebrow mb-2">Partner details</p>
                  <p className="text-[14px] leading-relaxed text-slate">{partner.tagline}</p>
                </section>
              ) : null}

              {partner.benefits.length > 0 ? (
                <section>
                  <p className="eyebrow mb-3">Member benefits</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {partner.benefits.map((benefit) => (
                      <div key={benefit} className="rounded-[3px] border border-gilt/20 bg-gilt/[0.05] px-3 py-2 text-[13px] text-ink">
                        {benefit}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="rounded-[4px] border border-border bg-parchment p-4">
              <p className="eyebrow mb-2">How to redeem</p>
              <p className="text-[13px] leading-relaxed text-slate">
                {partner.redemptionInstructions || 'Contact Pier Concierge and mention this perk.'}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href={partner.ctaHref}
                  target={partner.ctaExternal ? '_blank' : undefined}
                  rel={partner.ctaExternal ? 'noreferrer' : undefined}
                  className="flex h-9 items-center justify-center gap-1 rounded-[6px] border border-ink bg-ink text-[12px] text-parchment hover:bg-ink/90"
                >
                  {partner.ctaLabel}
                  {partner.ctaExternal ? <ExternalLink className="h-3 w-3" /> : null}
                </a>
                {showVisitLink(partner) ? (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 items-center justify-center gap-1 rounded-[6px] border border-border bg-surface text-[12px] text-ink hover:border-ink/30"
                  >
                    Visit {displayWebsite(partner.website)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
