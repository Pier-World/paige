import { supabase } from '../supabase';
import type { Database, Json } from '../../types/supabase';

export type DealType = 'fund' | 'co-invest' | 'secondary' | 'spv';
export type DealStatus = 'open' | 'closing' | 'closed' | 'pending';
export type CapitalMemberRole = 'gp' | 'lp';
export type CapitalMemberProfileStatus = 'draft' | 'active' | 'hidden' | 'archived';
export type EventType = 'dinner' | 'summit' | 'roundtable' | 'experience' | 'webinar';
export type EventHostType = 'pier' | 'partner';
export type ReturnMetricType = 'irr' | 'moic' | 'yield' | 'custom' | 'none';
export type PartnerCategory =
  | 'hotels'
  | 'dining'
  | 'dining-platform'
  | 'travel'
  | 'transportation'
  | 'wellness'
  | 'business'
  | 'coworking'
  | 'experiences'
  | 'retail'
  | 'services'
  | 'lifestyle'
  | 'restaurants'
  | 'finance'
  | 'health';
export type CapitalPartnerSource = 'perk';

export interface CapitalDeal {
  id: string;
  databaseId: string;
  name: string;
  manager: string;
  type: DealType;
  assetClass: string;
  status: DealStatus;
  targetSize: number;
  raisedSize: number;
  allocationSubscribedPercent: number;
  minCommitment: number;
  currencyCode: string;
  closeDate: string;
  publishedAt: string | null;
  targetIrr: number;
  moicTarget: number;
  returnMetricType: ReturnMetricType;
  returnDisplay: string;
  holdingPeriodYears: number | null;
  liquidityNote: string;
  vintage: number;
  geography: string;
  sectors: string[];
  description: string;
  thesis: string;
  whyPierSelected: string;
  contacts: Array<{ name: string; role: string; email: string }>;
  documents: CapitalDealDocument[];
  reviewStatus: CapitalDealReviewStatus;
  generatedSummary: string;
  disclaimer: string;
  offeringType: string;
  jurisdiction: string;
  eligibleInvestorRequirements: string;
  visibilityTier: 'members' | 'admin';
  internalNotes: string;
}

export interface CapitalEvent {
  id: string;
  databaseId: string;
  title: string;
  status: 'draft' | 'upcoming' | 'completed' | 'cancelled';
  type: EventType;
  hostType: EventHostType;
  hostName: string;
  audience: string;
  date: string;
  endDate: string;
  location: string;
  locationIsPublic: boolean;
  city: string;
  capacity: number | null;
  registeredCount: number;
  registered: boolean;
  description: string;
  upcoming: boolean;
  featured: boolean;
  registrationUrl: string;
  registrationLabel: string;
  recapUrl: string;
}

export interface CapitalPartner {
  id: string;
  databaseId: string;
  source: CapitalPartnerSource;
  name: string;
  category: PartnerCategory;
  tagline: string;
  benefit: string;
  benefits: string[];
  description: string;
  website: string;
  location: string;
  featured: boolean;
  imageUrl: string;
  minimumLevel: string;
  redemptionInstructions: string;
  ctaHref: string;
  ctaLabel: string;
  ctaExternal: boolean;
}

export interface CapitalMember {
  id: string;
  name: string;
  role: CapitalMemberRole;
  firm: string;
  title: string;
  location: string;
  aum: string;
  focusSectors: string[];
  verified: boolean;
}

export interface CapitalMemberProfile extends CapitalMember {
  databaseId: string;
  memberId: string | null;
  slug: string;
  displayName: string;
  bio: string;
  investmentThesis: string;
  aumDisplay: string;
  aumNumeric: number | null;
  currencyCode: string;
  checkSize: string;
  checkSizeDisplay: string;
  checkSizeMin: number | null;
  checkSizeMax: number | null;
  status: CapitalMemberProfileStatus;
  publishedAt: string | null;
  isPublished: boolean;
}

export interface CapitalMemberProfileUpdateInput {
  role?: CapitalMemberRole;
  displayName: string;
  firm: string;
  title?: string | null;
  location?: string | null;
  bio?: string | null;
  investmentThesis?: string | null;
  focusSectors?: string[];
  aumDisplay?: string | null;
  aumNumeric?: number | null;
  checkSizeDisplay?: string | null;
  checkSizeMin?: number | null;
  checkSizeMax?: number | null;
  currencyCode?: string;
}

