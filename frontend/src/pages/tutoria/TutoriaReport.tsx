import { useEffect, useState, useMemo } from 'react';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import {
  Loader2, Download, AlertTriangle, ClipboardList, Users,
  BarChart3, RefreshCw, CheckCircle2, TrendingUp,
} from 'lucide-react';
import TutoriaPage from './TutoriaPage';
import { useTranslation } from 'react-i18next';

// ── helpers ────────────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  CRITICA: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
  ALTA: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400',
  MEDIA: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
  BAIXA: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
};

const SEVERITY_BAR: Record<string, string> = {
  CRITICA: 'bg-red-500',
  ALTA: 'bg-orange-500',
  MEDIA: 'bg-amber-500',
  BAIXA: 'bg-green-500',
};

const PLAN_STATUS_ORDER = ['RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'EM_EXECUCAO', 'CONCLUIDO', 'DEVOLVIDO'];

const PLAN_STATUS_COLOR: Record<string, string> = {
  RASCUNHO: 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
  AGUARDANDO_APROVACAO: 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20',
  APROVADO: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20',
  EM_EXECUCAO: 'text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20',
  CONCLUIDO: 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20',
  DEVOLVIDO: 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20',
};

function csvDownload(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(',')]
    .concat(rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(',')))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const STAT_ICONS = {
  errors: { icon: AlertTriangle, color: 'text-red-500' },
  recurrent: { icon: RefreshCw, color: 'text-orange-500' },
  plans: { icon: ClipboardList, color: 'text-[#EC0000]' },
  students: { icon: Users, color: 'text-green-500' },
  completed: { icon: CheckCircle2, color: 'text-green-500' },
};

