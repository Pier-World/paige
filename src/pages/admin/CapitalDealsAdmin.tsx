import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminCapitalDealSourceMaterials,
  getAdminCapitalDealDocuments,
  getAdminCapitalDeals,
  publishAdminCapitalDeal,
  saveAdminCapitalDeal,
  unpublishAdminCapitalDeal,
  uploadAdminCapitalDealDocument,
  uploadAdminCapitalDealSourceMaterial,
  type AdminCapitalDealInput,
  type CapitalDeal,
  type CapitalDealDocument,
  type CapitalDealSourceMaterial,
  type DealType,
  type ReturnMetricType,
} from '../../lib/api/capitalMarkets';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

type DealFormState = {
  slug: string;
  name: string;
  managerName: string;
  dealType: DealType;
  assetClass: string;
  targetSize: string;
  raisedSize: string;
  allocationSubscribedPercent: string;
  minCommitment: string;
  currencyCode: string;
  closeDate: string;
  targetIrr: string;
  moicTarget: string;
  returnMetricType: ReturnMetricType;
  returnDisplay: string;
  holdingPeriodYears: string;
  liquidityNote: string;
  vintage: string;
  geography: string;
  sectors: string;
  description: string;
  thesis: string;
  whyPierSelected: string;
  generatedSummary: string;
  disclaimer: string;
  offeringType: string;
  jurisdiction: string;
  eligibleInvestorRequirements: string;
  internalNotes: string;
};

const emptyForm: DealFormState = {
  slug: '',
  name: '',
  managerName: '',
  dealType: 'fund',
  assetClass: '',
  targetSize: '',
  raisedSize: '',
  allocationSubscribedPercent: '',
  minCommitment: '',
  currencyCode: 'USD',
  closeDate: '',
  targetIrr: '',
  moicTarget: '',
  returnMetricType: 'irr',
  returnDisplay: '',
  holdingPeriodYears: '',
  liquidityNote: '',
  vintage: '',
  geography: '',
  sectors: '',
  description: '',
  thesis: '',
  whyPierSelected: '',
  generatedSummary: '',
  disclaimer: '',
  offeringType: '',
  jurisdiction: '',
  eligibleInvestorRequirements: '',
  internalNotes: '',
};

