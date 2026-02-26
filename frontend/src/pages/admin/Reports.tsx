import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, BookOpen, GraduationCap, Target, Clock,
  Award, TrendingUp, Building2, Package, Layers, AlertTriangle,
  CheckCircle, XCircle, Play, Star, Activity,
  FileText, RefreshCw, Eye,
  Zap, Shield
} from 'lucide-react';
import api from '../../lib/axios';
import { PremiumHeader, AnimatedStatCard } from '../../components/premium';
import { useTheme } from '../../contexts/ThemeContext';
import { getTranslatedProductName } from '../../utils/productTranslation';

// ─── Types ────────────────────────────────────────────
interface InsightsData {
  generated_at: string;
  overview: {
    total_students: number;
    total_trainers: number;
    pending_trainers: number;
    total_courses: number;
    total_lessons: number;
    total_plans: number;
    active_plans: number;
    total_enrollments: number;
    total_certificates: number;
    total_challenges: number;
    total_banks: number;
    total_products: number;
    total_study_hours: number;
    completion_rate: number;
  };
  challenges: {
    total_submissions: number;
    approved: number;
    rejected: number;
    pending_review: number;
    in_progress: number;
    approval_rate: number;
    avg_mpu: number;
    avg_score: number;
    error_breakdown: Array<{ type: string; count: number; percentage: number }>;
    difficulty_distribution: Record<string, number>;
  };
  products: Array<{ id: number; code: string; name: string; total_courses: number; total_plans: number }>;
  banks: Array<{ id: number; code: string; name: string; country: string; total_courses: number; total_plans: number }>;
  plan_status: Record<string, number>;
  lesson_progress: {
    status_distribution: Record<string, number>;
    avg_mpu: number;
  };
  top_students: Array<{ id: number; name: string; email: string; completed_lessons: number }>;
  top_trainers: Array<{ id: number; name: string; email: string; courses_created: number }>;
  monthly_trends: Array<{
    month: string;
    month_label: string;
    enrollments: number;
    submissions: number;
    completions: number;
    new_students: number;
    certificates: number;
  }>;
  ratings: {
    average: number;
    total: number;
    by_type: Record<string, { average: number; count: number }>;
  };
}

// ─── Animated bar for charts ──────────────────────────
function ProgressBar({ value, max, color, label, count }: { value: number; max: number; color: string; label: string; count?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">{count ?? value}</span>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
    </div>
  );
}

