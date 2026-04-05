import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Trophy,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Flame,
  GraduationCap,
  Calendar,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  FileWarning,
} from 'lucide-react';
import api from '../../lib/axios';

interface DashboardData {
  summary: {
    total_submissions: number;
    approved_submissions: number;
    rejected_submissions: number;
    approval_rate: number;
    total_operations: number;
    total_errors: number;
    avg_mpu: number;
    total_plans: number;
    completed_plans: number;
    certificates: number;
    total_lessons: number;
    completed_lessons: number;
    approved_lessons: number;
    avg_lesson_time: number;
  };
  errors_by_type: {
    methodology: number;
    knowledge: number;
    detail: number;
    procedure: number;
  };
  evolution: Array<{
    date: string;
    submissions: number;
    approved: number;
    avg_mpu: number;
  }>;
  challenges: Array<{
    id: number;
    challenge_id: number;
    title: string;
    target_mpu: number;
    attempt_number: number;
    calculated_mpu: number;
    mpu_vs_target: number;
    total_operations: number;
    errors_count: number;
    is_approved: boolean | null;
    status: string;
    course_title: string | null;
    plan_title: string | null;
    completed_at: string | null;
    submitted_by_name?: string | null;
    reviewed_by_name?: string | null;
  }>;
  recent_activity: Array<{
    id: number;
    challenge_title: string;
    is_approved: boolean | null;
    calculated_mpu: number;
    errors_count: number;
    completed_at: string | null;
  }>;
  error_details: Array<{
    error_type: string;
    description: string;
    operation_reference: string | null;
    challenge_title: string;
    course_title: string | null;
    plan_title: string | null;
    date: string | null;
  }>;
  best_performance: {
    challenge_title: string;
    mpu: number;
    date: string | null;
  } | null;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
}> = ({ title, value, subtitle, icon }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="font-body text-xs text-gray-500 dark:text-gray-400">{title}</p>
        <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subtitle && <p className="font-body text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        {icon}
      </div>
    </div>
  </div>
);

