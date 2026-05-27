export type DealType = 'fund' | 'co-invest' | 'secondary' | 'spv';
export type DealStatus = 'open' | 'closing' | 'closed' | 'pending';
export type MemberRole = 'gp' | 'lp';
export type EventType = 'dinner' | 'summit' | 'roundtable' | 'experience' | 'webinar';
export type PartnerCategory = 'hotels' | 'restaurants' | 'travel' | 'lifestyle' | 'finance' | 'health';

export interface CapitalDeal {
  id: string;
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
  title: string;
  type: EventType;
  date: string;
  endDate: string;
  location: string;
  city: string;
  capacity: number | null;
  registeredCount: number;
  registered: boolean;
  description: string;
  upcoming: boolean;
  registrationUrl?: string;
  registrationLabel?: string;
  recapUrl?: string;
}

export interface CapitalPartner {
  id: string;
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
  role: MemberRole;
  firm: string;
  title: string;
  location: string;
  aum: string;
  focusSectors: string[];
  verified: boolean;
}

// TODO(Phase 5): Replace static mock data with read-only Supabase queries from capital_* tables.
export const deals: CapitalDeal[] = [
  {
    id: 'north-atlantic-i',
    name: 'North Atlantic Fund I',
    manager: 'Meridian Capital',
    type: 'fund',
    assetClass: 'Buyout',
    status: 'open',
    targetSize: 150_000_000,
    raisedSize: 72_000_000,
    minCommitment: 500_000,
    closeDate: '2026-08-31',
    targetIrr: 22,
    moicTarget: 2.5,
    vintage: 2026,
    geography: 'New York',
    sectors: ['Industrial', 'Consumer', 'Business Services'],
    description:
      'A lower-middle-market buyout fund targeting companies with USD 5-25M EBITDA across fragmented North American industries.',
    thesis:
      'Meridian targets businesses with recurring demand, operational complexity, and under-institutionalized ownership. The team sources through founder networks and sector operators, then drives margin expansion and disciplined bolt-on acquisitions in the first 24 months.',
    contacts: [
      { name: 'Alicia Vance', role: 'Managing Partner', email: 'alicia@meridian.example' },
      { name: 'Thomas Reid', role: 'Investor Relations', email: 'thomas@meridian.example' },
    ],
    documents: [
      { label: 'Investment Deck', type: 'deck', size: '3.4 MB' },
      { label: 'Executive Summary', type: 'memo', size: '0.8 MB' },
      { label: 'Tearsheet', type: 'tearsheet', size: '0.2 MB' },
    ],
  },
  {
    id: 'arbor-spv-7',
    name: 'Arbor SPV VII - SaaS Co-Invest',
    manager: 'Arbor Partners',
    type: 'co-invest',
    assetClass: 'Venture',
    status: 'closing',
    targetSize: 12_000_000,
    raisedSize: 9_600_000,
    minCommitment: 100_000,
    closeDate: '2026-05-25',
    targetIrr: 28,
    moicTarget: 4,
    vintage: 2026,
    geography: 'San Francisco',
    sectors: ['B2B SaaS', 'DevTools'],
    description:
      'Co-investment alongside Arbor in a Series B vertical SaaS company serving commercial real estate operators.',
    thesis:
      'The company sits inside a workflow-heavy vertical with high switching costs and strong expansion revenue. Arbor led the Series A and is preserving pro-rata capacity for Pier members at Series B terms.',
    contacts: [{ name: 'Priya Nair', role: 'General Partner', email: 'priya@arbor.example' }],
    documents: [
      { label: 'Company Deck', type: 'deck', size: '5.1 MB' },
      { label: 'Investment Memo', type: 'memo', size: '1.2 MB' },
      { label: 'Cap Table Summary', type: 'tearsheet', size: '0.1 MB' },
    ],
  },
  {
    id: 'ledger-secondary',
    name: 'Ledger Secondary Fund III',
    manager: 'Ledger Asset Management',
    type: 'secondary',
    assetClass: 'Venture',
    status: 'open',
    targetSize: 80_000_000,
    raisedSize: 31_000_000,
    minCommitment: 250_000,
    closeDate: '2026-09-15',
    targetIrr: 18,
    moicTarget: 2.1,
    vintage: 2026,
    geography: 'London',
    sectors: ['Fintech', 'Enterprise Software', 'Climate'],
    description:
      'Diversified secondaries vehicle acquiring LP interests and direct secondaries from premier venture portfolios.',
    thesis:
      'Ledger focuses on discounted access to maturing venture portfolios where mark-to-market pressure has created attractive entry points. The strategy gives LPs diversified exposure with shorter duration than blind-pool primary funds.',
    contacts: [{ name: 'Eleanor Shaw', role: 'Partner', email: 'eleanor@ledger.example' }],
    documents: [
      { label: 'Fund Overview', type: 'deck', size: '2.8 MB' },
      { label: 'Portfolio Construction Memo', type: 'memo', size: '1.0 MB' },
    ],
  },
  {
    id: 'tidewater-re',
    name: 'Tidewater RE Fund II',
    manager: 'Tidewater Capital',
    type: 'fund',
    assetClass: 'Real Estate',
    status: 'open',
    targetSize: 200_000_000,
    raisedSize: 118_000_000,
    minCommitment: 1_000_000,
    closeDate: '2026-10-01',
    targetIrr: 14,
    moicTarget: 1.8,
    vintage: 2026,
    geography: 'Miami',
    sectors: ['Multifamily', 'Industrial', 'Hospitality'],
    description:
      'Value-add real estate strategy targeting Sun Belt workforce housing and last-mile logistics assets.',
    thesis:
      'Tidewater underwrites durable migration, constrained supply, and operational mispricing in fragmented local markets. The team has direct operating control over renovation, leasing, and asset management.',
    contacts: [{ name: 'Julian Torres', role: 'Founder', email: 'julian@tidewater.example' }],
    documents: [{ label: 'Offering Memorandum', type: 'memo', size: '2.6 MB' }],
  },
  {
    id: 'harrow-credit',
    name: 'Harrow Direct Lending IV',
    manager: 'Harrow Credit Partners',
    type: 'fund',
    assetClass: 'Credit',
    status: 'open',
    targetSize: 300_000_000,
    raisedSize: 164_000_000,
    minCommitment: 1_000_000,
    closeDate: '2026-11-30',
    targetIrr: 12,
    moicTarget: 1.5,
    vintage: 2026,
    geography: 'Chicago',
    sectors: ['Healthcare', 'Technology', 'Business Services'],
    description:
      'Senior secured direct lending to private equity-backed middle-market companies with capital preservation focus.',
    thesis:
      'Harrow emphasizes first-lien seniority, sponsor quality, and covenants in defensive verticals. The fund targets attractive current yield without relying on aggressive terminal value assumptions.',
    contacts: [{ name: 'Michael Stern', role: 'Managing Director', email: 'michael@harrow.example' }],
    documents: [{ label: 'Strategy Deck', type: 'deck', size: '4.2 MB' }],
  },
  {
    id: 'canopy-climate-spv',
    name: 'Canopy Climate SPV II',
    manager: 'Canopy Ventures',
    type: 'spv',
    assetClass: 'Venture',
    status: 'pending',
    targetSize: 8_000_000,
    raisedSize: 2_200_000,
    minCommitment: 100_000,
    closeDate: '2026-06-30',
    targetIrr: 35,
    moicTarget: 5,
    vintage: 2026,
    geography: 'Boston',
    sectors: ['Climate Tech', 'Energy Storage'],
    description:
      'SPV for a Series A investment in a battery storage startup with signed utility offtake agreements.',
    thesis:
      'Canopy is backing a storage platform with contracted demand, credible technical de-risking, and a near-term deployment path across three utility markets.',
    contacts: [{ name: 'Raj Bhatia', role: 'Founder & GP', email: 'raj@canopy.example' }],
    documents: [{ label: 'Company Snapshot', type: 'tearsheet', size: '0.4 MB' }],
  },
];