// ─── Section Card wrapper ─────────────────────────────
function SectionCard({ title, icon: Icon, children, iconColor = 'text-indigo-500', delay = 0 }: {
  title: string;
  icon: any;
  children: React.ReactNode;
  iconColor?: string;
  delay?: number;
}) {
  const { isDark } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl rounded-2xl border p-6 shadow-sm`}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

// ─── Mini stat row ────────────────────────────────────
function MiniStat({ icon: Icon, label, value, color = 'text-gray-500' }: {
  icon: any; label: string; value: string | number; color?: string;
}) {
  const { isDark } = useTheme();
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      </div>
      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────
function StatusDot({ color }: { color: string }) {
  return <span className={`inline-block w-3 h-3 rounded-full ${color}`} />;
}

// ═══════════════ MAIN COMPONENT ═══════════════
export default function Reports() {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/admin/reports/insights');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(t('insights.errorLoading', 'Erro ao carregar relatórios'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PremiumHeader icon={BarChart3} title={t('insights.title', 'Relatórios & Insights')} subtitle={t('insights.subtitle', 'Análise completa da plataforma')} badge={t('insights.badge', 'Insights')} iconColor="from-violet-500 to-purple-700" />
        <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-white/5' : 'bg-white'} border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{error}</p>
          <button onClick={fetchInsights} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            <RefreshCw className="w-4 h-4 inline mr-2" />{t('common.retry', 'Tentar novamente')}
          </button>
        </div>
      </div>
    );
  }

  const ov = data.overview;
  const ch = data.challenges;
  const maxTrend = Math.max(...data.monthly_trends.map(m => Math.max(m.enrollments, m.submissions, m.completions, m.new_students)), 1);

  // ─── Plan status colors ──────────
  const planStatusConfig: Record<string, { color: string; bg: string; icon: any }> = {
    PENDING: { color: 'text-amber-500', bg: 'bg-amber-500', icon: Clock },
    IN_PROGRESS: { color: 'text-blue-500', bg: 'bg-blue-500', icon: Play },
    COMPLETED: { color: 'text-green-500', bg: 'bg-green-500', icon: CheckCircle },
    DELAYED: { color: 'text-red-500', bg: 'bg-red-500', icon: AlertTriangle },
  };

  const lessonStatusConfig: Record<string, { color: string; label: string }> = {
    NOT_STARTED: { color: 'from-gray-400 to-gray-500', label: t('insights.notStarted', 'Não Iniciado') },
    RELEASED: { color: 'from-cyan-400 to-cyan-600', label: t('insights.released', 'Liberado') },
    IN_PROGRESS: { color: 'from-blue-400 to-blue-600', label: t('insights.inProgress', 'Em Curso') },
    PAUSED: { color: 'from-amber-400 to-amber-600', label: t('insights.paused', 'Pausado') },
    COMPLETED: { color: 'from-green-400 to-green-600', label: t('insights.completed', 'Concluído') },
  };

  const errorTypeLabels: Record<string, string> = {
    methodology: t('insights.methodology', 'Metodologia'),
    knowledge: t('insights.knowledge', 'Conhecimento'),
    detail: t('insights.detail', 'Detalhe'),
    procedure: t('insights.procedure', 'Procedimento'),
  };

  const errorTypeColors: Record<string, string> = {
    methodology: 'from-red-400 to-red-600',
    knowledge: 'from-orange-400 to-orange-600',
    detail: 'from-yellow-400 to-yellow-600',
    procedure: 'from-purple-400 to-purple-600',
  };

  const difficultyLabels: Record<string, string> = {
    easy: t('insights.easy', 'Fácil'),
    medium: t('insights.medium', 'Médio'),
    hard: t('insights.hard', 'Difícil'),
  };

  const difficultyColors: Record<string, string> = {
    easy: 'from-green-400 to-green-600',
    medium: 'from-amber-400 to-amber-600',
    hard: 'from-red-400 to-red-600',
  };

  const totalPlansAll = Object.values(data.plan_status).reduce((a, b) => a + b, 0);
  const totalLessonsAll = Object.values(data.lesson_progress.status_distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* ═══════ HEADER ═══════ */}
      <PremiumHeader
        icon={BarChart3}
        title={t('insights.title', 'Relatórios & Insights')}
        subtitle={t('insights.subtitle', 'Análise completa da plataforma')}
        badge={t('insights.badge', 'Insights')}
        iconColor="from-violet-500 to-purple-700"
        actions={
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={fetchInsights}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            {t('insights.refresh', 'Atualizar')}
          </motion.button>
        }
      />

      {/* ═══════ TOP KPI CARDS ═══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <AnimatedStatCard icon={Users} label={t('insights.students', 'Formandos')} value={ov.total_students} color="from-blue-500 to-blue-700" delay={0} />
        <AnimatedStatCard icon={Shield} label={t('insights.trainers', 'Formadores')} value={ov.total_trainers} color="from-emerald-500 to-emerald-700" delay={0.05} />
        <AnimatedStatCard icon={BookOpen} label={t('insights.courses', 'Cursos')} value={ov.total_courses} color="from-purple-500 to-purple-700" delay={0.1} />
        <AnimatedStatCard icon={GraduationCap} label={t('insights.plans', 'Planos')} value={ov.total_plans} color="from-indigo-500 to-indigo-700" delay={0.15} />
        <AnimatedStatCard icon={Target} label={t('insights.challenges', 'Desafios')} value={ov.total_challenges} color="from-orange-500 to-red-600" delay={0.2} />
        <AnimatedStatCard icon={Award} label={t('insights.certificates', 'Certificados')} value={ov.total_certificates} color="from-amber-500 to-yellow-600" delay={0.25} />
      </div>

      {/* ═══════ SECOND ROW KPIs ═══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatedStatCard icon={Clock} label={t('insights.studyHours', 'Horas de Estudo')} value={ov.total_study_hours} suffix="h" color="from-cyan-500 to-cyan-700" delay={0.3} decimals={1} />
        <AnimatedStatCard icon={TrendingUp} label={t('insights.completionRate', 'Taxa de Conclusão')} value={ov.completion_rate} suffix="%" color="from-green-500 to-emerald-600" delay={0.35} decimals={1} />
        <AnimatedStatCard icon={CheckCircle} label={t('insights.approvalRate', 'Taxa de Aprovação')} value={ch.approval_rate} suffix="%" color="from-teal-500 to-teal-700" delay={0.4} decimals={1} />
        <AnimatedStatCard icon={Zap} label={t('insights.avgMpu', 'MPU Médio')} value={ch.avg_mpu} color="from-pink-500 to-rose-600" delay={0.45} decimals={2} />
      </div>

      {/* ═══════ MAIN GRID ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── Challenge Submissions ─── */}
        <SectionCard title={t('insights.challengeAnalytics', 'Análise de Desafios')} icon={Target} iconColor="text-orange-500" delay={0.1}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('insights.approved', 'Aprovados')}</span>
                </div>
                <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{ch.approved}</span>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('insights.rejected', 'Reprovados')}</span>
                </div>
                <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{ch.rejected}</span>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-amber-500" />
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('insights.pendingReview', 'Pendentes')}</span>
                </div>
                <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{ch.pending_review}</span>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Play className="w-4 h-4 text-blue-500" />
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('insights.inProgressLabel', 'Em Curso')}</span>
                </div>
                <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{ch.in_progress}</span>
              </div>
            </div>
            {ch.avg_score > 0 && (
              <MiniStat icon={Star} label={t('insights.avgScore', 'MPU Médio')} value={`${ch.avg_score}`} color="text-amber-500" />
            )}
          </div>
        </SectionCard>

        {/* ─── Error Breakdown ─── */}
        <SectionCard title={t('insights.errorAnalysis', 'Análise de Erros')} icon={AlertTriangle} iconColor="text-red-500" delay={0.15}>
          <div className="space-y-3">
            {data.challenges.error_breakdown.map((err) => (
              <ProgressBar
                key={err.type}
                value={err.count}
                max={Math.max(...data.challenges.error_breakdown.map(e => e.count), 1)}
                color={errorTypeColors[err.type] || 'from-gray-400 to-gray-600'}
                label={errorTypeLabels[err.type] || err.type}
                count={`${err.count} (${err.percentage}%)`}
              />
            ))}
            {data.challenges.error_breakdown.every(e => e.count === 0) && (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('insights.noErrors', 'Sem erros registados')}</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ─── Training Plan Status ─── */}
        <SectionCard title={t('insights.planStatus', 'Estado dos Planos')} icon={GraduationCap} iconColor="text-indigo-500" delay={0.2}>
          {totalPlansAll === 0 ? (
            <div className="text-center py-6">
              <GraduationCap className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('insights.noPlans', 'Sem planos de formação')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.plan_status).map(([status, count]) => {
                const cfg = planStatusConfig[status] || { color: 'text-gray-500', bg: 'bg-gray-500', icon: FileText };
                const statusLabels: Record<string, string> = {
                  PENDING: t('insights.pending', 'Pendente'),
                  IN_PROGRESS: t('insights.inProgress', 'Em Curso'),
                  COMPLETED: t('insights.completed', 'Concluído'),
                  DELAYED: t('insights.delayed', 'Atrasado'),
                };
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusDot color={cfg.bg} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{statusLabels[status] || status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{count}</span>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        ({totalPlansAll > 0 ? Math.round((count / totalPlansAll) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ─── Lesson Progress ─── */}
        <SectionCard title={t('insights.lessonProgress', 'Progresso das Aulas')} icon={Layers} iconColor="text-cyan-500" delay={0.25}>
          {totalLessonsAll === 0 ? (
            <div className="text-center py-6">
              <Layers className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('insights.noLessonProgress', 'Sem registos de progresso')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.lesson_progress.status_distribution).map(([status, count]) => {
                const cfg = lessonStatusConfig[status] || { color: 'from-gray-400 to-gray-500', label: status };
                return (
                  <ProgressBar
                    key={status}
                    value={count}
                    max={Math.max(...Object.values(data.lesson_progress.status_distribution), 1)}
                    color={cfg.color}
                    label={cfg.label}
                    count={`${count} (${totalLessonsAll > 0 ? Math.round((count / totalLessonsAll) * 100) : 0}%)`}
                  />
                );
              })}
              {data.lesson_progress.avg_mpu > 0 && (
                <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <MiniStat icon={Zap} label={t('insights.avgLessonMpu', 'MPU Médio das Aulas')} value={data.lesson_progress.avg_mpu} color="text-pink-500" />
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* ─── Products / Services ─── */}
        <SectionCard title={t('insights.serviceDistribution', 'Distribuição por Serviço')} icon={Package} iconColor="text-orange-500" delay={0.3}>
          {data.products.length === 0 ? (
            <div className="text-center py-6">
              <Package className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('insights.noProducts', 'Sem serviços')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.products.map((p) => (
                <div key={p.id} className={`flex items-center justify-between py-2 px-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div>
                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {getTranslatedProductName(t, p.code, p.name)}
                    </span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>{p.code}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('insights.courses', 'Cursos')}</span>
                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.total_courses}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('insights.plans', 'Planos')}</span>
                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.total_plans}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ─── Banks ─── */}
        <SectionCard title={t('insights.bankDistribution', 'Distribuição por Banco')} icon={Building2} iconColor="text-blue-500" delay={0.35}>
          {data.banks.length === 0 ? (
            <div className="text-center py-6">
              <Building2 className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('insights.noBanks', 'Sem bancos')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.banks.map((b) => (
                <div key={b.id} className={`flex items-center justify-between py-2 px-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div>
                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{b.name}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>{b.code}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('insights.courses', 'Cursos')}</span>
                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{b.total_courses}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('insights.plans', 'Planos')}</span>
                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{b.total_plans}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ─── Challenge Difficulty Distribution ─── */}
        <SectionCard title={t('insights.difficultyDistribution', 'Dificuldade dos Desafios')} icon={Activity} iconColor="text-pink-500" delay={0.4}>
          <div className="space-y-3">
            {Object.entries(ch.difficulty_distribution).map(([diff, count]) => (
              <ProgressBar
                key={diff}
                value={count}
                max={Math.max(...Object.values(ch.difficulty_distribution), 1)}
                color={difficultyColors[diff] || 'from-gray-400 to-gray-600'}
                label={difficultyLabels[diff] || diff}
              />
            ))}
            {Object.values(ch.difficulty_distribution).every(v => v === 0) && (
              <div className="text-center py-4">
                <Target className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('insights.noChallenges', 'Sem desafios')}</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ─── Ratings ─── */}
        <SectionCard title={t('insights.ratingsOverview', 'Avaliações')} icon={Star} iconColor="text-amber-500" delay={0.45}>
          {data.ratings.total === 0 ? (
            <div className="text-center py-6">
              <Star className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('insights.noRatings', 'Sem avaliações')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.ratings.average}</span>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-5 h-5 ${i <= Math.round(data.ratings.average) ? 'text-amber-400 fill-amber-400' : isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{data.ratings.total} {t('insights.totalRatings', 'avaliações')}</p>
                </div>
              </div>
              <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-100'} pt-3 space-y-2`}>
                {Object.entries(data.ratings.by_type).map(([type, info]) => {
                  const typeLabels: Record<string, string> = {
                    course: t('insights.courses', 'Cursos'),
                    lesson: t('insights.lessons', 'Aulas'),
                    challenge: t('insights.challenges', 'Desafios'),
                    trainer: t('insights.trainers', 'Formadores'),
                    training_plan: t('insights.plans', 'Planos'),
                  };
                  if (info.count === 0) return null;
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{typeLabels[type] || type}</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{info.average}</span>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({info.count})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ═══════ MONTHLY TRENDS (Full width) ═══════ */}
      <SectionCard title={t('insights.monthlyTrends', 'Tendências Mensais (6 meses)')} icon={TrendingUp} iconColor="text-violet-500" delay={0.5}>
        {data.monthly_trends.every(m => m.enrollments === 0 && m.submissions === 0 && m.completions === 0 && m.new_students === 0) ? (
          <div className="text-center py-8">
            <TrendingUp className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('insights.noTrendData', 'Sem dados suficientes para tendências')}</p>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5"><StatusDot color="bg-blue-500" /><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('insights.enrollments', 'Inscrições')}</span></div>
              <div className="flex items-center gap-1.5"><StatusDot color="bg-orange-500" /><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('insights.submissions', 'Submissões')}</span></div>
              <div className="flex items-center gap-1.5"><StatusDot color="bg-green-500" /><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('insights.completions', 'Conclusões')}</span></div>
              <div className="flex items-center gap-1.5"><StatusDot color="bg-purple-500" /><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('insights.newStudents', 'Novos Formandos')}</span></div>
              <div className="flex items-center gap-1.5"><StatusDot color="bg-amber-500" /><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('insights.certificates', 'Certificados')}</span></div>
            </div>
            {/* Chart */}
            <div className="grid grid-cols-6 gap-3">
              {data.monthly_trends.map((m, i) => (
                <div key={m.month} className="space-y-2">
                  {/* Bars */}
                  <div className="flex items-end justify-center gap-1 h-32">
                    {[
                      { value: m.enrollments, color: 'bg-blue-500' },
                      { value: m.submissions, color: 'bg-orange-500' },
                      { value: m.completions, color: 'bg-green-500' },
                      { value: m.new_students, color: 'bg-purple-500' },
                      { value: m.certificates, color: 'bg-amber-500' },
                    ].map((bar, j) => (
                      <motion.div
                        key={j}
                        initial={{ height: 0 }}
                        animate={{ height: maxTrend > 0 ? `${Math.max((bar.value / maxTrend) * 100, bar.value > 0 ? 8 : 2)}%` : '2%' }}
                        transition={{ duration: 0.8, delay: i * 0.05 + j * 0.02 }}
                        className={`w-2 ${bar.color} rounded-t-sm`}
                        title={`${bar.value}`}
                      />
                    ))}
                  </div>
                  {/* Label */}
                  <p className={`text-xs text-center font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{m.month_label}</p>
                </div>
              ))}
            </div>
            {/* Summary table */}
            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      <th className="text-left py-1 font-medium">{t('insights.month', 'Mês')}</th>
                      <th className="text-right py-1 font-medium">{t('insights.enrollments', 'Inscrições')}</th>
                      <th className="text-right py-1 font-medium">{t('insights.submissions', 'Submissões')}</th>
                      <th className="text-right py-1 font-medium">{t('insights.completions', 'Conclusões')}</th>
                      <th className="text-right py-1 font-medium">{t('insights.newStudents', 'Novos Formandos')}</th>
                      <th className="text-right py-1 font-medium">{t('insights.certificates', 'Certificados')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthly_trends.map(m => (
                      <tr key={m.month} className={`border-t ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                        <td className={`py-1.5 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{m.month_label}</td>
                        <td className={`py-1.5 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.enrollments}</td>
                        <td className={`py-1.5 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.submissions}</td>
                        <td className={`py-1.5 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.completions}</td>
                        <td className={`py-1.5 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.new_students}</td>
                        <td className={`py-1.5 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.certificates}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      {/* ═══════ TOP PERFORMERS (Full width, 2 cols) ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Students */}
        <SectionCard title={t('insights.topStudents', 'Top Formandos')} icon={Users} iconColor="text-blue-500" delay={0.55}>
          {data.top_students.length === 0 ? (
            <div className="text-center py-6">
              <Users className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('insights.noStudentData', 'Sem dados de formandos')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.top_students.map((s, i) => (
                <div key={s.id} className={`flex items-center gap-3 py-2.5 px-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-600 text-white' : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.name}</p>
                    <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.completed_lessons}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('insights.lessonsShort', 'aulas')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Top Trainers */}
        <SectionCard title={t('insights.topTrainers', 'Top Formadores')} icon={Shield} iconColor="text-emerald-500" delay={0.6}>
          {data.top_trainers.length === 0 ? (
            <div className="text-center py-6">
              <Shield className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('insights.noTrainerData', 'Sem dados de formadores')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.top_trainers.map((tr, i) => (
                <div key={tr.id} className={`flex items-center gap-3 py-2.5 px-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-600 text-white' : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{tr.name}</p>
                    <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{tr.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {tr.lessons_given > 0 && (
                      <div className="flex items-center gap-1" title={t('insights.lessonsGiven', 'Aulas dadas')}>
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        <span className={`text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{tr.lessons_given}</span>
                      </div>
                    )}
                    {tr.challenges_applied > 0 && (
                      <div className="flex items-center gap-1" title={t('insights.challengesApplied', 'Desafios aplicados')}>
                        <Target className="w-3.5 h-3.5 text-purple-500" />
                        <span className={`text-xs font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{tr.challenges_applied}</span>
                      </div>
                    )}
                    {tr.challenges_reviewed > 0 && (
                      <div className="flex items-center gap-1" title={t('insights.challengesReviewed', 'Desafios corrigidos')}>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{tr.challenges_reviewed}</span>
                      </div>
                    )}
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tr.total_activity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ═══════ FOOTER ═══════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className={`text-center py-4 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
      >
        {t('insights.generatedAt', 'Relatório gerado em')} {new Date(data.generated_at).toLocaleString('pt-PT')}
      </motion.div>
    </div>
  );
}
