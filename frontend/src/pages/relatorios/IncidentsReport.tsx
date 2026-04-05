import { useState, useEffect, useMemo } from 'react';
import {
  Filter, Loader2, AlertTriangle, ChevronDown,
  Calendar, X, FileSpreadsheet, Search, RefreshCw,
} from 'lucide-react';
import { KpiCard } from '../../components/reports';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/axios';
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
  impact_level: string | null;
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

// ─── SelectFilter ──────────────────────────────────────────────────────────────

function SelectFilter({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: FilterOption[]; placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2 pr-8 rounded-xl border text-sm outline-none transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EC0000]/30"
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.id} value={String(o.id)}>{o.name}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-400 dark:text-gray-500" />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function IncidentsReport() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const userRole = (user as any)?.role || '';
  const canView = userRole === 'ADMIN' || userRole === 'MANAGER';

  const [data, setData] = useState<Incident[]>([]);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [impactLevel, setImpactLevel] = useState('');
  const [originId, setOriginId] = useState('');
  const [bankId, setBankId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [detectedById, setDetectedById] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productId, setProductId] = useState('');
  const [recurrence, setRecurrence] = useState('');
  const [searchText, setSearchText] = useState('');

  // Load filter options on mount
  useEffect(() => {
    api.get('/relatorios/incidents/filters')
      .then(r => setFilters(r.data))
      .catch(() => {});
  }, []);

  // Load data
  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (impactLevel) params.set('impact_level', impactLevel);
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

  // Clear filters
  const clearFilters = () => {
    setDateFrom(''); setDateTo('');
    setImpactLevel('');
    setOriginId('');
    setBankId(''); setDepartmentId('');
    setDetectedById(''); setCategoryId('');
    setProductId(''); setRecurrence('');
    setSearchText('');
  };

  const hasActiveFilters = dateFrom || dateTo || impactLevel || originId || bankId || departmentId || detectedById || categoryId || productId || recurrence;

  // Excel Export — headers always in Spanish (regulatory requirement)
  const ES_EXCEL_HEADERS = {
    dateError: 'Fecha error',
    dateDetection: 'Fecha Detección',
    office: 'Oficina',
    client: 'Cliente',
    product: 'Producto',
    event: 'EVENTO',
    reference: 'Referencia',
    finalClient: 'Cliente (final)',
    amount: 'Importe del evento',
    currency: 'Divisa',
    classification: 'Clasificación',
    origin: 'Origen',
    errorTypology: 'Tipología del error',
    impact: 'Impacto',
    recurrence: 'Recurrencia',
    detectedBy: 'Detectado por',
    description: 'Descripción incidencia',
    actionPlan: 'Análisis y Plan de Acción',
    escalated: 'Escalado',
    meetingComments: 'Comentarios vistos en la reunión',
  } as const;

  const exportToExcel = () => {
    const rows = filtered.map(i => ({
      [ES_EXCEL_HEADERS.dateError]: fmtDate(i.date_occurrence),
      [ES_EXCEL_HEADERS.dateDetection]: fmtDate(i.date_detection),
      [ES_EXCEL_HEADERS.office]: i.office || '',
      [ES_EXCEL_HEADERS.client]: i.bank_name || '',
      [ES_EXCEL_HEADERS.product]: i.product_name || '',
      [ES_EXCEL_HEADERS.event]: i.activity_name || '',
      [ES_EXCEL_HEADERS.reference]: i.reference_code || '',
      [ES_EXCEL_HEADERS.finalClient]: i.final_client || '',
      [ES_EXCEL_HEADERS.amount]: i.amount ?? '',
      [ES_EXCEL_HEADERS.currency]: i.currency || '',
      [ES_EXCEL_HEADERS.classification]: i.clasificacion || '',
      [ES_EXCEL_HEADERS.origin]: i.origin_name || '',
      [ES_EXCEL_HEADERS.errorTypology]: i.category_name || '',
      [ES_EXCEL_HEADERS.impact]: i.impact_level === 'ALTA' ? 'Alto' : i.impact_level === 'BAIXA' ? 'Baixo' : i.impact_name || '',
      [ES_EXCEL_HEADERS.recurrence]: ({ SI: 'Sí', NO: 'No', PERIODICA: 'Periódica', FIRST: 'Primera Vez', RECURRENT: 'Recurrente', SYSTEMIC: 'Sistémico' } as Record<string, string>)[i.recurrence_type ?? ''] ?? i.recurrence_type ?? '',
      [ES_EXCEL_HEADERS.detectedBy]: i.detected_by_name || '',
      [ES_EXCEL_HEADERS.description]: i.description || '',
      [ES_EXCEL_HEADERS.actionPlan]: i.action_plan_text || '',
      [ES_EXCEL_HEADERS.escalated]: i.escalado || '',
      [ES_EXCEL_HEADERS.meetingComments]: i.comentarios_reunion || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 16 },
      { wch: 18 }, { wch: 22 }, { wch: 40 }, { wch: 16 }, { wch: 6 },
      { wch: 14 }, { wch: 16 }, { wch: 22 }, { wch: 36 }, { wch: 14 },
      { wch: 24 }, { wch: 60 }, { wch: 60 }, { wch: 14 }, { wch: 60 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DETALLE');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Formulario_unico_Trade_Incidencias_${today}.xlsx`);
  };

  // Count high impact — use impact_level field (always populated)
  const highImpactCount = filtered.filter(i => i.impact_level === 'ALTA').length;

  // Access denied
  if (!canView) {
    return (
      <div className="text-center py-24 text-gray-400 dark:text-gray-600">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-bold">{t('relIncidents.accessRestricted')}</p>
        <p className="text-sm mt-1">{t('relIncidents.accessRestrictedDesc')}</p>
      </div>
    );
  }

  const inputCls = 'w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EC0000]/30';

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-[#EC0000]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#EC0000]">
                {t('relIncidents.portalTitle', { defaultValue: 'Incidencias' })}
              </p>
              <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">{t('relIncidents.title')}</h1>
              <p className="text-sm mt-0.5 text-gray-500 dark:text-gray-400">
                {t('relIncidents.incidentsCount', { count: filtered.length })}
                {highImpactCount > 0 && (
                  <> · <span className="text-[#EC0000] font-semibold">{t('relIncidents.highImpactCount', { count: highImpactCount })}</span></>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all
                bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300
                hover:bg-gray-50 dark:hover:bg-gray-800
                ${hasActiveFilters ? 'border-[#EC0000]/40 text-[#EC0000]' : ''}`}
            >
              <Filter className="w-4 h-4" />
              {t('relIncidents.filters')}
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#EC0000] animate-pulse" />
              )}
            </button>
            <button
              onClick={exportToExcel}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {t('relIncidents.exportExcel')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters Panel ──────────────────────────────────────────────────── */}
      {showFilters && filters && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#EC0000]" />
              <span className="text-sm font-bold text-gray-900 dark:text-white">{t('relIncidents.filters')}</span>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button onClick={() => { clearFilters(); setTimeout(fetchData, 50); }}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg transition-all text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white">
                  <X className="w-3 h-3 inline mr-1" />{t('relIncidents.clear')}
                </button>
              )}
              <button onClick={fetchData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EC0000] hover:bg-[#CC0000] text-white transition-colors">
                <Search className="w-3 h-3" />{t('relIncidents.apply')}
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {/* Row 1: Dates + Search */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3 inline mr-1" />{t('relIncidents.dateFrom')}
                </label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3 inline mr-1" />{t('relIncidents.dateTo')}
                </label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block text-gray-500 dark:text-gray-400">
                  <Search className="w-3 h-3 inline mr-1" />{t('relIncidents.freeSearch')}
                </label>
                <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder={t('relIncidents.searchPlaceholder')} className={inputCls} />
              </div>
            </div>
            {/* Row 2: Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block text-gray-500 dark:text-gray-400">{t('relIncidents.impact')}</label>
                <div className="relative">
                  <select value={impactLevel} onChange={e => setImpactLevel(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 rounded-xl border text-sm outline-none transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EC0000]/30">
                    <option value="">{t('relIncidents.all')}</option>
                    <option value="ALTA">Alto</option>
                    <option value="BAIXA">Baixo</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block text-gray-500 dark:text-gray-400">{t('relIncidents.origin')}</label>
                <SelectFilter value={originId} onChange={setOriginId} options={filters.origins} placeholder={t('relIncidents.all')} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block text-gray-500 dark:text-gray-400">{t('relIncidents.bank')}</label>
                <SelectFilter value={bankId} onChange={setBankId} options={filters.banks} placeholder={t('relIncidents.all')} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block text-gray-500 dark:text-gray-400">{t('relIncidents.department')}</label>
                <SelectFilter value={departmentId} onChange={setDepartmentId} options={filters.departments} placeholder={t('relIncidents.all')} />
              </div>
            </div>
            {/* Row 3: More dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block text-gray-500 dark:text-gray-400">{t('relIncidents.detectedBy')}</label>
                <SelectFilter value={detectedById} onChange={setDetectedById} options={filters.detected_by} placeholder={t('relIncidents.all')} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block text-gray-500 dark:text-gray-400">{t('relIncidents.category')}</label>
                <SelectFilter value={categoryId} onChange={setCategoryId} options={filters.categories} placeholder={t('relIncidents.allFem')} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block text-gray-500 dark:text-gray-400">{t('relIncidents.product')}</label>
                <SelectFilter value={productId} onChange={setProductId} options={filters.products} placeholder={t('relIncidents.all')} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block text-gray-500 dark:text-gray-400">{t('relIncidents.recurrence')}</label>
                <div className="relative">
                  <select value={recurrence} onChange={e => setRecurrence(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 rounded-xl border text-sm outline-none transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EC0000]/30">
                    <option value="">{t('relIncidents.allFem')}</option>
                    <option value="FIRST">{t('relIncidents.punctual')}</option>
                    <option value="RECURRENT">{t('relIncidents.recurrent')}</option>
                    <option value="SYSTEMIC">{t('relIncidents.systemic')}</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Summary ────────────────────────────────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard index={0} icon={AlertTriangle}
            label={t('relIncidents.totalIncidents')} value={filtered.length}
            boxClass="bg-blue-50 dark:bg-blue-900/20" iconClass="text-blue-600 dark:text-blue-400"
          />
          <KpiCard index={1} icon={AlertTriangle}
            label={t('relIncidents.highImpactLabel')} value={highImpactCount}
            boxClass="bg-red-50 dark:bg-red-900/20" iconClass="text-[#EC0000]"
          />
          <KpiCard index={2} icon={AlertTriangle}
            label={t('relIncidents.lowImpact')}
            value={filtered.filter(i => i.impact_level === 'BAIXA').length}
            boxClass="bg-emerald-50 dark:bg-emerald-900/20" iconClass="text-emerald-600 dark:text-emerald-400"
          />
          <KpiCard index={3} icon={RefreshCw}
            label={t('relIncidents.recurrentLabel')}
            value={filtered.filter(i => i.recurrence_type === 'RECURRENT' || i.recurrence_type === 'SYSTEMIC').length}
            boxClass="bg-amber-50 dark:bg-amber-900/20" iconClass="text-amber-600 dark:text-amber-400"
          />
        </div>
      )}

      {/* ── Data Table ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400 dark:text-gray-600">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-bold">{t('relIncidents.noIncidentsFound')}</p>
          <p className="text-sm mt-1">{t('relIncidents.noIncidentsDesc')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#EC0000]">
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
                      className={`border-b transition-colors border-gray-100 dark:border-gray-800
                        ${isHigh ? 'bg-red-50/50 dark:bg-red-900/10' : idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'}
                        hover:bg-gray-100 dark:hover:bg-gray-800/50`}
                    >
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{fmtDate(row.date_occurrence)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{fmtDate(row.date_detection)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{row.office || ''}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{row.bank_name || ''}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{row.product_name || ''}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{row.activity_name || ''}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[10px] text-gray-500 dark:text-gray-400">{row.reference_code || ''}</td>
                      <td className="px-3 py-2.5 max-w-[200px] truncate text-gray-700 dark:text-gray-300" title={row.final_client || ''}>{row.final_client || ''}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-right font-mono text-gray-700 dark:text-gray-300">{fmtAmount(row.amount, row.currency)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 dark:text-gray-400">{row.currency || ''}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{row.clasificacion || ''}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{row.origin_name || ''}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{row.category_name || ''}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isHigh
                            ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                            : 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                        }`}>
                          {row.impact_name || '\u2014'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{recurrenceLabel(row.recurrence_type, t)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{row.detected_by_name || ''}</td>
                      <td className="px-3 py-2.5 max-w-[300px] text-gray-700 dark:text-gray-300">
                        <div className="line-clamp-3 text-[11px] leading-relaxed">{row.description || ''}</div>
                      </td>
                      <td className="px-3 py-2.5 max-w-[300px] text-gray-700 dark:text-gray-300">
                        <div className="line-clamp-3 text-[11px] leading-relaxed">{row.action_plan_text || ''}</div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{row.escalado || ''}</td>
                      <td className="px-3 py-2.5 max-w-[250px] text-gray-700 dark:text-gray-300">
                        <div className="line-clamp-3 text-[11px] leading-relaxed">{row.comentarios_reunion || ''}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {t('relIncidents.recordsFound', { count: filtered.length })}
            </span>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white"
            >
              <RefreshCw className="w-3 h-3" /> {t('relIncidents.refresh')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