// TODO(Phase 5): Replace static mock data with read-only Supabase queries from capital_events.
export const events: CapitalEvent[] = [
  {
    id: 'london-dinner-jun',
    title: 'London Principals Dinner',
    type: 'dinner',
    date: '2026-06-04T19:00:00',
    endDate: '2026-06-04T22:00:00',
    location: 'The Connaught, Carlos Place',
    city: 'London',
    capacity: 24,
    registeredCount: 20,
    registered: true,
    registrationUrl: '',
    registrationLabel: 'Register',
    recapUrl: '',
    description:
      'An intimate dinner for Pier principals: GPs and LPs at the frontier of emerging manager allocations. Conversation off the record. Seats strictly limited.',
    upcoming: true,
  },
  {
    id: 'ny-summit-q3',
    title: 'Q3 LP-GP Summit',
    type: 'summit',
    date: '2026-07-22T09:00:00',
    endDate: '2026-07-22T17:00:00',
    location: 'Four Seasons, 57 East 57th Street',
    city: 'New York',
    capacity: 60,
    registeredCount: 48,
    registered: false,
    registrationUrl: '',
    registrationLabel: 'Register',
    recapUrl: '',
    description:
      'Pier flagship quarterly gathering with panels and structured introductions between LPs deploying into emerging managers and GPs raising their next fund.',
    upcoming: true,
  },
  {
    id: 'sf-roundtable-may',
    title: 'West Coast Allocator Roundtable',
    type: 'roundtable',
    date: '2026-05-14T08:30:00',
    endDate: '2026-05-14T10:30:00',
    location: 'Rosewood Sand Hill',
    city: 'Menlo Park',
    capacity: 18,
    registeredCount: 18,
    registered: false,
    registrationUrl: '',
    registrationLabel: 'Register',
    recapUrl: '',
    description:
      'Breakfast roundtable for West Coast family offices and emerging manager GPs. Three prepared practitioners, open discussion, no slides.',
    upcoming: false,
  },
  {
    id: 'dubai-tour-apr',
    title: 'MENA Capital Tour - Dubai',
    type: 'experience',
    date: '2026-04-09T10:00:00',
    endDate: '2026-04-11T18:00:00',
    location: 'DIFC, Gate District',
    city: 'Dubai',
    capacity: 30,
    registeredCount: 30,
    registered: true,
    registrationUrl: '',
    registrationLabel: 'Register',
    recapUrl: '',
    description:
      'Three-day curated tour introducing Pier members to leading MENA family office allocators.',
    upcoming: false,
  },
];

