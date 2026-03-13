import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, GraduationCap, CheckCircle2, Clock, Award, Target, BookOpen, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';

interface FormData {
  total_enrollments: number;
  completed_enrollments: number;
  completion_rate: number;
  plan_status: Record<string, number>;
  total_submissions: number;
  approved_submissions: number;
  approval_rate: number;
  avg_mpu: number;
  total_study_hours: number;
  total_certificates: number;
  error_breakdown: { methodology: number; knowledge: number; detail: number; procedure: number };
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-2xl border p-5 flex gap-4 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
        {sub && <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{sub}</p>}
      </div>
    </div>
  );
}

export default function FormacoesDashboard() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [data, setData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/relatorios/formacoes')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;
  if (!data) return null;

  const planLabels: Record<string, string> = {
    PENDING: t('relFormacoes.planPending'), IN_PROGRESS: t('relFormacoes.planInProgress'),
    COMPLETED: t('relFormacoes.planCompleted'), DELAYED: t('relFormacoes.planDelayed'),
  };
  const planChartData = Object.entries(data.plan_status).map(([k, v]) => ({ name: planLabels[k] || k, value: v }));
  const errData = [
    { name: t('relFormacoes.errMethodology'), value: data.error_breakdown.methodology },
    { name: t('relFormacoes.errKnowledge'), value: data.error_breakdown.knowledge },
    { name: t('relFormacoes.errDetail'), value: data.error_breakdown.detail },
    { name: t('relFormacoes.errProcedure'), value: data.error_breakdown.procedure },
  ].filter(d => d.value > 0);
  const axisColor = isDark ? '#6b7280' : '#9ca3af';

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{t('relFormacoes.portalTitle')}</p>
        <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('relFormacoes.title')}</h1>
      </div>

      {/* KPIs */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <KpiCard icon={BookOpen} label={t('relFormacoes.enrollments')} value={data.total_enrollments}
          sub={t('relFormacoes.completedSub', { count: data.completed_enrollments })} color="bg-gradient-to-br from-blue-600 to-blue-500" />
        <KpiCard icon={CheckCircle2} label={t('relFormacoes.completionRate')} value={`${data.completion_rate}%`}
          color="bg-gradient-to-br from-emerald-600 to-emerald-500" />
        <KpiCard icon={Target} label={t('relFormacoes.approvalRate')} value={`${data.approval_rate}%`}
          sub={t('relFormacoes.submissionsSub', { approved: data.approved_submissions, total: data.total_submissions })}
          color="bg-gradient-to-br from-purple-600 to-purple-500" />
        <KpiCard icon={Clock} label={t('relFormacoes.studyHours')} value={`${data.total_study_hours}h`}
          color="bg-gradient-to-br from-amber-600 to-amber-500" />
        <KpiCard icon={GraduationCap} label={t('relFormacoes.avgMpu')} value={data.avg_mpu > 0 ? `${data.avg_mpu}` : '—'}
          sub={t('relFormacoes.minPerOperation')} color="bg-gradient-to-br from-teal-600 to-teal-500" />
        <KpiCard icon={Award} label={t('relFormacoes.certificates')} value={data.total_certificates}
          color="bg-gradient-to-br from-yellow-600 to-yellow-500" />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan status bar chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`rounded-2xl border p-5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
        >
          <p className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('relFormacoes.plansByStatus')}</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={planChartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#f3f4f6'} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisColor }} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Error breakdown pie */}
        {errData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className={`rounded-2xl border p-5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <p className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <AlertCircle className="w-4 h-4 text-red-500" /> {t('relFormacoes.errorsByTypology')}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={errData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {errData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
}
