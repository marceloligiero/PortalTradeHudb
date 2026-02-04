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
    title: string;
    target_mpu: number;
    attempts: number;
    approvals: number;
    approval_rate: number;
    avg_mpu: number;
    best_mpu: number;
  }>;
  recent_activity: Array<{
    id: number;
    challenge_title: string;
    is_approved: boolean | null;
    calculated_mpu: number;
    errors_count: number;
    completed_at: string | null;
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
}> = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">{value}</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/student/reports/dashboard');
        setData(response.data);
      } catch (err: any) {
        console.error('Error fetching reports:', err);
        setError(err.response?.data?.detail || 'Erro ao carregar relatórios');
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-500">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, errors_by_type, evolution, challenges, recent_activity, best_performance } = data;
  const totalErrors = Object.values(errors_by_type).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          Meus Relatórios
        </h1>
        <p className="text-gray-500 mt-1">
          Acompanhe sua evolução e desempenho nos desafios
        </p>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total de Submissões"
          value={summary.total_submissions}
          subtitle={`${summary.approved_submissions} aprovadas`}
          icon={<BarChart3 className="w-6 h-6 text-white" />}
          color="from-blue-500 to-blue-600"
          delay={0.1}
        />
        <StatCard
          title="Taxa de Aprovação"
          value={`${(summary.approval_rate ?? 0).toFixed(1)}%`}
          subtitle={`${summary.rejected_submissions} reprovações`}
          icon={<Trophy className="w-6 h-6 text-white" />}
          color="from-green-500 to-green-600"
          delay={0.2}
        />
        <StatCard
          title="Tempo Médio (Lições)"
          value={`${Math.round(summary.avg_lesson_time || 0)} min`}
          subtitle="por lição"
          icon={<Clock className="w-6 h-6 text-white" />}
          color="from-purple-500 to-purple-600"
          delay={0.3}
        />
        <StatCard
          title="MPU Médio"
          value={(summary.avg_mpu ?? 0).toFixed(2)}
          subtitle="minutos/unidade"
          icon={<Zap className="w-6 h-6 text-white" />}
          color="from-amber-500 to-amber-600"
          delay={0.4}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Operações Realizadas"
          value={summary.total_operations}
          subtitle={`${summary.total_errors ?? 0} erros`}
          icon={<Sparkles className="w-6 h-6 text-white" />}
          color="from-indigo-500 to-indigo-600"
          delay={0.5}
        />
        <StatCard
          title="Planos Concluídos"
          value={`${summary.completed_plans}/${summary.total_plans}`}
          subtitle="planos de formação"
          icon={<Flame className="w-6 h-6 text-white" />}
          color="from-orange-500 to-orange-600"
          delay={0.6}
        />
        <StatCard
          title="Certificados"
          value={summary.certificates}
          subtitle={`${summary.completed_lessons} lições concluídas`}
          icon={<GraduationCap className="w-6 h-6 text-white" />}
          color="from-teal-500 to-teal-600"
          delay={0.7}
        />
      </div>

      {/* Best Performance & Error Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Best Performance */}
        {best_performance && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              🏆 Melhor Desempenho
            </h3>
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Desafio</p>
                <p className="font-semibold text-gray-800">{best_performance.challenge_title}</p>
              </div>
              <div className="flex justify-center">
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <p className="text-3xl font-bold text-green-600">{(best_performance.mpu ?? 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">MPU (Melhor)</p>
                </div>
              </div>
              {best_performance.date && (
                <p className="text-xs text-gray-400 text-right mt-2">
                  📅 {new Date(best_performance.date).toLocaleDateString('pt-BR')}
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
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Análise de Erros
          </h3>
          {totalErrors === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>Nenhum erro registrado! 🎉</p>
            </div>
          ) : (
            <div>
              <ErrorTypeBar
                label="📐 Metodologia"
                value={errors_by_type.methodology ?? 0}
                total={totalErrors}
                color="bg-purple-500"
              />
              <ErrorTypeBar
                label="💡 Conhecimento"
                value={errors_by_type.knowledge ?? 0}
                total={totalErrors}
                color="bg-blue-500"
              />
              <ErrorTypeBar
                label="🔍 Detalhe"
                value={errors_by_type.detail ?? 0}
                total={totalErrors}
                color="bg-orange-500"
              />
              <ErrorTypeBar
                label="📋 Procedimento"
                value={errors_by_type.procedure ?? 0}
                total={totalErrors}
                color="bg-red-500"
              />
              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-sm text-gray-500">
                  Total: <span className="font-bold text-gray-800">{totalErrors}</span> erros
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Challenge Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-500" />
          Desempenho por Desafio
        </h3>
        {challenges.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
            <p>Nenhum desafio realizado ainda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Desafio</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Tentativas</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Melhor MPU</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">MPU Médio</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((challenge, idx) => (
                  <motion.tr
                    key={challenge.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-800">{challenge.title}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{challenge.attempts}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-green-600 font-medium">
                        {(challenge.best_mpu ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-blue-600">{(challenge.avg_mpu ?? 0).toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          challenge.approvals > 0
                            ? 'bg-green-100 text-green-700'
                            : challenge.attempts > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {challenge.approvals > 0 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> {challenge.approvals} Aprovações
                          </>
                        ) : challenge.attempts > 0 ? (
                          <>
                            <Clock className="w-4 h-4" /> {challenge.attempts} Tentativas
                          </>
                        ) : (
                          'Sem tentativas'
                        )}
                      </span>
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
        className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-500" />
          Atividade Recente
        </h3>
        {recent_activity.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-2" />
            <p>Nenhuma atividade recente</p>
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
                    ? 'bg-green-50 border-green-200'
                    : activity.is_approved === false
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
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
                    <p className="font-medium text-gray-800">{activity.challenge_title}</p>
                    <p className="text-sm text-gray-500">
                      {activity.completed_at ? new Date(activity.completed_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : 'Em análise'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-gray-800">{(activity.calculated_mpu ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">MPU</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800">{activity.errors_count}</p>
                    <p className="text-xs text-gray-400">Erros</p>
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
          className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Evolução Mensal
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {evolution.map((item, idx) => (
              <motion.div
                key={item.date}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + idx * 0.1 }}
                className="bg-white rounded-xl p-4 text-center shadow-sm"
              >
                <p className="text-sm font-medium text-indigo-600 mb-2">{new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                <p className="text-2xl font-bold text-gray-800">{item.submissions}</p>
                <p className="text-xs text-gray-500">submissões</p>
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs">
                    <span className="text-green-600 font-medium">{item.approved}</span> aprovadas
                  </p>
                  <p className="text-xs text-gray-400">
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