// TODO(Phase 5): Replace static mock data with read-only Supabase queries from capital_partners.
export const partners: CapitalPartner[] = [
  {
    id: 'connaught',
    name: 'The Connaught',
    category: 'hotels',
    tagline: 'Mayfair, London',
    benefit: 'Suite upgrades, complimentary breakfast, and early check-in for Pier members.',
    description:
      'One of London finest five-star addresses. Pier members receive priority access during event weeks and preferred suite availability year-round.',
    website: 'theconnaught.co.uk',
    featured: true,
  },
  {
    id: 'aman-hotels',
    name: 'Aman Hotels',
    category: 'hotels',
    tagline: 'Global - 35 properties',
    benefit: 'USD 100 credit per stay and complimentary room upgrade when available.',
    description:
      'Access to Aman portfolio across ultra-luxury properties worldwide, with preferential pricing and direct booking support through Pier.',
    website: 'aman.com',
    featured: true,
  },
  {
    id: 'eleven-madison',
    name: 'Eleven Madison Park',
    category: 'restaurants',
    tagline: 'New York - 3 Michelin Stars',
    benefit: 'Priority reservation access and preferred seating for Pier members.',
    description:
      'Three Michelin star tasting menu in Manhattan. Pier members have access to a reserved allocation when available.',
    website: 'elevenmadisonpark.com',
    featured: false,
  },
  {
    id: 'core-club',
    name: 'Core Club',
    category: 'lifestyle',
    tagline: 'New York & Miami',
    benefit: 'Guest access for Pier members on selected event nights.',
    description:
      'A private members club relationship for Pier gatherings and member introductions in New York and Miami.',
    website: 'coreclub.com',
    featured: false,
  },
  {
    id: 'netjets',
    name: 'NetJets',
    category: 'travel',
    tagline: 'Private Aviation',
    benefit: 'Preferred fractional pricing and priority availability for Pier members.',
    description:
      'Pier members exploring fractional ownership can be connected to a dedicated NetJets representative.',
    website: 'netjets.com',
    featured: false,
  },
  {
    id: 'viridian',
    name: 'Viridian Advisory',
    category: 'finance',
    tagline: 'Tax & Estate Planning',
    benefit: 'Complimentary 60-minute consultation for new Pier members.',
    description:
      'Boutique family office advisory firm specializing in tax strategy, estate planning, and cross-border structuring.',
    website: 'viridianadvisory.com',
    featured: false,
  },
];