export type CapitalDealInterestRequestType = 'express_interest' | 'schedule_call' | 'request_documents';
export type CapitalDealReviewStatus = 'draft' | 'generated' | 'needs_review' | 'approved' | 'rejected';
export type CapitalDealInterestStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'intro_scheduled'
  | 'declined'
  | 'withdrawn';
export type CapitalEventRsvpStatus = 'requested' | 'confirmed' | 'waitlisted' | 'attended' | 'cancelled' | 'declined';
export type CapitalPartnerIntroStatus = 'submitted' | 'in_review' | 'introduced' | 'declined' | 'cancelled';

export interface CapitalDealInterest {
  id: string;
  dealId: string;
  memberId: string;
  requestType: CapitalDealInterestRequestType;
  status: CapitalDealInterestStatus;
}

export interface CapitalEventRsvp {
  id: string;
  eventId: string;
  memberId: string;
  status: CapitalEventRsvpStatus;
}

export interface CapitalPartnerIntro {
  id: string;
  partnerId: string;
  memberId: string;
  status: CapitalPartnerIntroStatus;
}

export interface CapitalDealDocument {
  id: string;
  label: string;
  type: string;
  size: string;
  storagePath: string;
  externalUrl: string;
  accessLevel: 'members' | 'approved_interest' | 'admin';
}

export interface CapitalDealSourceMaterial {
  id: string;
  dealId: string | null;
  label: string;
  materialType: string;
  storagePath: string;
  externalUrl: string;
  originalFilename: string;
  extractedText: string;
  generatedSummary: string;
  reviewStatus: CapitalDealReviewStatus;
  createdAt: string;
}

export interface AdminCapitalDealInput {
  slug: string;
  name: string;
  managerName: string;
  dealType: DealType;
  assetClass: string;
  status?: DealStatus;
  targetSize: number;
  raisedSize?: number;
  allocationSubscribedPercent?: number | null;
  minCommitment?: number | null;
  currencyCode?: string;
  closeDate?: string | null;
  targetIrr?: number | null;
  moicTarget?: number | null;
  returnMetricType?: ReturnMetricType;
  returnDisplay?: string | null;
  holdingPeriodYears?: number | null;
  liquidityNote?: string | null;
  vintage?: number | null;
  geography?: string | null;
  sectors?: string[];
  description: string;
  thesis?: string | null;
  whyPierSelected?: string | null;
  contacts?: Array<{ name: string; role: string; email: string }>;
  generatedSummary?: string | null;
  disclaimer?: string | null;
  offeringType?: string | null;
  jurisdiction?: string | null;
  eligibleInvestorRequirements?: string | null;
  internalNotes?: string | null;
}

type CapitalDealRow = Database['public']['Tables']['capital_deals']['Row'];
type CapitalDealDocumentRow = Database['public']['Tables']['capital_deal_documents']['Row'];
type CapitalDealSourceMaterialRow = Database['public']['Tables']['capital_deal_source_materials']['Row'];
type CapitalEventRow = Database['public']['Tables']['capital_events']['Row'];
type CapitalPartnerRow = Database['public']['Tables']['capital_partners']['Row'];
type PerkRow = Database['public']['Tables']['perks']['Row'];
type CapitalMemberProfileRow = Database['public']['Tables']['capital_member_profiles']['Row'];
type CapitalDealInterestRow = Database['public']['Tables']['capital_deal_interests']['Row'];
type CapitalEventRsvpRow = Database['public']['Tables']['capital_event_rsvps']['Row'];
type CapitalPartnerIntroRow = Database['public']['Tables']['capital_partner_intros']['Row'];

