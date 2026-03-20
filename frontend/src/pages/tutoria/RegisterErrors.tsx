import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Save, X, ChevronDown, Loader2,
  Calendar, User, Tag, CheckCircle2,
  Building2, Globe, DollarSign, FileText, Briefcase, Eye,
  Zap, Target, RefreshCw, ClipboardList, Plus, Trash2,
} from 'lucide-react';
import axios from '../../lib/axios';
import { CURRENCY_OPTIONS } from '../../lib/currencies';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserItem    { id: number; full_name: string; role?: string }
interface Category    { id: number; name: string; origin_id?: number | null }
interface ProductItem { id: number; code: string; name: string }
interface BankItem    { id: number; name: string; code?: string }
interface LookupItem  { id: number; name: string; description?: string; is_active?: boolean; bank_id?: number | null; department_id?: number | null; activity_id?: number | null }

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldLabel({ icon: Icon, children, isDark, required }: {
  icon?: React.ElementType; children: React.ReactNode; isDark: boolean; required?: boolean;
}) {
  return (
    <label className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function SelectField({ value, onChange, options, placeholder = '—', isDark, disabled = false }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string; isDark: boolean; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none px-3 py-2.5 pr-9 rounded-xl border text-sm outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isDark
            ? 'bg-white/[0.04] border-white/10 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
            : 'bg-white border-gray-200 text-gray-900 focus:border-red-400 focus:ring-2 focus:ring-red-400/10'
        }`}
        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : undefined }}
      >
        <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
    </div>
  );
}

function InputField({ value, onChange, placeholder = '', type = 'text', isDark }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; isDark: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
        isDark
          ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/10'
      }`}
    />
  );
}

