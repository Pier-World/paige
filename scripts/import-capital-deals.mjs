#!/usr/bin/env node
/**
 * Staff-only capital deal importer.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-capital-deals.mjs ./deals.json
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-capital-deals.mjs ./deals.csv
 *
 * Rows are always imported as unpublished drafts unless explicitly published later
 * from the admin review workflow.
 */
import { createClient } from '@supabase/supabase-js';
import { basename, extname, isAbsolute, join, resolve } from 'path';
import { readFileSync, statSync } from 'fs';

const inputPath = process.argv[2];

if (!inputPath) {
  console.error('Usage: node scripts/import-capital-deals.mjs <deals.json|deals.csv>');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEAL_TYPES = new Set(['fund', 'co-invest', 'secondary', 'spv']);
const STATUSES = new Set(['pending', 'open', 'closing', 'closed']);
const RETURN_TYPES = new Set(['irr', 'moic', 'yield', 'custom', 'none']);
const MATERIAL_TYPES = new Set(['deck', 'memo', 'tearsheet', 'legal', 'financials', 'overview', 'email', 'data_room', 'other']);

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function parseNumber(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const numeric = Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function parseTextArray(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  if (rows.length === 0) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() ?? '']))
  );
}

function loadRecords(filePath) {
  const resolved = resolve(filePath);
  const content = readFileSync(resolved, 'utf8');
  const extension = extname(resolved).toLowerCase();
  if (extension === '.json') {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.records ?? parsed.deals ?? [];
  }
  if (extension === '.csv') return parseCsv(content);
  throw new Error('Input must be a .json or .csv file.');
}

function normalizeRecord(record, index) {
  const name = String(record.name || '').trim();
  const managerName = String(record.manager_name || record.managerName || '').trim();
  const slug = slugify(record.slug || `${managerName}-${name}`);
  const dealType = String(record.deal_type || record.dealType || '').trim();
  const assetClass = String(record.asset_class || record.assetClass || '').trim();
  const targetSize = parseNumber(record.target_size ?? record.targetSize);
  const allocationSubscribedPercent = parseNumber(
    record.allocation_subscribed_percent ?? record.allocationSubscribedPercent,
    0
  );
  const status = String(record.status || 'pending').trim() || 'pending';
  const returnMetricType = String(record.return_metric_type || record.returnMetricType || 'irr').trim();
  const description = String(record.description || record.overview || '').trim();
  const errors = [];

  if (!name) errors.push('name is required');
  if (!managerName) errors.push('manager_name is required');
  if (!slug) errors.push('slug could not be generated');
  if (!DEAL_TYPES.has(dealType)) errors.push(`deal_type must be one of ${Array.from(DEAL_TYPES).join(', ')}`);
  if (!assetClass) errors.push('asset_class is required');
  if (targetSize === null || targetSize < 0) errors.push('target_size must be a non-negative number');
  if (allocationSubscribedPercent === null || allocationSubscribedPercent < 0 || allocationSubscribedPercent > 100) {
    errors.push('allocation_subscribed_percent must be between 0 and 100');
  }
  if (!description) errors.push('description or overview is required');
  if (!STATUSES.has(status)) errors.push(`status must be one of ${Array.from(STATUSES).join(', ')}`);
  if (!RETURN_TYPES.has(returnMetricType)) errors.push(`return_metric_type must be one of ${Array.from(RETURN_TYPES).join(', ')}`);

  const contacts = parseJsonField(record.contacts_json ?? record.contactsJson ?? record.contacts, []);
  const sourceMaterials = parseJsonField(record.source_materials_json ?? record.sourceMaterialsJson ?? record.sourceMaterials, []);
  const documents = parseJsonField(record.documents_json ?? record.documentsJson ?? record.documents, []);

  return {
    index,
    errors,
    sourceMaterials: Array.isArray(sourceMaterials) ? sourceMaterials : [],
    documents: Array.isArray(documents) ? documents : [],
    deal: {
      slug,
      name,
      manager_name: managerName,
      deal_type: dealType,
      asset_class: assetClass,
      status: 'pending',
      target_size: targetSize ?? 0,
      raised_size: parseNumber(record.raised_size ?? record.raisedSize, 0) ?? 0,
      allocation_subscribed_percent: allocationSubscribedPercent ?? 0,
      min_commitment: parseNumber(record.min_commitment ?? record.minCommitment),
      currency_code: String(record.currency_code || record.currencyCode || 'USD').trim().toUpperCase(),
      close_date: record.close_date || record.closeDate || null,
      target_irr: parseNumber(record.target_irr ?? record.targetIrr),
      moic_target: parseNumber(record.moic_target ?? record.moicTarget),
      vintage: parseNumber(record.vintage),
      geography: record.geography || null,
      sectors: parseTextArray(record.sectors),
      description,
      thesis: record.thesis || null,
      return_metric_type: returnMetricType,
      return_display: record.return_display || record.returnDisplay || null,
      holding_period_years: parseNumber(record.holding_period_years ?? record.holdingPeriodYears),
      liquidity_note: record.liquidity_note || record.liquidityNote || null,
      why_pier_selected: record.why_pier_selected || record.whyPierSelected || null,
      contacts,
      sort_order: parseNumber(record.sort_order ?? record.sortOrder, 0) ?? 0,
      published_at: null,
      source_system: record.source_system || record.sourceSystem || 'staff_import',
      source_record_id: record.source_record_id || record.sourceRecordId || slug,
      source_url: record.source_url || record.sourceUrl || null,
      last_imported_at: new Date().toISOString(),
      review_status: record.generated_summary || record.generatedSummary ? 'generated' : 'draft',
      internal_notes: record.internal_notes || record.internalNotes || null,
      generated_summary: record.generated_summary || record.generatedSummary || null,
      disclaimer: record.disclaimer || null,
      offering_type: record.offering_type || record.offeringType || null,
      jurisdiction: record.jurisdiction || null,
      eligible_investor_requirements: record.eligible_investor_requirements || record.eligibleInvestorRequirements || null,
      visibility_tier: 'admin',
      unpublished_at: new Date().toISOString(),
    },
  };
}

