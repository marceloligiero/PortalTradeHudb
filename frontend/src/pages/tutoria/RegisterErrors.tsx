import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle, Save, X, ChevronDown, Loader2,
  Calendar, User, Tag, CheckCircle2,
  Building2, Globe, DollarSign, FileText, Briefcase, Eye,
  Zap, Target, RefreshCw, ClipboardList, Plus, Trash2,
} from 'lucide-react';
import axios from '../../lib/axios';
import { CURRENCY_OPTIONS } from '../../lib/currencies';
import { useAuthStore } from '../../stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserItem    { id: number; full_name: string; role?: string }
interface Category    { id: number; name: string; origin_id?: number | null }
interface ProductItem { id: number; code: string; name: string }
interface BankItem    { id: number; name: string; code?: string }
interface LookupItem  { id: number; name: string; description?: string; is_active?: boolean; bank_id?: number | null; department_id?: number | null; activity_id?: number | null; level?: string }

// ─── Field helpers ────────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/10 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:placeholder-gray-600 dark:focus:border-red-500 dark:focus:ring-red-500/10';
const selectCls = 'w-full appearance-none px-3 py-2.5 pr-9 rounded-xl border text-sm outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white border-gray-200 text-gray-900 focus:border-red-400 focus:ring-2 focus:ring-red-400/10 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:focus:border-red-500 dark:focus:ring-red-500/10 dark:[color-scheme:dark]';

function FieldLabel({ icon: Icon, children, required }: {
  icon?: React.ElementType; children: React.ReactNode; required?: boolean;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500 dark:text-gray-400">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function SelectField({ value, onChange, options, placeholder = '—', disabled = false }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={selectCls}
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
    </div>
  );
}

function InputField({ value, onChange, placeholder = '', type = 'text' }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  );
}

