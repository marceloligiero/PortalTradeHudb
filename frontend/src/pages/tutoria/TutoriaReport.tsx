import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Loader2, Download, AlertTriangle, ClipboardList, Users,
  BarChart3, RefreshCw, CheckCircle2, TrendingUp,
} from 'lucide-react';
import TutoriaPage from './TutoriaPage';
import { useTranslation } from 'react-i18next';

// ── helpers ────────────────────────────────────────────────────────────────

const SEVERITY_GRADIENT: Record<string, string> = {
  BAIXA: 'from-green-500 to-green-600',
  MEDIA: 'from-amber-500 to-amber-600',
  ALTA: 'from-orange-500 to-orange-600',
  CRITICA: 'from-red-500 to-red-600',
};
const SEVERITY_BAR: Record<string, string> = {
  BAIXA: 'bg-gradient-to-r from-green-500 to-green-400',
  MEDIA: 'bg-gradient-to-r from-amber-500 to-amber-400',
  ALTA: 'bg-gradient-to-r from-orange-500 to-orange-400',
  CRITICA: 'bg-gradient-to-r from-red-500 to-red-400',
};

const PLAN_STATUS_ORDER = ['RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'EM_EXECUCAO', 'CONCLUIDO', 'DEVOLVIDO'];

const PLAN_STATUS_COLOR: Record<string, string> = {
  RASCUNHO: 'text-gray-400 border-gray-500/20 bg-gray-500/10',
  AGUARDANDO_APROVACAO: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
  APROVADO: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
  EM_EXECUCAO: 'text-violet-400 border-violet-500/20 bg-violet-500/10',
  CONCLUIDO: 'text-green-400 border-green-500/20 bg-green-500/10',
  DEVOLVIDO: 'text-red-400 border-red-500/20 bg-red-500/10',
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

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  gradient: string;
  shadowColor: string;
  isDark: boolean;
}
function StatCard({ icon: Icon, label, value, sub, gradient, shadowColor, isDark }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`relative group rounded-3xl p-6 border transition-all duration-500 shadow-xl ${shadowColor} ${
        isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white border-gray-200 hover:border-gray-300 shadow-lg'
      }`}
    >
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <motion.div
            whileHover={{ rotate: 10 }}
            className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg`}
          >
            <Icon className="w-7 h-7 text-white" />
          </motion.div>
        </div>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{label}</p>
        <p className={`text-5xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        {sub && <p className={`text-xs mt-1 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function TutoriaReport() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const isManager = user?.role === 'ADMIN' || user?.role === 'TRAINER';
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

  // students with most errors
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
      <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
    </div>
  );

  if (fetchError) return (
    <div className={`rounded-2xl border p-6 ${isDark ? 'bg-white/[0.02] border-white/8 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
      {fetchError}
    </div>
  );

  return (
    <TutoriaPage className="space-y-10">

      {/* ── Page Header ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className={`border-b pb-8 ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30"
            >
              <BarChart3 className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}>{t('tutoriaReport.headerSubtitle')}</p>
              <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('tutoriaReport.title')}</h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                {isManager ? t('tutoriaReport.descriptionManager') : t('tutoriaReport.descriptionStudent')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => csvDownload('erros.csv', errors)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                isDark
                  ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm'
              }`}
            >
              <Download className="w-4 h-4" />
              {t('tutoriaReport.errorsCsv')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => csvDownload('planos.csv', plans)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              {t('tutoriaReport.plansCsv')}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Stat cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard icon={AlertTriangle} label={t('tutoriaReport.totalErrors')} value={errors.length}
            gradient="from-red-500 to-red-600" shadowColor="shadow-red-500/20" isDark={isDark} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard icon={RefreshCw} label={t('tutoriaReport.recurrents')} value={recurrentErrors.length}
            sub={t('tutoriaReport.recurrentsOfTotal', { rate: recurrenceRate })}
            gradient="from-orange-500 to-orange-600" shadowColor="shadow-orange-500/20" isDark={isDark} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard icon={ClipboardList} label={t('tutoriaReport.actionPlans')} value={plans.length}
            sub={t('tutoriaReport.completedSub', { count: concludedPlans.length })}
            gradient="from-purple-500 to-purple-600" shadowColor="shadow-purple-500/20" isDark={isDark} />
        </motion.div>
        {isManager ? (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <StatCard icon={Users} label={t('tutoriaReport.students')} value={students.length}
              gradient="from-green-500 to-green-600" shadowColor="shadow-green-500/20" isDark={isDark} />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <StatCard icon={CheckCircle2} label={t('tutoriaReport.completed')} value={concludedPlans.length}
              sub={plans.length > 0 ? t('tutoriaReport.completedOfPlans', { rate: Math.round((concludedPlans.length / plans.length) * 100) }) : undefined}
              gradient="from-green-500 to-green-600" shadowColor="shadow-green-500/20" isDark={isDark} />
          </motion.div>
        )}
      </div>

      {/* ── Plan status row ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {PLAN_STATUS_ORDER.map((status) => {
          const count = planStatusCounts[status] ?? 0;
          return (
            <div
              key={status}
              className={`rounded-2xl p-4 border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}
            >
              <p className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{count}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                isDark ? PLAN_STATUS_COLOR[status] : PLAN_STATUS_COLOR[status].replace('/10', '/20').replace('/20', '/30')
              }`}>{t('tutoriaReport.planStatus.' + status)}</span>
            </div>
          );
        })}
      </motion.div>

      {/* ── Grid: Severity + Categories ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Severity breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}
        >
          <div className={`px-6 py-5 border-b bg-gradient-to-r from-red-600/10 to-transparent ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('tutoriaReport.errorsPerSeverity')}</h2>
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('tutoriaReport.totalErrorsLabel', { count: errors.length })}</p>
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
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                      sev === 'CRITICA'
                        ? isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
                        : sev === 'ALTA'
                        ? isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600'
                        : sev === 'MEDIA'
                        ? isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'
                        : isDark ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-600'
                    }`}>
                      {t('tutoriaReport.severity.' + sev)}
                    </span>
                    <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {count} <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({pct}%)</span>
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                      className={`h-full rounded-full ${SEVERITY_BAR[sev]}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
          className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}
        >
          <div className={`px-6 py-5 border-b bg-gradient-to-r from-indigo-600/10 to-transparent ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('tutoriaReport.errorsPerCategory')}</h2>
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('tutoriaReport.topCategories', { count: categoryCounts.length })}</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {categoryCounts.length === 0 ? (
              <p className={`text-sm text-center py-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('tutoriaReport.noData')}</p>
            ) : categoryCounts.map(([cat, count], i) => {
              const maxCount = categoryCounts[0]?.[1] ?? 1;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-semibold ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{cat}</span>
                    <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{count}</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.4 + i * 0.05 }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Top students (manager only) ───────────────────────── */}
      {isManager && topStudents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}
        >
          <div className={`px-6 py-5 border-b bg-gradient-to-r from-amber-600/10 to-transparent ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('tutoriaReport.studentsWithMostErrors')}</h2>
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('tutoriaReport.topStudents', { count: topStudents.length })}</p>
              </div>
            </div>
          </div>
          <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
            {topStudents.map((st, idx) => {
              const maxCount = topStudents[0]?.count ?? 1;
              const pct = Math.round((st.count / maxCount) * 100);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.04 * idx }}
                  className={`px-6 py-4 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{st.name}</span>
                      {st.recurrent > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                          isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600'
                        }`}>{st.recurrent} {t('tutoriaReport.reincLabel')}</span>
                      )}
                    </div>
                    <span className={`text-sm font-black ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{t('tutoriaReport.errorsCount', { count: st.count })}</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 + 0.05 * idx }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Reincidence notice for student ────────────────────── */}
      {!isManager && recurrentErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className={`flex items-start gap-4 rounded-2xl border p-5 ${
            isDark ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-200'
          }`}
        >
          <RefreshCw className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
          <div>
            <p className={`text-sm font-bold ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>
              {t('tutoriaReport.reincidentErrors', { count: recurrentErrors.length })}
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-orange-400/70' : 'text-orange-600'}`}>
              {t('tutoriaReport.reincidentNotice')}
            </p>
          </div>
        </motion.div>
      )}

    </TutoriaPage>
  );
}
