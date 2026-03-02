import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { PremiumHeader } from '../../components/premium';
import { useTheme } from '../../contexts/ThemeContext';

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
  color: string;
  delay?: number;
}> = ({ title, value, subtitle, icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className={`bg-gradient-to-br ${color} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-white/80 text-sm font-medium">{title}</p>
        <p className="text-white text-3xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className="bg-white/20 rounded-xl p-3">{icon}</div>
    </div>
  </motion.div>
);

const ErrorTypeBar: React.FC<{
  label: string;
  value: number;
  total: number;
  color: string;
  isDark: boolean;
}> = ({ label, value, total, color, isDark }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{label}</span>
        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{value}</span>
      </div>
      <div className={`h-3 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
};

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-16 h-16 mb-4 text-red-500" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, errors_by_type, evolution, challenges, recent_activity, best_performance, error_details } = data;
  const totalErrors = Object.values(errors_by_type).reduce((a, b) => a + b, 0);

  const errorTypeLabels: Record<string, string> = {
    'METHODOLOGY': `📐 ${t('myReports.methodology')}`,
    'KNOWLEDGE': `💡 ${t('myReports.knowledge')}`,
    'DETAIL': `🔍 ${t('myReports.detail')}`,
    'PROCEDURE': `📋 ${t('myReports.procedure')}`,
    'METODOLOGIA': `📐 ${t('myReports.methodology')}`,
    'CONHECIMENTO': `💡 ${t('myReports.knowledge')}`,
    'DETALHE': `🔍 ${t('myReports.detail')}`,
    'PROCEDIMENTO': `📋 ${t('myReports.procedure')}`,
  };

  const errorTypeColors: Record<string, string> = {
    'METHODOLOGY': isDark ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-200',
    'KNOWLEDGE': isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-200',
    'DETAIL': isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-orange-100 text-orange-700 border-orange-200',
    'PROCEDURE': isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-700 border-red-200',
    'METODOLOGIA': isDark ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-200',
    'CONHECIMENTO': isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-200',
    'DETALHE': isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-orange-100 text-orange-700 border-orange-200',
    'PROCEDIMENTO': isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-700 border-red-200',
  };

  const filteredErrors = error_details?.filter(e => 
    errorTypeFilter === 'ALL' || e.error_type === errorTypeFilter
  ) || [];
  const displayErrors = showAllErrors ? filteredErrors : filteredErrors.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <PremiumHeader
        icon={BarChart3}
        title={t('myReports.title')}
        subtitle={t('myReports.subtitle')}
        badge={t('myReports.badge')}
        iconColor="from-indigo-500 to-indigo-700"
      />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('myReports.totalSubmissions')}
          value={summary.total_submissions}
          subtitle={`${summary.approved_submissions} ${t('myReports.approved')}`}
          icon={<BarChart3 className="w-6 h-6 text-white" />}
          color="from-blue-500 to-blue-600"
          delay={0.1}
        />
        <StatCard
          title={t('myReports.approvalRate')}
          value={`${(summary.approval_rate ?? 0).toFixed(1)}%`}
          subtitle={`${summary.rejected_submissions} ${t('myReports.rejections')}`}
          icon={<Trophy className="w-6 h-6 text-white" />}
          color="from-green-500 to-green-600"
          delay={0.2}
        />
        <StatCard
          title={t('myReports.avgLessonTime')}
          value={`${Math.round(summary.avg_lesson_time || 0)} min`}
          subtitle={t('myReports.perLesson')}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="from-purple-500 to-purple-600"
          delay={0.3}
        />
        <StatCard
          title={t('myReports.avgMPU')}
          value={(summary.avg_mpu ?? 0).toFixed(2)}
          subtitle={t('myReports.minutesPerUnit')}
          icon={<Zap className="w-6 h-6 text-white" />}
          color="from-amber-500 to-amber-600"
          delay={0.4}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={t('myReports.operationsCompleted')}
          value={summary.total_operations}
          subtitle={`${summary.total_errors ?? 0} ${t('myReports.errors')}`}
          icon={<Sparkles className="w-6 h-6 text-white" />}
          color="from-indigo-500 to-indigo-600"
          delay={0.5}
        />
        <StatCard
          title={t('myReports.completedPlans')}
          value={`${summary.completed_plans}/${summary.total_plans}`}
          subtitle={t('myReports.trainingPlans')}
          icon={<Flame className="w-6 h-6 text-white" />}
          color="from-orange-500 to-orange-600"
          delay={0.6}
        />
        <StatCard
          title={t('myReports.certificates')}
          value={summary.certificates}
          subtitle={`${summary.completed_lessons} ${t('myReports.lessonsCompleted')}`}
          icon={<GraduationCap className="w-6 h-6 text-white" />}
          color="from-teal-500 to-teal-600"
          delay={0.7}
        />
      </div>

      {/* Best Performance & Error Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Performance */}
        {best_performance && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className={`${isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'} border rounded-2xl p-6`}
          >
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
              <Trophy className="w-6 h-6 text-yellow-500" />
              🏆 {t('myReports.bestPerformance')}
            </h3>
            <div className="space-y-3">
              <div className={`${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100'} rounded-xl p-4 shadow-sm`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('myReports.challenge')}</p>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{best_performance.challenge_title}</p>
              </div>
              <div className="flex justify-center">
                <div className={`${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100'} rounded-xl p-4 text-center shadow-sm`}>
                  <p className={`text-3xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{(best_performance.mpu ?? 0).toFixed(2)}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>MPU ({t('myReports.best')})</p>
                </div>
              </div>
              {best_performance.date && (
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} text-right mt-2`}>
                  📅 {new Date(best_performance.date).toLocaleDateString('pt-PT')}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Error Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-sm`}
        >
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
            <AlertTriangle className="w-6 h-6 text-red-500" />
            {t('myReports.errorAnalysis')}
          </h3>
          {totalErrors === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>{t('myReports.noErrors')} 🎉</p>
            </div>
          ) : (
            <div>
              <ErrorTypeBar
                label={`📐 ${t('myReports.methodology')}`}
                value={errors_by_type.methodology ?? 0}
                total={totalErrors}
                color="bg-purple-500"
                isDark={isDark}
              />
              <ErrorTypeBar
                label={`💡 ${t('myReports.knowledge')}`}
                value={errors_by_type.knowledge ?? 0}
                total={totalErrors}
                color="bg-blue-500"
                isDark={isDark}
              />
              <ErrorTypeBar
                label={`🔍 ${t('myReports.detail')}`}
                value={errors_by_type.detail ?? 0}
                total={totalErrors}
                color="bg-orange-500"
                isDark={isDark}
              />
              <ErrorTypeBar
                label={`📋 ${t('myReports.procedure')}`}
                value={errors_by_type.procedure ?? 0}
                total={totalErrors}
                color="bg-red-500"
                isDark={isDark}
              />
              <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'} text-center`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total: <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{totalErrors}</span> {t('myReports.errors')}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Challenge Performance Table */}
      {/* Detailed Error List */}
      {error_details && error_details.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
              <FileWarning className="w-6 h-6 text-red-500" />
              Detalhe dos Erros
            </h3>
            <span className={`text-sm px-3 py-1 rounded-full ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
              {filteredErrors.length} {filteredErrors.length === 1 ? 'erro' : 'erros'}
            </span>
          </div>

          {/* Filter by error type */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setErrorTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                errorTypeFilter === 'ALL'
                  ? isDark ? 'bg-white/20 text-white border-white/30' : 'bg-gray-800 text-white border-gray-800'
                  : isDark ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            >
              Todos ({error_details.length})
            </button>
            {(Array.from(new Set(error_details.map(e => e.error_type)))).map(type => {
              const count = error_details.filter(e => e.error_type === type).length;
              if (count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setErrorTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    errorTypeFilter === type
                      ? errorTypeColors[type]
                      : isDark ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
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
                <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tipo</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Descrição</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Plano</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Curso</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('myReports.challenge')}</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ref.</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Data</th>
                </tr>
              </thead>
              <tbody>
                {displayErrors.map((err, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + idx * 0.03 }}
                    className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
                  >
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${errorTypeColors[err.error_type] || (isDark ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-gray-100 text-gray-600 border-gray-200')}`}>
                        {errorTypeLabels[err.error_type] || err.error_type}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} max-w-xs`}>
                      {err.description || '-'}
                    </td>
                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {err.plan_title || '-'}
                    </td>
                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {err.course_title || '-'}
                    </td>
                    <td className={`py-3 px-4 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {err.challenge_title}
                    </td>
                    <td className={`py-3 px-4 text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {err.operation_reference || '-'}
                    </td>
                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} whitespace-nowrap`}>
                      {err.date ? new Date(err.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Show more/less button */}
          {filteredErrors.length > 10 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAllErrors(!showAllErrors)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showAllErrors ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Ver todos ({filteredErrors.length} erros)
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Challenge Performance Table - original */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-sm`}
      >
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
          <Flame className="w-6 h-6 text-orange-500" />
          {t('myReports.challengePerformance')}
        </h3>
        {challenges.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
            <p>{t('myReports.noChallenges')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('myReports.challenge')}</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Curso</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Plano</th>
                  <th className={`text-center py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tentativa</th>
                  <th className={`text-center py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>MPU</th>
                  <th className={`text-center py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Meta</th>
                  <th className={`text-center py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ops.</th>
                  <th className={`text-center py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('myReports.errors')}</th>
                  <th className={`text-center py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('myReports.result')}</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('trainingPlanDetail.appliedBy', 'Aplicado por')}</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('trainingPlanDetail.correctedBy', 'Corrigido por')}</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Data</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((challenge, idx) => (
                  <motion.tr
                    key={challenge.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.03 }}
                    className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
                  >
                    <td className={`py-3 px-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{challenge.title}</td>
                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{challenge.course_title || '-'}</td>
                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{challenge.plan_title || '-'}</td>
                    <td className={`py-3 px-4 text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-700'}`}>
                        {challenge.attempt_number}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono font-medium ${
                        challenge.is_approved === true
                          ? isDark ? 'text-green-400' : 'text-green-600'
                          : challenge.is_approved === false
                          ? isDark ? 'text-red-400' : 'text-red-600'
                          : isDark ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {(challenge.calculated_mpu ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-center font-mono text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(challenge.target_mpu ?? 0).toFixed(2)}
                    </td>
                    <td className={`py-3 px-4 text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{challenge.total_operations}</td>
                    <td className={`py-3 px-4 text-center ${challenge.errors_count > 0 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                      {challenge.errors_count}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          challenge.is_approved === true
                            ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                            : challenge.is_approved === false
                            ? isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                            : challenge.status === 'PENDING_REVIEW'
                            ? isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                            : isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {challenge.is_approved === true ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> {t('myReports.approved')}</>
                        ) : challenge.is_approved === false ? (
                          <><XCircle className="w-3.5 h-3.5" /> {t('myReports.rejections')}</>
                        ) : challenge.status === 'PENDING_REVIEW' ? (
                          <><Clock className="w-3.5 h-3.5" /> Pendente</>
                        ) : (
                          <><Clock className="w-3.5 h-3.5" /> {challenge.status}</>
                        )}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {challenge.submitted_by_name || '-'}
                    </td>
                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {challenge.reviewed_by_name || '-'}
                    </td>
                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} whitespace-nowrap`}>
                      {challenge.completed_at ? new Date(challenge.completed_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-sm`}
      >
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
          <Calendar className="w-6 h-6 text-indigo-500" />
          {t('myReports.recentActivity')}
        </h3>
        {recent_activity.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Calendar className="w-12 h-12 mx-auto mb-2" />
            <p>{t('myReports.noRecentActivity')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recent_activity.map((activity, idx) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + idx * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  activity.is_approved === true
                    ? isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
                    : activity.is_approved === false
                    ? isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
                    : isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  {activity.is_approved === true ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : activity.is_approved === false ? (
                    <XCircle className="w-8 h-8 text-red-500" />
                  ) : (
                    <Clock className="w-8 h-8 text-yellow-500" />
                  )}
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{activity.challenge_title}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{(activity.calculated_mpu ?? 0).toFixed(2)}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>MPU</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{activity.errors_count}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('myReports.errors')}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Evolution Timeline */}
      {evolution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className={`${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'} border rounded-2xl p-6`}
        >
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            {t('myReports.monthlyEvolution')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {evolution.map((item, idx) => (
              <motion.div
                key={item.date}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + idx * 0.1 }}
                className={`${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100'} rounded-xl p-4 text-center shadow-sm`}
              >
                <p className={`text-sm font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'} mb-2`}>{new Date(item.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{item.submissions}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('myReports.submissions')}</p>
                <div className={`mt-2 pt-2 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <p className="text-xs">
                    <span className={`${isDark ? 'text-green-400' : 'text-green-600'} font-medium`}>{item.approved}</span> {t('myReports.approved')}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    MPU: {(item.avg_mpu ?? 0).toFixed(2)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Reports;