function TextareaField({ value, onChange, placeholder = '', rows = 4, isDark }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; isDark: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all resize-none ${
        isDark
          ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/10'
      }`}
    />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RegisterErrors() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ── Form fields (matching Access form layout) ─────────────────────────────

  // Row 1 — Dates
  const [dateOccurrence, setDate]         = useState(() => new Date().toISOString().split('T')[0]);
  const [dateDetection, setDateDetection] = useState('');
  const [dateSolution, setDateSolution]   = useState('');

  // Row 2 — Transaction + Classification
  const [bankId, setBankId]               = useState('');
  const [office, setOffice]               = useState('');
  const [impactId, setImpactId]           = useState('');
  const [originId, setOriginId]           = useState('');
  const [categoryId, setCategory]         = useState('');   // Tipología Error
  const [detectedById, setDetectedById]   = useState('');

  // Row 3 — People
  const [tutoradoId, setTutorado]   = useState('');  // Grabador
  const [approverId, setApproverId] = useState('');  // Liberador

  // Row 4 — Details
  const [departmentId, setDepartmentId] = useState('');
  const [activityId, setActivityId]     = useState('');   // EVENTO (depends on Banco + Depto)
  const [errorTypeId, setErrorTypeId]   = useState('');   // Tipo Error (depends on Actividad)
  const [productId, setProduct]         = useState('');
  const [description, setDescription]   = useState('');
  const [recurrenceType, setRecurrence] = useState('');
  const [severity, setSeverity]         = useState('MEDIA');

  // ── Lists ─────────────────────────────────────────────────────────────────
  const [allUsers, setAllUsers]     = useState<UserItem[]>([]);  // All users except ADMIN
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

  // ── Motivos do Erro ─────────────────────────────────────────────────────
  interface Motivo { id: number; typology: string; description: string; references: string[] }
  interface RefRow { id: number; referencia: string; divisa: string; importe: string; cliente_final: string }
  const TYPOLOGY_OPTIONS = [
    { value: 'METHODOLOGY', label: t('registerError.typologyMethodology'), color: 'from-purple-500 to-indigo-500' },
    { value: 'KNOWLEDGE',   label: t('registerError.typologyKnowledge'), color: 'from-blue-500 to-cyan-500' },
    { value: 'DETAIL',      label: t('registerError.typologyDetail'), color: 'from-amber-500 to-orange-500' },
    { value: 'PROCEDURE',   label: t('registerError.typologyProcedure'), color: 'from-emerald-500 to-teal-500' },
  ];
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  // ── Refs (Referências) ────────────────────────────────────────────────
  const [refs, setRefs] = useState<RefRow[]>([{ id: 1, referencia: '', divisa: '', importe: '', cliente_final: '' }]);
  let refIdCounter = refs.length > 0 ? Math.max(...refs.map(r => r.id)) + 1 : 1;
  const addRef = () => setRefs(prev => [...prev, { id: refIdCounter++, referencia: '', divisa: '', importe: '', cliente_final: '' }]);
  const removeRef = (id: number) => setRefs(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
  const updateRef = (id: number, field: keyof RefRow, value: string) => setRefs(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  // Parse references from the Referências group rows
  const parsedRefs = refs.map(r => r.referencia.trim()).filter(Boolean);
  let motivoIdCounter = motivos.length > 0 ? Math.max(...motivos.map(m => m.id)) + 1 : 1;
  const addMotivo = (typology: string) => {
    setMotivos(prev => [...prev, { id: motivoIdCounter++, typology, description: '', references: [] }]);
  };
  const removeMotivo = (id: number) => {
    setMotivos(prev => prev.filter(m => m.id !== id));
  };
  const updateMotivoDesc = (id: number, desc: string) => {
    setMotivos(prev => prev.map(m => m.id === id ? { ...m, description: desc } : m));
  };
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
          // Load all users except ADMIN — used for Grabador and Liberador
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

  // Actividad depends on Banco + Depto → filter activities by bank_id & department_id
  const filteredActivities = activities.filter(a => {
    if (a.is_active === false) return false;
    // If activity has no bank/dept dependency (legacy), always show
    if (!a.bank_id && !a.department_id) return true;
    // Filter by selected bank
    if (bankId && a.bank_id && a.bank_id !== Number(bankId)) return false;
    // Filter by selected department
    if (departmentId && a.department_id && a.department_id !== Number(departmentId)) return false;
    // If neither bank nor dept selected yet, show all
    if (!bankId && !departmentId) return true;
    // If only bank selected, match bank
    if (bankId && !departmentId) return a.bank_id === Number(bankId);
    // If only dept selected, match dept
    if (!bankId && departmentId) return a.department_id === Number(departmentId);
    return true;
  });

  // Tipo Error depends on Actividad → filter error_types by activity_id
  const filteredErrorTypes = errorTypes.filter(et => {
    if (et.is_active === false) return false;
    if (!activityId) return true; // show all if no activity selected
    if (!et.activity_id) return true; // generic types always visible
    return et.activity_id === Number(activityId);
  });

  // Tipología Error depends on Origen → filter categories by origin_id
  const filteredCategories = categories.filter(c => {
    if (!originId) return true; // show all if no origin selected
    if (!(c as any).origin_id) return true; // legacy categories always visible
    return (c as any).origin_id === Number(originId);
  });

  // Reset dependent fields when parent changes
  useEffect(() => {
    // When bank or department changes, reset activity (and cascaded error type)
    setActivityId('');
    setErrorTypeId('');
  }, [bankId, departmentId]);

  useEffect(() => {
    // When activity changes, reset error type
    setErrorTypeId('');
  }, [activityId]);

  useEffect(() => {
    // When origin changes, reset tipología
    setCategory('');
  }, [originId]);

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || (user as any)?.is_tutor || (user as any)?.is_team_lead || (user as any)?.is_referente;
  const canSave = description.trim() && dateOccurrence && bankId && office.trim() && departmentId;

  const handleSave = async () => {
    if (!canSave) {
      setError(t('registerError.validationRequired'));
      return;
    }
    // Validate motivos: each must have at least 1 reference linked (if references exist)
    if (motivos.length > 0 && parsedRefs.length > 0) {
      const missingRef = motivos.some(m => m.references.length === 0);
      if (missingRef) {
        setError(t('registerError.validationMotivosRef'));
        return;
      }
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
        severity:        severity,
        // Dates
        date_detection:  dateDetection || null,
        date_solution:   dateSolution  || null,
        // Transaction
        bank_id:         bankId        ? Number(bankId)        : null,
        office:          office.trim() || null,
        reference_code:  parsedRefs.join(', ') || null,
        // Classification
        impact_id:       impactId      ? Number(impactId)      : null,
        origin_id:       originId      ? Number(originId)      : null,
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
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('registerError.successTitle')}</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('registerError.redirecting')}</p>
        </motion.div>
      </div>
    );
  }

  // ── Users for dropdowns (all except ADMIN) ────────────────────────────────
  const userOptions = allUsers.map(u => ({ value: String(u.id), label: u.full_name }));

  return (
    <div className="space-y-8 max-w-5xl">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className={`border-b pb-8 ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <div className="flex items-center gap-5">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30"
          >
            <AlertTriangle className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-red-400' : 'text-red-500'}`}>{t('registerError.portalLabel')}</span>
            <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('registerError.pageTitle')}</h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              {t('registerError.pageSubtitle')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ROW 1 — Fecha Error · Fch Detección · Fch Solución
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-md shadow-red-500/20">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('registerError.dates')}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <FieldLabel icon={Calendar} isDark={isDark} required>{t('registerError.dateError')}</FieldLabel>
              <InputField type="date" value={dateOccurrence} onChange={setDate} isDark={isDark} />
            </div>
            <div>
              <FieldLabel icon={Calendar} isDark={isDark}>{t('registerError.dateDetection')}</FieldLabel>
              <InputField type="date" value={dateDetection} onChange={setDateDetection} isDark={isDark} />
            </div>
            <div>
              <FieldLabel icon={Calendar} isDark={isDark}>{t('registerError.dateSolution')}</FieldLabel>
              <InputField type="date" value={dateSolution} onChange={setDateSolution} isDark={isDark} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ROW 2 — Banco(Cliente) · Oficina · Impacto · Origen · Tipología Error · Detectado Por
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('registerError.transactionClassification')}</p>
        </div>
        <div className="p-6 space-y-5">
          {/* Banco(Cliente) · Oficina */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <FieldLabel icon={Building2} isDark={isDark} required>{t('registerError.bankClient')}</FieldLabel>
              <SelectField
                value={bankId}
                onChange={setBankId}
                options={banks.map(b => ({ value: String(b.id), label: b.name }))}
                placeholder={t('registerError.selectBank')}
                isDark={isDark}
              />
            </div>
            <div>
              <FieldLabel icon={Globe} isDark={isDark} required>{t('registerError.office')}</FieldLabel>
              <InputField type="number" value={office} onChange={setOffice} placeholder="1234" isDark={isDark} />
            </div>
          </div>

          {/* Impacto · Origen · Tipología Error · Detectado Por */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div>
              <FieldLabel icon={Zap} isDark={isDark}>{t('registerError.impact')}</FieldLabel>
              <SelectField
                value={impactId}
                onChange={setImpactId}
                options={impacts.filter(i => i.is_active !== false).map(i => ({ value: String(i.id), label: i.name }))}
                placeholder={t('registerError.select')}
                isDark={isDark}
              />
            </div>
            <div>
              <FieldLabel icon={Target} isDark={isDark}>{t('registerError.origin')}</FieldLabel>
              <SelectField
                value={originId}
                onChange={setOriginId}
                options={origins.filter(i => i.is_active !== false).map(i => ({ value: String(i.id), label: i.name }))}
                placeholder={t('registerError.select')}
                isDark={isDark}
              />
            </div>
            <div>
              <FieldLabel icon={Tag} isDark={isDark}>{t('registerError.errorTypology')}</FieldLabel>
              <SelectField
                value={categoryId}
                onChange={setCategory}
                options={filteredCategories.map(c => ({ value: String(c.id), label: c.name }))}
                placeholder={originId ? t('registerError.select') : t('registerError.selectOriginFirst')}
                isDark={isDark}
              />
            </div>
            <div>
              <FieldLabel icon={Eye} isDark={isDark}>{t('registerError.detectedBy')}</FieldLabel>
              <SelectField
                value={detectedById}
                onChange={setDetectedById}
                options={detectedBy.filter(i => i.is_active !== false).map(i => ({ value: String(i.id), label: i.name }))}
                placeholder={t('registerError.select')}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ROW 2b — Refs (apenas Referência) — dynamic array
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.17 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-cyan-500/20">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('registerError.refsTitle', 'Referências')}</p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addRef}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('registerError.addRef', '+ Ref')}
          </motion.button>
        </div>
        <div className="p-6 space-y-3">
          {refs.map((r, idx) => (
            <div key={r.id} className={`grid grid-cols-[1fr_0.7fr_0.7fr_1fr_auto] gap-3 items-end ${idx > 0 ? 'pt-2' : ''}`}>
              <div>
                {idx === 0 && <FieldLabel icon={FileText} isDark={isDark}>{t('registerError.reference', 'Referência')}</FieldLabel>}
                <InputField value={r.referencia} onChange={v => updateRef(r.id, 'referencia', v)} placeholder="3530CLI0000057" isDark={isDark} />
              </div>
              <div>
                {idx === 0 && <FieldLabel icon={DollarSign} isDark={isDark}>{t('registerError.currency', 'Divisa')}</FieldLabel>}
                <SelectField value={r.divisa} onChange={v => updateRef(r.id, 'divisa', v)} options={CURRENCY_OPTIONS} placeholder="—" isDark={isDark} />
              </div>
              <div>
                {idx === 0 && <FieldLabel icon={DollarSign} isDark={isDark}>{t('registerError.amount', 'Importe')}</FieldLabel>}
                <InputField type="number" value={r.importe} onChange={v => updateRef(r.id, 'importe', v)} placeholder="0.00" isDark={isDark} />
              </div>
              <div>
                {idx === 0 && <FieldLabel icon={User} isDark={isDark}>{t('registerError.finalClient', 'Cliente Final')}</FieldLabel>}
                <InputField value={r.cliente_final} onChange={v => updateRef(r.id, 'cliente_final', v)} placeholder={t('registerError.finalClientHint', 'Nome do cliente')} isDark={isDark} />
              </div>
              <div className={idx === 0 ? 'mt-6' : ''}>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeRef(r.id)}
                  disabled={refs.length <= 1}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ROW 3 — Grabador · Liberador
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
            <User className="w-4 h-4 text-white" />
          </div>
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('registerError.people')}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {isManager && (
              <div>
                <FieldLabel icon={User} isDark={isDark}>{t('registerError.recorder')}</FieldLabel>
                <SelectField
                  value={tutoradoId}
                  onChange={setTutorado}
                  options={userOptions}
                  placeholder={t('registerError.selectRecorderOptional', 'Deixar vazio = eu próprio')}
                  isDark={isDark}
                />
              </div>
            )}
            <div>
              <FieldLabel icon={User} isDark={isDark}>{t('registerError.releaser')}</FieldLabel>
              <SelectField
                value={approverId}
                onChange={setApproverId}
                options={userOptions}
                placeholder={t('registerError.selectReleaser')}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ROW 4 — Depto · Actividad · Tipo Error · Descripción · Solución · Recurrencia
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-md shadow-orange-500/20">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('registerError.incidentDetails')}</p>
        </div>
        <div className="p-6 space-y-5">
          {/* Depto · Evento · Tipo Error · Recurrencia · Severidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <div>
              <FieldLabel icon={Building2} isDark={isDark} required>{t('registerError.department')}</FieldLabel>
              <SelectField
                value={departmentId}
                onChange={setDepartmentId}
                options={departments.filter(i => i.is_active !== false).map(i => ({ value: String(i.id), label: i.name }))}
                placeholder={t('registerError.select')}
                isDark={isDark}
              />
            </div>
            <div>
              <FieldLabel icon={ClipboardList} isDark={isDark}>{t('registerError.activity')}</FieldLabel>
              <SelectField
                value={activityId}
                onChange={setActivityId}
                options={filteredActivities.map(i => ({ value: String(i.id), label: i.name }))}
                placeholder={bankId || departmentId ? t('registerError.select') : t('registerError.selectBankDept')}
                isDark={isDark}
              />
            </div>
            <div>
              <FieldLabel icon={Briefcase} isDark={isDark}>{t('registerError.errorType')}</FieldLabel>
              <SelectField
                value={errorTypeId}
                onChange={setErrorTypeId}
                options={filteredErrorTypes.map(et => ({ value: String(et.id), label: et.name }))}
                placeholder={activityId ? t('registerError.select') : t('registerError.selectActivity')}
                isDark={isDark}
              />
            </div>
            <div>
              <FieldLabel icon={RefreshCw} isDark={isDark}>{t('registerError.recurrence')}</FieldLabel>
              <SelectField
                value={recurrenceType}
                onChange={setRecurrence}
                options={recurrenceOptions}
                placeholder={t('registerError.select')}
                isDark={isDark}
              />
            </div>
            <div>
              <FieldLabel icon={AlertTriangle} isDark={isDark}>{t('registerError.severity')}</FieldLabel>
              <SelectField
                value={severity}
                onChange={setSeverity}
                options={severityOptions}
                placeholder={t('registerError.select')}
                isDark={isDark}
              />
            </div>
          </div>

          {/* Descripción incidencia */}
          <div>
            <FieldLabel isDark={isDark} required>{t('registerError.incidentDescription')}</FieldLabel>
            <TextareaField
              value={description}
              onChange={setDescription}
              placeholder={t('registerError.descriptionHint')}
              rows={4}
              isDark={isDark}
            />
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ROW 5 — Motivos do Erro
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.28 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/20">
            <Tag className="w-4 h-4 text-white" />
          </div>
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('registerError.errorReasons')}</p>
        </div>
        <div className="p-6 space-y-5">
          {/* Typology buttons */}
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('registerError.addReasonByTypology')}
            </p>
            <div className="flex flex-wrap gap-2">
              {TYPOLOGY_OPTIONS.map(opt => (
                <motion.button
                  key={opt.value}
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => addMotivo(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${opt.color} shadow-md transition-all hover:shadow-lg`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Motivos list */}
          <AnimatePresence>
            {motivos.map(m => {
              const opt = TYPOLOGY_OPTIONS.find(o => o.value === m.typology);
              const noRefsEntered = parsedRefs.length === 0;
              const missingRef = !noRefsEntered && m.references.length === 0;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 rounded-xl border space-y-3 ${missingRef ? (isDark ? 'border-red-500/30 bg-red-500/[0.04]' : 'border-red-300 bg-red-50/50') : (isDark ? 'bg-white/[0.02] border-white/8' : 'bg-gray-50 border-gray-200')}`}
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
                        isDark={isDark}
                      />
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeMotivo(m.id)}
                      className="mt-1 p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Reference checkboxes */}
                  {parsedRefs.length > 0 ? (
                    <div className="pl-1">
                      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${missingRef ? 'text-red-400' : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
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
                                  : isDark
                                    ? 'bg-white/[0.04] border-white/10 text-gray-400 hover:border-red-500/40 hover:text-white'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-red-400/40 hover:text-gray-700'
                              }`}
                            >
                              {ref}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className={`text-[10px] italic pl-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      {t('registerError.enterRefsAbove')}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {motivos.length === 0 && (
            <p className={`text-center py-4 text-xs italic ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {t('registerError.noReasons')}
            </p>
          )}
        </div>
      </motion.div>

      {/* ── Error message ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm ${
              isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom action bar ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
        className={`rounded-2xl border p-5 flex items-center justify-between gap-4 flex-wrap ${
          isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {!tutoradoId && !description.trim()
            ? <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>{t('registerError.fillRequired')}</span>
            : !tutoradoId
              ? <span className="text-orange-400">{t('registerError.selectRecorderHint')}</span>
              : !description.trim()
                ? <span className="text-orange-400">{t('registerError.fillDescription')}</span>
                : <span className={isDark ? 'text-green-400' : 'text-green-600'}>{t('registerError.readyToSave')}</span>}
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/tutoria/errors')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              isDark
                ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <X className="w-4 h-4" /> {t('registerError.exit')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 12px 30px rgba(239,68,68,.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving || !canSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white text-sm font-bold shadow-lg shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('registerError.saving')}</>
              : <><Save className="w-4 h-4" /> {t('registerError.save')}</>}
          </motion.button>
        </div>
      </motion.div>

    </div>
  );
}