const inputClass = 'w-full rounded-[4px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-gilt';
const labelClass = 'mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-slate';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const numeric = Number(value.replace(/[$,\s]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function formFromDeal(deal: CapitalDeal): DealFormState {
  return {
    slug: deal.id,
    name: deal.name,
    managerName: deal.manager,
    dealType: deal.type,
    assetClass: deal.assetClass,
    targetSize: deal.targetSize ? String(deal.targetSize) : '',
    raisedSize: deal.raisedSize ? String(deal.raisedSize) : '',
    allocationSubscribedPercent:
      deal.allocationSubscribedPercent || deal.allocationSubscribedPercent === 0
        ? String(deal.allocationSubscribedPercent)
        : '',
    minCommitment: deal.minCommitment ? String(deal.minCommitment) : '',
    currencyCode: deal.currencyCode,
    closeDate: deal.closeDate?.slice(0, 10) ?? '',
    targetIrr: deal.targetIrr ? String(deal.targetIrr) : '',
    moicTarget: deal.moicTarget ? String(deal.moicTarget) : '',
    returnMetricType: deal.returnMetricType,
    returnDisplay: deal.returnDisplay,
    holdingPeriodYears: deal.holdingPeriodYears ? String(deal.holdingPeriodYears) : '',
    liquidityNote: deal.liquidityNote,
    vintage: deal.vintage ? String(deal.vintage) : '',
    geography: deal.geography,
    sectors: deal.sectors.join(', '),
    description: deal.description,
    thesis: deal.thesis,
    whyPierSelected: deal.whyPierSelected,
    generatedSummary: deal.generatedSummary,
    disclaimer: deal.disclaimer,
    offeringType: deal.offeringType,
    jurisdiction: deal.jurisdiction,
    eligibleInvestorRequirements: deal.eligibleInvestorRequirements,
    internalNotes: deal.internalNotes,
  };
}

function toDealInput(form: DealFormState): AdminCapitalDealInput {
  return {
    slug: form.slug || slugify(`${form.managerName}-${form.name}`),
    name: form.name.trim(),
    managerName: form.managerName.trim(),
    dealType: form.dealType,
    assetClass: form.assetClass.trim(),
    targetSize: parseNumber(form.targetSize) ?? 0,
    raisedSize: parseNumber(form.raisedSize) ?? 0,
    allocationSubscribedPercent: parseNumber(form.allocationSubscribedPercent) ?? 0,
    minCommitment: parseNumber(form.minCommitment),
    currencyCode: form.currencyCode.trim().toUpperCase() || 'USD',
    closeDate: form.closeDate || null,
    targetIrr: parseNumber(form.targetIrr),
    moicTarget: parseNumber(form.moicTarget),
    returnMetricType: form.returnMetricType,
    returnDisplay: form.returnDisplay || null,
    holdingPeriodYears: parseNumber(form.holdingPeriodYears),
    liquidityNote: form.liquidityNote || null,
    vintage: parseNumber(form.vintage),
    geography: form.geography || null,
    sectors: form.sectors.split(',').map((sector) => sector.trim()).filter(Boolean),
    description: form.description.trim(),
    thesis: form.thesis || null,
    whyPierSelected: form.whyPierSelected || null,
    generatedSummary: form.generatedSummary || null,
    disclaimer: form.disclaimer || null,
    offeringType: form.offeringType || null,
    jurisdiction: form.jurisdiction || null,
    eligibleInvestorRequirements: form.eligibleInvestorRequirements || null,
    internalNotes: form.internalNotes || null,
  };
}

export default function CapitalDealsAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [deals, setDeals] = useState<CapitalDeal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<CapitalDeal | null>(null);
  const [sourceMaterials, setSourceMaterials] = useState<CapitalDealSourceMaterial[]>([]);
  const [dealDocuments, setDealDocuments] = useState<CapitalDealDocument[]>([]);
  const [form, setForm] = useState<DealFormState>(emptyForm);
  const [sourceLabel, setSourceLabel] = useState('');
  const [sourceType, setSourceType] = useState('overview');
  const [sourceOverview, setSourceOverview] = useState('');
  const [sourceSummary, setSourceSummary] = useState('');
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [documentLabel, setDocumentLabel] = useState('');
  const [documentType, setDocumentType] = useState<CapitalDealDocument['type']>('tearsheet');
  const [documentAccess, setDocumentAccess] = useState<CapitalDealDocument['accessLevel']>('approved_interest');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const stats = useMemo(() => {
    return {
      total: deals.length,
      published: deals.filter((deal) => deal.publishedAt).length,
      drafts: deals.filter((deal) => !deal.publishedAt).length,
    };
  }, [deals]);

  async function loadDeals() {
    const data = await getAdminCapitalDeals();
    setDeals(data);
    if (selectedDeal) {
      const refreshed = data.find((deal) => deal.databaseId === selectedDeal.databaseId) ?? null;
      setSelectedDeal(refreshed);
      if (refreshed) setForm(formFromDeal(refreshed));
    }
  }

  async function loadSourceMaterials(dealId: string) {
    const data = await getAdminCapitalDealSourceMaterials(dealId);
    setSourceMaterials(data);
  }

  async function loadDealDocuments(dealId: string) {
    const data = await getAdminCapitalDealDocuments(dealId);
    setDealDocuments(data);
  }

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/login');
        return;
      }

      const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (member?.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      setAuthorized(true);
      setCheckingAuth(false);
      try {
        await loadDeals();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load deals.');
      }
    }

    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  function selectDeal(deal: CapitalDeal | null) {
    setSelectedDeal(deal);
    setForm(deal ? formFromDeal(deal) : emptyForm);
    setSourceMaterials([]);
    setDealDocuments([]);
    setMessage('');
    setError('');
    if (deal) {
      loadSourceMaterials(deal.databaseId).catch((err) =>
        setError(err instanceof Error ? err.message : 'Unable to load source materials.')
      );
      loadDealDocuments(deal.databaseId).catch((err) =>
        setError(err instanceof Error ? err.message : 'Unable to load deal documents.')
      );
    }
  }

  async function handleSave() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const saved = await saveAdminCapitalDeal(toDealInput(form), selectedDeal?.databaseId);
      setMessage('Draft saved. It is not visible to members until published.');
      await loadDeals();
      selectDeal(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save draft.');
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish() {
    if (!selectedDeal || !user) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await publishAdminCapitalDeal(selectedDeal.databaseId, user.id, 'open');
      setMessage('Deal published to member deal flow.');
      await loadDeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish deal.');
    } finally {
      setBusy(false);
    }
  }

  async function handleUnpublish() {
    if (!selectedDeal) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await unpublishAdminCapitalDeal(selectedDeal.databaseId);
      setMessage('Deal returned to unpublished draft status.');
      await loadDeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to unpublish deal.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSourceUpload() {
    if (!selectedDeal) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await uploadAdminCapitalDealSourceMaterial({
        dealId: selectedDeal.databaseId,
        label: sourceLabel || sourceFile?.name || 'Source material',
        materialType: sourceType,
        file: sourceFile,
        overview: sourceOverview,
        generatedSummary: sourceSummary,
      });
      setSourceLabel('');
      setSourceOverview('');
      setSourceSummary('');
      setSourceFile(null);
      await loadSourceMaterials(selectedDeal.databaseId);
      setMessage('Source material saved for internal review.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save source material.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDocumentUpload() {
    if (!selectedDeal || !documentFile) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await uploadAdminCapitalDealDocument({
        dealId: selectedDeal.databaseId,
        label: documentLabel || documentFile.name,
        documentType,
        accessLevel: documentAccess,
        file: documentFile,
      });
      setDocumentLabel('');
      setDocumentFile(null);
      await loadDealDocuments(selectedDeal.databaseId);
      setMessage('Deal document attached. Access follows the selected document policy.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to attach document.');
    } finally {
      setBusy(false);
    }
  }

  if (checkingAuth || !authorized) {
    return (
      <div className="min-h-screen bg-parchment px-6 py-12">
        <p className="text-[14px] text-slate">Checking admin permissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment px-6 py-8 sm:px-10 lg:px-14">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Admin</p>
          <h1 className="font-display text-[38px] leading-none text-ink">Deal publishing.</h1>
          <p className="mt-3 max-w-2xl text-[14px] text-slate">
            Staff-only intake, review, document management, and publishing for fund opportunities.
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-[4px] border border-border bg-surface p-4">
          <p className="eyebrow mb-1">Total</p>
          <p className="font-mono-data text-[22px] text-ink">{stats.total}</p>
        </div>
        <div className="rounded-[4px] border border-border bg-surface p-4">
          <p className="eyebrow mb-1">Published</p>
          <p className="font-mono-data text-[22px] text-ink">{stats.published}</p>
        </div>
        <div className="rounded-[4px] border border-border bg-surface p-4">
          <p className="eyebrow mb-1">Drafts</p>
          <p className="font-mono-data text-[22px] text-ink">{stats.drafts}</p>
        </div>
      </div>

      {message ? <div className="mb-4 rounded-[4px] border border-ledger/30 bg-ledger/10 p-3 text-[13px] text-ledger">{message}</div> : null}
      {error ? <div className="mb-4 rounded-[4px] border border-danger/30 bg-danger/10 p-3 text-[13px] text-danger">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="rounded-[4px] border border-border bg-surface p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="eyebrow">Opportunities</p>
            <Button size="sm" variant="secondary" onClick={() => selectDeal(null)}>New draft</Button>
          </div>
          <div className="space-y-2">
            {deals.map((deal) => (
              <button
                key={deal.databaseId}
                type="button"
                onClick={() => selectDeal(deal)}
                className={`w-full rounded-[4px] border p-3 text-left transition-colors ${
                  selectedDeal?.databaseId === deal.databaseId ? 'border-gilt bg-gilt/10' : 'border-border hover:border-ink/30'
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-[13px] font-medium leading-snug text-ink">{deal.name}</p>
                  <Badge variant={deal.publishedAt ? deal.status : 'pending'}>{deal.publishedAt ? deal.status : 'draft'}</Badge>
                </div>
                <p className="text-[12px] text-slate">{deal.manager}</p>
                <p className="mt-1 font-mono-data text-[11px] text-slate">
                  {formatCurrency(deal.targetSize, deal.currencyCode, true)}
                </p>
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-6">
          <section className="rounded-[4px] border border-border bg-surface p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow mb-1">Draft details</p>
                <h2 className="text-[20px] font-medium text-ink">{selectedDeal ? selectedDeal.name : 'New opportunity'}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={handleSave} loading={busy}>Save draft</Button>
                {selectedDeal?.publishedAt ? (
                  <Button variant="danger" onClick={handleUnpublish} loading={busy}>Unpublish</Button>
                ) : selectedDeal ? (
                  <Button onClick={handlePublish} loading={busy}>Publish</Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name, slug: form.slug || slugify(`${form.managerName}-${name}`) })} />
              <Field label="Manager" value={form.managerName} onChange={(managerName) => setForm({ ...form, managerName, slug: form.slug || slugify(`${managerName}-${form.name}`) })} />
              <Field label="Slug" value={form.slug} onChange={(slug) => setForm({ ...form, slug: slugify(slug) })} />
              <SelectField label="Deal type" value={form.dealType} onChange={(dealType) => setForm({ ...form, dealType: dealType as DealType })} options={['fund', 'co-invest', 'secondary', 'spv']} />
              <Field label="Asset class" value={form.assetClass} onChange={(assetClass) => setForm({ ...form, assetClass })} />
              <Field label="Currency" value={form.currencyCode} onChange={(currencyCode) => setForm({ ...form, currencyCode })} />
              <Field label="Target size" value={form.targetSize} onChange={(targetSize) => setForm({ ...form, targetSize })} />
              <Field label="Raised size" value={form.raisedSize} onChange={(raisedSize) => setForm({ ...form, raisedSize })} />
              <Field label="Subscribed %" value={form.allocationSubscribedPercent} onChange={(allocationSubscribedPercent) => setForm({ ...form, allocationSubscribedPercent })} />
              <Field label="Min commitment" value={form.minCommitment} onChange={(minCommitment) => setForm({ ...form, minCommitment })} />
              <Field label="Close date" type="date" value={form.closeDate} onChange={(closeDate) => setForm({ ...form, closeDate })} />
              <Field label="Target IRR" value={form.targetIrr} onChange={(targetIrr) => setForm({ ...form, targetIrr })} />
              <Field label="MOIC target" value={form.moicTarget} onChange={(moicTarget) => setForm({ ...form, moicTarget })} />
              <SelectField label="Return metric" value={form.returnMetricType} onChange={(returnMetricType) => setForm({ ...form, returnMetricType: returnMetricType as ReturnMetricType })} options={['irr', 'moic', 'yield', 'custom', 'none']} />
              <Field label="Return display" value={form.returnDisplay} onChange={(returnDisplay) => setForm({ ...form, returnDisplay })} />
              <Field label="Vintage" value={form.vintage} onChange={(vintage) => setForm({ ...form, vintage })} />
              <Field label="Geography" value={form.geography} onChange={(geography) => setForm({ ...form, geography })} />
              <Field label="Sectors" value={form.sectors} onChange={(sectors) => setForm({ ...form, sectors })} />
              <Field label="Holding period years" value={form.holdingPeriodYears} onChange={(holdingPeriodYears) => setForm({ ...form, holdingPeriodYears })} />
            </div>

            <div className="mt-4 grid gap-4">
              <TextArea label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
              <TextArea label="Thesis" value={form.thesis} onChange={(thesis) => setForm({ ...form, thesis })} />
              <TextArea label="Why Pier selected this" value={form.whyPierSelected} onChange={(whyPierSelected) => setForm({ ...form, whyPierSelected })} />
              <TextArea label="Generated / refined summary" value={form.generatedSummary} onChange={(generatedSummary) => setForm({ ...form, generatedSummary })} />
              <TextArea label="Disclaimer" value={form.disclaimer} onChange={(disclaimer) => setForm({ ...form, disclaimer })} />
              <TextArea label="Eligible investor requirements" value={form.eligibleInvestorRequirements} onChange={(eligibleInvestorRequirements) => setForm({ ...form, eligibleInvestorRequirements })} />
              <TextArea label="Internal notes" value={form.internalNotes} onChange={(internalNotes) => setForm({ ...form, internalNotes })} />
            </div>
          </section>

          {selectedDeal ? (
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[4px] border border-border bg-surface p-5">
                <p className="eyebrow mb-4">Internal source materials</p>
                <div className="space-y-3">
                  <Field label="Label" value={sourceLabel} onChange={setSourceLabel} />
                  <SelectField label="Type" value={sourceType} onChange={setSourceType} options={['overview', 'deck', 'memo', 'tearsheet', 'legal', 'financials', 'email', 'data_room', 'other']} />
                  <label className={labelClass}>Source file</label>
                  <input className={inputClass} type="file" onChange={(event) => setSourceFile(event.target.files?.[0] ?? null)} />
                  <TextArea label="Overview / extracted notes" value={sourceOverview} onChange={setSourceOverview} />
                  <TextArea label="Generated summary" value={sourceSummary} onChange={setSourceSummary} />
                  <Button variant="secondary" onClick={handleSourceUpload} loading={busy}>
                    <Upload className="h-4 w-4" />
                    Save source material
                  </Button>
                </div>
                <div className="mt-5 space-y-2">
                  {sourceMaterials.map((material) => (
                    <div key={material.id} className="rounded-[4px] border border-border p-3">
                      <p className="text-[13px] font-medium text-ink">{material.label}</p>
                      <p className="text-[12px] text-slate">{material.materialType} / {material.reviewStatus}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[4px] border border-border bg-surface p-5">
                <p className="eyebrow mb-4">Approved deal documents</p>
                <div className="space-y-3">
                  <Field label="Label" value={documentLabel} onChange={setDocumentLabel} />
                  <SelectField label="Document type" value={documentType} onChange={(value) => setDocumentType(value)} options={['deck', 'memo', 'tearsheet', 'legal', 'financials', 'other']} />
                  <SelectField label="Access" value={documentAccess} onChange={(value) => setDocumentAccess(value as CapitalDealDocument['accessLevel'])} options={['admin', 'members', 'approved_interest']} />
                  <label className={labelClass}>Document file</label>
                  <input className={inputClass} type="file" onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)} />
                  <Button variant="secondary" onClick={handleDocumentUpload} loading={busy} disabled={!documentFile}>
                    <Upload className="h-4 w-4" />
                    Attach document
                  </Button>
                </div>
                <div className="mt-5 space-y-2">
                  {dealDocuments.map((document) => (
                    <div key={document.id} className="rounded-[4px] border border-border p-3">
                      <p className="text-[13px] font-medium text-ink">{document.label}</p>
                      <p className="text-[12px] text-slate">{document.type} / {document.accessLevel}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className={labelClass}>{label}</span>
      <input className={inputClass} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label>
      <span className={labelClass}>{label}</span>
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className={labelClass}>{label}</span>
      <textarea className={`${inputClass} min-h-[96px]`} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
