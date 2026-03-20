import { useState, useEffect } from 'react';
import { Loader2, GraduationCap, CheckCircle2, Clock, Award, Target, BookOpen, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';

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

const PIE_COLORS = ['#EC0000', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--tooltip-bg)',
  border: 'none',
  borderRadius: '12px',
  fontSize: 12,
};

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex gap-4">
      <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div>
        <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {sub && <p className="text-xs mt-0.5 text-gray-400 dark:text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function FormacoesDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/relatorios/formacoes')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" /></div>;
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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#EC0000]">
          {t('relFormacoes.portalTitle')}
        </p>
        <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">
          {t('relFormacoes.title')}
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          icon={BookOpen}
          label={t('relFormacoes.enrollments')}
          value={data.total_enrollments}
          sub={t('relFormacoes.completedSub', { count: data.completed_enrollments })}
          iconColor="text-[#3B82F6]"
        />
        <KpiCard
          icon={CheckCircle2}
          label={t('relFormacoes.completionRate')}
          value={`${data.completion_rate}%`}
          iconColor="text-[#10B981]"
        />
        <KpiCard
          icon={Target}
          label={t('relFormacoes.approvalRate')}
          value={`${data.approval_rate}%`}
          sub={t('relFormacoes.submissionsSub', { approved: data.approved_submissions, total: data.total_submissions })}
          iconColor="text-[#8B5CF6]"
        />
        <KpiCard
          icon={Clock}
          label={t('relFormacoes.studyHours')}
          value={`${data.total_study_hours}h`}
          iconColor="text-[#F59E0B]"
        />
        <KpiCard
          icon={GraduationCap}
          label={t('relFormacoes.avgMpu')}
          value={data.avg_mpu > 0 ? `${data.avg_mpu}` : '\u2014'}
          sub={t('relFormacoes.minPerOperation')}
          iconColor="text-[#EC0000]"
        />
        <KpiCard
          icon={Award}
          label={t('relFormacoes.certificates')}
          value={data.total_certificates}
          iconColor="text-[#EC0000]"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan status bar chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm font-headline font-bold mb-4 text-gray-900 dark:text-white">
            {t('relFormacoes.plansByStatus')}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={planChartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--axis-color)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--axis-color)' }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#EC0000" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Error breakdown pie */}
        {errData.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-sm font-headline font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <AlertCircle className="w-4 h-4 text-[#EC0000]" /> {t('relFormacoes.errorsByTypology')}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={errData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {errData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
