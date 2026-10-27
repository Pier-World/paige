# Member fund import prompt

Hand this prompt to another AI along with the memos, decks, and data-room links. It should output only `capital_deals_member_import.csv`. Do not paste confidential PDFs into this repo or into the Pier chat.

```
You are preparing a member-facing import CSV for Pier's capital_deals table. Read the attached memos, decks, and data-room links. Output ONLY a CSV. Do not quote confidential terms, GP/fund legal names, IR emails, or performance that is not clearly intended for a public teaser.

File: capital_deals_member_import.csv
Header row (exact):
source_record_id,slug,name,manager_name,deal_type,asset_class,status,target_size,raised_size,allocation_subscribed_percent,min_commitment,currency_code,close_date,target_irr,moic_target,return_metric_type,return_display,vintage,geography,sectors,description,thesis,why_pier_selected,liquidity_note,contacts_json,source_materials_json,documents_json,generated_summary,disclaimer,jurisdiction,eligible_investor_requirements

Rules:
- name: elegant descriptor, not the real fund name. Examples: "US feeder for an international quant strategy", "Seed-stage software fund, Fund III". Never use [Confidential] as a prefix.
- manager_name: strategy label, not the GP firm ("International quant manager", "US venture manager").
- slug: kebab-case from the descriptor, unique, no real names (us-feeder-international-quant).
- source_record_id: same as slug.
- deal_type: fund | co-invest | secondary | spv
- asset_class: short label (Venture, Credit, Quant, Secondaries, etc.)
- status: open unless the memo says it is closing/closed
- description: 2–4 sentences, member-facing, no confidential numbers or names
- why_pier_selected: 1–2 sentences on why Pier is surfacing it, still non-confidential
- thesis: leave blank or repeat a non-confidential line; do not paste the memo
- contacts_json: []
- source_materials_json: []
- documents_json: one object if a data-room or memo URL exists:
  [{"label":"Data room","document_type":"memo","external_url":"https://...","access_level":"approved_interest"}]
- Numeric fields (target_size, raised_size, min_commitment, target_irr, moic_target, vintage, close_date): fill only if the figure is acceptable on a public member page. Otherwise leave empty and set return_metric_type to none.
- allocation_subscribed_percent: 0–100 if public, else 0
- currency_code: USD unless clearly otherwise
- sectors: comma-separated themes, no portfolio company names
- disclaimer: one line that this is not an offer to subscribe
- eligible_investor_requirements: high-level only (e.g. "Qualified purchasers") if known
- jurisdiction: US or as stated
- generated_summary: same as description
- Escape CSV quotes. Multi-line cells wrapped in double quotes.

If a memo is too sensitive to summarize, still emit a row with name, manager_name, asset_class, geography, a one-line description, and the data-room URL.
```

After the CSV is filled, import live open opportunities with:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-capital-deals.mjs docs/seeds/capital_deals_member_import.csv
```

Imported rows are published as `open` and member-visible. Status can be adjusted later in the capital deals admin.
