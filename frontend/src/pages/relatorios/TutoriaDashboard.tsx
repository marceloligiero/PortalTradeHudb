import { useState, useEffect } from 'react';
import {
  Loader2, AlertTriangle, CheckCircle2, RefreshCw, Clock, Shield, TrendingUp, Users,
} from 'lucide-react';
import { AreaChart, BarChart, DonutChart, BarList, Legend } from '@tremor/react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import { KpiCard, ChartCard, RateBar } from '../../components/reports';

/* ─── Types ──────────────────────────────────────────────────────────────── */

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

interface MonthlyRow { month: number; year: number; errors_count: number; resolved_count: number; resolution_rate: number; }
interface CategoryRow { category_name: string; errors_count: number; resolved_count: number; resolution_rate: number; }
interface TrainerRow { trainer_name: string; errors_count: number; resolved_count: number; avg_resolution_days: number; }

/* ─── Constants ──────────────────────────────────────────────────────────── */

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/* ─── Main ────────────────────────────────────────────────────────────────── */

export default function TutoriaDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<TutoriaData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [trainers, setTrainers] = useState<TrainerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/relatorios/tutoria'),
      api.get('/dw/tutoria/by-month'),
      api.get('/dw/tutoria/by-category'),
      api.get('/dw/tutoria/by-trainer'),
    ]).then(([tutRes, monthRes, catRes, trainerRes]) => {
      if (tutRes.status === 'fulfilled') setData(tutRes.value.data);
      if (monthRes.status === 'fulfilled') { const d = monthRes.value.data; setMonthly(Array.isArray(d) ? d : []); }
      if (catRes.status === 'fulfilled') { const d = catRes.value.data; setCategories(Array.isArray(d) ? d : []); }
      if (trainerRes.status === 'fulfilled') { const d = trainerRes.value.data; setTrainers(Array.isArray(d) ? d : []); }
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

  const sevLabels: Record<string, string> = {
    BAIXA: t('relTutoria.sevLow'), MEDIA: t('relTutoria.sevMedium'),
    ALTA: t('relTutoria.sevHigh'), CRITICA: t('relTutoria.sevCritical'),
  };
  const severityData = Object.entries(data.by_severity)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: sevLabels[k] || k, value: v }));

  const statLabels: Record<string, string> = {
    OPEN: t('relTutoria.statusOpen'), IN_PROGRESS: t('relTutoria.statusInProgress'),
    RESOLVED: t('relTutoria.statusResolved'), CLOSED: t('relTutoria.statusClosed'), PENDING: t('relTutoria.statusPending'),
  };
  const statusData = Object.entries(data.by_status)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: statLabels[k] || k, Erros: v }));

  const planLabels: Record<string, string> = {
    PENDING: t('relTutoria.planPending'), IN_PROGRESS: t('relTutoria.planInProgress'),
    COMPLETED: t('relTutoria.planCompleted'), DELAYED: t('relTutoria.planDelayed'),
  };
  const plansData = Object.entries(data.plans_by_status)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: planLabels[k] || k, Planos: v }));

  const monthlyChartData = monthly.map(row => ({
    name: MONTH_NAMES[row.month - 1],
    Erros: row.errors_count,
    Resolvidos: row.resolved_count,
  }));

  const categoryBarList = categories.slice(0, 10).map(c => ({
    name: c.category_name,
    value: c.errors_count,
  }));

  const severityColors: [string, string, string, string] = ['emerald', 'amber', 'red', 'purple'];

  function daysBadgeClass(days: number): string {
    if (days <= 0) return 'font-mono text-gray-400 dark:text-gray-600';
    if (days < 7) return 'font-mono text-emerald-600 dark:text-emerald-400 font-semibold';
    if (days <= 14) return 'font-mono text-amber-600 dark:text-amber-400 font-semibold';
    return 'font-mono text-[#EC0000] font-semibold';
  }

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#EC0000]">
          {t('relTutoria.portalTitle')}
        </p>
        <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">
          {t('relTutoria.title')}
        </h1>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard index={0} icon={AlertTriangle} label={t('relTutoria.totalErrors')} value={data.total_errors}
          boxClass="bg-red-50 dark:bg-red-900/20" iconClass="text-[#EC0000]" />
        <KpiCard index={1} icon={CheckCircle2} label={t('relTutoria.resolutionRate')} value={`${data.resolved_rate}%`}
          sub={t('relTutoria.resolvedSub', { count: data.resolved_errors })}
          boxClass="bg-emerald-50 dark:bg-emerald-900/20" iconClass="text-emerald-600 dark:text-emerald-400" />
        <KpiCard index={2} icon={RefreshCw} label={t('relTutoria.recurrenceRate')} value={`${data.recurrent_rate}%`}
          sub={t('relTutoria.recurrentSub', { count: data.recurrent_errors })}
          boxClass="bg-amber-50 dark:bg-amber-900/20" iconClass="text-amber-600 dark:text-amber-400" />
        <KpiCard index={3} icon={Shield} label={t('relTutoria.criticalErrors')} value={data.by_severity['CRITICA'] ?? 0}
          boxClass="bg-purple-50 dark:bg-purple-900/20" iconClass="text-purple-600 dark:text-purple-400" />
        <KpiCard index={4} icon={Clock} label={t('relTutoria.openErrors')} value={data.by_status['OPEN'] ?? 0}
          boxClass="bg-blue-50 dark:bg-blue-900/20" iconClass="text-blue-600 dark:text-blue-400" />
        <KpiCard index={5} icon={TrendingUp} label={t('relTutoria.completedPlans')} value={data.plans_by_status['COMPLETED'] ?? 0}
          boxClass="bg-teal-50 dark:bg-teal-900/20" iconClass="text-teal-600 dark:text-teal-400" />
      </div>

      {/* ── Monthly Trend — AreaChart (Tremor) ────────────────────────────── */}
      {monthlyChartData.length > 0 && (
        <ChartCard index={6} title={t('relTutoria.monthlyTrend', 'Evolução Mensal de Erros')} icon={TrendingUp}>
          <AreaChart
            className="h-52"
            data={monthlyChartData}
            index="name"
            categories={['Erros', 'Resolvidos']}
            colors={['red', 'emerald']}
            valueFormatter={(v: number) => `${v}`}
            showLegend
            showAnimation
            showGridLines={false}
            curveType="monotone"
          />
        </ChartCard>
      )}

      {/* ── Charts Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {severityData.length > 0 && (
          <ChartCard index={7} title={t('relTutoria.errorsBySeverity')}>
            <div className="flex items-center gap-4">
              <DonutChart
                className="h-44 w-44 flex-shrink-0"
                data={severityData}
                category="value"
                index="name"
                colors={severityColors}
                showAnimation
                showLabel={false}
              />
              <Legend
                categories={severityData.map(d => d.name)}
                colors={severityColors}
                className="flex-1"
              />
            </div>
          </ChartCard>
        )}

        {statusData.length > 0 && (
          <ChartCard index={8} title={t('relTutoria.errorsByStatus')}>
            <BarChart
              className="h-44"
              data={statusData}
              index="name"
              categories={['Erros']}
              colors={['red']}
              showLegend={false}
              showAnimation
              showGridLines={false}
              valueFormatter={(v: number) => `${v}`}
            />
          </ChartCard>
        )}
      </div>

      {/* ── By Category — table with resolution rate ─────────────────────── */}
      {categories.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#EC0000]" />
            <p className="text-sm font-headline font-bold text-gray-900 dark:text-white">
              {t('relTutoria.byCategory', 'Erros por Categoria')}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3 text-left font-semibold">{t('relTutoria.category', 'Categoria')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t('relTutoria.totalErrors', 'Erros')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t('relTutoria.resolvedSub', 'Resolvidos')}</th>
                  <th className="px-5 py-3 text-left font-semibold">{t('relTutoria.resolutionRate', 'Taxa')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {categories.slice(0, 10).map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{c.category_name}</td>
                    <td className="px-4 py-3 text-center font-mono text-gray-700 dark:text-gray-300">{c.errors_count}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {c.resolved_count}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <RateBar
                        value={c.resolution_rate}
                        trackClass="w-20"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Action Plans — BarChart (Tremor) ─────────────────────────────── */}
      {plansData.length > 0 && (
        <ChartCard index={10} title={t('relTutoria.actionPlansByStatus')}>
          <BarChart
            className="h-44"
            data={plansData}
            index="name"
            categories={['Planos']}
            colors={['blue']}
            showLegend={false}
            showAnimation
            showGridLines={false}
            valueFormatter={(v: number) => `${v}`}
          />
        </ChartCard>
      )}

      {/* ── By Trainer table ─────────────────────────────────────────────── */}
      {trainers.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#EC0000]" />
            <p className="text-sm font-headline font-bold text-gray-900 dark:text-white">
              {t('relTutoria.byTrainer', 'Por Tutor')}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label={t('relTutoria.byTrainer', 'Por Tutor')}>
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3 text-left font-semibold">{t('relTutoria.trainer', 'Tutor')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t('relTutoria.totalErrors', 'Erros')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t('relTutoria.resolvedSub', 'Resolvidos')}</th>
                  <th className="px-5 py-3 text-left font-semibold">{t('relTutoria.resolutionRate', 'Taxa')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t('relTutoria.avgDays', 'Dias Médios')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {trainers.map((tr, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{tr.trainer_name}</td>
                    <td className="px-4 py-3 text-center font-mono text-gray-700 dark:text-gray-300">{tr.errors_count}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {tr.resolved_count}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <RateBar
                        value={tr.errors_count > 0 ? Math.round((tr.resolved_count / tr.errors_count) * 100) : 0}
                        trackClass="w-16"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={daysBadgeClass(tr.avg_resolution_days)}>
                        {tr.avg_resolution_days > 0 ? `${tr.avg_resolution_days}d` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