function TextareaField({ value, onChange, placeholder = '', rows = 4 }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${inputCls} resize-none`}
    />
  );
}

// ─── GAP 2 & 3 Constants ──────────────────────────────────────────────────────

const IMPACT_DETAIL_OPTIONS: Record<string, string[]> = {
  BAIXO: ['Imagen', 'Retraso Operativo'],
  ALTO:  ['Económico', 'Regulatorio', 'Reputacional (Imagen)', 'GDPR (Protección de Datos)'],
};

const ORIGIN_DETAIL_OPTIONS: Record<string, string[]> = {
  'Trade_Personas':   ['Formación Insuficiente', 'Dependencia de Personal Clave', 'Error Puntual', 'Sobrecarga Operativa', 'Segregación Funcional'],
  'Trade_Procesos':   ['Diseño Ineficaz del Proceso', 'Desempeño Ineficaz de un Proceso', 'Calidad de los Datos'],
  'Trade_Tecnología': ['Gestión del Cambio Tecnológico Inadecuado', 'Diseño Inadecuado de los Sistemas', 'Funcionamiento Inadecuado de un Sistema'],
  'Terceros':         ['Proveedores', 'Oficina/Uni/Middle', 'Corresponsal'],
};

function normalizeStr(s: string): string {
  return s.toLowerCase().replace(/[_áóéíú]/g, c => ({'á':'a','ó':'o','é':'e','í':'i','ú':'u','_':' '}[c] || c));
}

function getOriginDetailOptions(originName: string): string[] {
  for (const [k, v] of Object.entries(ORIGIN_DETAIL_OPTIONS)) {
    if (normalizeStr(originName).includes(normalizeStr(k))) return v;
  }
  return [];
}

// ─── Card layout helpers ──────────────────────────────────────────────────────

const cardCls = 'rounded-2xl border overflow-hidden bg-white border-gray-200 shadow-sm dark:bg-white/[0.03] dark:border-white/8 dark:shadow-none';
const cardHeaderCls = 'px-6 py-4 border-b flex items-center gap-3 border-gray-100 bg-gray-50 dark:border-white/8 dark:bg-white/[0.02]';

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RegisterErrors() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ── Form fields ──────────────────────────────────────────────────────────

  // Row 1 — Dates
  const [dateOccurrence, setDate]         = useState(() => new Date().toISOString().split('T')[0]);
  const [dateDetection, setDateDetection] = useState('');
  const [dateSolution, setDateSolution]   = useState('');

  // Row 2 — Transaction + Classification
  const [bankId, setBankId]               = useState('');
  const [office, setOffice]               = useState('');
  const [impactId, setImpactId]           = useState('');
  const [impactDetail, setImpactDetail]   = useState('');
  const [originId, setOriginId]           = useState('');
  const [originDetail, setOriginDetail]   = useState('');
  const [categoryId, setCategory]         = useState('');
  const [detectedById, setDetectedById]   = useState('');

  // Row 3 — People
  const [tutoradoId, setTutorado]   = useState('');
  const [approverId, setApproverId] = useState('');

  // Row 4 — Details
  const [departmentId, setDepartmentId] = useState('');
  const [activityId, setActivityId]     = useState('');
  const [errorTypeId, setErrorTypeId]   = useState('');
  const [productId, setProduct]         = useState('');
  const [description, setDescription]   = useState('');
  const [recurrenceType, setRecurrence] = useState('');
  const [severity, setSeverity]         = useState('MEDIA');

  // ── Lists ─────────────────────────────────────────────────────────────────
  const [allUsers, setAllUsers]     = useState<UserItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts]     = useState<ProductItem[]>([]);
  const [banks, setBanks]           = useState<BankItem[]>([]);
  const [impacts, setImpacts]       = useState<LookupItem[]>([]);
  const [origins, setOrigins]       = useState<LookupItem[]>([]);
  const [detectedBy, setDetectedBy] = useState<LookupItem[]>([]);
  const [departments, setDepts]      = useState<LookupItem[]>([]);
  const [activities, setActivities]  = useState<LookupItem[]>([]);
  const [errorTypes, setErrorTypes]  = useState<LookupItem[]>([]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  const recurrenceOptions = [
    { value: 'FIRST',     label: t('registerError.recurrencePuntual') },
    { value: 'RECURRENT', label: t('registerError.recurrenceRecurrent') },
    { value: 'SYSTEMIC',  label: t('registerError.recurrenceSystemic') },
  ];

  const severityOptions = [
    { value: 'BAIXA',   label: t('registerError.severityLow') },
    { value: 'MEDIA',   label: t('registerError.severityMedium') },
    { value: 'ALTA',    label: t('registerError.severityHigh') },
    { value: 'CRITICA', label: t('registerError.severityCritical') },
  ];

  // ── Motivos do Erro ───────────────────────────────────────────────────────
  interface Motivo { id: number; typology: string; description: string; references: string[] }
  interface RefRow { id: number; referencia: string; divisa: string; importe: string; cliente_final: string }

  const TYPOLOGY_OPTIONS = [
    { value: 'METHODOLOGY', label: t('registerError.typologyMethodology'), color: 'from-purple-500 to-indigo-500' },
    { value: 'KNOWLEDGE',   label: t('registerError.typologyKnowledge'), color: 'from-blue-500 to-cyan-500' },
    { value: 'DETAIL',      label: t('registerError.typologyDetail'), color: 'from-amber-500 to-orange-500' },
    { value: 'PROCEDURE',   label: t('registerError.typologyProcedure'), color: 'from-emerald-500 to-teal-500' },
  ];

  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [refs, setRefs] = useState<RefRow[]>([{ id: 1, referencia: '', divisa: '', importe: '', cliente_final: '' }]);

  let refIdCounter = refs.length > 0 ? Math.max(...refs.map(r => r.id)) + 1 : 1;
  const addRef = () => setRefs(prev => [...prev, { id: refIdCounter++, referencia: '', divisa: '', importe: '', cliente_final: '' }]);
  const removeRef = (id: number) => setRefs(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
  const updateRef = (id: number, field: keyof RefRow, value: string) => setRefs(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  const parsedRefs = refs.map(r => r.referencia.trim()).filter(Boolean);

  let motivoIdCounter = motivos.length > 0 ? Math.max(...motivos.map(m => m.id)) + 1 : 1;
  const addMotivo = (typology: string) => {
    setMotivos(prev => [...prev, { id: motivoIdCounter++, typology, description: '', references: [] }]);
  };
  const removeMotivo = (id: number) => setMotivos(prev => prev.filter(m => m.id !== id));
  const updateMotivoDesc = (id: number, desc: string) => setMotivos(prev => prev.map(m => m.id === id ? { ...m, description: desc } : m));
  const toggleMotivoRef = (id: number, ref: string) => {
    setMotivos(prev => prev.map(m => {
      if (m.id !== id) return m;
      const has = m.references.includes(ref);
      return { ...m, references: has ? m.references.filter(r => r !== ref) : [...m.references, ref] };
    }));
  };

  useEffect(() => {
    const safe = async (fn: () => Promise<void>) => { try { await fn(); } catch { /* ignore */ } };
    (async () => {
      await Promise.all([
        safe(async () => { const r = await axios.get('/api/tutoria/categories'); setCategories(Array.isArray(r.data) ? r.data : []); }),
        safe(async () => { const r = await axios.get('/api/tutoria/products');    setProducts(Array.isArray(r.data) ? r.data : []); }),
        safe(async () => {
          const r = await axios.get('/api/tutoria/team');
          const data = Array.isArray(r.data) ? r.data : [];
          setAllUsers(data.filter((u: UserItem) => u.role !== 'ADMIN'));
        }),
        safe(async () => { const r = await axios.get('/api/admin/banks');              setBanks(Array.isArray(r.data) ? r.data : []); }),
        safe(async () => { const r = await axios.get('/api/admin/master/impacts');     setImpacts(Array.isArray(r.data) ? r.data : []); }),
        safe(async () => { const r = await axios.get('/api/admin/master/origins');     setOrigins(Array.isArray(r.data) ? r.data : []); }),
        safe(async () => { const r = await axios.get('/api/admin/master/detected-by'); setDetectedBy(Array.isArray(r.data) ? r.data : []); }),
        safe(async () => { const r = await axios.get('/api/admin/master/departments'); setDepts(Array.isArray(r.data) ? r.data : []); }),
        safe(async () => { const r = await axios.get('/api/admin/master/activities');  setActivities(Array.isArray(r.data) ? r.data : []); }),
        safe(async () => { const r = await axios.get('/api/admin/master/error-types'); setErrorTypes(Array.isArray(r.data) ? r.data : []); }),
      ]);
    })();
  }, [user]);

  // ── Cascading Dependencies ──────────────────────────────────────────────

  const filteredActivities = activities.filter(a => {
    if (a.is_active === false) return false;
    if (!a.bank_id && !a.department_id) return true;
    if (bankId && a.bank_id && a.bank_id !== Number(bankId)) return false;
    if (departmentId && a.department_id && a.department_id !== Number(departmentId)) return false;
    if (!bankId && !departmentId) return true;
    if (bankId && !departmentId) return a.bank_id === Number(bankId);
    if (!bankId && departmentId) return a.department_id === Number(departmentId);
    return true;
  });

  const filteredErrorTypes = errorTypes.filter(et => {
    if (et.is_active === false) return false;
    if (!activityId) return true;
    if (!et.activity_id) return true;
    return et.activity_id === Number(activityId);
  });

  const filteredCategories = categories.filter(c => {
    if (!originId) return true;
    if (!(c as any).origin_id) return true;
    return (c as any).origin_id === Number(originId);
  });

  useEffect(() => { setActivityId(''); setErrorTypeId(''); }, [bankId, departmentId]);
  useEffect(() => { setErrorTypeId(''); }, [activityId]);
  useEffect(() => { setCategory(''); }, [originId]);
  useEffect(() => { setImpactDetail(''); }, [impactId]);
  useEffect(() => { setOriginDetail(''); }, [originId]);

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || (user as any)?.is_tutor || (user as any)?.is_team_lead || (user as any)?.is_referente;
  const canSave = description.trim() && dateOccurrence && bankId && office.trim() && departmentId;

  const impactLevelStr = impacts.find(i => String(i.id) === impactId)?.level || '';
  const impactDetailOptions = IMPACT_DETAIL_OPTIONS[impactLevelStr] || [];

  const selectedOriginName = origins.find(o => String(o.id) === originId)?.name || '';
  const originDetailOptions = getOriginDetailOptions(selectedOriginName);

  const handleSave = async () => {
    if (!canSave) { setError(t('registerError.validationRequired')); return; }
    if (motivos.length > 0 && parsedRefs.length > 0) {
      const missingRef = motivos.some(m => m.references.length === 0);
      if (missingRef) { setError(t('registerError.validationMotivosRef')); return; }
    }
    setError('');
    setSaving(true);
    try {
      await axios.post('/api/tutoria/errors', {
        date_occurrence: dateOccurrence,
        description:     description.trim(),
        tutorado_id:     tutoradoId ? Number(tutoradoId) : null,
        category_id:     categoryId  ? Number(categoryId) : null,
        product_id:      productId   ? Number(productId)  : null,
        severity,
        date_detection:  dateDetection || null,
        date_solution:   dateSolution  || null,
        bank_id:         bankId        ? Number(bankId)        : null,
        office:          office.trim() || null,
        reference_code:  parsedRefs.join(', ') || null,
        impact_id:       impactId      ? Number(impactId)      : null,
        impact_detail:   impactDetail  || null,
        origin_id:       originId      ? Number(originId)      : null,
        origin_detail:   originDetail  || null,
        detected_by_id:  detectedById  ? Number(detectedById)  : null,
        department_id:   departmentId  ? Number(departmentId)  : null,
        activity_id:     activityId    ? Number(activityId)    : null,
        error_type_id:   errorTypeId   ? Number(errorTypeId)   : null,
        approver_id:     approverId    ? Number(approverId)    : null,
        recurrence_type: recurrenceType || null,
        motivos: motivos.map(m => ({ typology: m.typology, description: m.description.trim(), references: m.references })),
        refs: refs.filter(r => r.referencia.trim() || r.divisa.trim() || r.importe || r.cliente_final.trim()).map(r => ({
          referencia: r.referencia.trim() || null,
          divisa: r.divisa.trim() || null,
          importe: r.importe ? parseFloat(r.importe) : null,
          cliente_final: r.cliente_final.trim() || null,
        })),
      });
      setSaved(true);
      setTimeout(() => navigate('/tutoria/errors'), 1200);
    } catch (e: any) {
      setError(e?.response?.data?.detail || t('registerError.saveError'));
    } finally {
      setSaving(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (saved) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center animate-in zoom-in-95 fade-in duration-200">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">{t('registerError.successTitle')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('registerError.redirecting')}</p>
        </div>
      </div>
    );
  }

  const userOptions = allUsers.map(u => ({ value: String(u.id), label: u.full_name }));

  return (
    <div className="space-y-8 max-w-5xl">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="border-b pb-8 border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold uppercase tracking-widest text-red-500 dark:text-red-400">{t('registerError.portalLabel')}</span>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">{t('registerError.pageTitle')}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/50">{t('registerError.pageSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* ═══════════════ ROW 1 — Datas ════════════════════════════════════════ */}
      <div className={cardCls}>
        <div className={cardHeaderCls}>
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-md shadow-red-500/20">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{t('registerError.dates')}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <FieldLabel icon={Calendar} required>{t('registerError.dateError')}</FieldLabel>
              <InputField type="date" value={dateOccurrence} onChange={setDate} />
            </div>
            <div>
              <FieldLabel icon={Calendar}>{t('registerError.dateDetection')}</FieldLabel>
              <InputField type="date" value={dateDetection} onChange={setDateDetection} />
            </div>
            <div>
              <FieldLabel icon={Calendar}>{t('registerError.dateSolution')}</FieldLabel>
              <InputField type="date" value={dateSolution} onChange={setDateSolution} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ ROW 2 — Transação & Classificação ════════════════════ */}
      <div className={cardCls}>
        <div className={cardHeaderCls}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{t('registerError.transactionClassification')}</p>
        </div>
        <div className="p-6 space-y-5">
          {/* Banco · Oficina */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <FieldLabel icon={Building2} required>{t('registerError.bankClient')}</FieldLabel>
              <SelectField
                value={bankId}
                onChange={setBankId}
                options={banks.map(b => ({ value: String(b.id), label: b.name }))}
                placeholder={t('registerError.selectBank')}
              />
            </div>
            <div>
              <FieldLabel icon={Globe} required>{t('registerError.office')}</FieldLabel>
              <InputField type="number" value={office} onChange={setOffice} placeholder="1234" />
            </div>
          </div>

          {/* Impacto · Detalle Impacto · Origen · Detalle Origen · Tipología · Detectado Por */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div>
              <FieldLabel icon={Zap}>{t('registerError.impact')}</FieldLabel>
              <SelectField
                value={impactId}
                onChange={setImpactId}
                options={impacts.filter(i => i.is_active !== false).map(i => ({ value: String(i.id), label: i.name }))}
                placeholder={t('registerError.select')}
              />
            </div>
            {impactId && impactDetailOptions.length > 0 && (
              <div>
                <FieldLabel icon={Zap}>{t('registerError.impactDetail', 'Detalle Impacto')}</FieldLabel>
                <SelectField
                  value={impactDetail}
                  onChange={setImpactDetail}
                  options={impactDetailOptions.map(o => ({ value: o, label: o }))}
                  placeholder={t('registerError.select')}
                />
              </div>
            )}
            <div>
              <FieldLabel icon={Target}>{t('registerError.origin')}</FieldLabel>
              <SelectField
                value={originId}
                onChange={setOriginId}
                options={origins.filter(i => i.is_active !== false).map(i => ({ value: String(i.id), label: i.name }))}
                placeholder={t('registerError.select')}
              />
            </div>
            {originId && originDetailOptions.length > 0 && (
              <div>
                <FieldLabel icon={Target}>{t('registerError.originDetail', 'Detalle Origen')}</FieldLabel>
                <SelectField
                  value={originDetail}
                  onChange={setOriginDetail}
                  options={originDetailOptions.map(o => ({ value: o, label: o }))}
                  placeholder={t('registerError.select')}
                />
              </div>
            )}
            <div>
              <FieldLabel icon={Tag}>{t('registerError.errorTypology')}</FieldLabel>
              <SelectField
                value={categoryId}
                onChange={setCategory}
                options={filteredCategories.map(c => ({ value: String(c.id), label: c.name }))}
                placeholder={originId ? t('registerError.select') : t('registerError.selectOriginFirst')}
              />
            </div>
            <div>
              <FieldLabel icon={Eye}>{t('registerError.detectedBy')}</FieldLabel>
              <SelectField
                value={detectedById}
                onChange={setDetectedById}
                options={detectedBy.filter(i => i.is_active !== false).map(i => ({ value: String(i.id), label: i.name }))}
                placeholder={t('registerError.select')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ ROW 2b — Referências ════════════════════════════════ */}
      <div className={cardCls}>
        <div className={`${cardHeaderCls} justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-cyan-500/20">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{t('registerError.refsTitle', 'Referências')}</p>
          </div>
          <button
            type="button"
            onClick={addRef}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('registerError.addRef', '+ Ref')}
          </button>
        </div>
        <div className="p-6 space-y-3">
          {refs.map((r, idx) => (
            <div key={r.id} className={`grid grid-cols-[1fr_0.7fr_0.7fr_1fr_auto] gap-3 items-end ${idx > 0 ? 'pt-2' : ''}`}>
              <div>
                {idx === 0 && <FieldLabel icon={FileText}>{t('registerError.reference', 'Referência')}</FieldLabel>}
                <InputField value={r.referencia} onChange={v => updateRef(r.id, 'referencia', v)} placeholder="3530CLI0000057" />
              </div>
              <div>
                {idx === 0 && <FieldLabel icon={DollarSign}>{t('registerError.currency', 'Divisa')}</FieldLabel>}
                <SelectField value={r.divisa} onChange={v => updateRef(r.id, 'divisa', v)} options={CURRENCY_OPTIONS} placeholder="—" />
              </div>
              <div>
                {idx === 0 && <FieldLabel icon={DollarSign}>{t('registerError.amount', 'Importe')}</FieldLabel>}
                <InputField type="number" value={r.importe} onChange={v => updateRef(r.id, 'importe', v)} placeholder="0.00" />
              </div>
              <div>
                {idx === 0 && <FieldLabel icon={User}>{t('registerError.finalClient', 'Cliente Final')}</FieldLabel>}
                <InputField value={r.cliente_final} onChange={v => updateRef(r.id, 'cliente_final', v)} placeholder={t('registerError.finalClientHint', 'Nome do cliente')} />
              </div>
              <div className={idx === 0 ? 'mt-6' : ''}>
                <button
                  type="button"
                  onClick={() => removeRef(r.id)}
                  disabled={refs.length <= 1}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════ ROW 3 — Pessoas ═════════════════════════════════════ */}
      <div className={cardCls}>
        <div className={cardHeaderCls}>
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
            <User className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{t('registerError.people')}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {isManager && (
              <div>
                <FieldLabel icon={User}>{t('registerError.recorder')}</FieldLabel>
                <SelectField
                  value={tutoradoId}
                  onChange={setTutorado}
                  options={userOptions}
                  placeholder={t('registerError.selectRecorderOptional', 'Deixar vazio = eu próprio')}
                />
              </div>
            )}
            <div>
              <FieldLabel icon={User}>{t('registerError.releaser')}</FieldLabel>
              <SelectField
                value={approverId}
                onChange={setApproverId}
                options={userOptions}
                placeholder={t('registerError.selectReleaser')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ ROW 4 — Detalhes do Incidente ═══════════════════════ */}
      <div className={cardCls}>
        <div className={cardHeaderCls}>
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-md shadow-orange-500/20">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{t('registerError.incidentDetails')}</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <div>
              <FieldLabel icon={Building2} required>{t('registerError.department')}</FieldLabel>
              <SelectField
                value={departmentId}
                onChange={setDepartmentId}
                options={departments.filter(i => i.is_active !== false).map(i => ({ value: String(i.id), label: i.name }))}
                placeholder={t('registerError.select')}
              />
            </div>
            <div>
              <FieldLabel icon={ClipboardList}>{t('registerError.activity')}</FieldLabel>
              <SelectField
                value={activityId}
                onChange={setActivityId}
                options={filteredActivities.map(i => ({ value: String(i.id), label: i.name }))}
                placeholder={bankId || departmentId ? t('registerError.select') : t('registerError.selectBankDept')}
              />
            </div>
            <div>
              <FieldLabel icon={Briefcase}>{t('registerError.errorType')}</FieldLabel>
              <SelectField
                value={errorTypeId}
                onChange={setErrorTypeId}
                options={filteredErrorTypes.map(et => ({ value: String(et.id), label: et.name }))}
                placeholder={activityId ? t('registerError.select') : t('registerError.selectActivity')}
              />
            </div>
            <div>
              <FieldLabel icon={RefreshCw}>{t('registerError.recurrence')}</FieldLabel>
              <SelectField
                value={recurrenceType}
                onChange={setRecurrence}
                options={recurrenceOptions}
                placeholder={t('registerError.select')}
              />
            </div>
            <div>
              <FieldLabel icon={AlertTriangle}>{t('registerError.severity')}</FieldLabel>
              <SelectField
                value={severity}
                onChange={setSeverity}
                options={severityOptions}
                placeholder={t('registerError.select')}
              />
            </div>
          </div>

          <div>
            <FieldLabel required>{t('registerError.incidentDescription')}</FieldLabel>
            <TextareaField
              value={description}
              onChange={setDescription}
              placeholder={t('registerError.descriptionHint')}
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════ ROW 5 — Motivos do Erro ════════════════════════════= */}
      <div className={cardCls}>
        <div className={cardHeaderCls}>
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/20">
            <Tag className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{t('registerError.errorReasons')}</p>
        </div>
        <div className="p-6 space-y-5">
          {/* Typology buttons */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-gray-500 dark:text-gray-400">
              {t('registerError.addReasonByTypology')}
            </p>
            <div className="flex flex-wrap gap-2">
              {TYPOLOGY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => addMotivo(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${opt.color} shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Motivos list */}
          <div className="space-y-3">
            {motivos.map(m => {
              const opt = TYPOLOGY_OPTIONS.find(o => o.value === m.typology);
              const noRefsEntered = parsedRefs.length === 0;
              const missingRef = !noRefsEntered && m.references.length === 0;
              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border space-y-3 transition-colors ${
                    missingRef
                      ? 'border-red-300 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/[0.04]'
                      : 'bg-gray-50 border-gray-200 dark:bg-white/[0.02] dark:border-white/8'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-gradient-to-r ${opt?.color || 'from-gray-500 to-gray-600'} whitespace-nowrap mt-1`}>
                      {opt?.label || m.typology}
                    </span>
                    <div className="flex-1">
                      <TextareaField
                        value={m.description}
                        onChange={(v) => updateMotivoDesc(m.id, v)}
                        placeholder={t('registerError.reasonDescHint')}
                        rows={2}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMotivo(m.id)}
                      className="mt-1 p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Reference checkboxes */}
                  {parsedRefs.length > 0 ? (
                    <div className="pl-1">
                      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${
                        missingRef ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {t('registerError.linkedRefs')} {missingRef && t('registerError.selectAtLeast1')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {parsedRefs.map(ref => {
                          const selected = m.references.includes(ref);
                          return (
                            <button
                              key={ref}
                              type="button"
                              onClick={() => toggleMotivoRef(m.id, ref)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                                selected
                                  ? 'bg-red-500/90 text-white border-red-500 shadow-md shadow-red-500/20'
                                  : 'bg-white border-gray-200 text-gray-500 hover:border-red-400/40 hover:text-gray-700 dark:bg-white/[0.04] dark:border-white/10 dark:text-gray-400 dark:hover:border-red-500/40 dark:hover:text-white'
                              }`}
                            >
                              {ref}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] italic pl-1 text-gray-400 dark:text-gray-600">
                      {t('registerError.enterRefsAbove')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {motivos.length === 0 && (
            <p className="text-center py-4 text-xs italic text-gray-400 dark:text-gray-600">
              {t('registerError.noReasons')}
            </p>
          )}
        </div>
      </div>

      {/* ── Error message ────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm bg-red-50 border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* ── Bottom action bar ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border p-5 flex items-center justify-between gap-4 flex-wrap bg-white border-gray-200 shadow-sm dark:bg-white/[0.03] dark:border-white/8 dark:shadow-none">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {!tutoradoId && !description.trim()
            ? <span className="text-gray-400 dark:text-gray-600">{t('registerError.fillRequired')}</span>
            : !tutoradoId
              ? <span className="text-orange-400">{t('registerError.selectRecorderHint')}</span>
              : !description.trim()
                ? <span className="text-orange-400">{t('registerError.fillDescription')}</span>
                : <span className="text-green-600 dark:text-green-400">{t('registerError.readyToSave')}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/tutoria/errors')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="w-4 h-4" /> {t('registerError.exit')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white text-sm font-bold shadow-lg shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('registerError.saving')}</>
              : <><Save className="w-4 h-4" /> {t('registerError.save')}</>}
          </button>
        </div>
      </div>

    </div>
  );
}