const memberVisibleDealStatuses: Array<Exclude<DealStatus, 'pending'>> = ['open', 'closing', 'closed'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseContacts(contacts: Json): CapitalDeal['contacts'] {
  if (!Array.isArray(contacts)) return [];

  return contacts
    .filter(isRecord)
    .map((contact) => ({
      name: asString(contact.name),
      role: asString(contact.role),
      email: asString(contact.email),
    }))
    .filter((contact) => contact.name || contact.role || contact.email);
}

function normalizeWebsite(website: string | null): string {
  if (!website || website.trim().toLowerCase() === 'null') return '';
  const trimmed = website.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
}

function formatCurrencyAmount(currencyCode: string, amount: number): string {
  return `${currencyCode} ${amount.toLocaleString()}`;
}

function formatCheckSize(row: CapitalMemberProfileRow): string {
  if (row.check_size_display) return row.check_size_display;
  if (row.check_size_min !== null && row.check_size_max !== null) {
    return `${formatCurrencyAmount(row.currency_code, row.check_size_min)} - ${formatCurrencyAmount(row.currency_code, row.check_size_max)}`;
  }
  if (row.check_size_min !== null) return `${formatCurrencyAmount(row.currency_code, row.check_size_min)}+`;
  if (row.check_size_max !== null) return `Up to ${formatCurrencyAmount(row.currency_code, row.check_size_max)}`;
  return 'Check size undisclosed';
}

function mapDealDocument(row: CapitalDealDocumentRow): CapitalDeal['documents'][number] {
  return {
    id: row.id,
    label: row.label,
    type: row.document_type,
    size: row.display_size ?? (row.file_size_bytes ? `${Math.round(row.file_size_bytes / 1024)} KB` : 'Available'),
    storagePath: row.storage_path ?? '',
    externalUrl: row.external_url ?? '',
    accessLevel: row.access_level,
  };
}

type CapitalDealRowExtended = CapitalDealRow & {
  return_metric_type?: ReturnMetricType;
  return_display?: string | null;
  holding_period_years?: number | null;
  liquidity_note?: string | null;
  why_pier_selected?: string | null;
  review_status?: CapitalDealReviewStatus;
  generated_summary?: string | null;
  disclaimer?: string | null;
  offering_type?: string | null;
  jurisdiction?: string | null;
  eligible_investor_requirements?: string | null;
  visibility_tier?: 'members' | 'admin';
  internal_notes?: string | null;
  allocation_subscribed_percent?: number | null;
};

type CapitalEventRowExtended = CapitalEventRow & {
  host_type?: EventHostType;
  audience?: string | null;
  host_name?: string | null;
  location_is_public?: boolean;
  event_type: EventType | 'tour';
};

type CapitalPartnerRowExtended = CapitalPartnerRow & {
  location?: string | null;
};

function mapReturnMetricType(value: string | undefined): ReturnMetricType {
  if (value === 'moic' || value === 'yield' || value === 'custom' || value === 'none') return value;
  return 'irr';
}

function mapReviewStatus(value: string | undefined): CapitalDealReviewStatus {
  if (value === 'generated' || value === 'needs_review' || value === 'approved' || value === 'rejected') return value;
  return 'draft';
}

function normalizeEventType(value: string): EventType {
  if (value === 'tour') return 'experience';
  if (value === 'dinner' || value === 'summit' || value === 'roundtable' || value === 'experience' || value === 'webinar') {
    return value;
  }
  return 'dinner';
}

function mapDeal(row: CapitalDealRowExtended, documents: CapitalDealDocumentRow[] = []): CapitalDeal {
  const whyPier = row.why_pier_selected ?? row.thesis ?? row.description;
  return {
    id: row.slug || row.id,
    databaseId: row.id,
    name: row.name,
    manager: row.manager_name,
    type: row.deal_type,
    assetClass: row.asset_class,
    status: row.status,
    targetSize: row.target_size,
    raisedSize: row.raised_size,
    allocationSubscribedPercent:
      row.allocation_subscribed_percent ??
      (row.target_size > 0 ? Math.min(100, Math.round((row.raised_size / row.target_size) * 100)) : 0),
    minCommitment: row.min_commitment ?? 0,
    currencyCode: row.currency_code,
    closeDate: row.close_date ?? row.created_at,
    publishedAt: row.published_at,
    targetIrr: row.target_irr ?? 0,
    moicTarget: row.moic_target ?? 0,
    returnMetricType: mapReturnMetricType(row.return_metric_type),
    returnDisplay: row.return_display ?? '',
    holdingPeriodYears: row.holding_period_years ?? null,
    liquidityNote: row.liquidity_note ?? '',
    vintage: row.vintage ?? new Date(row.created_at).getFullYear(),
    geography: row.geography ?? 'Global',
    sectors: row.sectors,
    description: row.description,
    thesis: row.thesis ?? row.description,
    whyPierSelected: whyPier,
    contacts: parseContacts(row.contacts),
    documents: documents.map(mapDealDocument),
    reviewStatus: mapReviewStatus(row.review_status),
    generatedSummary: row.generated_summary ?? '',
    disclaimer: row.disclaimer ?? '',
    offeringType: row.offering_type ?? '',
    jurisdiction: row.jurisdiction ?? '',
    eligibleInvestorRequirements: row.eligible_investor_requirements ?? '',
    visibilityTier: row.visibility_tier === 'admin' ? 'admin' : 'members',
    internalNotes: row.internal_notes ?? '',
  };
}

function mapEvent(row: CapitalEventRowExtended): CapitalEvent {
  return {
    id: row.slug || row.id,
    databaseId: row.id,
    title: row.title,
    status: row.status,
    type: normalizeEventType(row.event_type),
    hostType: row.host_type === 'partner' ? 'partner' : 'pier',
    hostName: row.host_name ?? '',
    audience: row.audience ?? '',
    date: row.starts_at,
    endDate: row.ends_at ?? row.starts_at,
    location: row.location,
    locationIsPublic: row.location_is_public ?? false,
    city: row.city,
    capacity: row.capacity,
    registeredCount: row.registered_count,
    registered: false,
    description: row.description,
    upcoming: row.status === 'upcoming',
    featured: row.featured,
    registrationUrl: row.external_registration_url ?? '',
    registrationLabel: (row.external_registration_label ?? '').trim() || 'Register',
    recapUrl: row.recap_url ?? '',
  };
}

function mapPartner(row: CapitalPartnerRowExtended): CapitalPartner {
  return {
    id: row.slug || row.id,
    databaseId: row.id,
    source: 'perk',
    name: row.name,
    category: row.category,
    tagline: row.tagline ?? '',
    benefit: row.benefit,
    benefits: [row.benefit],
    description: row.description,
    website: normalizeWebsite(row.website_url),
    location: row.location ?? '',
    featured: row.featured,
    imageUrl: '',
    minimumLevel: '',
    redemptionInstructions: '',
    ctaHref: `/concierge?partner=${encodeURIComponent(row.name)}`,
    ctaLabel: 'Request introduction',
    ctaExternal: false,
  };
}

function normalizePartnerCategory(category: string | null | undefined): PartnerCategory {
  const normalized = (category ?? '').trim().toLowerCase();

  if (normalized === 'hotel' || normalized === 'hotels') return 'hotels';
  if (normalized === 'restaurant' || normalized === 'restaurants' || normalized === 'dining') return 'dining';
  if (normalized === 'dining platform') return 'dining-platform';
  if (normalized === 'experience' || normalized === 'experiences') return 'experiences';
  if (normalized === 'health' || normalized === 'wellness') return 'wellness';
  if (normalized === 'transport' || normalized === 'transportation') return 'transportation';
  if (normalized === 'business') return 'business';
  if (normalized === 'coworking') return 'coworking';
  if (normalized === 'retail') return 'retail';
  if (normalized === 'service' || normalized === 'services') return 'services';
  if (normalized === 'travel') return 'travel';
  if (normalized === 'finance') return 'finance';
  if (normalized === 'lifestyle') return 'lifestyle';

  return 'lifestyle';
}

function capitalizeBenefit(benefit: string): string {
  const trimmed = benefit.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function compactBenefitList(benefits: string[]): string {
  const normalized = benefits.map(capitalizeBenefit).filter(Boolean);
  if (normalized.length === 0) return 'Member benefit available through Pier.';
  return normalized.join(', ');
}

function conciergeHref(source: CapitalPartnerSource, id: string, name: string): string {
  const params = new URLSearchParams({
    source,
    id,
    partner: name,
  });
  return `/concierge?${params.toString()}`;
}

function mapPerkPartner(row: PerkRow): CapitalPartner {
  const benefits = row.benefits ?? [];
  const externalLink = normalizeWebsite(row.external_link);
  const description = row.short_description || row.partner_description || compactBenefitList(benefits);

  return {
    id: `perk:${row.id}`,
    databaseId: row.id,
    source: 'perk',
    name: row.title,
    category: normalizePartnerCategory(row.category),
    tagline: row.partner_description,
    benefit: benefits[0] ?? row.short_description,
    benefits,
    description,
    website: externalLink,
    location: row.city,
    featured: row.featured,
    imageUrl: row.image_url,
    minimumLevel: row.minimum_level ?? '',
    redemptionInstructions: row.redemption_instructions ?? '',
    ctaHref: externalLink || conciergeHref('perk', row.id, row.title),
    ctaLabel: externalLink ? 'Redeem perk' : 'Request via concierge',
    ctaExternal: Boolean(externalLink),
  };
}

function sortPartners(a: CapitalPartner, b: CapitalPartner): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (a.category !== b.category) return a.category.localeCompare(b.category);
  return a.name.localeCompare(b.name);
}

function mapMember(row: CapitalMemberProfileRow): CapitalMember {
  return {
    id: row.slug || row.id,
    name: row.display_name,
    role: row.role,
    firm: row.firm,
    title: row.title ?? 'Member',
    location: row.location ?? 'Global',
    aum: row.aum_display ?? (row.aum_numeric !== null ? formatCurrencyAmount(row.currency_code, row.aum_numeric) : 'AUM undisclosed'),
    focusSectors: row.focus_sectors,
    verified: row.verified,
  };
}

function mapMemberProfile(row: CapitalMemberProfileRow): CapitalMemberProfile {
  return {
    ...mapMember(row),
    databaseId: row.id,
    memberId: row.member_id,
    slug: row.slug,
    displayName: row.display_name,
    bio: row.bio ?? '',
    investmentThesis: row.investment_thesis ?? '',
    aumDisplay: row.aum_display ?? '',
    aumNumeric: row.aum_numeric,
    currencyCode: row.currency_code,
    checkSize: formatCheckSize(row),
    checkSizeDisplay: row.check_size_display ?? '',
    checkSizeMin: row.check_size_min,
    checkSizeMax: row.check_size_max,
    status: row.status,
    publishedAt: row.published_at,
    isPublished: Boolean(row.published_at && row.status === 'active'),
  };
}

function mapDealInterest(row: CapitalDealInterestRow): CapitalDealInterest {
  return {
    id: row.id,
    dealId: row.deal_id,
    memberId: row.member_id,
    requestType: row.request_type,
    status: row.status,
  };
}

function mapEventRsvp(row: CapitalEventRsvpRow): CapitalEventRsvp {
  return {
    id: row.id,
    eventId: row.event_id,
    memberId: row.member_id,
    status: row.status,
  };
}

function mapPartnerIntro(row: CapitalPartnerIntroRow): CapitalPartnerIntro {
  return {
    id: row.id,
    partnerId: row.partner_id,
    memberId: row.member_id,
    status: row.status,
  };
}

function mapSourceMaterial(row: CapitalDealSourceMaterialRow): CapitalDealSourceMaterial {
  return {
    id: row.id,
    dealId: row.deal_id,
    label: row.label,
    materialType: row.material_type,
    storagePath: row.storage_path ?? '',
    externalUrl: row.external_url ?? '',
    originalFilename: row.original_filename ?? '',
    extractedText: row.extracted_text ?? '',
    generatedSummary: row.generated_summary ?? '',
    reviewStatus: mapReviewStatus(row.review_status),
    createdAt: row.created_at,
  };
}

function toAdminDealRow(input: AdminCapitalDealInput): Database['public']['Tables']['capital_deals']['Insert'] {
  return {
    slug: input.slug,
    name: input.name,
    manager_name: input.managerName,
    deal_type: input.dealType,
    asset_class: input.assetClass,
    status: input.status ?? 'pending',
    target_size: input.targetSize,
    raised_size: input.raisedSize ?? 0,
    allocation_subscribed_percent: input.allocationSubscribedPercent ?? 0,
    min_commitment: input.minCommitment ?? null,
    currency_code: input.currencyCode ?? 'USD',
    close_date: input.closeDate ?? null,
    target_irr: input.targetIrr ?? null,
    moic_target: input.moicTarget ?? null,
    return_metric_type: input.returnMetricType ?? 'irr',
    return_display: input.returnDisplay ?? null,
    holding_period_years: input.holdingPeriodYears ?? null,
    liquidity_note: input.liquidityNote ?? null,
    vintage: input.vintage ?? null,
    geography: input.geography ?? null,
    sectors: input.sectors ?? [],
    description: input.description,
    thesis: input.thesis ?? null,
    why_pier_selected: input.whyPierSelected ?? null,
    contacts: input.contacts ?? [],
    generated_summary: input.generatedSummary ?? null,
    disclaimer: input.disclaimer ?? null,
    offering_type: input.offeringType ?? null,
    jurisdiction: input.jurisdiction ?? null,
    eligible_investor_requirements: input.eligibleInvestorRequirements ?? null,
    internal_notes: input.internalNotes ?? null,
    review_status: input.generatedSummary ? 'generated' : 'draft',
    visibility_tier: 'admin',
    published_at: null,
    unpublished_at: new Date().toISOString(),
  };
}

function objectPathForDealFile(dealId: string, file: File, scope: 'source' | 'documents'): string {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `${scope}/${dealId}/${Date.now()}-${safeName}`;
}

function capitalWriteError(message: string): Error {
  if (message.includes('duplicate key value') || message.includes('23505')) {
    return new Error('This request already exists. The Pier team has your prior submission.');
  }

  return new Error(message);
}

export async function getAdminCapitalDeals(): Promise<CapitalDeal[]> {
  const { data, error } = await supabase
    .from('capital_deals')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Unable to load admin capital deals: ${error.message}`);

  return (data ?? []).map((deal) => mapDeal(deal));
}

export async function saveAdminCapitalDeal(input: AdminCapitalDealInput, dealId?: string): Promise<CapitalDeal> {
  if (dealId) {
    const row = toAdminDealRow(input);
    const { data, error } = await supabase
      .from('capital_deals')
      .update(row)
      .eq('id', dealId)
      .select('*')
      .single();

    if (error) throw new Error(`Unable to update capital deal: ${error.message}`);
    return mapDeal(data);
  }

  const { data, error } = await supabase
    .from('capital_deals')
    .insert(toAdminDealRow(input))
    .select('*')
    .single();

  if (error) throw new Error(`Unable to create capital deal: ${error.message}`);
  return mapDeal(data);
}

export async function publishAdminCapitalDeal(dealId: string, reviewerId: string, status: Exclude<DealStatus, 'pending'> = 'open'): Promise<void> {
  const { error } = await supabase
    .from('capital_deals')
    .update({
      status,
      published_at: new Date().toISOString(),
      review_status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      visibility_tier: 'members',
      unpublished_at: null,
    })
    .eq('id', dealId);

  if (error) throw new Error(`Unable to publish capital deal: ${error.message}`);
}

export async function unpublishAdminCapitalDeal(dealId: string): Promise<void> {
  const { error } = await supabase
    .from('capital_deals')
    .update({
      status: 'pending',
      published_at: null,
      visibility_tier: 'admin',
      unpublished_at: new Date().toISOString(),
    })
    .eq('id', dealId);

  if (error) throw new Error(`Unable to unpublish capital deal: ${error.message}`);
}

export async function getAdminCapitalDealSourceMaterials(dealId: string): Promise<CapitalDealSourceMaterial[]> {
  const { data, error } = await supabase
    .from('capital_deal_source_materials')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Unable to load source materials: ${error.message}`);
  return (data ?? []).map(mapSourceMaterial);
}

