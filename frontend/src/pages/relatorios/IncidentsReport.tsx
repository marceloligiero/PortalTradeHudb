import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, Loader2, AlertTriangle, ChevronDown,
  Calendar, X, FileSpreadsheet, Search, RefreshCw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';
import * as XLSX from 'xlsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Incident {
  id: number;
  date_occurrence: string | null;
  date_detection: string | null;
  date_solution: string | null;
  office: string | null;
  bank_name: string | null;
  product_name: string | null;
  category_name: string | null;
  reference_code: string | null;
  final_client: string | null;
  amount: number | null;
  currency: string | null;
  impact_name: string | null;
  origin_name: string | null;
  clasificacion: string | null;
  severity: string | null;
  recurrence_type: string | null;
  detected_by_name: string | null;
  department_name: string | null;
  activity_name: string | null;
  description: string | null;
  solution: string | null;
  action_plan_text: string | null;
  escalado: string | null;
  comentarios_reunion: string | null;
  tutorado_name: string | null;
  created_by_name: string | null;
  approver_name: string | null;
  status: string | null;
}

interface FilterOption { id: number; name: string }

interface Filters {
  impacts: FilterOption[];
  origins: FilterOption[];
  banks: FilterOption[];
  departments: FilterOption[];
  detected_by: FilterOption[];
  categories: FilterOption[];
  products: FilterOption[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function fmtAmount(val: number | null, cur: string | null) {
  if (val == null) return '';
  const formatted = val.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return cur ? `${formatted} ${cur}` : formatted;
}

function recurrenceLabel(v: string | null, t: (key: string) => string) {
  if (!v) return '';
  const map: Record<string, string> = { FIRST: t('relIncidents.punctual'), RECURRENT: t('relIncidents.recurrent'), SYSTEMIC: t('relIncidents.systemic') };
  return map[v] || v;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function IncidentsReport() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDark } = useTheme();

  // Only ADMIN and MANAGER can view this report
  const userRole = (user as any)?.role || '';
  const canView = userRole === 'ADMIN' || userRole === 'MANAGER';

  const [data, setData] = useState<Incident[]>([]);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [impactId, setImpactId] = useState('');
  const [originId, setOriginId] = useState('');
  const [bankId, setBankId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [detectedById, setDetectedById] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productId, setProductId] = useState('');
  const [recurrence, setRecurrence] = useState('');
  const [searchText, setSearchText] = useState('');

  // Load filters on mount, then default to "Alto" impact
  useEffect(() => {
    api.get('/relatorios/incidents/filters')
      .then(r => {
        const f: Filters = r.data;
        setFilters(f);
        // Default to "Alto" impact
        const alto = f.impacts?.find((i: FilterOption) => i.name.toLowerCase() === 'alto');
        if (alto) {
          setImpactId(String(alto.id));
        }
      })
      .catch(() => {});
  }, []);

  // Load data
  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (impactId) params.set('impact_id', impactId);
    if (originId) params.set('origin_id', originId);
    if (bankId) params.set('bank_id', bankId);
    if (departmentId) params.set('department_id', departmentId);
    if (detectedById) params.set('detected_by_id', detectedById);
    if (categoryId) params.set('category_id', categoryId);
    if (productId) params.set('product_id', productId);
    if (recurrence) params.set('recurrence_type', recurrence);

    api.get(`/relatorios/incidents?${params.toString()}`)
      .then(r => setData(Array.isArray(r.data) ? r.data : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  // Fetch data when filters finish loading (impactId defaults to "Alto")
  useEffect(() => {
    if (filters) fetchData();
  }, [filters]);

  // Local text search
  const filtered = useMemo(() => {
    if (!searchText.trim()) return data;
    const s = searchText.toLowerCase();
    return data.filter(i =>
      (i.description || '').toLowerCase().includes(s) ||
      (i.final_client || '').toLowerCase().includes(s) ||
      (i.bank_name || '').toLowerCase().includes(s) ||
      (i.reference_code || '').toLowerCase().includes(s) ||
      (i.tutorado_name || '').toLowerCase().includes(s) ||
      (i.solution || '').toLowerCase().includes(s) ||
      (i.action_plan_text || '').toLowerCase().includes(s)
    );
  }, [data, searchText]);

  // ── Clear filters ─────────────────────────────────────────────────────────
  const clearFilters = () => {
    setDateFrom(''); setDateTo('');
    // Reset impactId back to "Alto" default
    const alto = filters?.impacts?.find(i => i.name.toLowerCase() === 'alto');
    setImpactId(alto ? String(alto.id) : '');
    setOriginId('');
    setBankId(''); setDepartmentId('');
    setDetectedById(''); setCategoryId('');
    setProductId(''); setRecurrence('');
    setSearchText('');
  };

  const hasActiveFilters = dateFrom || dateTo || impactId || originId || bankId || departmentId || detectedById || categoryId || productId || recurrence;

  // ── Excel Export ──────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const rows = filtered.map(i => ({
      [t('relIncidents.excelDateError')]: fmtDate(i.date_occurrence),
      [t('relIncidents.excelDateDetection')]: fmtDate(i.date_detection),
      [t('relIncidents.excelOffice')]: i.office || '',
      [t('relIncidents.excelClient')]: i.bank_name || '',
      [t('relIncidents.excelProduct')]: i.product_name || '',
      [t('relIncidents.excelEvent')]: i.activity_name || '',
      [t('relIncidents.excelReference')]: i.reference_code || '',
      [t('relIncidents.excelFinalClient')]: i.final_client || '',
      [t('relIncidents.excelAmount')]: i.amount ?? '',
      [t('relIncidents.excelCurrency')]: i.currency || '',
      [t('relIncidents.excelClassification')]: i.clasificacion || '',
      [t('relIncidents.excelOrigin')]: i.origin_name || '',
      [t('relIncidents.excelErrorTypology')]: i.category_name || '',
      [t('relIncidents.excelImpact')]: i.impact_name || '',
      [t('relIncidents.excelRecurrence')]: recurrenceLabel(i.recurrence_type, t),
      [t('relIncidents.excelDetectedBy')]: i.detected_by_name || '',
      [t('relIncidents.excelDescription')]: i.description || '',
      [t('relIncidents.excelActionPlan')]: i.action_plan_text || '',
      [t('relIncidents.excelEscalated')]: i.escalado || '',
      [t('relIncidents.excelMeetingComments')]: i.comentarios_reunion || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths matching the original Excel
    ws['!cols'] = [
      { wch: 12 },  // A - Fecha error
      { wch: 14 },  // B - Fecha Detección
      { wch: 8 },   // C - Oficina
      { wch: 12 },  // D - Cliente
      { wch: 16 },  // E - Producto
      { wch: 18 },  // F - EVENTO
      { wch: 22 },  // G - Referencia
      { wch: 40 },  // H - Cliente (final)
      { wch: 16 },  // I - Importe del evento
      { wch: 6 },   // J - Divisa
      { wch: 14 },  // K - Clasificación
      { wch: 16 },  // L - Origen
      { wch: 22 },  // M - Tipología del error
      { wch: 36 },  // N - Impacto
      { wch: 14 },  // O - Recurrencia
      { wch: 24 },  // P - Detectado por
      { wch: 60 },  // Q - Descripción incidencia
      { wch: 60 },  // R - Análisis y Plan de Acción
      { wch: 14 },  // S - Escalado
      { wch: 60 },  // T - Comentarios vistos en la reunión
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DETALLE');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Formulario_unico_Trade_Incidencias_${today}.xlsx`);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const cardCls = `rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`;
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all ${
    isDark
      ? 'bg-white/[0.04] border-white/10 text-white focus:border-red-500'
      : 'bg-white border-gray-200 text-gray-900 focus:border-red-400'
  }`;
  const selectCls = `w-full appearance-none px-3 py-2 pr-8 rounded-xl border text-sm outline-none transition-all cursor-pointer ${
    isDark
      ? 'bg-white/[0.04] border-white/10 text-white focus:border-red-500'
      : 'bg-white border-gray-200 text-gray-900 focus:border-red-400'
  }`;

  const SelectFilter = ({ value, onChange, options, placeholder }: {
    value: string; onChange: (v: string) => void; options: FilterOption[]; placeholder: string;
  }) => (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} className={selectCls}
        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : undefined }}>
        <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{placeholder}</option>
        {options.map(o => (
          <option key={o.id} value={String(o.id)} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{o.name}</option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
    </div>
  );

  // Count high impact
  const highImpactCount = filtered.filter(i => (i.impact_name || '').toLowerCase() === 'alto').length;

  // ── Access denied ─────────────────────────────────────────────────────────
  if (!canView) {
    return (
      <div className={`text-center py-24 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-bold">{t('relIncidents.accessRestricted')}</p>
        <p className="text-sm mt-1">{t('relIncidents.accessRestrictedDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className={`border-b pb-6 ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('relIncidents.title')}</h1>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                {t('relIncidents.incidentsCount', { count: filtered.length })}
                {highImpactCount > 0 && (
                  <> · <span className="text-red-400 font-semibold">{t('relIncidents.highImpactCount', { count: highImpactCount })}</span></>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              } ${hasActiveFilters ? (isDark ? 'border-red-500/40 text-red-400' : 'border-red-400/40 text-red-500') : ''}`}
            >
              <Filter className="w-4 h-4" />
              {t('relIncidents.filters')}
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 12px 30px rgba(34,197,94,.3)' }}
              whileTap={{ scale: 0.97 }}
              onClick={exportToExcel}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white text-sm font-bold shadow-lg shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {t('relIncidents.exportExcel')}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Filters Panel ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && filters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className={cardCls}
          >
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <Filter className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('relIncidents.filters')}</span>
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button onClick={() => { clearFilters(); setTimeout(fetchData, 50); }}
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
                    <X className="w-3 h-3 inline mr-1" />{t('relIncidents.clear')}
                  </button>
                )}
                <motion.button whileTap={{ scale: 0.95 }} onClick={fetchData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-400 transition-all">
                  <Search className="w-3 h-3" />{t('relIncidents.apply')}
                </motion.button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Row 1: Dates + Search */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Calendar className="w-3 h-3 inline mr-1" />{t('relIncidents.dateFrom')}
                  </label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Calendar className="w-3 h-3 inline mr-1" />{t('relIncidents.dateTo')}
                  </label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Search className="w-3 h-3 inline mr-1" />{t('relIncidents.freeSearch')}
                  </label>
                  <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder={t('relIncidents.searchPlaceholder')} className={inputCls} />
                </div>
              </div>
              {/* Row 2: Dropdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('relIncidents.impact')}</label>
                  <SelectFilter value={impactId} onChange={setImpactId} options={filters.impacts} placeholder={t('relIncidents.all')} />
                </div>
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('relIncidents.origin')}</label>
                  <SelectFilter value={originId} onChange={setOriginId} options={filters.origins} placeholder={t('relIncidents.all')} />
                </div>
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('relIncidents.bank')}</label>
                  <SelectFilter value={bankId} onChange={setBankId} options={filters.banks} placeholder={t('relIncidents.all')} />
                </div>
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('relIncidents.department')}</label>
                  <SelectFilter value={departmentId} onChange={setDepartmentId} options={filters.departments} placeholder={t('relIncidents.all')} />
                </div>
              </div>
              {/* Row 3: More dropdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('relIncidents.detectedBy')}</label>
                  <SelectFilter value={detectedById} onChange={setDetectedById} options={filters.detected_by} placeholder={t('relIncidents.all')} />
                </div>
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('relIncidents.category')}</label>
                  <SelectFilter value={categoryId} onChange={setCategoryId} options={filters.categories} placeholder={t('relIncidents.allFem')} />
                </div>
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('relIncidents.product')}</label>
                  <SelectFilter value={productId} onChange={setProductId} options={filters.products} placeholder={t('relIncidents.all')} />
                </div>
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('relIncidents.recurrence')}</label>
                  <div className="relative">
                    <select value={recurrence} onChange={e => setRecurrence(e.target.value)} className={selectCls}
                      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : undefined }}>
                      <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('relIncidents.allFem')}</option>
                      <option value="FIRST" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('relIncidents.punctual')}</option>
                      <option value="RECURRENT" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('relIncidents.recurrent')}</option>
                      <option value="SYSTEMIC" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('relIncidents.systemic')}</option>
                    </select>
                    <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI Summary ────────────────────────────────────────────────────── */}
      {!loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: t('relIncidents.totalIncidents'), value: filtered.length, color: 'from-blue-500 to-indigo-600' },
            { label: t('relIncidents.highImpactLabel'), value: highImpactCount, color: 'from-red-500 to-rose-600' },
            { label: t('relIncidents.lowImpact'), value: filtered.filter(i => (i.impact_name || '').toLowerCase() === 'baixo').length, color: 'from-green-500 to-emerald-600' },
            { label: t('relIncidents.recurrentLabel'), value: filtered.filter(i => i.recurrence_type === 'RECURRENT' || i.recurrence_type === 'SYSTEMIC').length, color: 'from-amber-500 to-orange-600' },
          ].map(kpi => (
            <div key={kpi.label} className={cardCls}>
              <div className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg`}>
                  <span className="text-white text-sm font-black">{kpi.value}</span>
                </div>
                <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{kpi.label}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Data Table ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-24 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-bold">{t('relIncidents.noIncidentsFound')}</p>
          <p className="text-sm mt-1">{t('relIncidents.noIncidentsDesc')}</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cardCls}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={isDark ? 'bg-red-600/80' : 'bg-red-600'}>
                  {[
                    t('relIncidents.colDateError'), t('relIncidents.colDateDetection'), t('relIncidents.colOffice'), t('relIncidents.colClient'), t('relIncidents.colProduct'),
                    t('relIncidents.colEvent'), t('relIncidents.colReference'), t('relIncidents.colFinalClient'), t('relIncidents.colAmount'), t('relIncidents.colCurrency'),
                    t('relIncidents.colClassification'), t('relIncidents.colOrigin'), t('relIncidents.colErrorTypology'),
                    t('relIncidents.colImpact'), t('relIncidents.colRecurrence'), t('relIncidents.colDetectedBy'),
                    t('relIncidents.colDescription'), t('relIncidents.colActionPlan'),
                    t('relIncidents.colEscalated'), t('relIncidents.colMeetingComments'),
                  ].map(col => (
                    <th key={col} className="px-3 py-3 text-left text-white font-bold whitespace-nowrap border-r border-red-500/30 last:border-r-0">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => {
                  const isHigh = (row.impact_name || '').toLowerCase() === 'alto';
                  return (
                    <tr
                      key={row.id}
                      className={`border-b transition-colors ${
                        isDark
                          ? `border-white/5 ${isHigh ? 'bg-red-500/[0.06]' : idx % 2 === 0 ? 'bg-white/[0.01]' : 'bg-white/[0.03]'} hover:bg-white/[0.06]`
                          : `border-gray-100 ${isHigh ? 'bg-red-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-100`
                      }`}
                    >
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{fmtDate(row.date_occurrence)}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{fmtDate(row.date_detection)}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.office || ''}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.bank_name || ''}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.product_name || ''}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.activity_name || ''}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap font-mono text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{row.reference_code || ''}</td>
                      <td className={`px-3 py-2.5 max-w-[200px] truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`} title={row.final_client || ''}>{row.final_client || ''}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap text-right font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{fmtAmount(row.amount, row.currency)}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{row.currency || ''}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.clasificacion || ''}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.origin_name || ''}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.category_name || ''}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isHigh
                            ? isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                            : isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                        }`}>
                          {row.impact_name || '—'}
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{recurrenceLabel(row.recurrence_type, t)}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.detected_by_name || ''}</td>
                      <td className={`px-3 py-2.5 max-w-[300px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="line-clamp-3 text-[11px] leading-relaxed">{row.description || ''}</div>
                      </td>
                      <td className={`px-3 py-2.5 max-w-[300px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="line-clamp-3 text-[11px] leading-relaxed">{row.action_plan_text || ''}</div>
                      </td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.escalado || ''}</td>
                      <td className={`px-3 py-2.5 max-w-[250px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="line-clamp-3 text-[11px] leading-relaxed">{row.comentarios_reunion || ''}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className={`px-6 py-3 border-t flex items-center justify-between ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('relIncidents.recordsFound', { count: filtered.length })}
            </span>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={fetchData}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <RefreshCw className="w-3 h-3" /> {t('relIncidents.refresh')}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
