import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw, Clock, Shield, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface TutoriaData {
  total_errors: number;
  recurrent_errors: number;
  recurrent_rate: number;
  resolved_errors: number;
  resolved_rate: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  plans_by_status: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/*  Colour palettes (Santander Design System)                          */
/* ------------------------------------------------------------------ */
const SEVERITY_COLORS: Record<string, string> = {
  BAIXA: '#10B981',
  MEDIA: '#F59E0B',
  ALTA: '#EC0000',
  CRITICA: '#8B5CF6',
};

const BAR_COLORS = ['#6b7280', '#3B82F6', '#10B981', '#F59E0B'];

const AXIS_COLOR = '#9ca3af';

/* ------------------------------------------------------------------ */
/*  Custom Recharts tooltip — styled with Tailwind dark: classes       */
/* ------------------------------------------------------------------ */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl px-3 py-2 shadow-lg border border-gray-200 dark:border-gray-800 text-xs">
      {label && (
        <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">{label}</p>
      )}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-gray-700 dark:text-gray-300">
          <span style={{ color: entry.color || entry.fill }}>&#9679;</span>{' '}
          {entry.name}:{' '}
          <span className="font-mono font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StatCard — icon box + value (font-mono) + label                   */
/* ------------------------------------------------------------------ */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  boxClass,
  iconClass,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  boxClass: string;
  iconClass: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${boxClass}`}
      >
        <Icon className={`w-5 h-5 ${iconClass}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {sub && (
          <p className="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                     */
/* ------------------------------------------------------------------ */
export default function TutoriaDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<TutoriaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/relatorios/tutoria')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Loading state */
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" />
      </div>
    );
  }
  if (!data) return null;

  /* ---------- derived chart data ---------- */
  const sevLabels: Record<string, string> = {
    BAIXA: t('relTutoria.sevLow'),
    MEDIA: t('relTutoria.sevMedium'),
    ALTA: t('relTutoria.sevHigh'),
    CRITICA: t('relTutoria.sevCritical'),
  };
  const severityData = Object.entries(data.by_severity)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: sevLabels[k] || k,
      value: v,
      color: SEVERITY_COLORS[k] || '#6b7280',
    }));

  const statLabels: Record<string, string> = {
    OPEN: t('relTutoria.statusOpen'),
    IN_PROGRESS: t('relTutoria.statusInProgress'),
    RESOLVED: t('relTutoria.statusResolved'),
    CLOSED: t('relTutoria.statusClosed'),
    PENDING: t('relTutoria.statusPending'),
  };
  const statusData = Object.entries(data.by_status)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: statLabels[k] || k, value: v }));

  const planLabels: Record<string, string> = {
    PENDING: t('relTutoria.planPending'),
    IN_PROGRESS: t('relTutoria.planInProgress'),
    COMPLETED: t('relTutoria.planCompleted'),
    DELAYED: t('relTutoria.planDelayed'),
  };
  const plansData = Object.entries(data.plans_by_status)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: planLabels[k] || k, value: v }));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#EC0000]">
          {t('relTutoria.portalTitle')}
        </p>
        <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">
          {t('relTutoria.title')}
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={AlertTriangle}
          label={t('relTutoria.totalErrors')}
          value={data.total_errors}
          boxClass="bg-red-100 dark:bg-red-900/20"
          iconClass="text-[#EC0000]"
        />
        <StatCard
          icon={CheckCircle2}
          label={t('relTutoria.resolutionRate')}
          value={`${data.resolved_rate}%`}
          sub={t('relTutoria.resolvedSub', { count: data.resolved_errors })}
          boxClass="bg-emerald-100 dark:bg-emerald-900/20"
          iconClass="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={RefreshCw}
          label={t('relTutoria.recurrenceRate')}
          value={`${data.recurrent_rate}%`}
          sub={t('relTutoria.recurrentSub', { count: data.recurrent_errors })}
          boxClass="bg-amber-100 dark:bg-amber-900/20"
          iconClass="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={Shield}
          label={t('relTutoria.criticalErrors')}
          value={data.by_severity['CRITICA'] ?? 0}
          boxClass="bg-purple-100 dark:bg-purple-900/20"
          iconClass="text-purple-600 dark:text-purple-400"
        />
        <StatCard
          icon={Clock}
          label={t('relTutoria.openErrors')}
          value={data.by_status['OPEN'] ?? 0}
          boxClass="bg-blue-100 dark:bg-blue-900/20"
          iconClass="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={TrendingUp}
          label={t('relTutoria.completedPlans')}
          value={data.plans_by_status['COMPLETED'] ?? 0}
          boxClass="bg-teal-100 dark:bg-teal-900/20"
          iconClass="text-teal-600 dark:text-teal-400"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity pie */}
        {severityData.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-sm font-headline font-bold mb-4 text-gray-900 dark:text-white">
              {t('relTutoria.errorsBySeverity')}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={severityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={10}
                >
                  {severityData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Error status bar chart */}
        {statusData.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-sm font-headline font-bold mb-4 text-gray-900 dark:text-white">
              {t('relTutoria.errorsByStatus')}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData} barSize={32}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={AXIS_COLOR}
                  strokeOpacity={0.2}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#EC0000" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Plans bar chart */}
      {plansData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm font-headline font-bold mb-4 text-gray-900 dark:text-white">
            {t('relTutoria.actionPlansByStatus')}
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={plansData} barSize={40}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={AXIS_COLOR}
                strokeOpacity={0.2}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: AXIS_COLOR }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: AXIS_COLOR }}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {plansData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