export async function getAdminCapitalDealDocuments(dealId: string): Promise<CapitalDealDocument[]> {
  const { data, error } = await supabase
    .from('capital_deal_documents')
    .select('*')
    .eq('deal_id', dealId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Unable to load deal documents: ${error.message}`);
  return (data ?? []).map(mapDealDocument);
}

export async function uploadAdminCapitalDealSourceMaterial(input: {
  dealId: string;
  label: string;
  materialType: string;
  file?: File | null;
  overview?: string;
  generatedSummary?: string;
}): Promise<CapitalDealSourceMaterial> {
  let storagePath: string | null = null;

  if (input.file) {
    storagePath = objectPathForDealFile(input.dealId, input.file, 'source');
    const { error: uploadError } = await supabase.storage
      .from('capital-deal-materials')
      .upload(storagePath, input.file, { contentType: input.file.type || undefined, upsert: true });

    if (uploadError) throw new Error(`Unable to upload source material: ${uploadError.message}`);
  }

  const { data, error } = await supabase
    .from('capital_deal_source_materials')
    .insert({
      deal_id: input.dealId,
      label: input.label,
      material_type: input.materialType,
      storage_path: storagePath,
      original_filename: input.file?.name ?? null,
      mime_type: input.file?.type || null,
      file_size_bytes: input.file?.size ?? null,
      extracted_text: input.overview?.trim() || null,
      generated_summary: input.generatedSummary?.trim() || null,
      review_status: input.generatedSummary?.trim() ? 'generated' : 'draft',
    })
    .select('*')
    .single();

  if (error) throw new Error(`Unable to save source material: ${error.message}`);
  return mapSourceMaterial(data);
}

export async function uploadAdminCapitalDealDocument(input: {
  dealId: string;
  label: string;
  documentType: CapitalDealDocument['type'];
  accessLevel: CapitalDealDocument['accessLevel'];
  file: File;
}): Promise<void> {
  const storagePath = objectPathForDealFile(input.dealId, input.file, 'documents');
  const { error: uploadError } = await supabase.storage
    .from('capital-deal-materials')
    .upload(storagePath, input.file, { contentType: input.file.type || undefined, upsert: true });

  if (uploadError) throw new Error(`Unable to upload deal document: ${uploadError.message}`);

  const { error } = await supabase.from('capital_deal_documents').insert({
    deal_id: input.dealId,
    label: input.label,
    document_type: input.documentType,
    access_level: input.accessLevel,
    storage_path: storagePath,
    file_size_bytes: input.file.size,
    display_size: `${Math.max(1, Math.round(input.file.size / 1024))} KB`,
  });

  if (error) throw new Error(`Unable to save deal document: ${error.message}`);
}

export async function getCapitalDealDocumentUrl(document: CapitalDealDocument): Promise<string> {
  if (document.externalUrl) return document.externalUrl;
  if (!document.storagePath) throw new Error('No document file is available yet.');

  const { data, error } = await supabase.storage
    .from('capital-deal-materials')
    .createSignedUrl(document.storagePath, 60);

  if (error || !data?.signedUrl) throw new Error(`Unable to create document link: ${error?.message ?? 'no URL returned'}`);
  return data.signedUrl;
}

export async function getCapitalDeals(): Promise<CapitalDeal[]> {
  const { data, error } = await supabase
    .from('capital_deals')
    .select('*')
    .not('published_at', 'is', null)
    .in('status', memberVisibleDealStatuses)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Unable to load capital deals: ${error.message}`);

  return (data ?? []).map((deal) => mapDeal(deal));
}

