import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, Search, XCircle, ArrowRight,
  Clock, CheckCircle2, AlertCircle, User,
  Calendar, TrendingUp,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id: number;
  error_id: number;
  tutorado_name?: string;
  created_by_name?: string;
  status: string;
  what?: string;
  when_deadline?: string;
  items_total: number;
  items_completed: number;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_STATUS_ORDER = [
  'OPEN', 'IN_PROGRESS', 'DONE',
  'RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'EM_EXECUCAO', 'CONCLUIDO', 'DEVOLVIDO',
];

const PLAN_STATUS_ICON: Record<string, React.ElementType> = {
  OPEN:                 AlertCircle,
  IN_PROGRESS:          TrendingUp,
  DONE:                 CheckCircle2,
  RASCUNHO:             Clock,
  AGUARDANDO_APROVACAO: AlertCircle,
  APROVADO:             CheckCircle2,
  EM_EXECUCAO:          TrendingUp,
  CONCLUIDO:            CheckCircle2,
  DEVOLVIDO:            XCircle,
};

function planStatusCls(s: string) {
  const m: Record<string, string> = {
    OPEN:                 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/20',
    IN_PROGRESS:          'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/20',
    DONE:                 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20',
    RASCUNHO:             'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/15 dark:text-gray-400 dark:border-gray-500/20',
    AGUARDANDO_APROVACAO: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/20',
    APROVADO:             'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/20',
    EM_EXECUCAO:          'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/20',
    CONCLUIDO:            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20',
    DEVOLVIDO:            'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/20',
  };
  return m[s] || 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/15 dark:text-gray-400 dark:border-gray-500/20';
}

function planTopBg(s: string) {
  const m: Record<string, string> = {
    OPEN:                 'bg-red-500',
    IN_PROGRESS:          'bg-orange-500',
    DONE:                 'bg-emerald-500',
    RASCUNHO:             'bg-gray-400',
    AGUARDANDO_APROVACAO: 'bg-yellow-500',
    APROVADO:             'bg-blue-500',
    EM_EXECUCAO:          'bg-orange-500',
    CONCLUIDO:            'bg-emerald-500',
    DEVOLVIDO:            'bg-red-500',
  };
  return m[s] || 'bg-gray-400';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TutoriaPlans() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isManager = user?.is_admin || user?.is_diretor || user?.is_gerente || user?.is_tutor;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const endpoint = isManager ? '/api/tutoria/plans' : '/api/tutoria/my-plans';
        const res = await axios.get(endpoint);
        setPlans(Array.isArray(res.data) ? res.data : []);
      } catch {
        setLoadError(t('tutoriaPlans.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [isManager]);

  const filtered = plans.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !(p.what ?? '').toLowerCase().includes(q) &&
        !(p.tutorado_name ?? '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const statusCounts = PLAN_STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = plans.filter(p => p.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#EC0000]">
              {t('tutoriaPlans.headerSubtitle')}
            </p>
            <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">
              {isManager ? t('tutoriaPlans.title') : t('tutoriaPlans.titleMy')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t('tutoriaPlans.plansFound', { count: filtered.length })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Status quick-pills ──────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            filterStatus === ''
              ? 'bg-[#EC0000] border-[#EC0000] text-white'
              : 'bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('tutoriaPlans.all')} ({plans.length})
        </button>
        {PLAN_STATUS_ORDER.map(s => statusCounts[s] > 0 ? (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filterStatus === s
                ? 'bg-[#EC0000] border-[#EC0000] text-white'
                : 'bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('tutoriaPlans.status.' + s, s)} ({statusCounts[s]})
          </button>
        ) : null)}
      </div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('tutoriaPlans.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-[#EC0000] transition-all"
        />
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC0000]" />
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border p-6 text-sm bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400">
          {loadError}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-16 text-center">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
          <p className="text-lg font-headline font-bold text-gray-400 dark:text-gray-500">
            {plans.length === 0 ? t('tutoriaPlans.emptyNone') : t('tutoriaPlans.emptyFiltered')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const pct = p.items_total > 0 ? Math.round((p.items_completed / p.items_total) * 100) : 0;
            const isOverdue = p.when_deadline && new Date(p.when_deadline) < new Date()
              && p.status !== 'CONCLUIDO' && p.status !== 'DONE';
            const StatusIcon = PLAN_STATUS_ICON[p.status] ?? Clock;

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/tutoria/plans/${p.id}`)}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden cursor-pointer hover:shadow-md hover:border-[#EC0000]/30 transition-all"
              >
                {/* Color bar */}
                <div className={`h-1.5 ${planTopBg(p.status)}`} />

                <div className="p-5">
                  {/* Status + overdue */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${planStatusCls(p.status)}`}>
                      <StatusIcon className="w-3 h-3" />
                      {t('tutoriaPlans.status.' + p.status, p.status)}
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400">
                        {t('tutoriaPlans.overdue')}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <p className="text-sm font-bold mb-3 line-clamp-2 text-gray-900 dark:text-white">
                    {p.what ?? t('tutoriaPlans.defaultTitle', { id: p.id })}
                  </p>

                  {/* Meta */}
                  <div className="space-y-1.5 mb-4 text-xs text-gray-400 dark:text-gray-500">
                    {p.tutorado_name && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />{p.tutorado_name}
                      </div>
                    )}
                    {p.when_deadline && (
                      <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500 dark:text-red-400' : ''}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {t('tutoriaPlans.deadline')}: {new Date(p.when_deadline).toLocaleDateString('pt-PT')}
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  {p.items_total > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                          {t('tutoriaPlans.actionsProgress', { completed: p.items_completed, total: p.items_total })}
                        </span>
                        <span className={`text-[10px] font-bold font-mono ${pct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <div
                          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-[#EC0000]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-300 dark:text-gray-700">
                      #{p.id} · {t('tutoriaPlans.errorLabel')} #{p.error_id}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-700" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
