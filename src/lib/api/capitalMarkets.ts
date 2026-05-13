import { supabase } from '../supabase';
import type { Database, Json } from '../../types/supabase';

export type DealType = 'fund' | 'co-invest' | 'secondary' | 'spv';
export type DealStatus = 'open' | 'closing' | 'closed' | 'pending';
export type CapitalMemberRole = 'gp' | 'lp';
export type CapitalMemberProfileStatus = 'draft' | 'active' | 'hidden' | 'archived';
export type EventType = 'dinner' | 'summit' | 'roundtable' | 'tour' | 'webinar';
export type PartnerCategory = 'hotels' | 'restaurants' | 'travel' | 'lifestyle' | 'finance' | 'health';

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
  minCommitment: number;
  closeDate: string;
  targetIrr: number;
  moicTarget: number;
  vintage: number;
  geography: string;
  sectors: string[];
  description: string;
  thesis: string;
  contacts: Array<{ name: string; role: string; email: string }>;
  documents: Array<{ label: string; type: string; size: string }>;
}

export interface CapitalEvent {
  id: string;
  databaseId: string;
  title: string;
  status: 'draft' | 'upcoming' | 'completed' | 'cancelled';
  type: EventType;
  date: string;
  endDate: string;
  location: string;
  city: string;
  /** Null when capacity is not published (no misleading progress bar). */
  capacity: number | null;
  registeredCount: number;
  registered: boolean;
  description: string;
  upcoming: boolean;
  /** Off-platform registration (e.g. Luma). Empty when unset. */
  registrationUrl: string;
  registrationLabel: string;
  recapUrl: string;
}

export interface CapitalPartner {
  id: string;
  databaseId: string;
  name: string;
  category: PartnerCategory;
  tagline: string;
  benefit: string;
  description: string;
  website: string;
  featured: boolean;
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

type CapitalDealRow = Database['public']['Tables']['capital_deals']['Row'];
type CapitalDealDocumentRow = Database['public']['Tables']['capital_deal_documents']['Row'];
type CapitalEventRow = Database['public']['Tables']['capital_events']['Row'];
type CapitalPartnerRow = Database['public']['Tables']['capital_partners']['Row'];
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
  if (!website) return '';
  return website.startsWith('http://') || website.startsWith('https://') ? website : `https://${website}`;
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
    label: row.label,
    type: row.document_type,
    size: row.display_size ?? (row.file_size_bytes ? `${Math.round(row.file_size_bytes / 1024)} KB` : 'Available'),
  };
}

function mapDeal(row: CapitalDealRow, documents: CapitalDealDocumentRow[] = []): CapitalDeal {
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
    minCommitment: row.min_commitment ?? 0,
    closeDate: row.close_date ?? row.created_at,
    targetIrr: row.target_irr ?? 0,
    moicTarget: row.moic_target ?? 0,
    vintage: row.vintage ?? new Date(row.created_at).getFullYear(),
    geography: row.geography ?? 'Global',
    sectors: row.sectors,
    description: row.description,
    thesis: row.thesis ?? row.description,
    contacts: parseContacts(row.contacts),
    documents: documents.map(mapDealDocument),
  };
}

function mapEvent(row: CapitalEventRow): CapitalEvent {
  return {
    id: row.slug || row.id,
    databaseId: row.id,
    title: row.title,
    status: row.status,
    type: row.event_type,
    date: row.starts_at,
    endDate: row.ends_at ?? row.starts_at,
    location: row.location,
    city: row.city,
    capacity: row.capacity,
    registeredCount: row.registered_count,
    registered: false,
    description: row.description,
    upcoming: row.status === 'upcoming',
    registrationUrl: row.external_registration_url ?? '',
    registrationLabel: (row.external_registration_label ?? '').trim() || 'Register',
    recapUrl: row.recap_url ?? '',
  };
}

function mapPartner(row: CapitalPartnerRow): CapitalPartner {
  return {
    id: row.slug || row.id,
    databaseId: row.id,
    name: row.name,
    category: row.category,
    tagline: row.tagline ?? '',
    benefit: row.benefit,
    description: row.description,
    website: normalizeWebsite(row.website_url),
    featured: row.featured,
  };
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

function capitalWriteError(message: string): Error {
  if (message.includes('duplicate key value') || message.includes('23505')) {
    return new Error('This request already exists. The Pier team has your prior submission.');
  }

  return new Error(message);
}

export async function getCapitalDeals(): Promise<CapitalDeal[]> {
  const { data, error } = await supabase
    .from('capital_deals')
    .select('*')
    .not('published_at', 'is', null)
    .in('status', memberVisibleDealStatuses)
    .order('sort_order', { ascending: true })
    .order('close_date', { ascending: true });

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
    .from('capital_partners')
    .select('*')
    .not('published_at', 'is', null)
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(`Unable to load capital partners: ${error.message}`);

  return (data ?? []).map(mapPartner);
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