export async function getCapitalDealBySlugOrId(identifier: string): Promise<CapitalDeal | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);

  const dealQuery = supabase
    .from('capital_deals')
    .select('*')
    .not('published_at', 'is', null)
    .in('status', memberVisibleDealStatuses)
    .limit(1);

  const { data: deal, error: dealError } = isUuid
    ? await dealQuery.eq('id', identifier).maybeSingle()
    : await dealQuery.eq('slug', identifier).maybeSingle();

  if (dealError) throw new Error(`Unable to load capital deal: ${dealError.message}`);
  if (!deal) return null;

  const { data: documents, error: documentsError } = await supabase
    .from('capital_deal_documents')
    .select('*')
    .eq('deal_id', deal.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (documentsError) throw new Error(`Unable to load deal documents: ${documentsError.message}`);

  return mapDeal(deal, documents ?? []);
}

export async function getCapitalEvents(): Promise<CapitalEvent[]> {
  const { data, error } = await supabase
    .from('capital_events')
    .select('*')
    .not('published_at', 'is', null)
    .in('status', ['upcoming', 'completed'])
    .order('starts_at', { ascending: true });

  if (error) throw new Error(`Unable to load capital events: ${error.message}`);

  return (data ?? []).map(mapEvent);
}

export async function getCapitalEventsForMember(memberId: string): Promise<CapitalEvent[]> {
  const [events, rsvps] = await Promise.all([
    getCapitalEvents(),
    getMyCapitalEventRsvps(memberId),
  ]);
  const activeRsvps = new Set(
    rsvps
      .filter((rsvp) => rsvp.status === 'confirmed' || rsvp.status === 'attended')
      .map((rsvp) => rsvp.eventId)
  );

  return events.map((event) => ({
    ...event,
    registered: activeRsvps.has(event.databaseId),
  }));
}

