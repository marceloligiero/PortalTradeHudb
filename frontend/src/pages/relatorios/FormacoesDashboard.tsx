import { useState, useEffect } from 'react';
import {
  Loader2, GraduationCap, CheckCircle2, Clock, Award, Target,
  BookOpen, AlertCircle, TrendingUp,
} from 'lucide-react';
import { AreaChart, BarChart, DonutChart, BarList, Legend } from '@tremor/react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';

/* ─── Types ──────────────────────────────────────────────────────────────── */

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

interface MonthlyRow {
  month: number; year: number;
  enrollments: number; completions: number; completion_rate: number;
}

interface CourseRow {
  course_name: string; enrollments: number; completions: number; completion_rate: number;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/* ─── KPI Card ────────────────────────────────────────────────────────────── */

function KpiCard({ icon: Icon, label, value, sub, boxClass, iconClass }: {
  icon: any; label: string; value: string | number; sub?: string;
  boxClass: string; iconClass: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${boxClass}`}>
        <Icon className={`w-5 h-5 ${iconClass}`} />
      </div>
      <div>
        <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {sub && <p className="text-xs mt-0.5 text-gray-400 dark:text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Card Shell ──────────────────────────────────────────────────────────── */

function ChartCard({ title, icon: Icon, children, className = '' }: {
  title: string; icon?: any; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
      <p className="text-sm font-headline font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
        {Icon && <Icon className="w-4 h-4 text-[#EC0000]" />}
        {title}
      </p>
      {children}
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */

export default function FormacoesDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<FormData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    Promise.allSettled([
      api.get('/relatorios/formacoes'),
      api.get(`/dw/training/by-month?year=${currentYear}`),
      api.get('/dw/training/by-course?limit=8'),
    ]).then(([formRes, monthRes, courseRes]) => {
      if (formRes.status === 'fulfilled') setData(formRes.value.data);
      if (monthRes.status === 'fulfilled') {
        const d = monthRes.value.data;
        setMonthly(Array.isArray(d) ? d : []);
      }
      if (courseRes.status === 'fulfilled') {
        const d = courseRes.value.data;
        setCourses(Array.isArray(d) ? d : []);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" />
      </div>
    );
  }
  if (!data) return null;

  /* ── Derived data ─────────────────────────────────────────────────────── */

  const planLabels: Record<string, string> = {
    PENDING: t('relFormacoes.planPending'),
    IN_PROGRESS: t('relFormacoes.planInProgress'),
    COMPLETED: t('relFormacoes.planCompleted'),
    DELAYED: t('relFormacoes.planDelayed'),
  };
  const planChartData = Object.entries(data.plan_status).map(([k, v]) => ({
    name: planLabels[k] || k,
    Planos: v,
  }));

  const errData = [
    { name: t('relFormacoes.errMethodology'), value: data.error_breakdown.methodology },
    { name: t('relFormacoes.errKnowledge'), value: data.error_breakdown.knowledge },
    { name: t('relFormacoes.errDetail'), value: data.error_breakdown.detail },
    { name: t('relFormacoes.errProcedure'), value: data.error_breakdown.procedure },
  ].filter(d => d.value > 0);

  const monthlyChartData = monthly.map(row => ({
    name: MONTH_NAMES[row.month - 1],
    Matrículas: row.enrollments,
    Concluídas: row.completions,
  }));

  const courseBarList = courses.map(c => ({
    name: c.course_name,
    value: c.enrollments,
  }));

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#EC0000]">
          {t('relFormacoes.portalTitle')}
        </p>
        <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">
          {t('relFormacoes.title')}
        </h1>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          icon={BookOpen} label={t('relFormacoes.enrollments')}
          value={data.total_enrollments}
          sub={t('relFormacoes.completedSub', { count: data.completed_enrollments })}
          boxClass="bg-blue-50 dark:bg-blue-900/20" iconClass="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={CheckCircle2} label={t('relFormacoes.completionRate')}
          value={`${data.completion_rate}%`}
          boxClass="bg-emerald-50 dark:bg-emerald-900/20" iconClass="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={Target} label={t('relFormacoes.approvalRate')}
          value={`${data.approval_rate}%`}
          sub={t('relFormacoes.submissionsSub', { approved: data.approved_submissions, total: data.total_submissions })}
          boxClass="bg-purple-50 dark:bg-purple-900/20" iconClass="text-purple-600 dark:text-purple-400"
        />
        <KpiCard
          icon={Clock} label={t('relFormacoes.studyHours')}
          value={`${data.total_study_hours}h`}
          boxClass="bg-amber-50 dark:bg-amber-900/20" iconClass="text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          icon={GraduationCap} label={t('relFormacoes.avgMpu')}
          value={data.avg_mpu > 0 ? `${data.avg_mpu}` : '—'}
          sub={data.avg_mpu > 0 ? t('relFormacoes.minPerOperation') : undefined}
          boxClass="bg-[#EC0000]/10" iconClass="text-[#EC0000]"
        />
        <KpiCard
          icon={Award} label={t('relFormacoes.certificates')}
          value={data.total_certificates}
          boxClass="bg-yellow-50 dark:bg-yellow-900/20" iconClass="text-yellow-600 dark:text-yellow-400"
        />
      </div>

      {/* ── Monthly Trend — AreaChart (Tremor) ────────────────────────────── */}
      {monthlyChartData.length > 0 && (
        <ChartCard title={`${t('relFormacoes.monthlyTrend', 'Evolução Mensal')} — ${currentYear}`} icon={TrendingUp}>
          <AreaChart
            className="h-52"
            data={monthlyChartData}
            index="name"
            categories={['Matrículas', 'Concluídas']}
            colors={['blue', 'emerald']}
            valueFormatter={(v) => `${v}`}
            showLegend
            showAnimation
            showGridLines={false}
            curveType="monotone"
          />
        </ChartCard>
      )}

      {/* ── Charts Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Plan status — BarChart (Tremor) */}
        <ChartCard title={t('relFormacoes.plansByStatus')}>
          {planChartData.every(d => d.Planos === 0) ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400 dark:text-gray-600">
              {t('relFormacoes.noPlans', 'Sem dados de planos')}
            </div>
          ) : (
            <BarChart
              className="h-48"
              data={planChartData}
              index="name"
              categories={['Planos']}
              colors={['red']}
              showLegend={false}
              showAnimation
              showGridLines={false}
              valueFormatter={(v) => `${v}`}
            />
          )}
        </ChartCard>

        {/* Error breakdown — DonutChart (Tremor) */}
        {errData.length > 0 ? (
          <ChartCard title={t('relFormacoes.errorsByTypology')} icon={AlertCircle}>
            <div className="flex items-center gap-6">
              <DonutChart
                className="h-48 w-48 flex-shrink-0"
                data={errData}
                category="value"
                index="name"
                colors={['red', 'emerald', 'amber', 'blue']}
                showAnimation
                showLabel={false}
              />
              <Legend
                categories={errData.map(d => d.name)}
                colors={['red', 'emerald', 'amber', 'blue']}
                className="flex-1"
              />
            </div>
          </ChartCard>
        ) : (
          <ChartCard title={t('relFormacoes.errorsByTypology')} icon={AlertCircle}>
            <div className="flex items-center justify-center h-48 text-sm text-gray-400 dark:text-gray-600">
              {t('relFormacoes.noErrors', 'Sem erros registados')}
            </div>
          </ChartCard>
        )}
      </div>

      {/* ── Top Courses — BarList (Tremor) ───────────────────────────────── */}
      {courseBarList.length > 0 && (
        <ChartCard title={t('relFormacoes.topCourses', 'Cursos por Matrículas')} icon={GraduationCap}>
          <BarList
            data={courseBarList}
            color="red"
            valueFormatter={(v) => `${v} mat.`}
            className="mt-1"
          />
        </ChartCard>
      )}

    </div>
  );
}