function mimeTypeFor(filePath) {
  const extension = extname(filePath).toLowerCase();
  const map = {
    '.csv': 'text/csv',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.json': 'application/json',
    '.pdf': 'application/pdf',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return map[extension] || 'application/octet-stream';
}

async function uploadMaterialFile(slug, material, inputDirectory) {
  if (!material.file_path && !material.filePath) return null;
  const rawPath = material.file_path || material.filePath;
  const resolved = isAbsolute(rawPath) ? rawPath : join(inputDirectory, rawPath);
  const file = readFileSync(resolved);
  const stats = statSync(resolved);
  const objectPath = `source/${slug}/${Date.now()}-${basename(resolved).replace(/[^a-zA-Z0-9._-]/g, '-')}`;
  const contentType = material.mime_type || material.mimeType || mimeTypeFor(resolved);
  const { error } = await supabase.storage
    .from('capital-deal-materials')
    .upload(objectPath, file, { contentType, upsert: true });
  if (error) throw new Error(`Unable to upload ${rawPath}: ${error.message}`);
  return {
    storage_path: objectPath,
    original_filename: basename(resolved),
    mime_type: contentType,
    file_size_bytes: stats.size,
  };
}

async function main() {
  const inputFile = resolve(inputPath);
  const inputDirectory = inputFile.slice(0, inputFile.lastIndexOf('/'));
  const rawRecords = loadRecords(inputFile);
  const normalized = rawRecords.map(normalizeRecord);
  const validationErrors = normalized
    .filter((record) => record.errors.length > 0)
    .map((record) => ({ row: record.index + 1, errors: record.errors }));

  const { data: batch, error: batchError } = await supabase
    .from('capital_deal_import_batches')
    .insert({
      source_type: extname(inputFile).toLowerCase() === '.csv' ? 'csv' : 'json',
      source_filename: basename(inputFile),
      source_record_count: rawRecords.length,
      validation_errors: validationErrors,
      status: validationErrors.length > 0 ? 'failed' : 'processing',
    })
    .select('id')
    .single();

  if (batchError) throw new Error(`Unable to create import batch: ${batchError.message}`);

  if (validationErrors.length > 0) {
    console.error(JSON.stringify(validationErrors, null, 2));
    process.exit(1);
  }

  let imported = 0;
  const failures = [];

  for (const record of normalized) {
    try {
      const { data: deal, error: dealError } = await supabase
        .from('capital_deals')
        .upsert({ ...record.deal, import_batch_id: batch.id }, { onConflict: 'slug' })
        .select('id, slug')
        .single();

      if (dealError) throw new Error(dealError.message);

      for (const material of record.sourceMaterials) {
        const upload = await uploadMaterialFile(deal.slug, material, inputDirectory);
        const materialType = MATERIAL_TYPES.has(material.material_type || material.materialType)
          ? material.material_type || material.materialType
          : 'overview';

        const { error: materialError } = await supabase.from('capital_deal_source_materials').insert({
          deal_id: deal.id,
          import_batch_id: batch.id,
          label: material.label || material.original_filename || material.originalFilename || material.file_path || material.filePath || 'Source material',
          material_type: materialType,
          storage_path: upload?.storage_path ?? material.storage_path ?? material.storagePath ?? null,
          external_url: material.external_url ?? material.externalUrl ?? null,
          original_filename: upload?.original_filename ?? material.original_filename ?? material.originalFilename ?? null,
          mime_type: upload?.mime_type ?? material.mime_type ?? material.mimeType ?? null,
          file_size_bytes: upload?.file_size_bytes ?? parseNumber(material.file_size_bytes ?? material.fileSizeBytes),
          extracted_text: material.extracted_text ?? material.extractedText ?? material.overview ?? null,
          generated_summary: material.generated_summary ?? material.generatedSummary ?? null,
          review_status: material.generated_summary || material.generatedSummary ? 'generated' : 'draft',
          internal_notes: material.internal_notes ?? material.internalNotes ?? null,
        });

        if (materialError) throw new Error(materialError.message);
      }

      for (const document of record.documents) {
        const upload = await uploadMaterialFile(deal.slug, document, inputDirectory);
        const { error: documentError } = await supabase.from('capital_deal_documents').insert({
          deal_id: deal.id,
          label: document.label || document.original_filename || document.originalFilename || 'Deal document',
          document_type: document.document_type || document.documentType || 'other',
          display_size: document.display_size || document.displaySize || null,
          file_size_bytes: upload?.file_size_bytes ?? parseNumber(document.file_size_bytes ?? document.fileSizeBytes),
          storage_path: upload?.storage_path ?? document.storage_path ?? document.storagePath ?? null,
          external_url: document.external_url ?? document.externalUrl ?? null,
          access_level: document.access_level || document.accessLevel || 'admin',
          sort_order: parseNumber(document.sort_order ?? document.sortOrder, 0) ?? 0,
        });

        if (documentError) throw new Error(documentError.message);
      }

      imported += 1;
    } catch (error) {
      failures.push({ row: record.index + 1, slug: record.deal.slug, error: error.message });
    }
  }

  const { error: updateError } = await supabase
    .from('capital_deal_import_batches')
    .update({
      imported_count: imported,
      failed_count: failures.length,
      validation_errors: failures,
      status: failures.length > 0 ? 'failed' : 'imported',
    })
    .eq('id', batch.id);

  if (updateError) throw new Error(`Unable to update import batch: ${updateError.message}`);
  if (failures.length > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }

  console.log(`Imported ${imported} draft deal${imported === 1 ? '' : 's'} into batch ${batch.id}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