export async function getCapitalPartners(): Promise<CapitalPartner[]> {
  const { data, error } = await supabase
    .from('perks')
    .select(
      'id,title,short_description,partner_description,benefits,image_url,category,city,tags,featured,minimum_level,redemption_instructions,external_link,reservation_integration,created_at,updated_at'
    )
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Unable to load member perks: ${error.message}`);

  return (data ?? []).map(mapPerkPartner).sort(sortPartners);
}

export async function getCapitalMembers(): Promise<CapitalMember[]> {
  const { data, error } = await supabase
    .from('capital_member_profiles')
    .select('*')
    .not('published_at', 'is', null)
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('display_name', { ascending: true });

  if (error) throw new Error(`Unable to load capital member profiles: ${error.message}`);

  return (data ?? []).map(mapMember);
}

export async function getMyCapitalMemberProfile(memberId: string): Promise<CapitalMemberProfile | null> {
  const { data, error } = await supabase
    .from('capital_member_profiles')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle();

  if (error) throw new Error(`Unable to load your capital member profile: ${error.message}`);

  return data ? mapMemberProfile(data) : null;
}

export async function updateMyCapitalMemberProfile(input: CapitalMemberProfileUpdateInput): Promise<CapitalMemberProfile> {
  const { data, error } = await supabase.rpc('update_my_capital_member_profile', {
    p_role: input.role ?? 'lp',
    p_display_name: input.displayName,
    p_firm: input.firm,
    p_title: input.title ?? null,
    p_location: input.location ?? null,
    p_bio: input.bio ?? null,
    p_investment_thesis: input.investmentThesis ?? null,
    p_focus_sectors: input.focusSectors ?? [],
    p_aum_display: input.aumDisplay ?? null,
    p_aum_numeric: input.aumNumeric ?? null,
    p_check_size_display: input.checkSizeDisplay ?? null,
    p_check_size_min: input.checkSizeMin ?? null,
    p_check_size_max: input.checkSizeMax ?? null,
    p_currency_code: input.currencyCode ?? 'USD',
  });

  if (error) throw new Error(`Unable to save your capital member profile: ${error.message}`);
  if (!data) throw new Error('Unable to save your capital member profile: no profile returned.');

  return mapMemberProfile(data);
}

export async function getMyCapitalDealInterests(memberId: string, dealId: string): Promise<CapitalDealInterest[]> {
  const { data, error } = await supabase
    .from('capital_deal_interests')
    .select('*')
    .eq('member_id', memberId)
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Unable to load your deal requests: ${error.message}`);

  return (data ?? []).map(mapDealInterest);
}

