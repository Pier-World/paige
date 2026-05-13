#!/usr/bin/env node
/**
 * Generates supabase/migrations/20260515131000_seed_capital_markets_population.sql
 * Run: node scripts/generate-capital-markets-seed.mjs
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '../supabase/migrations/20260515131000_seed_capital_markets_population.sql');

function esc(s) {
  return String(s).replace(/'/g, "''");
}

/** Reference date: May 13, 2026 — events before are completed; on/after upcoming */
const CUTOFF = new Date('2026-05-13T12:00:00-04:00');

const events = [
  { slug: 'forseeable-future-jan-2026', title: 'Forseeable Future', type: 'dinner', start: '2026-01-27T18:00:00-05:00', end: '2026-01-27T22:00:00-05:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'Opening salvo of the year: a seated dinner for Pier GPs and LPs to compare notes on allocator priorities and manager selection. Chatham House rules; curated seating.', aud: 'GPs and LPs', feat: false },
  { slug: 'michael-andrews-bespoke-evening-feb-2026', title: 'A Bespoke Evening: Michael Andrews suiting', type: 'dinner', start: '2026-02-12T18:00:00-05:00', end: '2026-02-12T22:30:00-05:00', city: 'New York', loc: 'Manhattan', desc: 'A small-format evening built around craft and fit—tailoring as a lens for how leaders present in rooms that matter. For members who appreciate detail and discretion.', aud: 'GPs & LPs', feat: false },
  { slug: 'rvip-lp-dinner-feb-2026', title: 'RVIP LP Dinner', type: 'dinner', start: '2026-02-19T18:30:00-06:00', end: '2026-02-19T22:00:00-06:00', city: 'Nashville', loc: 'Nashville', desc: 'Allocator-focused dinner in Nashville: candid LP conversation, emerging manager themes, and the kind of introductions that happen after the last pour.', aud: 'LPs and invited guests', feat: false },
  { slug: 'oceans-gun-club-night-mar-2026', title: 'Oceans Gun Club Night', type: 'dinner', start: '2026-03-05T18:30:00-05:00', end: '2026-03-05T22:00:00-05:00', city: 'New York', loc: 'New York City', desc: 'An unconventional Pier night out—precision, discipline, and a relaxed social layer for members who like their networking with a bit of edge.', aud: 'Members', feat: false },
  { slug: 'sxsw-wellness-house-2026', title: 'SxSW Wellness House', type: 'tour', start: '2026-03-14T09:00:00-05:00', end: '2026-03-16T21:00:00-05:00', city: 'Austin', loc: 'Austin — multi-day activation', desc: 'A Pier presence during South by: daytime programming focused on longevity, performance, and founder stamina—plus serendipitous collisions with the Pier network across the city.', aud: 'Members & guests', feat: false },
  { slug: 'gp-lp-event-angellist-mar-2026', title: 'GP & LP Event with Angelist', type: 'roundtable', start: '2026-03-18T18:30:00-04:00', end: '2026-03-18T21:30:00-04:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'Structured GP/LP conversation on early-stage access, pacing, and diligence—designed for serious check-writers and disciplined emerging managers.', aud: 'GPs and LPs', feat: false },
  { slug: 'interesting-persons-dinner-mar-2026', title: 'Interesting Persons Dinner', type: 'dinner', start: '2026-03-24T18:30:00-04:00', end: '2026-03-24T22:30:00-04:00', city: 'New York', loc: 'New York City', desc: 'The Pier tradition: one table, no speeches, only people you will actually want to follow up with. Nomination-led guest list.', aud: 'Invite-only', feat: false },
  { slug: 'otis-ai-cpg-founder-dinner-apr-2026', title: 'Otis AI CPG Founder + Investor Dinner', type: 'dinner', start: '2026-04-15T18:30:00-04:00', end: '2026-04-15T22:00:00-04:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'CPG operators and capital partners in one room—AI-led growth, retail realities, and what diligence looks like when the product is on a shelf.', aud: 'Founders & investors', feat: false },
  { slug: 'right-to-invest-dinner-apr-2026', title: 'Right to Invest dinner', type: 'dinner', start: '2026-04-22T18:30:00-04:00', end: '2026-04-22T22:30:00-04:00', city: 'New York', loc: 'Magic Room at The Ned', desc: 'A focused evening on access and alignment—how allocators think about concentration, rights, and long-term incentives in private markets.', aud: 'Members', feat: false },
  { slug: 'rvip-allocator-intimate-dinner-may-2026', title: 'RVIP Allocator Intimate Dinner (6-8 ppl)', type: 'roundtable', start: '2026-05-05T18:30:00-07:00', end: '2026-05-06T22:00:00-07:00', city: 'San Francisco', loc: 'San Francisco', desc: 'Micro-format allocator dinner: six to eight seats, high signal, zero pageantry. Built for candid portfolio construction conversation.', aud: 'Allocators', feat: false },
  { slug: 'series-a-b-dinner-may-2026', title: 'Series A/B Dinner', type: 'dinner', start: '2026-05-13T18:30:00-04:00', end: '2026-05-13T22:30:00-04:00', city: 'New York', loc: 'Carne Mare', desc: 'Growth-stage operators and the capital partners who back them—conversation tuned to scaling teams, boards, and the next financing chapter.', aud: 'Founders & investors', feat: true },
  { slug: 'allocators-wine-tasting-may-2026', title: 'Allocators Wine Tasting Event', type: 'dinner', start: '2026-05-19T18:30:00-04:00', end: '2026-05-19T22:00:00-04:00', city: 'New York', loc: 'The Ned', desc: 'A refined allocator social: structured tasting, unstructured chemistry, and the kind of follow-ups that turn into real mandates.', aud: 'Allocators', feat: true },
  { slug: 'pier-ned-wristcheck-timepieces-may-2026', title: 'Pier x The Ned x Wristcheck Timepieces Event', type: 'dinner', start: '2026-05-20T18:30:00-04:00', end: '2026-05-20T22:00:00-04:00', city: 'New York', loc: 'The Ned', desc: 'Collectors and capital partners—design, provenance, and the discipline of long-term conviction. Invite-only; details to confirmed guests.', aud: 'Watch collectors', feat: false },
  { slug: 'austin-cota-raceday-may-2026', title: 'Austin COTA Raceday', type: 'tour', start: '2026-05-22T09:00:00-05:00', end: '2026-05-22T19:00:00-05:00', city: 'Austin', loc: 'Circuit of The Americas', desc: 'All-day Pier energy in Austin—sport, hospitality, and the side conversations that happen between sessions on the paddock.', aud: 'Members', feat: false },
  { slug: 'boston-techweek-may-2026', title: 'Boston TechWeek', type: 'summit', start: '2026-05-29T18:30:00-04:00', end: '2026-05-29T22:00:00-04:00', city: 'Boston', loc: 'Boston', desc: 'Pier presence during TechWeek Boston: a hosted dinner connecting founders, operators, and capital with a bias toward durable companies.', aud: 'Partners & members', feat: false },
  { slug: 'right-to-invest-techweek-jun-2026', title: 'Right to Invest - Techweek', type: 'summit', start: '2026-06-01T18:00:00-04:00', end: '2026-06-01T21:30:00-04:00', city: 'New York', loc: 'New York City', desc: 'A TechWeek-adjacent session on access and investor rights—clear frameworks, sharp questions, and Pier-standard hospitality.', aud: 'Members', feat: false },
  { slug: 'foreseeable-future-vip-dinner-jun-2026', title: 'Foreseeable Future VIP Dinner', type: 'dinner', start: '2026-06-08T18:30:00-04:00', end: '2026-06-08T22:30:00-04:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'VIP table ahead of the gala: tighter group, longer conversations, and a focus on relationships that compound.', aud: 'VIP members', feat: false },
  { slug: 'foreseeable-future-gala-jun-2026', title: 'Foreseeable Future Gala', type: 'summit', start: '2026-06-09T18:00:00-04:00', end: '2026-06-09T23:00:00-04:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'The marquee evening—black tie optional, high conviction required. A celebration of the Pier network and the year ahead.', aud: 'Members & guests', feat: true },
  { slug: 'collective-poker-series-jun-2026', title: 'The Collective Poker Series', type: 'dinner', start: '2026-06-11T18:30:00-04:00', end: '2026-06-11T23:00:00-04:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'Friendly stakes and serious operators—an informal Pier tradition for members who prefer their networking with a deck of cards.', aud: 'Members', feat: false },
  { slug: 'sweet-honey-farm-rooftop-jun-2026', title: 'Sweet Honey Farm with Rooftop Series', type: 'tour', start: '2026-06-13T16:00:00-04:00', end: '2026-06-13T22:00:00-04:00', city: 'New York', loc: 'Sweet Honey Farm', desc: 'Golden-hour programming: farm setting, rooftop energy, and a cross-section of founders and capital partners outside the usual city rooms.', aud: 'Members', feat: false },
  { slug: 'abundance-dinner-jun-2026', title: 'Abundance Dinner', type: 'dinner', start: '2026-06-15T18:00:00-04:00', end: '2026-06-15T22:00:00-04:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'Operators and investors exploring how ambitious infrastructure and civic-minded founders intersect—conversation-forward, policy-aware, optimistic.', aud: 'Poli-aware operators & founders', feat: false },
  { slug: 'space-auction-joopiter-jun-2026', title: 'Space Auction with Joopiter', type: 'summit', start: '2026-06-04T18:30:00-04:00', end: '2026-06-04T22:00:00-04:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'Culture meets capital—an auction-adjacent evening for members who collect at the intersection of art, taste, and narrative. Date subject to final venue confirmation.', aud: 'Members', feat: false },
  { slug: 'gp-labs-amsterdam-trip-jun-2026', title: 'GP Labs Amsterdam Trip', type: 'tour', start: '2026-06-27T08:00:00+02:00', end: '2026-06-30T20:00:00+02:00', city: 'Amsterdam', loc: 'Amsterdam, Netherlands', desc: 'Multi-day Pier travel: curated sessions with local operators and global allocators, plus the unstructured time where real partnerships form.', aud: 'GPs & invited LPs', feat: true },
  { slug: 'collective-poker-series-jul-2026', title: 'The Collective Poker Series', type: 'dinner', start: '2026-07-09T18:30:00-04:00', end: '2026-07-09T23:00:00-04:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'Friendly stakes and serious operators—an informal Pier tradition for members who prefer their networking with a deck of cards.', aud: 'Members', feat: false },
  { slug: 'casino-night-jul-2026', title: 'Casino Night', type: 'dinner', start: '2026-07-16T18:30:00-04:00', end: '2026-07-16T23:30:00-04:00', city: 'New York', loc: 'The Portrait Bar & Library at The Public; Maxwell Social', desc: 'A high-energy Pier social across iconic Manhattan rooms—champagne, blackjack, and introductions that do not feel like networking.', aud: 'Members (capacity-limited)', feat: false },
  { slug: 'hamptons-polo-weekend-jul-2026', title: 'Hamptons Polo Weekend 2', type: 'tour', start: '2026-07-25T12:00:00-04:00', end: '2026-07-25T20:00:00-04:00', city: 'Hamptons', loc: 'East End, Long Island', desc: 'Sun, sport, and allocator small talk—Hamptons programming built for members who want summer to feel like summer.', aud: 'Members & guests', feat: false },
  { slug: 'collective-poker-series-aug-2026', title: 'The Collective Poker Series', type: 'dinner', start: '2026-08-13T18:30:00-04:00', end: '2026-08-13T23:00:00-04:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'Friendly stakes and serious operators—an informal Pier tradition for members who prefer their networking with a deck of cards.', aud: 'Members', feat: false },
  { slug: 'chamberlain-art-shelter-island-aug-2026', title: 'Chamberlain Art Shelter Island and Yacht Cruise', type: 'tour', start: '2026-08-14T10:00:00-04:00', end: '2026-08-16T18:00:00-04:00', city: 'Shelter Island', loc: 'Shelter Island, NY — art program & yacht', desc: 'Weekend escape: private art experiences and water time—built for deeper relationships than a single dinner allows.', aud: 'Members', feat: true },
  { slug: 'collective-poker-series-sep-2026', title: 'The Collective Poker Series', type: 'dinner', start: '2026-09-10T18:30:00-04:00', end: '2026-09-10T23:00:00-04:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'Friendly stakes and serious operators—an informal Pier tradition for members who prefer their networking with a deck of cards.', aud: 'Members', feat: false },
  { slug: 'collective-poker-series-oct-2026', title: 'The Collective Poker Series', type: 'dinner', start: '2026-10-01T18:30:00-04:00', end: '2026-10-01T23:00:00-04:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'Friendly stakes and serious operators—an informal Pier tradition for members who prefer their networking with a deck of cards.', aud: 'Members', feat: false },
  { slug: 'super-secret-tech-conference-nov-2026', title: 'Super Secret Tech Conference', type: 'summit', start: '2026-11-12T09:00:00-05:00', end: '2026-11-12T19:00:00-05:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'Members know the drill: off-calendar programming during a major tech week—high signal, invitation-only, details released to confirmed guests only.', aud: 'Members', feat: false },
  { slug: 'collective-poker-series-nov-2026', title: 'The Collective Poker Series', type: 'dinner', start: '2026-11-05T18:30:00-05:00', end: '2026-11-05T23:00:00-05:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'Friendly stakes and serious operators—an informal Pier tradition for members who prefer their networking with a deck of cards.', aud: 'Members', feat: false },
  { slug: 'collective-poker-invitational-dec-2026', title: 'The Collective Poker Series Invitational', type: 'dinner', start: '2026-12-10T18:30:00-05:00', end: '2026-12-10T23:30:00-05:00', city: 'New York', loc: 'Private Pier venue — details to confirmed guests', desc: 'Season closer: invitational table, elevated format, and the members who have shown up all year.', aud: 'Invited members', feat: true },
];

function statusFor(e) {
  const t = new Date(e.start);
  return t < CUTOFF ? 'completed' : 'upcoming';
}

const eventValues = events
  .map((e, i) => {
    const st = statusFor(e);
    const recap = st === 'completed' ? 'NULL' : 'NULL'; // no fake recap URLs
    return `(
  '${esc(e.slug)}',
  '${esc(e.title)}',
  '${e.type}',
  '${st}',
  timestamptz '${e.start}',
  timestamptz '${e.end}',
  '${esc(e.loc)}',
  '${esc(e.city)}',
  NULL,
  0,
  '${esc(e.desc + ' Audience: ' + e.aud + '.')}',
  ${recap},
  ${e.feat},
  ${i + 1},
  timezone('utc', now()),
  NULL,
  NULL
)`;
  })
  .join(',\n');

const header = `/*
  # Seed capital markets catalog (illustrative / member-facing)

  Source events: docs/seeds/PIER_Master_Event_Calendar_2026_Events.csv
  Financial columns from the spreadsheet are NOT imported.

  Idempotent: uses ON CONFLICT DO NOTHING on natural keys (slug) where supported.
  For capital_events / deals / partners / profiles: delete by slug then insert (dev-friendly) —
  instead we use INSERT ... ON CONFLICT (slug) DO UPDATE for events only if unique on slug.

  Postgres: ON CONFLICT requires unique constraint. capital_events has UNIQUE(slug).

  Strategy: INSERT with ON CONFLICT (slug) DO NOTHING for events; for other tables same.
*/

`;

const membersSql = `
INSERT INTO public.capital_member_profiles (
  slug, display_name, role, firm, title, location, aum_display, aum_numeric, currency_code,
  focus_sectors, bio, investment_thesis, verified, status, sort_order, published_at, member_id,
  check_size_display, check_size_min, check_size_max
) VALUES
('gp-elena-voss', 'Elena Voss', 'gp', 'Harborline Partners', 'Managing Partner', 'New York', '$1.2B AUM', 1200000000, 'USD',
 ARRAY['Software','Fintech','Climate'], 'Former growth equity partner; now building a concentrated early growth portfolio with a services-heavy diligence model.',
 'Back exceptional founders in capital-light software where distribution is the moat.', true, 'active', 1, timezone('utc', now()), NULL,
 'USD 500k – 5M', 500000, 5000000),
('gp-marcus-wei', 'Marcus Wei', 'gp', 'Northline Ventures', 'Founder & GP', 'San Francisco', '$420M Fund III', 420000000, 'USD',
 ARRAY['AI Infra','Cybersecurity','DevTools'], 'Operator-turned-investor; prefers technical diligence led by practitioners, not slide decks.',
 'Lead rounds where product velocity and enterprise pull can be measured in quarters, not years.', true, 'active', 2, timezone('utc', now()), NULL,
 'USD 2M – 8M', 2000000, 8000000),
('gp-sarah-okonkwo', 'Sarah Okonkwo', 'gp', 'Compass Foundry', 'Partner', 'London', '€180M early-stage', 180000000, 'EUR',
 ARRAY['Consumer','Marketplaces','Health'], 'Built two category-leading brands before moving to the investing side; focuses on Europe–US expansion stories.',
 'Partner with founders who treat brand and community as compounding assets.', true, 'active', 3, timezone('utc', now()), NULL,
 'EUR 1M – 4M', 1000000, 4000000),
('lp-james-cole', 'James Cole', 'lp', 'Lakeshore Family Office', 'CIO', 'Chicago', 'Multi-strategy allocator', NULL, 'USD',
 ARRAY['Private Equity','Secondaries','Credit'], 'Leads private markets for a multi-generational family office with a bias toward liquidity planning.',
 'Seeking disciplined managers with aligned economics and transparent portfolio construction.', true, 'active', 10, timezone('utc', now()), NULL,
 'USD 5M – 25M', 5000000, 25000000),
('lp-amira-hassan', 'Amira Hassan', 'lp', 'Crescent Endowment', 'Head of Private Investments', 'Boston', '$3.8B endowment', 3800000000, 'USD',
 ARRAY['Venture','Real Assets','Venture Growth'], 'Endowment allocator focused on durable cash flows and mission-aligned innovation.',
 'Writes meaningful commitments to managers who can articulate downside first.', true, 'active', 11, timezone('utc', now()), NULL,
 'USD 10M – 50M', 10000000, 50000000),
('lp-david-park', 'David Park', 'lp', 'Meridian Pension Trust', 'Senior Investment Director', 'Toronto', 'CAD 22B plan assets', 22000000000, 'CAD',
 ARRAY['Infrastructure','Private Credit','Buyouts'], 'Large plan allocator with a governance-first approach and a preference for co-invest windows.',
 'Interested in scale managers with institutional reporting and clear fee mechanics.', false, 'active', 12, timezone('utc', now()), NULL,
 'CAD 15M – 75M', 15000000, 75000000)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  firm = EXCLUDED.firm,
  title = EXCLUDED.title,
  bio = EXCLUDED.bio,
  investment_thesis = EXCLUDED.investment_thesis,
  updated_at = timezone('utc', now());
`;

const dealsSql = `
INSERT INTO public.capital_deals (
  slug, name, manager_name, deal_type, asset_class, status, target_size, raised_size, min_commitment,
  currency_code, close_date, target_irr, moic_target, vintage, geography, sectors, description, thesis,
  contacts, sort_order, published_at
) VALUES
('illustrative-growth-fund-vii', 'Illustrative Growth Fund VII', 'Harborline Partners', 'fund', 'Venture', 'open',
 250000000, 142000000, 2500000, 'USD', '2026-09-30', 22, 2.8, 2026, 'North America',
 ARRAY['Software','AI Applications'],
 'A concentrated early growth fund focused on capital-efficient software with enterprise pull. Illustrative listing for member navigation.',
 'Thesis: lead or co-lead where velocity metrics and net retention can be diligenced with customers in the loop.',
 '[{"name":"IR Desk","role":"Investor relations","email":""}]'::jsonb, 1, timezone('utc', now())),
('illustrative-co-invest-ai-infra', 'Illustrative Co-Invest: AI Infrastructure', 'Northline Ventures', 'co-invest', 'Venture', 'closing',
 45000000, 38000000, 500000, 'USD', '2026-06-15', 28, 3.2, 2025, 'United States',
 ARRAY['AI Infra','Semiconductors'],
 'Single-asset co-invest alongside a known institutional round—illustrative only, not an offer to subscribe.',
 'Underwrite like a lead: power, cooling, and software margins must clear a stressed case.',
 '[{"name":"Deal team","role":"Partner","email":""}]'::jsonb, 2, timezone('utc', now())),
('illustrative-spv-secondaries-strip', 'Illustrative SPV: Secondaries Strip', 'Compass Foundry', 'spv', 'Secondaries', 'open',
 12000000, 6200000, 250000, 'USD', '2026-07-01', 16, 1.9, 2024, 'Europe / US',
 ARRAY['Secondaries','Marketplaces'],
 'Small SPV to acquire a strip of secondary interests in a consumer marketplace—illustrative profile for UI testing.',
 'Focus on seller quality and concentration limits; prefer diversified LP sellers.',
 '[{"name":"SPV admin","role":"Administrator","email":""}]'::jsonb, 3, timezone('utc', now())),
('illustrative-buyout-fund-v', 'Illustrative Buyout Fund V', 'Lakeshore Capital Partners', 'fund', 'Buyouts', 'closed',
 1800000000, 1800000000, 10000000, 'USD', '2025-12-01', 18, 2.2, 2022, 'North America',
 ARRAY['Industrials','Business Services'],
 'Control buyouts in founder-owned industrials and services—illustrative closed fund entry.',
 'Operational improvement playbook with conservative leverage.',
 '[{"name":"Partner","role":"Investor relations","email":""}]'::jsonb, 4, timezone('utc', now())),
('illustrative-private-credit-income', 'Illustrative Private Credit Income', 'Meridian Credit Partners', 'fund', 'Credit', 'open',
 400000000, 210000000, 1000000, 'USD', '2026-11-30', 11, 1.45, 2025, 'North America',
 ARRAY['Private Credit','Asset-backed'],
 'Senior secured lending to middle-market operators with covenant-heavy structures—illustrative.',
 'Income-first; avoid cyclical tails without hard collateral.',
 '[{"name":"Capital formation","role":"IR","email":""}]'::jsonb, 5, timezone('utc', now())),
('illustrative-co-invest-climate-infra', 'Illustrative Co-Invest: Climate Infrastructure', 'Northline Ventures', 'co-invest', 'Infrastructure', 'open',
 60000000, 12000000, 1000000, 'USD', '2026-08-20', 14, 2.1, 2026, 'United States',
 ARRAY['Climate','Energy'],
 'Project finance adjacent co-invest with contracted revenue—illustrative.',
 'Underwrite offtake, counterparty, and construction risk explicitly.',
 '[{"name":"Infra lead","role":"Partner","email":""}]'::jsonb, 6, timezone('utc', now())),
('illustrative-secondary-fund-iii', 'Illustrative Secondary Fund III', 'Harborline Partners', 'secondary', 'Secondaries', 'closing',
 500000000, 410000000, 5000000, 'USD', '2026-05-30', 15, 1.7, 2024, 'Global',
 ARRAY['Secondaries','Venture'],
 'LP-led secondaries and GP-led continuation vehicles—illustrative.',
 'Price discipline and diversification across vintages.',
 '[{"name":"Secondaries desk","role":"Principal","email":""}]'::jsonb, 7, timezone('utc', now())),
('illustrative-spv-consumer-roll-up', 'Illustrative SPV: Consumer Roll-Up', 'Compass Foundry', 'spv', 'Buyouts', 'open',
 35000000, 8000000, 500000, 'EUR', '2026-10-15', 20, 2.4, 2025, 'Western Europe',
 ARRAY['Consumer','Marketplaces'],
 'Single-brand roll-up with a repeatable M&A playbook—illustrative.',
 'Margin expansion through procurement and channel mix.',
 '[{"name":"Deal partner","role":"Partner","email":""}]'::jsonb, 8, timezone('utc', now()))
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  raised_size = EXCLUDED.raised_size,
  updated_at = timezone('utc', now());
`;

const partnersSql = `
INSERT INTO public.capital_partners (
  slug, name, category, tagline, benefit, description, website_url, featured, status, sort_order, published_at
) VALUES
('aman-new-york', 'Aman New York', 'hotels', 'Urban sanctuary above Midtown', 'Preferred arrival experience and Pier-member recognition on eligible stays',
 'Aman New York pairs Japanese minimalism with Manhattan energy. Pier members receive thoughtful recognition at arrival where available, and our concierge can coordinate itineraries that protect time.',
 'https://www.aman.com/hotels/aman-new-york', true, 'active', 1, timezone('utc', now())),
('carne-mare', 'Carne Mare', 'restaurants', 'Italian chophouse energy', 'Priority consideration for Pier-hosted member tables on select dates',
 'Carne Mare is built for celebration: prime cuts, seafood towers, and a room that feels like a night out. Requests route through Pier Concierge to align with house capacity.',
 'https://www.carneramenyc.com/', true, 'active', 2, timezone('utc', now())),
('blacklane-global', 'Blacklane', 'travel', 'Chauffeured reliability', 'Member routing support for airport and city-to-city transfers',
 'Blacklane focuses on consistent chauffeur quality across global metros. Pier Concierge can help members book with the right vehicle class and meet-and-greet details.',
 'https://www.blacklane.com/en/', false, 'active', 3, timezone('utc', now())),
('equinox-plus', 'Equinox', 'health', 'Performance baseline', 'Trial access pathways coordinated through Pier for eligible members',
 'Equinox is a practical partner for members who travel constantly—recovery, training, and routine. Availability varies by market; Pier Concierge confirms eligibility.',
 'https://www.equinox.com/', false, 'active', 4, timezone('utc', now())),
('resy-private', 'Resy Private', 'restaurants', 'Hard tables, handled quietly', 'Concierge-assisted routing for high-demand reservations',
 'Resy Private is not a guarantee—it is a better process. Pier Concierge packages member context so restaurants can say yes when capacity exists.',
 'https://resy.com/', false, 'active', 5, timezone('utc', now())),
('four-seasons-partner', 'Four Seasons Hotels and Resorts', 'hotels', 'Consistent luxury service', 'Property notes and celebration details passed through concierge',
 'When members need predictable excellence—family travel, roadshows, recovery weekends—Four Seasons remains a default. Pier coordinates preferences without drama.',
 'https://www.fourseasons.com/', true, 'active', 6, timezone('utc', now())),
('jpm-private-bank-ref', 'Illustrative Private Banking Partner', 'finance', 'Institutional-grade banking context', 'Education-forward introductions where appropriate',
 'Illustrative partner entry for UI seeding—not an endorsement. Pier can coordinate introductions to regulated institutions when members request a banking conversation.',
 'https://privatebank.jpmorgan.com/', false, 'active', 7, timezone('utc', now())),
('oura-health', 'Oura', 'health', 'Sleep and readiness signal', 'Member education on readiness metrics and cohort offers when available',
 'Oura is a lightweight signal layer for busy operators. Pier highlights it as a wellness tool—not medical advice—with offers subject to partner campaigns.',
 'https://ouraring.com/', false, 'active', 8, timezone('utc', now())),
('netjets-partner', 'NetJets', 'travel', 'Fractional aviation', 'Routing to aviation advisors through Pier Concierge',
 'For members who live in three cities a week, aviation time is portfolio time. Pier does not sell fractional shares; we coordinate introductions to authorized advisors.',
 'https://www.netjets.com/en-us/', false, 'active', 9, timezone('utc', now()))
ON CONFLICT (slug) DO UPDATE SET
  benefit = EXCLUDED.benefit,
  description = EXCLUDED.description,
  updated_at = timezone('utc', now());
`;

const eventsSql = `
INSERT INTO public.capital_events (
  slug, title, event_type, status, starts_at, ends_at, location, city, capacity, registered_count,
  description, recap_url, featured, sort_order, published_at, external_registration_url, external_registration_label
) VALUES
${eventValues}
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  event_type = EXCLUDED.event_type,
  status = EXCLUDED.status,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  location = EXCLUDED.location,
  city = EXCLUDED.city,
  description = EXCLUDED.description,
  featured = EXCLUDED.featured,
  sort_order = EXCLUDED.sort_order,
  recap_url = COALESCE(public.capital_events.recap_url, EXCLUDED.recap_url),
  external_registration_url = COALESCE(public.capital_events.external_registration_url, EXCLUDED.external_registration_url),
  external_registration_label = COALESCE(public.capital_events.external_registration_label, EXCLUDED.external_registration_label),
  updated_at = timezone('utc', now());
`;

const sql = `${header}${membersSql}\n${dealsSql}\n${partnersSql}\n${eventsSql}\n`;

writeFileSync(out, sql, 'utf8');
console.log('Wrote', out);