// TODO(Phase 5): Replace static mock data with read-only Supabase queries from capital_member_profiles.
export const members: CapitalMember[] = [
  {
    id: '1',
    name: 'Alicia Vance',
    role: 'gp',
    firm: 'Meridian Capital',
    title: 'Managing Partner',
    location: 'New York',
    aum: 'USD 320M',
    focusSectors: ['Buyout', 'Industrial'],
    verified: true,
  },
  {
    id: '2',
    name: 'James Whitfield',
    role: 'lp',
    firm: 'Whitfield Family Office',
    title: 'CIO',
    location: 'London',
    aum: 'USD 800M AUM',
    focusSectors: ['Venture', 'Secondaries'],
    verified: true,
  },
  {
    id: '3',
    name: 'Priya Nair',
    role: 'gp',
    firm: 'Arbor Partners',
    title: 'General Partner',
    location: 'San Francisco',
    aum: 'USD 180M',
    focusSectors: ['Venture', 'B2B SaaS'],
    verified: true,
  },
  {
    id: '4',
    name: 'Lars Eriksen',
    role: 'lp',
    firm: 'Eriksen Endowment',
    title: 'Head of Alternatives',
    location: 'Copenhagen',
    aum: 'USD 450M AUM',
    focusSectors: ['Credit', 'Infrastructure'],
    verified: true,
  },
  {
    id: '5',
    name: 'Sophie Duvall',
    role: 'lp',
    firm: 'Maison Duvall',
    title: 'Principal',
    location: 'Geneva',
    aum: 'USD 1.2B AUM',
    focusSectors: ['Real Estate', 'Private Equity'],
    verified: true,
  },
  {
    id: '6',
    name: 'Raj Bhatia',
    role: 'gp',
    firm: 'Canopy Ventures',
    title: 'Founder & GP',
    location: 'Boston',
    aum: 'USD 90M',
    focusSectors: ['Climate Tech', 'Hard Tech'],
    verified: true,
  },
  {
    id: '7',
    name: 'Margaret Thornton',
    role: 'lp',
    firm: 'Thornton Foundation',
    title: 'Executive Director',
    location: 'Chicago',
    aum: 'USD 220M AUM',
    focusSectors: ['Impact', 'Venture'],
    verified: true,
  },
  {
    id: '8',
    name: 'Kenji Mori',
    role: 'gp',
    firm: 'Pacific Bridge Capital',
    title: 'Managing Director',
    location: 'Tokyo',
    aum: 'USD 270M',
    focusSectors: ['Growth', 'Asia-Pacific'],
    verified: false,
  },
];

export const typeLabels: Record<DealType, string> = {
  fund: 'Fund',
  'co-invest': 'Co-Invest',
  secondary: 'Secondary',
  spv: 'SPV',
};

export const eventTypeLabels: Record<EventType, string> = {
  dinner: 'Dinner',
  summit: 'Summit',
  roundtable: 'Roundtable',
  experience: 'Experience',
  webinar: 'Webinar',
};

export const partnerCategoryLabels: Record<PartnerCategory, string> = {
  hotels: 'Hotels',
  restaurants: 'Restaurants',
  travel: 'Travel',
  lifestyle: 'Lifestyle',
  finance: 'Finance',
  health: 'Health',
};
