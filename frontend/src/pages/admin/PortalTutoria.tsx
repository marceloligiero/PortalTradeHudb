import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ClipboardList, CheckCircle2, Clock,
  Plus, TrendingUp, Shield, AlertCircle,
  ArrowRight, BarChart3, XCircle, RefreshCw, Users,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashStats {
  total_errors: number;
  errors_by_status: Record<string, number>;
  recurrent_errors: number;
  total_plans: number;
  plans_by_status: Record<string, number>;
  overdue_plans: number;
  impact_counts: Record<string, number>;
}

interface RecentError {
  id: number;
  date_occurrence: string;
  description: string;
  tutorado_name?: string;
  category_name?: string;
  severity: string;
  status: string;
  is_recurrent: boolean;
  recurrence_count: number;
  plans_count: number;
}

interface RecentPlan {
  id: number;
  tutorado_name?: string;
  created_by_name?: string;
  status: string;
  when_deadline?: string;
  items_total: number;
  items_completed: number;
  what?: string;
}

// ─── Impact colors (Santander DS) ────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, { badge: string; bar: string }> = {
  BAIXA:   { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', bar: 'bg-green-500' },
  MEDIA:   { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', bar: 'bg-amber-500' },
  ALTA:    { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', bar: 'bg-orange-500' },
  CRITICA: { badge: 'bg-red-100 text-[#EC0000] dark:bg-red-900/30 dark:text-red-400', bar: 'bg-[#EC0000]' },
};

const IMPACT_COLORS: Record<string, { bar: string }> = {
  ALTA:  { bar: 'bg-[#EC0000]' },
  BAIXA: { bar: 'bg-green-500' },
};

const PLAN_STATUS_BADGE: Record<string, string> = {
  RASCUNHO:            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  AGUARDANDO_APROVACAO:'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  APROVADO:            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  EM_EXECUCAO:         'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CONCLUIDO:           'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  DEVOLVIDO:           'bg-red-100 text-[#EC0000] dark:bg-red-900/30 dark:text-red-400',
  // English aliases (backend may return these)
  OPEN:                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  IN_PROGRESS:         'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  DONE:                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function statusDot(s: string): string {
  const map: Record<string, string> = {
    ABERTO: 'bg-red-500', EM_ANALISE: 'bg-amber-500', PLANO_CRIADO: 'bg-blue-500',
    EM_EXECUCAO: 'bg-orange-500', CONCLUIDO: 'bg-emerald-500', VERIFICADO: 'bg-emerald-600',
  };
  return map[s] || 'bg-gray-400';
}

// ─── Small DS components ─────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: 'red' | 'blue' | 'emerald' | 'amber';
}) {
  const bg: Record<string, string> = {
    red:     'bg-red-50 dark:bg-red-900/20 text-[#EC0000]',
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white">{value}</div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionCard({ icon: Icon, title, action, children }: {
  icon: React.ElementType; title: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-[#EC0000]" />
          </div>
          <h2 className="text-sm font-headline font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PortalTutoria() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isManager = user?.is_admin || user?.is_diretor || user?.is_gerente || user?.is_tutor;
  const isStudent = !isManager;

  const [stats, setStats] = useState<DashStats | null>(null);
  const [recentErrors, setRecentErrors] = useState<RecentError[]>([]);
  const [recentPlans, setRecentPlans] = useState<RecentPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, errorsRes, plansRes] = await Promise.allSettled([
          axios.get('/api/tutoria/dashboard'),
          axios.get('/api/tutoria/errors'),
          isStudent ? axios.get('/api/tutoria/my-plans') : axios.get('/api/tutoria/plans'),
        ]);
        if (dashRes.status === 'fulfilled') setStats(dashRes.value.data);
        if (errorsRes.status === 'fulfilled') {
          const data = errorsRes.value.data;
          setRecentErrors((Array.isArray(data) ? data : []).slice(0, 5));
        }
        if (plansRes.status === 'fulfilled') {
          const data = plansRes.value.data;
          setRecentPlans((Array.isArray(data) ? data : []).slice(0, 5));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isStudent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EC0000]" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('adminPortalTutoria.loading')}</p>
        </div>
      </div>
    );
  }

  const byStatus = stats?.errors_by_status ?? {};
  const byPlanStatus = stats?.plans_by_status ?? {};
  const impactCounts = stats?.impact_counts ?? {};

  const openErrors = (byStatus['ABERTO'] ?? 0) + (byStatus['EM_ANALISE'] ?? 0) + (byStatus['PLANO_CRIADO'] ?? 0) + (byStatus['EM_EXECUCAO'] ?? 0);
  const activePlans = byPlanStatus['EM_EXECUCAO'] ?? 0;
  const donePlans = byPlanStatus['CONCLUIDO'] ?? 0;

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#EC0000]">
              {t('adminPortalTutoria.headerLabel')}
            </p>
            <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">
              {isStudent ? t('adminPortalTutoria.myPanel') : t('adminPortalTutoria.dashboard')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isStudent
                ? t('adminPortalTutoria.studentSubtitle')
                : user?.role === 'ADMIN'
                  ? t('adminPortalTutoria.adminSubtitle')
                  : t('adminPortalTutoria.trainerSubtitle')}
            </p>
          </div>
        </div>

        {isManager && (
          <button
            onClick={() => navigate('/tutoria/errors/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#EC0000] hover:bg-[#CC0000] text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> {t('adminPortalTutoria.registerError')}
          </button>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={AlertTriangle} label={t('adminPortalTutoria.totalErrors')}
          value={stats?.total_errors ?? 0} color="red"
          sub={t('adminPortalTutoria.openErrors', { count: openErrors })}
        />
        <KpiCard
          icon={RefreshCw} label={t('adminPortalTutoria.recurrent')}
          value={stats?.recurrent_errors ?? 0} color="amber"
          sub={t('adminPortalTutoria.sameTypeRepeated')}
        />
        <KpiCard
          icon={ClipboardList} label={t('adminPortalTutoria.actionPlans')}
          value={stats?.total_plans ?? 0} color="blue"
          sub={t('adminPortalTutoria.inExecution', { count: activePlans })}
        />
        <KpiCard
          icon={CheckCircle2} label={t('adminPortalTutoria.completedPlans')}
          value={donePlans} color="emerald"
          sub={stats?.overdue_plans ? t('adminPortalTutoria.overdueCount', { count: stats.overdue_plans }) : t('adminPortalTutoria.noOverdue')}
        />
      </div>

      {/* ── Recent errors + plans ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent errors */}
        <SectionCard
          icon={AlertTriangle}
          title={isStudent ? t('adminPortalTutoria.myRecentErrors') : t('adminPortalTutoria.recentErrors')}
          action={
            <button
              onClick={() => navigate(isStudent ? '/tutoria/my-errors' : '/tutoria/errors')}
              className="text-xs font-medium text-[#EC0000] hover:text-[#CC0000] flex items-center gap-1"
            >
              {t('adminPortalTutoria.viewAll')} <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          {recentErrors.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('adminPortalTutoria.noErrorsRegistered')}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentErrors.map(e => (
                <div
                  key={e.id}
                  onClick={() => navigate(`/tutoria/errors/${e.id}`)}
                  className="px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(e.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {e.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {e.tutorado_name} · {e.category_name ?? '—'} · {t('adminPortalTutoria.errorStatus.' + e.status, e.status)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {e.is_recurrent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        {t('adminPortalTutoria.recurrenceCount', { count: e.recurrence_count })}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SEVERITY_COLORS[e.severity]?.badge || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {t('adminPortalTutoria.severity.' + e.severity, e.severity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Recent plans */}
        <SectionCard
          icon={ClipboardList}
          title={isStudent ? t('adminPortalTutoria.myPlans') : t('adminPortalTutoria.recentPlans')}
          action={
            <button
              onClick={() => navigate(isStudent ? '/tutoria/my-plans' : '/tutoria/plans')}
              className="text-xs font-medium text-[#EC0000] hover:text-[#CC0000] flex items-center gap-1"
            >
              {t('adminPortalTutoria.viewAll')} <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          {recentPlans.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('adminPortalTutoria.noPlanCreated')}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentPlans.map(p => {
                const pct = p.items_total > 0 ? Math.round((p.items_completed / p.items_total) * 100) : 0;
                const isDone = p.status === 'CONCLUIDO';
                const isOverdue = p.when_deadline && new Date(p.when_deadline) < new Date() && !isDone;
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/tutoria/plans/${p.id}`)}
                    className="px-5 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                        {p.what ?? t('adminPortalTutoria.planFallback', { id: p.id })}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isOverdue && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-[#EC0000] dark:bg-red-900/30 dark:text-red-400">
                            {t('tutoriaPlans.overdue', 'Vencido')}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${PLAN_STATUS_BADGE[p.status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {t('tutoriaPlans.status.' + p.status, p.status)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {p.tutorado_name ?? '—'}
                    </p>
                    {p.items_total > 0 && (
                      <div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-full bg-[#EC0000] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-mono">
                          {t('adminPortalTutoria.actionsCompleted', { completed: p.items_completed, total: p.items_total })}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Breakdown cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Impact breakdown */}
        <SectionCard icon={TrendingUp} title={t('adminPortalTutoria.impactByAnalysis')}>
          <div className="p-5 space-y-3">
            {(['ALTA', 'BAIXA'] as const).map(lvl => {
              const count = impactCounts[lvl] ?? 0;
              const total = Object.values(impactCounts).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={lvl}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {t('adminPortalTutoria.impact.' + lvl)}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">{count}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-full ${IMPACT_COLORS[lvl]?.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.values(impactCounts).reduce((a, b) => a + b, 0) === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-2">
                {t('adminPortalTutoria.noImpactData')}
              </p>
            )}
          </div>
        </SectionCard>

        {/* Plan statuses */}
        <SectionCard icon={BarChart3} title={t('adminPortalTutoria.planStatuses')}>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'RASCUNHO',            icon: Clock,        color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
                { key: 'AGUARDANDO_APROVACAO', icon: Clock,        color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                { key: 'APROVADO',             icon: CheckCircle2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { key: 'EM_EXECUCAO',          icon: TrendingUp,   color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                { key: 'CONCLUIDO',            icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                { key: 'DEVOLVIDO',            icon: XCircle,      color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
              ].map(({ key, icon: Icon, color, bg }) => (
                <div key={key} className={`rounded-xl p-3 ${bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('tutoriaPlans.status.' + key)}</span>
                  </div>
                  <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                    {byPlanStatus[key] ?? 0}
                  </p>
                </div>
              ))}
            </div>
            {(stats?.overdue_plans ?? 0) > 0 && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[#EC0000] text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{t('adminPortalTutoria.overdueWarning', { count: stats?.overdue_plans })}</span>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Quick actions (manager only) ──────────────────────────── */}
      {isManager && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t('adminPortalTutoria.registerError'), icon: AlertTriangle, path: '/tutoria/errors/new' },
            { label: t('adminPortalTutoria.viewAllErrors'), icon: Users,         path: '/tutoria/errors' },
            { label: t('adminPortalTutoria.viewPlans'),     icon: ClipboardList, path: '/tutoria/plans' },
          ].map(({ label, icon: Icon, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#EC0000]/30 hover:shadow-md transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#EC0000]" />
              </div>
              <span className="font-medium text-sm text-gray-900 dark:text-white flex-1">{label}</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>
      )}

      {/* ── Student CTA ────────────────────────────────────────────── */}
      {isStudent && recentPlans.filter(p => p.status === 'EM_EXECUCAO').length > 0 && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-blue-800 dark:text-blue-300">
              {t('adminPortalTutoria.studentCtaTitle')}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              {t('adminPortalTutoria.studentCtaSub')}
            </p>
          </div>
          <button
            onClick={() => navigate('/tutoria/my-plans')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EC0000] hover:bg-[#CC0000] text-white text-xs font-medium flex-shrink-0 transition-colors"
          >
            {t('adminPortalTutoria.viewPlans')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