interface StatCardProps {
  iconKey: keyof typeof STAT_ICONS;
  label: string;
  value: number | string;
  sub?: string;
}
function StatCard({ iconKey, label, value, sub }: StatCardProps) {
  const { icon: Icon, color } = STAT_ICONS[iconKey];
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 transition-colors hover:border-[#EC0000]/30">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">{label}</p>
      <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="font-body text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function TutoriaReport() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const isManager = user?.is_admin || user?.is_diretor || user?.is_gerente || user?.is_tutor;
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const planEndpoint = isManager ? '/api/tutoria/plans' : '/api/tutoria/my-plans';
        const [eRes, pRes, stRes] = await Promise.allSettled([
          axios.get('/api/tutoria/errors'),
          axios.get(planEndpoint),
          isManager ? axios.get('/api/tutoria/students') : Promise.resolve({ data: [] }),
        ]);
        if (eRes.status === 'fulfilled') setErrors(Array.isArray(eRes.value.data) ? eRes.value.data : []);
        if (pRes.status === 'fulfilled') setPlans(Array.isArray(pRes.value.data) ? pRes.value.data : []);
        if (stRes.status === 'fulfilled') setStudents(Array.isArray(stRes.value.data) ? stRes.value.data : []);
      } catch {
        setFetchError(t('tutoriaReport.fetchError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // ── computed ──────────────────────────────────────────────────────────────

  const recurrentErrors = useMemo(() => errors.filter(e => e.is_recurrent), [errors]);
  const concludedPlans = useMemo(() => plans.filter(p => p.status === 'CONCLUIDO'), [plans]);

  const recurrenceRate = useMemo(() =>
    errors.length > 0 ? Math.round((recurrentErrors.length / errors.length) * 100) : 0,
    [errors, recurrentErrors]
  );

  const severityCounts = useMemo(() => {
    const map: Record<string, number> = { BAIXA: 0, MEDIA: 0, ALTA: 0, CRITICA: 0 };
    for (const e of errors) if (e.severity in map) map[e.severity]++;
    return map;
  }, [errors]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of errors) {
      const label = e.category?.name ?? t('tutoriaReport.noCategory');
      map[label] = (map[label] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [errors]);

  const planStatusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of plans) map[p.status] = (map[p.status] || 0) + 1;
    return map;
  }, [plans]);

  const topStudents = useMemo(() => {
    const map: Record<number, { name: string; count: number; recurrent: number }> = {};
    for (const e of errors) {
      const id = e.tutorado_id;
      if (!id) continue;
      if (!map[id]) map[id] = { name: e.tutorado?.name ?? `#${id}`, count: 0, recurrent: 0 };
      map[id].count++;
      if (e.is_recurrent) map[id].recurrent++;
    }
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [errors]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin w-8 h-8" />
    </div>
  );

  if (fetchError) return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-gray-500 dark:text-gray-400">
      {fetchError}
    </div>
  );

  return (
    <TutoriaPage className="space-y-8">

      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#EC0000]" />
            </div>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000]">{t('tutoriaReport.headerSubtitle')}</p>
              <h1 className="font-headline text-2xl font-bold text-gray-900 dark:text-white">{t('tutoriaReport.title')}</h1>
              <p className="font-body text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {isManager ? t('tutoriaReport.descriptionManager') : t('tutoriaReport.descriptionStudent')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => csvDownload('erros.csv', errors)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-bold transition-colors bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#EC0000]/30"
            >
              <Download className="w-4 h-4" />
              {t('tutoriaReport.errorsCsv')}
            </button>
            <button
              onClick={() => csvDownload('planos.csv', plans)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EC0000] hover:bg-[#CC0000] text-white text-sm font-body font-bold transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('tutoriaReport.plansCsv')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard iconKey="errors" label={t('tutoriaReport.totalErrors')} value={errors.length} />
        <StatCard iconKey="recurrent" label={t('tutoriaReport.recurrents')} value={recurrentErrors.length}
          sub={t('tutoriaReport.recurrentsOfTotal', { rate: recurrenceRate })} />
        <StatCard iconKey="plans" label={t('tutoriaReport.actionPlans')} value={plans.length}
          sub={t('tutoriaReport.completedSub', { count: concludedPlans.length })} />
        {isManager ? (
          <StatCard iconKey="students" label={t('tutoriaReport.students')} value={students.length} />
        ) : (
          <StatCard iconKey="completed" label={t('tutoriaReport.completed')} value={concludedPlans.length}
            sub={plans.length > 0 ? t('tutoriaReport.completedOfPlans', { rate: Math.round((concludedPlans.length / plans.length) * 100) }) : undefined} />
        )}
      </div>

      {/* ── Plan status row ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {PLAN_STATUS_ORDER.map((status) => {
          const count = planStatusCounts[status] ?? 0;
          return (
            <div
              key={status}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center"
            >
              <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white mb-1">{count}</p>
              <span className={`text-xs font-body font-bold px-2 py-0.5 rounded-full border ${PLAN_STATUS_COLOR[status]}`}>
                {t('tutoriaReport.planStatus.' + status)}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Grid: Severity + Categories ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Severity breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#EC0000]" />
              </div>
              <div>
                <h2 className="font-headline text-base font-bold text-gray-900 dark:text-white">{t('tutoriaReport.errorsPerSeverity')}</h2>
                <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('tutoriaReport.totalErrorsLabel', { count: errors.length })}</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA'] as const).map(sev => {
              const count = severityCounts[sev] ?? 0;
              const pct = errors.length > 0 ? Math.round((count / errors.length) * 100) : 0;
              return (
                <div key={sev}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-body font-bold px-2.5 py-1 rounded-lg border ${SEVERITY_COLOR[sev]}`}>
                      {t('tutoriaReport.severity.' + sev)}
                    </span>
                    <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                      {count} <span className="font-body text-xs text-gray-400 dark:text-gray-500">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${SEVERITY_BAR[sev]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#EC0000]" />
              </div>
              <div>
                <h2 className="font-headline text-base font-bold text-gray-900 dark:text-white">{t('tutoriaReport.errorsPerCategory')}</h2>
                <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('tutoriaReport.topCategories', { count: categoryCounts.length })}</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {categoryCounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <TrendingUp className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="font-body text-sm text-gray-400 dark:text-gray-500">{t('tutoriaReport.noData')}</p>
              </div>
            ) : categoryCounts.map(([cat, count]) => {
              const maxCount = categoryCounts[0]?.[1] ?? 1;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-body text-sm font-semibold text-gray-700 dark:text-gray-300">{cat}</span>
                    <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#EC0000] to-[#CC0000] transition-all duration-700 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Top students (manager only) ───────────────────────── */}
      {isManager && topStudents.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#EC0000]" />
              </div>
              <div>
                <h2 className="font-headline text-base font-bold text-gray-900 dark:text-white">{t('tutoriaReport.studentsWithMostErrors')}</h2>
                <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('tutoriaReport.topStudents', { count: topStudents.length })}</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {topStudents.map((st, idx) => {
              const maxCount = topStudents[0]?.count ?? 1;
              const pct = Math.round((st.count / maxCount) * 100);
              return (
                <div
                  key={idx}
                  className="px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm font-semibold text-gray-900 dark:text-white">{st.name}</span>
                      {st.recurrent > 0 && (
                        <span className="text-xs font-body font-bold px-2 py-0.5 rounded-full border bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400">
                          {st.recurrent} {t('tutoriaReport.reincLabel')}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-sm font-bold text-[#EC0000]">{t('tutoriaReport.errorsCount', { count: st.count })}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#EC0000] to-[#CC0000] transition-all duration-500 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Reincidence notice for student ────────────────────── */}
      {!isManager && recurrentErrors.length > 0 && (
        <div className="flex items-start gap-4 rounded-2xl border p-5 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <RefreshCw className="w-5 h-5 flex-shrink-0 mt-0.5 text-orange-500 dark:text-orange-400" />
          <div>
            <p className="font-body text-sm font-bold text-orange-800 dark:text-orange-300">
              {t('tutoriaReport.reincidentErrors', { count: recurrentErrors.length })}
            </p>
            <p className="font-body text-xs mt-0.5 text-orange-600 dark:text-orange-400">
              {t('tutoriaReport.reincidentNotice')}
            </p>
          </div>
        </div>
      )}

    </TutoriaPage>
  );
}