const ErrorTypeBar: React.FC<{
  label: string;
  value: number;
  total: number;
  color: string;
}> = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between font-body text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
        <span className="font-medium text-gray-800 dark:text-white">{value}</span>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/student/reports/dashboard');
        setData(response.data);
      } catch (err: any) {
        console.error('Error fetching reports:', err);
        setError(err.response?.data?.detail || t('myReports.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-16 h-16 mb-4 text-[#EC0000]" />
        <p className="font-headline text-lg font-bold text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, errors_by_type, evolution, challenges, recent_activity, best_performance, error_details } = data;
  const totalErrors = Object.values(errors_by_type).reduce((a, b) => a + b, 0);

  const errorTypeLabels: Record<string, string> = {
    'METHODOLOGY': t('myReports.methodology'),
    'KNOWLEDGE': t('myReports.knowledge'),
    'DETAIL': t('myReports.detail'),
    'PROCEDURE': t('myReports.procedure'),
    'METODOLOGIA': t('myReports.methodology'),
    'CONHECIMENTO': t('myReports.knowledge'),
    'DETALHE': t('myReports.detail'),
    'PROCEDIMENTO': t('myReports.procedure'),
  };

  const errorTypeColors: Record<string, string> = {
    'METHODOLOGY': 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
    'KNOWLEDGE': 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    'DETAIL': 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30',
    'PROCEDURE': 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30',
    'METODOLOGIA': 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
    'CONHECIMENTO': 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    'DETALHE': 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30',
    'PROCEDIMENTO': 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30',
  };

  const filteredErrors = error_details?.filter(e =>
    errorTypeFilter === 'ALL' || e.error_type === errorTypeFilter
  ) || [];
  const displayErrors = showAllErrors ? filteredErrors : filteredErrors.slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
              {t('myReports.badge')}
            </p>
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {t('myReports.title')}
            </h1>
            <p className="font-body text-gray-500 dark:text-gray-400 mt-1 max-w-xl text-sm">
              {t('myReports.subtitle')}
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {[
            { icon: BarChart3, value: summary.total_submissions, label: t('myReports.totalSubmissions') },
            { icon: Trophy,    value: `${(summary.approval_rate ?? 0).toFixed(1)}%`, label: t('myReports.approvalRate') },
            { icon: TrendingUp, value: (summary.avg_mpu ?? 0).toFixed(2), label: t('myReports.avgMPU') },
            { icon: GraduationCap, value: summary.certificates, label: t('myReports.certificates') },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-[#EC0000] shrink-0" />
              <div>
                <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('myReports.totalSubmissions')}
          value={summary.total_submissions}
          subtitle={`${summary.approved_submissions} ${t('myReports.approved')}`}
          icon={<BarChart3 className="w-5 h-5 text-[#EC0000]" />}
        />
        <StatCard
          title={t('myReports.approvalRate')}
          value={`${(summary.approval_rate ?? 0).toFixed(1)}%`}
          subtitle={`${summary.rejected_submissions} ${t('myReports.rejections')}`}
          icon={<Trophy className="w-5 h-5 text-[#EC0000]" />}
        />
        <StatCard
          title={t('myReports.avgLessonTime')}
          value={`${Math.round(summary.avg_lesson_time || 0)} min`}
          subtitle={t('myReports.perLesson')}
          icon={<Clock className="w-5 h-5 text-[#EC0000]" />}
        />
        <StatCard
          title={t('myReports.avgMPU')}
          value={(summary.avg_mpu ?? 0).toFixed(2)}
          subtitle={t('myReports.minutesPerUnit')}
          icon={<Zap className="w-5 h-5 text-[#EC0000]" />}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={t('myReports.operationsCompleted')}
          value={summary.total_operations}
          subtitle={`${summary.total_errors ?? 0} ${t('myReports.errors')}`}
          icon={<Sparkles className="w-5 h-5 text-[#EC0000]" />}
        />
        <StatCard
          title={t('myReports.completedPlans')}
          value={`${summary.completed_plans}/${summary.total_plans}`}
          subtitle={t('myReports.trainingPlans')}
          icon={<Flame className="w-5 h-5 text-[#EC0000]" />}
        />
        <StatCard
          title={t('myReports.certificates')}
          value={summary.certificates}
          subtitle={`${summary.completed_lessons} ${t('myReports.lessonsCompleted')}`}
          icon={<GraduationCap className="w-5 h-5 text-[#EC0000]" />}
        />
      </div>

      {/* Best Performance & Error Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Performance */}
        {best_performance && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h3 className="font-headline text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              {t('myReports.bestPerformance')}
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <p className="font-body text-sm text-gray-500 dark:text-gray-400">{t('myReports.challenge')}</p>
                <p className="font-headline font-bold text-gray-800 dark:text-white">{best_performance.challenge_title}</p>
              </div>
              <div className="flex justify-center">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
                  <p className="font-mono text-3xl font-bold text-green-600 dark:text-green-400">{(best_performance.mpu ?? 0).toFixed(2)}</p>
                  <p className="font-body text-sm text-gray-500 dark:text-gray-400">MPU ({t('myReports.best')})</p>
                </div>
              </div>
              {best_performance.date && (
                <p className="font-body text-xs text-gray-400 dark:text-gray-500 text-right mt-2">
                  {new Date(best_performance.date).toLocaleDateString('pt-PT')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error Analysis */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h3 className="font-headline text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-[#EC0000]" />
            {t('myReports.errorAnalysis')}
          </h3>
          {totalErrors === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p className="font-body">{t('myReports.noErrors')}</p>
            </div>
          ) : (
            <div>
              <ErrorTypeBar
                label={t('myReports.methodology')}
                value={errors_by_type.methodology ?? 0}
                total={totalErrors}
                color="bg-purple-500"
              />
              <ErrorTypeBar
                label={t('myReports.knowledge')}
                value={errors_by_type.knowledge ?? 0}
                total={totalErrors}
                color="bg-blue-500"
              />
              <ErrorTypeBar
                label={t('myReports.detail')}
                value={errors_by_type.detail ?? 0}
                total={totalErrors}
                color="bg-orange-500"
              />
              <ErrorTypeBar
                label={t('myReports.procedure')}
                value={errors_by_type.procedure ?? 0}
                total={totalErrors}
                color="bg-[#EC0000]"
              />
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-center">
                <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                  Total: <span className="font-bold text-gray-800 dark:text-white">{totalErrors}</span> {t('myReports.errors')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Error List */}
      {error_details && error_details.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FileWarning className="w-6 h-6 text-[#EC0000]" />
              {t('myReports.errorDetails')}
            </h3>
            <span className="font-body text-sm px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
              {filteredErrors.length} {filteredErrors.length === 1 ? t('myReports.errorSingular') : t('myReports.errorsPlural')}
            </span>
          </div>

          {/* Filter by error type */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setErrorTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-body text-xs font-medium transition-colors border ${
                errorTypeFilter === 'ALL'
                  ? 'bg-[#EC0000] text-white border-[#EC0000]'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t('myReports.all')} ({error_details.length})
            </button>
            {(Array.from(new Set(error_details.map(e => e.error_type)))).map(type => {
              const count = error_details.filter(e => e.error_type === type).length;
              if (count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setErrorTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-xl font-body text-xs font-medium transition-colors border ${
                    errorTypeFilter === type
                      ? errorTypeColors[type]
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {errorTypeLabels[type]} ({count})
                </button>
              );
            })}
          </div>

          {/* Error table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.type')}</th>
                  <th className="text-left py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.description')}</th>
                  <th className="text-left py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.plan')}</th>
                  <th className="text-left py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.course')}</th>
                  <th className="text-left py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.challenge')}</th>
                  <th className="text-left py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.ref')}</th>
                  <th className="text-left py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.date')}</th>
                </tr>
              </thead>
              <tbody>
                {displayErrors.map((err, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-body text-xs font-medium border ${errorTypeColors[err.error_type] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>
                        {errorTypeLabels[err.error_type] || err.error_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-body text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                      {err.description || '-'}
                    </td>
                    <td className="py-3 px-4 font-body text-sm text-gray-600 dark:text-gray-300">
                      {err.plan_title || '-'}
                    </td>
                    <td className="py-3 px-4 font-body text-sm text-gray-600 dark:text-gray-300">
                      {err.course_title || '-'}
                    </td>
                    <td className="py-3 px-4 font-body text-sm font-medium text-gray-800 dark:text-white">
                      {err.challenge_title}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm text-gray-500 dark:text-gray-400">
                      {err.operation_reference || '-'}
                    </td>
                    <td className="py-3 px-4 font-body text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {err.date ? new Date(err.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Show more/less button */}
          {filteredErrors.length > 10 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAllErrors(!showAllErrors)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {showAllErrors ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    {t('myReports.showLess')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    {t('myReports.showAllErrors', { count: filteredErrors.length })}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Challenge Performance Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h3 className="font-headline text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-500" />
          {t('myReports.challengePerformance')}
        </h3>
        {challenges.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
            <p className="font-body">{t('myReports.noChallenges')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.challenge')}</th>
                  <th className="text-left py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.course')}</th>
                  <th className="text-left py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.plan')}</th>
                  <th className="text-center py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.attempt')}</th>
                  <th className="text-center py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">MPU</th>
                  <th className="text-center py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.target')}</th>
                  <th className="text-center py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.ops')}</th>
                  <th className="text-center py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.errors')}</th>
                  <th className="text-center py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.result')}</th>
                  <th className="text-left py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('trainingPlanDetail.appliedBy', 'Aplicado por')}</th>
                  <th className="text-left py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('trainingPlanDetail.correctedBy', 'Corrigido por')}</th>
                  <th className="text-left py-3 px-4 font-body text-sm font-medium text-gray-500 dark:text-gray-400">{t('myReports.date')}</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((challenge) => (
                  <tr
                    key={challenge.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="py-3 px-4 font-body font-medium text-gray-800 dark:text-white">{challenge.title}</td>
                    <td className="py-3 px-4 font-body text-sm text-gray-600 dark:text-gray-300">{challenge.course_title || '-'}</td>
                    <td className="py-3 px-4 font-body text-sm text-gray-600 dark:text-gray-300">{challenge.plan_title || '-'}</td>
                    <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full font-mono text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white">
                        {challenge.attempt_number}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono font-medium ${
                        challenge.is_approved === true
                          ? 'text-green-600 dark:text-green-400'
                          : challenge.is_approved === false
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {(challenge.calculated_mpu ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-sm text-gray-500 dark:text-gray-400">
                      {(challenge.target_mpu ?? 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center font-body text-gray-600 dark:text-gray-300">{challenge.total_operations}</td>
                    <td className={`py-3 px-4 text-center font-body ${challenge.errors_count > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {challenge.errors_count}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-body text-xs font-medium ${
                          challenge.is_approved === true
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : challenge.is_approved === false
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            : challenge.status === 'PENDING_REVIEW'
                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {challenge.is_approved === true ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> {t('myReports.approved')}</>
                        ) : challenge.is_approved === false ? (
                          <><XCircle className="w-3.5 h-3.5" /> {t('myReports.rejections')}</>
                        ) : challenge.status === 'PENDING_REVIEW' ? (
                          <><Clock className="w-3.5 h-3.5" /> {t('myReports.pendingStatus')}</>
                        ) : (
                          <><Clock className="w-3.5 h-3.5" /> {challenge.status}</>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-body text-sm text-gray-600 dark:text-gray-300">
                      {challenge.submitted_by_name || '-'}
                    </td>
                    <td className="py-3 px-4 font-body text-sm text-gray-600 dark:text-gray-300">
                      {challenge.reviewed_by_name || '-'}
                    </td>
                    <td className="py-3 px-4 font-body text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {challenge.completed_at ? new Date(challenge.completed_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h3 className="font-headline text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[#EC0000]" />
          {t('myReports.recentActivity')}
        </h3>
        {recent_activity.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2" />
            <p className="font-body">{t('myReports.noRecentActivity')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recent_activity.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  activity.is_approved === true
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                    : activity.is_approved === false
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  {activity.is_approved === true ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
                  ) : activity.is_approved === false ? (
                    <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                  ) : (
                    <Clock className="w-8 h-8 text-yellow-500 shrink-0" />
                  )}
                  <div>
                    <p className="font-headline font-bold text-gray-800 dark:text-white">{activity.challenge_title}</p>
                    <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                      {activity.completed_at ? new Date(activity.completed_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : t('myReports.underReview')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-mono font-bold text-gray-800 dark:text-white">{(activity.calculated_mpu ?? 0).toFixed(2)}</p>
                    <p className="font-body text-xs text-gray-400 dark:text-gray-500">MPU</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono font-bold text-gray-800 dark:text-white">{activity.errors_count}</p>
                    <p className="font-body text-xs text-gray-400 dark:text-gray-500">{t('myReports.errors')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evolution Timeline */}
      {evolution.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h3 className="font-headline text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#EC0000]" />
            {t('myReports.monthlyEvolution')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {evolution.map((item) => (
              <div
                key={item.date}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 text-center"
              >
                <p className="font-body text-sm font-medium text-[#EC0000] mb-2">
                  {new Date(item.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                </p>
                <p className="font-mono text-2xl font-bold text-gray-800 dark:text-white">{item.submissions}</p>
                <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('myReports.submissions')}</p>
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="font-body text-xs">
                    <span className="text-green-600 dark:text-green-400 font-medium">{item.approved}</span> {t('myReports.approved')}
                  </p>
                  <p className="font-mono text-xs text-gray-400 dark:text-gray-500">
                    MPU: {(item.avg_mpu ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
