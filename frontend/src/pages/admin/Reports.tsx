import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3, Users, BookOpen, GraduationCap, Target, Clock,
  Award, TrendingUp, Building2, Package, Layers, AlertTriangle,
  CheckCircle, XCircle, Play, Star, Activity,
  FileText, RefreshCw, Eye,
  Zap, Shield
} from 'lucide-react';
import api from '../../lib/axios';
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
  top_trainers: Array<{ id: number; name: string; email: string; courses_created: number; lessons_given?: number; challenges_applied?: number; challenges_reviewed?: number; total_activity?: number }>;
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
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Section Card wrapper ─────────────────────────────
function SectionCard({ title, icon: Icon, children, iconColor = 'text-[#EC0000]' }: {
  title: string;
  icon: any;
  children: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Mini stat row ────────────────────────────────────
function MiniStat({ icon: Icon, label, value, color = 'text-gray-500' }: {
  icon: any; label: string; value: string | number; color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
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
        <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        {/* Error Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#EC0000]" />
              </div>
              <div>
                <span className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000]">{t('insights.badge', 'Insights')}</span>
                <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{t('insights.title', 'Relatórios & Insights')}</h1>
                <p className="font-body text-sm text-gray-500 dark:text-gray-400">{t('insights.subtitle', 'Análise completa da plataforma')}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-8 rounded-2xl text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button onClick={fetchInsights} className="mt-4 px-4 py-2 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-lg transition">
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
    NOT_STARTED: { color: 'bg-gray-500', label: t('insights.notStarted', 'Não Iniciado') },
    RELEASED: { color: 'bg-cyan-500', label: t('insights.released', 'Liberado') },
    IN_PROGRESS: { color: 'bg-blue-500', label: t('insights.inProgress', 'Em Curso') },
    PAUSED: { color: 'bg-amber-500', label: t('insights.paused', 'Pausado') },
    COMPLETED: { color: 'bg-green-500', label: t('insights.completed', 'Concluído') },
  };

  const errorTypeLabels: Record<string, string> = {
    methodology: t('insights.methodology', 'Metodologia'),
    knowledge: t('insights.knowledge', 'Conhecimento'),
    detail: t('insights.detail', 'Detalhe'),
    procedure: t('insights.procedure', 'Procedimento'),
  };

  const errorTypeColors: Record<string, string> = {
    methodology: 'bg-red-500',
    knowledge: 'bg-orange-500',
    detail: 'bg-yellow-500',
    procedure: 'bg-purple-500',
  };

  const difficultyLabels: Record<string, string> = {
    easy: t('insights.easy', 'Fácil'),
    medium: t('insights.medium', 'Médio'),
    hard: t('insights.hard', 'Difícil'),
  };

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-500',
    medium: 'bg-amber-500',
    hard: 'bg-red-500',
  };

  const totalPlansAll = Object.values(data.plan_status).reduce((a, b) => a + b, 0);
  const totalLessonsAll = Object.values(data.lesson_progress.status_distribution).reduce((a, b) => a + b, 0);

  const kpiStats = [
    { icon: Users, label: t('insights.students', 'Formandos'), value: ov.total_students },
    { icon: Shield, label: t('insights.trainers', 'Formadores'), value: ov.total_trainers },
    { icon: BookOpen, label: t('insights.courses', 'Cursos'), value: ov.total_courses },
    { icon: GraduationCap, label: t('insights.plans', 'Planos'), value: ov.total_plans },
    { icon: Target, label: t('insights.challenges', 'Desafios'), value: ov.total_challenges },
    { icon: Award, label: t('insights.certificates', 'Certificados'), value: ov.total_certificates },
    { icon: Clock, label: t('insights.studyHours', 'Horas de Estudo'), value: ov.total_study_hours, suffix: 'h', decimals: 1 },
    { icon: TrendingUp, label: t('insights.completionRate', 'Taxa de Conclusão'), value: ov.completion_rate, suffix: '%', decimals: 1 },
    { icon: CheckCircle, label: t('insights.approvalRate', 'Taxa de Aprovação'), value: ch.approval_rate, suffix: '%', decimals: 1 },
    { icon: Zap, label: t('insights.avgMpu', 'MPU Médio'), value: ch.avg_mpu, decimals: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* ═══════ HEADER + KPI STATS BAR ═══════ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#EC0000]" />
            </div>
            <div>
              <span className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000]">{t('insights.badge', 'Insights')}</span>
              <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{t('insights.title', 'Relatórios & Insights')}</h1>
              <p className="font-body text-sm text-gray-500 dark:text-gray-400">{t('insights.subtitle', 'Análise completa da plataforma')}</p>
            </div>
          </div>
          <button
            onClick={fetchInsights}
            className="flex items-center gap-2 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-sm px-5 py-2.5 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            {t('insights.refresh', 'Atualizar')}
          </button>
        </div>

        {/* KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          {kpiStats.map((stat, i) => {
            const StatIcon = stat.icon;
            const displayValue = stat.decimals != null
              ? Number(stat.value).toFixed(stat.decimals)
              : stat.value;
            return (
              <div key={i} className="flex items-center gap-3">
                <StatIcon className="w-5 h-5 text-[#EC0000] shrink-0" />
                <div className="min-w-0">
                  <p className="font-mono text-lg font-bold text-gray-900 dark:text-white truncate">
                    {displayValue}{stat.suffix ?? ''}
                  </p>
                  <p className="font-body text-xs text-gray-500 dark:text-gray-400 truncate">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════ MAIN GRID ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── Challenge Submissions ─── */}
        <SectionCard title={t('insights.challengeAnalytics', 'Análise de Desafios')} icon={Target} iconColor="text-orange-500">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('insights.approved', 'Aprovados')}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{ch.approved}</span>
              </div>
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('insights.rejected', 'Reprovados')}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{ch.rejected}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('insights.pendingReview', 'Pendentes')}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{ch.pending_review}</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Play className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('insights.inProgressLabel', 'Em Curso')}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{ch.in_progress}</span>
              </div>
            </div>
            {ch.avg_score > 0 && (
              <MiniStat icon={Star} label={t('insights.avgScore', 'MPU Médio')} value={`${ch.avg_score}`} color="text-amber-500" />
            )}
          </div>
        </SectionCard>

        {/* ─── Error Breakdown ─── */}
        <SectionCard title={t('insights.errorAnalysis', 'Análise de Erros')} icon={AlertTriangle} iconColor="text-red-500">
          <div className="space-y-3">
            {data.challenges.error_breakdown.map((err) => (
              <ProgressBar
                key={err.type}
                value={err.count}
                max={Math.max(...data.challenges.error_breakdown.map(e => e.count), 1)}
                color={errorTypeColors[err.type] || 'bg-gray-500'}
                label={errorTypeLabels[err.type] || err.type}
                count={`${err.count} (${err.percentage}%)`}
              />
            ))}
            {data.challenges.error_breakdown.every(e => e.count === 0) && (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('insights.noErrors', 'Sem erros registados')}</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ─── Training Plan Status ─── */}
        <SectionCard title={t('insights.planStatus', 'Estado dos Planos')} icon={GraduationCap} iconColor="text-indigo-500">
          {totalPlansAll === 0 ? (
            <div className="text-center py-6">
              <GraduationCap className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('insights.noPlans', 'Sem planos de formação')}</p>
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
                      <span className="text-sm text-gray-700 dark:text-gray-300">{statusLabels[status] || status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
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
        <SectionCard title={t('insights.lessonProgress', 'Progresso das Aulas')} icon={Layers} iconColor="text-cyan-500">
          {totalLessonsAll === 0 ? (
            <div className="text-center py-6">
              <Layers className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('insights.noLessonProgress', 'Sem registos de progresso')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.lesson_progress.status_distribution).map(([status, count]) => {
                const cfg = lessonStatusConfig[status] || { color: 'bg-gray-500', label: status };
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
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <MiniStat icon={Zap} label={t('insights.avgLessonMpu', 'MPU Médio das Aulas')} value={data.lesson_progress.avg_mpu} color="text-pink-500" />
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* ─── Products / Services ─── */}
        <SectionCard title={t('insights.serviceDistribution', 'Distribuição por Serviço')} icon={Package} iconColor="text-orange-500">
          {data.products.length === 0 ? (
            <div className="text-center py-6">
              <Package className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('insights.noProducts', 'Sem serviços')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.products.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {getTranslatedProductName(t, p.code, p.name)}
                    </span>
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{p.code}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t('insights.courses', 'Cursos')}</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{p.total_courses}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t('insights.plans', 'Planos')}</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{p.total_plans}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ─── Banks ─── */}
        <SectionCard title={t('insights.bankDistribution', 'Distribuição por Banco')} icon={Building2} iconColor="text-blue-500">
          {data.banks.length === 0 ? (
            <div className="text-center py-6">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('insights.noBanks', 'Sem bancos')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.banks.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{b.name}</span>
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{b.code}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t('insights.courses', 'Cursos')}</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{b.total_courses}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t('insights.plans', 'Planos')}</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{b.total_plans}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ─── Challenge Difficulty Distribution ─── */}
        <SectionCard title={t('insights.difficultyDistribution', 'Dificuldade dos Desafios')} icon={Activity} iconColor="text-pink-500">
          <div className="space-y-3">
            {Object.entries(ch.difficulty_distribution).map(([diff, count]) => (
              <ProgressBar
                key={diff}
                value={count}
                max={Math.max(...Object.values(ch.difficulty_distribution), 1)}
                color={difficultyColors[diff] || 'bg-gray-500'}
                label={difficultyLabels[diff] || diff}
              />
            ))}
            {Object.values(ch.difficulty_distribution).every(v => v === 0) && (
              <div className="text-center py-4">
                <Target className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('insights.noChallenges', 'Sem desafios')}</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ─── Ratings ─── */}
        <SectionCard title={t('insights.ratingsOverview', 'Avaliações')} icon={Star} iconColor="text-amber-500">
          {data.ratings.total === 0 ? (
            <div className="text-center py-6">
              <Star className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('insights.noRatings', 'Sem avaliações')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{data.ratings.average}</span>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-5 h-5 ${i <= Math.round(data.ratings.average) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                  </div>
                  <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">{data.ratings.total} {t('insights.totalRatings', 'avaliações')}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">{typeLabels[type] || type}</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{info.average}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">({info.count})</span>
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
      <SectionCard title={t('insights.monthlyTrends', 'Tendências Mensais (6 meses)')} icon={TrendingUp} iconColor="text-[#EC0000]">
        {data.monthly_trends.every(m => m.enrollments === 0 && m.submissions === 0 && m.completions === 0 && m.new_students === 0) ? (
          <div className="text-center py-8">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('insights.noTrendData', 'Sem dados suficientes para tendências')}</p>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5"><StatusDot color="bg-blue-500" /><span className="text-xs text-gray-600 dark:text-gray-400">{t('insights.enrollments', 'Inscrições')}</span></div>
              <div className="flex items-center gap-1.5"><StatusDot color="bg-orange-500" /><span className="text-xs text-gray-600 dark:text-gray-400">{t('insights.submissions', 'Submissões')}</span></div>
              <div className="flex items-center gap-1.5"><StatusDot color="bg-green-500" /><span className="text-xs text-gray-600 dark:text-gray-400">{t('insights.completions', 'Conclusões')}</span></div>
              <div className="flex items-center gap-1.5"><StatusDot color="bg-purple-500" /><span className="text-xs text-gray-600 dark:text-gray-400">{t('insights.newStudents', 'Novos Formandos')}</span></div>
              <div className="flex items-center gap-1.5"><StatusDot color="bg-amber-500" /><span className="text-xs text-gray-600 dark:text-gray-400">{t('insights.certificates', 'Certificados')}</span></div>
            </div>
            {/* Chart */}
            <div className="grid grid-cols-6 gap-3">
              {data.monthly_trends.map((m) => (
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
                      <div
                        key={j}
                        className={`w-2 ${bar.color} rounded-t-sm transition-all duration-700 ease-out`}
                        style={{ height: maxTrend > 0 ? `${Math.max((bar.value / maxTrend) * 100, bar.value > 0 ? 8 : 2)}%` : '2%' }}
                        title={`${bar.value}`}
                      />
                    ))}
                  </div>
                  {/* Label */}
                  <p className="text-xs text-center font-medium text-gray-400 dark:text-gray-500">{m.month_label}</p>
                </div>
              ))}
            </div>
            {/* Summary table */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400">
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
                      <tr key={m.month} className="border-t border-gray-50 dark:border-gray-800">
                        <td className="py-1.5 font-medium text-gray-700 dark:text-gray-300">{m.month_label}</td>
                        <td className="py-1.5 text-right text-gray-900 dark:text-white">{m.enrollments}</td>
                        <td className="py-1.5 text-right text-gray-900 dark:text-white">{m.submissions}</td>
                        <td className="py-1.5 text-right text-gray-900 dark:text-white">{m.completions}</td>
                        <td className="py-1.5 text-right text-gray-900 dark:text-white">{m.new_students}</td>
                        <td className="py-1.5 text-right text-gray-900 dark:text-white">{m.certificates}</td>
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
        <SectionCard title={t('insights.topStudents', 'Top Formandos')} icon={Users} iconColor="text-blue-500">
          {data.top_students.length === 0 ? (
            <div className="text-center py-6">
              <Users className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('insights.noStudentData', 'Sem dados de formandos')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.top_students.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{s.name}</p>
                    <p className="text-xs truncate text-gray-400 dark:text-gray-500">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{s.completed_lessons}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{t('insights.lessonsShort', 'aulas')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Top Trainers */}
        <SectionCard title={t('insights.topTrainers', 'Top Formadores')} icon={Shield} iconColor="text-emerald-500">
          {data.top_trainers.length === 0 ? (
            <div className="text-center py-6">
              <Shield className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('insights.noTrainerData', 'Sem dados de formadores')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.top_trainers.map((tr, i) => (
                <div key={tr.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{tr.name}</p>
                    <p className="text-xs truncate text-gray-400 dark:text-gray-500">{tr.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {(tr.lessons_given ?? 0) > 0 && (
                      <div className="flex items-center gap-1" title={t('insights.lessonsGiven', 'Aulas dadas')}>
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{tr.lessons_given}</span>
                      </div>
                    )}
                    {(tr.challenges_applied ?? 0) > 0 && (
                      <div className="flex items-center gap-1" title={t('insights.challengesApplied', 'Desafios aplicados')}>
                        <Target className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{tr.challenges_applied}</span>
                      </div>
                    )}
                    {(tr.challenges_reviewed ?? 0) > 0 && (
                      <div className="flex items-center gap-1" title={t('insights.challengesReviewed', 'Desafios corrigidos')}>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{tr.challenges_reviewed}</span>
                      </div>
                    )}
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{tr.total_activity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ═══════ FOOTER ═══════ */}
      <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-600">
        {t('insights.generatedAt', 'Relatório gerado em')} {new Date(data.generated_at).toLocaleString('pt-PT')}
      </div>
    </div>
  );
}
