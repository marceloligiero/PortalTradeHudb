import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Plus, Search, Filter, ChevronDown,
  RefreshCw, Calendar, User, Tag, ArrowRight, Loader2,
  Eye, XCircle, Clock,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TutoriaError {
  id: number;
  date_occurrence: string;
  description: string;
  tutorado_id: number;
  tutorado_name?: string;
  created_by_name?: string;
  category_id?: number;
  category_name?: string;
  impact_level?: string;
  status: string;
  is_recurrent: boolean;
  recurrence_count: number;
  is_active: boolean;
  plans_count: number;
  created_at: string;
  is_overdue?: boolean;
  deadline_date?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER = ['REGISTERED', 'ANALYSIS', 'ABERTO', 'EM_ANALISE', 'PLANO_CRIADO', 'EM_EXECUCAO', 'CONCLUIDO', 'VERIFICADO', 'PENDING_TUTOR_REVIEW', 'PENDING_CHIEF_APPROVAL', 'APPROVED', 'CANCELLED', 'RESOLVED'];

function impactClsDark(s: string) {
  const m: Record<string, string> = {
    BAIXA: 'bg-green-500/15 text-green-400 border-green-500/20',
    ALTA:  'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return m[s] || 'bg-gray-500/15 text-gray-400 border-gray-500/20';
}
function impactClsLight(s: string) {
  const m: Record<string, string> = {
    BAIXA: 'bg-green-50 text-green-700 border-green-200',
    ALTA:  'bg-red-50 text-red-700 border-red-200',
  };
  return m[s] || 'bg-gray-100 text-gray-600 border-gray-200';
}
function statusClsDark(s: string) {
  const m: Record<string, string> = {
    REGISTERED:             'bg-gray-500/15 text-gray-400 border-gray-500/20',
    ANALYSIS:               'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    ABERTO:                 'bg-red-500/15 text-red-400 border-red-500/20',
    EM_ANALISE:             'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    PLANO_CRIADO:           'bg-blue-500/15 text-blue-400 border-blue-500/20',
    EM_EXECUCAO:            'bg-orange-500/15 text-orange-400 border-orange-500/20',
    CONCLUIDO:              'bg-green-500/15 text-green-400 border-green-500/20',
    VERIFICADO:             'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    PENDING_TUTOR_REVIEW:   'bg-purple-500/15 text-purple-400 border-purple-500/20',
    PENDING_CHIEF_APPROVAL: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    APPROVED:               'bg-teal-500/15 text-teal-400 border-teal-500/20',
    CANCELLED:              'bg-gray-500/15 text-gray-500 border-gray-500/20',
    RESOLVED:               'bg-emerald-500 text-white border-emerald-500',
  };
  return m[s] || 'bg-gray-500/15 text-gray-400 border-gray-500/20';
}
function statusClsLight(s: string) {
  const m: Record<string, string> = {
    REGISTERED:             'bg-gray-100 text-gray-600 border-gray-200',
    ANALYSIS:               'bg-yellow-50 text-yellow-700 border-yellow-200',
    ABERTO:                 'bg-red-50 text-red-700 border-red-200',
    EM_ANALISE:             'bg-yellow-50 text-yellow-700 border-yellow-200',
    PLANO_CRIADO:           'bg-blue-50 text-blue-700 border-blue-200',
    EM_EXECUCAO:            'bg-orange-50 text-orange-700 border-orange-200',
    CONCLUIDO:              'bg-green-50 text-green-700 border-green-200',
    VERIFICADO:             'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING_TUTOR_REVIEW:   'bg-purple-50 text-purple-700 border-purple-200',
    PENDING_CHIEF_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED:               'bg-teal-50 text-teal-700 border-teal-200',
    CANCELLED:              'bg-gray-100 text-gray-500 border-gray-200',
    RESOLVED:               'bg-emerald-500 text-white border-emerald-500',
  };
  return m[s] || 'bg-gray-100 text-gray-600 border-gray-200';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TutoriaErrors() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Determine view mode based on route
  const isAnalysisView = location.pathname.endsWith('/analysis');
  const isTutorReviewView = location.pathname.endsWith('/tutor-review');
  const isMyErrorsView = location.pathname.endsWith('/my-errors');

  const IMPACT_LABEL: Record<string, string> = {
    BAIXA: t('adminPortalTutoria.impact.BAIXA'),
    ALTA:  t('adminPortalTutoria.impact.ALTA'),
  };
  const STATUS_LABEL: Record<string, string> = {
    REGISTERED:             t('tutoriaDetail.status.REGISTERED'),
    ANALYSIS:               t('tutoriaDetail.status.ANALYSIS'),
    ABERTO:                 t('tutoriaDetail.status.ABERTO'),
    EM_ANALISE:             t('tutoriaDetail.status.EM_ANALISE'),
    PLANO_CRIADO:           t('tutoriaDetail.status.PLANO_CRIADO'),
    EM_EXECUCAO:            t('tutoriaDetail.status.EM_EXECUCAO'),
    CONCLUIDO:              t('tutoriaDetail.status.CONCLUIDO'),
    VERIFICADO:             t('tutoriaDetail.status.VERIFICADO'),
    PENDING_TUTOR_REVIEW:   t('tutoriaDetail.status.PENDING_TUTOR_REVIEW'),
    PENDING_CHIEF_APPROVAL: t('tutoriaDetail.status.PENDING_CHIEF_APPROVAL'),
    APPROVED:               t('tutoriaDetail.status.APPROVED'),
    CANCELLED:              t('tutoriaDetail.status.CANCELLED'),
    RESOLVED:               t('tutoriaDetail.status.RESOLVED'),
  };

  const isManager = user?.is_admin || user?.is_diretor || user?.is_gerente || user?.is_tutor;

  const [errors, setErrors] = useState<TutoriaError[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [filterImpact, setFilterImpact] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRecurrent, setFilterRecurrent] = useState('');

  // Status filters per view
  const ANALYSIS_STATUSES = ['REGISTERED', 'PENDING', 'ABERTO', 'ANALYSIS', 'EM_ANALISE'];
  const TUTOR_REVIEW_STATUSES = ['PENDING_TUTOR_REVIEW', 'PENDING_CHIEF_APPROVAL'];
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/tutoria/errors');
        setErrors(Array.isArray(res.data) ? res.data : []);
      } catch {
        setLoadError(t('tutoriaErrors.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = errors.filter(e => {
    // View-specific status filter
    if (isAnalysisView && !ANALYSIS_STATUSES.includes(e.status)) return false;
    if (isTutorReviewView && !TUTOR_REVIEW_STATUSES.includes(e.status)) return false;
    if (filterImpact && e.impact_level !== filterImpact) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    if (filterRecurrent === 'yes' && !e.is_recurrent) return false;
    if (filterRecurrent === 'no' && e.is_recurrent) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !e.description.toLowerCase().includes(q) &&
        !(e.tutorado_name?.toLowerCase().includes(q)) &&
        !(e.category_name?.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });

  const statusCounts = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = errors.filter(e => e.status === s).length;
    return acc;
  }, {});

  const selectCls = `w-full appearance-none px-3 py-2 pr-8 rounded-xl border text-sm outline-none cursor-pointer ${
    isDark ? 'bg-white/[0.04] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
  }`;

  return (
    <div className="space-y-8 max-w-6xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`border-b pb-8 ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30"
            >
              <AlertTriangle className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-red-400' : 'text-red-500'}`}>{t('tutoriaErrors.headerLabel')}</span>
              <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {isAnalysisView ? t('tutoriaErrors.analysisTitle')
                  : isTutorReviewView ? t('tutoriaErrors.tutorReviewTitle')
                  : isMyErrorsView ? t('tutoriaErrors.myTitle')
                  : isManager ? t('tutoriaErrors.title') : t('tutoriaErrors.myTitle')}
              </h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                {t('tutoriaErrors.errorCount', { count: filtered.length })}
              </p>
            </div>
          </div>
          {!isAnalysisView && !isTutorReviewView && (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/tutoria/errors/new')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold shadow-lg shadow-red-500/25"
            >
              <Plus className="w-4 h-4" /> {t('tutoriaErrors.registerError')}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ── Status quick-pills ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex gap-2 flex-wrap"
      >
        {[{ label: `${t('common.all')} (${errors.length})`, value: '' }, ...STATUS_ORDER.map(s => ({ label: `${STATUS_LABEL[s]} (${statusCounts[s]})`, value: s }))].map(({ label, value }) => (
          statusCounts[value as string] > 0 || value === '' ? (
            <button
              key={value}
              onClick={() => setFilterStatus(filterStatus === value ? '' : value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                filterStatus === value
                  ? 'bg-red-500 border-red-500 text-white'
                  : isDark ? 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ) : null
        ))}
      </motion.div>

      {/* ── Search + Filters ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('tutoriaErrors.searchPlaceholder')}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                isDark
                  ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-red-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-400'
              }`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              showFilters || filterImpact || filterRecurrent
                ? 'bg-red-500 border-red-500 text-white'
                : isDark ? 'bg-white/[0.04] border-white/10 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" /> {t('tutoriaErrors.filters')}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-gray-50 border-gray-200'}`}
            >
              <div className="relative">
                <select value={filterImpact} onChange={e => setFilterImpact(e.target.value)} className={selectCls} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>
                  <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('tutoriaErrors.allImpacts')}</option>
                  {['ALTA', 'BAIXA'].map(s => <option key={s} value={s} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{IMPACT_LABEL[s]}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
              </div>
              <div className="relative">
                <select value={filterRecurrent} onChange={e => setFilterRecurrent(e.target.value)} className={selectCls} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>
                  <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('tutoriaErrors.allRecurrence')}</option>
                  <option value="yes" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('tutoriaErrors.recurrent')}</option>
                  <option value="no" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('tutoriaErrors.noRecurrence')}</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
              </div>
              <button
                onClick={() => { setFilterImpact(''); setFilterStatus(''); setFilterRecurrent(''); setSearch(''); }}
                className={`flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl border transition-all ${isDark ? 'border-white/10 text-gray-500 hover:text-white' : 'border-gray-200 text-gray-400 hover:text-gray-900'}`}
              >
                <XCircle className="w-3.5 h-3.5" /> {t('tutoriaErrors.clearFilters')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Overdue banner ───────────────────────────────────────────────────── */}
      {errors.filter(e => e.is_overdue).length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-4">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {t('tutoriaErrors.overdueWarning', { count: errors.filter(e => e.is_overdue).length })}
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-red-400' : 'text-red-500'}`} />
        </div>
      ) : loadError ? (
        <div className={`rounded-2xl border p-6 text-sm ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {loadError}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`rounded-2xl border p-16 text-center ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-white border-gray-200'}`}
        >
          <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
          <p className={`text-lg font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {errors.length === 0 ? t('tutoriaErrors.noErrors') : t('tutoriaErrors.noFilterResults')}
          </p>
          {isManager && errors.length === 0 && (
            <button
              onClick={() => navigate('/tutoria/errors/new')}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500 text-white text-sm font-bold"
            >
              <Plus className="w-4 h-4" /> {t('tutoriaErrors.registerFirst')}
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
        >
          {/* Table header */}
          <div
            className={`grid gap-3 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b ${
              isDark ? 'bg-white/[0.02] text-gray-600 border-white/5' : 'bg-gray-50 text-gray-400 border-gray-100'
            }`}
            style={{ gridTemplateColumns: '1fr 130px 110px 90px 60px 36px' }}
          >
            <span>{t('tutoriaErrors.errorTutorado')}</span>
            <span>{t('tutoriaErrors.category')}</span>
            <span>{t('tutoriaErrors.status')}</span>
            <span>{t('tutoriaErrors.impact')}</span>
            <span>{t('tutoriaErrors.plans')}</span>
            <span />
          </div>

          <AnimatePresence initial={false}>
            {filtered.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
              >
                <div
                  onClick={() => navigate(`/tutoria/errors/${e.id}`)}
                  className={`grid items-center gap-3 px-5 py-4 border-b cursor-pointer transition-colors ${
                    isDark ? 'border-white/5 hover:bg-white/[0.03]' : 'border-gray-100 hover:bg-gray-50/60'
                  }`}
                  style={{ gridTemplateColumns: '1fr 130px 110px 90px 60px 36px' }}
                >
                  {/* Description + meta */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {e.description}
                      </p>
                      {e.is_recurrent && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 border ${
                          e.recurrence_count >= 2
                            ? isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200'
                            : isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-orange-50 text-orange-600 border-orange-200'
                        }`}>
                          <RefreshCw className="w-2.5 h-2.5 inline mr-0.5" />{e.recurrence_count + 1}ª {t('tutoriaErrors.time')}
                        </span>
                      )}
                      {e.is_overdue && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 dark:bg-red-500/15 dark:text-red-400">
                          <Clock className="w-3 h-3" /> {t('tutoriaErrors.overdue')}
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{e.tutorado_name ?? '—'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(e.date_occurrence).toLocaleDateString('pt-PT')}</span>
                    </div>
                  </div>

                  {/* Category */}
                  <span className={`text-xs font-medium truncate flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {e.category_name ? <><Tag className="w-3 h-3 flex-shrink-0" />{e.category_name}</> : <span className={isDark ? 'text-gray-700' : 'text-gray-300'}>—</span>}
                  </span>

                  {/* Status */}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border text-center ${isDark ? statusClsDark(e.status) : statusClsLight(e.status)}`}>
                    {STATUS_LABEL[e.status] ?? e.status}
                  </span>

                  {/* Impact */}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border text-center ${isDark ? impactClsDark(e.impact_level ?? '') : impactClsLight(e.impact_level ?? '')}`}>
                    {e.impact_level ? (IMPACT_LABEL[e.impact_level] ?? e.impact_level) : '—'}
                  </span>

                  {/* Plans count */}
                  <span className={`text-sm font-black text-center ${e.plans_count > 0 ? isDark ? 'text-blue-400' : 'text-blue-600' : isDark ? 'text-gray-700' : 'text-gray-300'}`}>
                    {e.plans_count}
                  </span>

                  <ArrowRight className={`w-4 h-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className={`px-5 py-3 flex items-center justify-between ${isDark ? 'bg-white/[0.01] border-t border-white/5' : 'bg-gray-50 border-t border-gray-100'}`}>
            <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{filtered.length} {t('tutoriaErrors.ofErrors', { total: errors.length })}</span>
            {isManager && (
              <button onClick={() => navigate('/tutoria/errors/new')} className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}>
                <Plus className="w-3.5 h-3.5" /> {t('tutoriaErrors.newError')}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {errors.some(e => e.is_recurrent) && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className={`rounded-xl border p-3 flex items-center gap-3 text-xs ${isDark ? 'bg-orange-500/5 border-orange-500/10 text-orange-400/70' : 'bg-orange-50 border-orange-200 text-orange-700'}`}
        >
          <Eye className="w-4 h-4 flex-shrink-0" />
          <span><strong>{t('tutoriaErrors.recurrenceLabel')}</strong> {t('tutoriaErrors.recurrenceWarning')}</span>
        </motion.div>
      )}

    </div>
  );
}