export async function createCapitalDealInterest(input: {
  dealId: string;
  memberId: string;
  requestType: CapitalDealInterestRequestType;
}): Promise<void> {
  const { error } = await supabase
    .from('capital_deal_interests')
    .insert({
      deal_id: input.dealId,
      member_id: input.memberId,
      request_type: input.requestType,
    });

  if (error) throw capitalWriteError(`Unable to submit deal request: ${error.message}`);
}

export async function getMyCapitalEventRsvps(memberId: string): Promise<CapitalEventRsvp[]> {
  const { data, error } = await supabase
    .from('capital_event_rsvps')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Unable to load your event RSVPs: ${error.message}`);

  return (data ?? []).map(mapEventRsvp);
}

export async function createCapitalEventRsvp(input: {
  eventId: string;
  memberId: string;
  status?: Extract<CapitalEventRsvpStatus, 'requested' | 'waitlisted'>;
}): Promise<void> {
  const { error } = await supabase
    .from('capital_event_rsvps')
    .insert({
      event_id: input.eventId,
      member_id: input.memberId,
      status: input.status ?? 'requested',
    });

  if (error) throw capitalWriteError(`Unable to submit event RSVP: ${error.message}`);
}

export async function getMyCapitalPartnerIntros(memberId: string): Promise<CapitalPartnerIntro[]> {
  const { data, error } = await supabase
    .from('capital_partner_intros')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Unable to load your partner intro requests: ${error.message}`);

  return (data ?? []).map(mapPartnerIntro);
}

export async function createCapitalPartnerIntro(input: {
  partnerId: string;
  memberId: string;
}): Promise<void> {
  const { error } = await supabase
    .from('capital_partner_intros')
    .insert({
      partner_id: input.partnerId,
      member_id: input.memberId,
      contact_preference: 'concierge',
    });

  if (error) throw capitalWriteError(`Unable to submit partner intro request: ${error.message}`);
}
