import { ExternalLink } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { CapitalPartner, CapitalPartnerIntro } from '../../lib/api/capitalMarkets';
import { partnerCategoryLabels } from '../../pages/capital-markets/mockData';

function displayWebsite(website: string) {
  return website.replace(/^https?:\/\//, '') || 'Website';
}

type FeaturedPartnerCardProps = {
  partner: CapitalPartner;
  intro?: CapitalPartnerIntro;
  submitting?: boolean;
  onIntro: (partner: CapitalPartner) => void;
};

export function FeaturedPartnerCard({ partner }: FeaturedPartnerCardProps) {
  const locationLine = [partnerCategoryLabels[partner.category], partner.location]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex h-full flex-col rounded-[4px] border border-border bg-surface p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="eyebrow text-gilt">{locationLine}</p>
        <Badge variant="members">Featured</Badge>
      </div>
      <h2 className="font-display text-[22px] leading-tight tracking-[-0.01em] text-ink">{partner.name}</h2>
      <p className="mt-3 flex-1 text-[13px] leading-relaxed text-slate">{partner.description}</p>
      <div className="mt-4 rounded-[2px] border border-gilt/20 bg-gilt/[0.06] px-3 py-2.5">
        <p className="eyebrow mb-1 text-slate">Member benefit</p>
        <p className="text-[13px] text-ink">{partner.benefit}</p>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <a
          href={partner.website || '#'}
          target="_blank"
          rel="noreferrer"
          className="flex h-8 items-center justify-center gap-1 rounded-[6px] border border-border bg-parchment text-[12px] text-ink hover:border-ink/30"
        >
          Visit {displayWebsite(partner.website)}
          <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={`/concierge?partner=${encodeURIComponent(partner.id)}`}
          className="flex h-8 items-center justify-center rounded-[6px] border border-ink bg-ink text-[12px] text-parchment hover:bg-ink/90"
        >
          Request introduction
        </a>
      </div>
    </div>
  );
}

type PartnerListRowProps = {
  partner: CapitalPartner;
  intro?: CapitalPartnerIntro;
  submitting?: boolean;
  onIntro: (partner: CapitalPartner) => void;
};

export function PartnerListRow({ partner, intro, submitting, onIntro }: PartnerListRowProps) {
  const locationLine = [partnerCategoryLabels[partner.category], partner.location]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="group flex flex-col gap-5 rounded-[4px] border border-border bg-surface p-5 transition-colors hover:border-ink/30 xl:flex-row xl:items-start xl:justify-between">
      <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(140px,180px)_1fr_minmax(160px,200px)]">
        <div>
          <p className="eyebrow mb-0.5">{locationLine}</p>
          <p className="font-medium text-ink">{partner.name}</p>
        </div>
        <p className="text-[13px] leading-relaxed text-slate">{partner.description}</p>
        <div>
          <p className="eyebrow mb-1">Member benefit</p>
          <p className="text-[13px] text-ink">{partner.benefit}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:min-w-[140px]">
        <a
          href={partner.website || '#'}
          target="_blank"
          rel="noreferrer"
          className="flex h-8 items-center justify-center gap-1 rounded-[6px] border border-border bg-parchment text-[12px] text-slate hover:border-ink/30 hover:text-ink"
        >
          <ExternalLink className="h-3 w-3" />
          Visit
        </a>
        <button
          type="button"
          disabled={submitting || Boolean(intro)}
          onClick={() => onIntro(partner)}
          className="flex h-8 items-center justify-center rounded-[6px] border border-ink bg-ink text-[12px] text-parchment hover:bg-ink/90 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : intro ? `Intro ${intro.status.replace('_', ' ')}` : 'Request intro'}
        </button>
      </div>
    </div>
  );
}
