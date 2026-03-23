import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, GraduationCap, UserCheck,
  Target, Clock, CheckCircle, XCircle,
  Calendar, Award, BarChart3, FileText, AlertCircle,
  ArrowRight, TrendingUp, Layers, ShieldCheck, Activity,
  Building2, Package,
} from 'lucide-react';
import api from '../../lib/axios';

interface ActivePlan {
  id: number;
  title: string;
  student_name: string;
  trainer_name: string;
  days_remaining: number;
  total_courses: number;
}

interface RecentSubmission {
  id: number;
  challenge_title: string;
  student_name: string;
  is_approved: boolean;
  calculated_mpu: number;
  submitted_at: string;
}

interface DashboardSummary {
  active_students_30d: number;
  total_enrollments: number;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalTrainers: 0,
    totalStudents: 0,
    activePlans: 0,
    pendingTrainers: 0,
    totalChallenges: 0,
    totalSubmissions: 0,
    approvedSubmissions: 0,
    approvalRate: 0,
    avgMpu: 0,
    submissionsThisMonth: 0,
    totalBanks: 0,
    totalProducts: 0,
    totalLessons: 0,
    totalCertificates: 0,
    totalStudyHours: 0,
    activeStudents: 0,
  });

  const [extStats, setExtStats] = useState<DashboardSummary>({
    active_students_30d: 0,
    total_enrollments: 0,
  });

  const [activePlans, setActivePlans] = useState<ActivePlan[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResp, statsResp, plansResp] = await Promise.all([
          api.get('/api/admin/users?page=1&page_size=1'),
          api.get('/api/admin/reports/stats'),
          api.get('/api/training-plans/'),
        ]);

        const usersTotal = usersResp.data?.total ?? 0;
        const statsData = statsResp.data ?? {};
        const plans = plansResp.data ?? [];

        const activePlansData = plans.filter((p: any) => {
          const status = p.status?.toUpperCase() ?? '';
          if (status === 'COMPLETED') return false;
          if (p.is_active === false) return false;
          return true;
        });

        setStats({
          totalUsers: usersTotal,
          totalCourses: statsData.total_courses ?? 0,
          totalTrainers: statsData.total_trainers ?? 0,
          totalStudents: statsData.total_students ?? 0,
          activePlans: activePlansData.length,
          pendingTrainers: statsData.pending_trainers ?? 0,
          totalChallenges: statsData.total_challenges ?? 0,
          totalSubmissions: statsData.total_submissions ?? 0,
          approvedSubmissions: statsData.approved_submissions ?? 0,
          approvalRate: statsData.approval_rate ?? 0,
          avgMpu: statsData.avg_mpu ?? 0,
          submissionsThisMonth: statsData.submissions_this_month ?? 0,
          totalBanks: statsData.total_banks ?? 0,
          totalProducts: statsData.total_products ?? 0,
          totalLessons: statsData.total_lessons ?? 0,
          totalCertificates: statsData.total_certificates ?? 0,
          totalStudyHours: statsData.total_study_hours ?? 0,
          activeStudents: statsData.active_students ?? 0,
        });

        setRecentSubmissions(statsData.recent_submissions ?? []);

        setActivePlans(activePlansData.slice(0, 5).map((p: any) => ({
          id: p.id,
          title: p.title,
          student_name: p.student?.full_name ?? t('adminDashboard.notAssigned'),
          trainer_name: p.trainer?.full_name ?? t('adminDashboard.notAssigned'),
          days_remaining: p.end_date
            ? Math.max(0, Math.ceil((new Date(p.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
            : 0,
          total_courses: p.total_courses ?? 0,
        })));

        try {
          const extResp = await api.get('/api/admin/advanced-reports/dashboard-summary');
          setExtStats({
            active_students_30d: extResp.data?.active_students_30d ?? 0,
            total_enrollments: extResp.data?.total_enrollments ?? 0,
          });
        } catch {
          // extended stats are optional
        }

      } catch (e) {
        console.error('Error fetching admin stats:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const studentsPerTrainer =
    stats.totalTrainers > 0 ? (stats.totalStudents / stats.totalTrainers).toFixed(1) : '—';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-32" />
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-72" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-96" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-56 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Header ──────────────────────────────────────────── */}
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
            {t('adminDashboard.controlPanel')}
          </p>
          <h1 className="font-headline text-3xl font-bold text-gray-900 dark:text-white">
            {t('adminDashboard.portalAdmin')}
          </h1>
          <p className="font-body text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            {t('adminDashboard.subtitleInsights')}
          </p>
        </div>

        {/* ── Pending Alert ────────────────────────────────────── */}
        {stats.pendingTrainers > 0 && (
          <button
            role="alert"
            aria-label={t('adminDashboard.trainersAwaitingValidation')}
            onClick={() => navigate('/trainer-validation')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-l-4 border-l-amber-500 border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body font-bold text-gray-900 dark:text-white text-sm">
                {t('adminDashboard.trainersAwaitingValidation')}
              </p>
              <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                {t('adminDashboard.trainersAwaitingApproval', { count: stats.pendingTrainers })}
              </p>
            </div>
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white font-body text-sm font-bold shrink-0">
              {t('adminDashboard.validateNow')}
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        )}

        {/* ── Platform KPIs ────────────────────────────────────── */}
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            {t('adminDashboard.platformOverview')}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, label: t('adminDashboard.totalUsers'), value: stats.totalUsers, color: 'text-gray-700 dark:text-gray-300' },
              { icon: GraduationCap, label: t('adminDashboard.activeStudents'), value: stats.totalStudents, color: 'text-blue-600 dark:text-blue-400' },
              { icon: UserCheck, label: t('adminDashboard.trainers'), value: stats.totalTrainers, color: 'text-emerald-600 dark:text-emerald-400' },
              { icon: BookOpen, label: t('adminDashboard.availableCourses'), value: stats.totalCourses, color: 'text-purple-600 dark:text-purple-400' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  <span className="font-body text-xs text-gray-500 dark:text-gray-400">{kpi.label}</span>
                </div>
                <p className="font-mono text-3xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Role Insights ─────────────────────────────────────── */}
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            {t('adminDashboard.insightsByRole')}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* FORMANDOS */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 border-l-4 border-l-blue-500">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="font-headline text-base font-bold text-gray-900 dark:text-white">
                    {t('adminDashboard.roleTrainees')}
                  </h2>
                  <p className="font-body text-[11px] text-gray-400 dark:text-gray-500">
                    {t('adminDashboard.roleTraineesDesc')}
                  </p>
                </div>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <InsightMetric
                  label={t('adminDashboard.activePlans')}
                  value={stats.activePlans}
                  icon={<Calendar className="w-4 h-4 text-blue-500" />}
                />
                <InsightMetric
                  label={t('adminDashboard.certificates')}
                  value={stats.totalCertificates}
                  icon={<Award className="w-4 h-4 text-blue-500" />}
                />
                <InsightMetric
                  label={t('adminDashboard.approval')}
                  value={`${stats.approvalRate}%`}
                  icon={<CheckCircle className="w-4 h-4 text-blue-500" />}
                  highlight={stats.approvalRate >= 80}
                />
                <InsightMetric
                  label={t('adminDashboard.active30d')}
                  value={extStats.active_students_30d || stats.activeStudents}
                  icon={<Activity className="w-4 h-4 text-blue-500" />}
                />
                <InsightMetric
                  label={t('adminDashboard.avgMpu')}
                  value={stats.avgMpu}
                  icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
                />
                <InsightMetric
                  label={t('adminDashboard.studyHours')}
                  value={`${stats.totalStudyHours.toFixed(0)}h`}
                  icon={<Clock className="w-4 h-4 text-blue-500" />}
                />
              </div>
              <div className="px-5 pb-4">
                <button
                  onClick={() => navigate('/training-plans')}
                  className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-body font-bold cursor-pointer"
                >
                  {t('adminDashboard.viewPlans')} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* FORMADORES */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 border-l-4 border-l-emerald-500">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-headline text-base font-bold text-gray-900 dark:text-white">
                    {t('adminDashboard.roleTrainers')}
                  </h2>
                  <p className="font-body text-[11px] text-gray-400 dark:text-gray-500">
                    {t('adminDashboard.roleTrainersDesc')}
                  </p>
                </div>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <InsightMetric
                  label={t('adminDashboard.trainersActive')}
                  value={stats.totalTrainers}
                  icon={<UserCheck className="w-4 h-4 text-emerald-500" />}
                />
                <InsightMetric
                  label={t('adminDashboard.pending')}
                  value={stats.pendingTrainers}
                  icon={<Clock className="w-4 h-4 text-amber-500" />}
                  alert={stats.pendingTrainers > 0}
                />
                <InsightMetric
                  label={t('adminDashboard.studentsPerTrainer')}
                  value={studentsPerTrainer}
                  icon={<Users className="w-4 h-4 text-emerald-500" />}
                />
                <InsightMetric
                  label={t('adminDashboard.reviewsThisMonth')}
                  value={stats.submissionsThisMonth}
                  icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
                />
              </div>
              <div className="px-5 pb-4">
                <button
                  onClick={() => navigate('/trainer-validation')}
                  className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-body font-bold cursor-pointer"
                >
                  {t('adminDashboard.validateTrainers')} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CONTEÚDO */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 border-l-4 border-l-purple-500">
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="font-headline text-base font-bold text-gray-900 dark:text-white">
                    {t('adminDashboard.roleContent')}
                  </h2>
                  <p className="font-body text-[11px] text-gray-400 dark:text-gray-500">
                    {t('adminDashboard.roleContentDesc')}
                  </p>
                </div>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <InsightMetric
                  label={t('adminDashboard.availableCourses')}
                  value={stats.totalCourses}
                  icon={<BookOpen className="w-4 h-4 text-purple-500" />}
                />
                <InsightMetric
                  label={t('adminDashboard.lessons')}
                  value={stats.totalLessons}
                  icon={<FileText className="w-4 h-4 text-purple-500" />}
                />
                <InsightMetric
                  label={t('adminDashboard.challenges')}
                  value={stats.totalChallenges}
                  icon={<Target className="w-4 h-4 text-purple-500" />}
                />
                <InsightMetric
                  label={t('adminDashboard.enrollmentsTotal')}
                  value={extStats.total_enrollments || '—'}
                  icon={<Users className="w-4 h-4 text-purple-500" />}
                />
                <InsightMetric
                  label={t('adminDashboard.banks')}
                  value={stats.totalBanks}
                  icon={<Building2 className="w-4 h-4 text-purple-500" />}
                />
                <InsightMetric
                  label={t('adminDashboard.products')}
                  value={stats.totalProducts}
                  icon={<Package className="w-4 h-4 text-purple-500" />}
                />
              </div>
              <div className="px-5 pb-4">
                <button
                  onClick={() => navigate('/courses')}
                  className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-body font-bold cursor-pointer"
                >
                  {t('adminDashboard.manageCourses')} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* DESEMPENHO */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 border-l-4 border-l-[#EC0000]">
                <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[#EC0000]" />
                </div>
                <div>
                  <h2 className="font-headline text-base font-bold text-gray-900 dark:text-white">
                    {t('adminDashboard.rolePerformance')}
                  </h2>
                  <p className="font-body text-[11px] text-gray-400 dark:text-gray-500">
                    {t('adminDashboard.rolePerformanceDesc')}
                  </p>
                </div>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <InsightMetric
                  label={t('adminDashboard.totalSubmissions')}
                  value={stats.totalSubmissions}
                  icon={<FileText className="w-4 h-4 text-[#EC0000]" />}
                />
                <InsightMetric
                  label={t('adminDashboard.approvedSubmissions')}
                  value={stats.approvedSubmissions}
                  icon={<CheckCircle className="w-4 h-4 text-[#EC0000]" />}
                  highlight
                />
                <InsightMetric
                  label={t('adminDashboard.approval')}
                  value={`${stats.approvalRate}%`}
                  icon={<TrendingUp className="w-4 h-4 text-[#EC0000]" />}
                  highlight={stats.approvalRate >= 80}
                />
                <InsightMetric
                  label={t('adminDashboard.avgMpu')}
                  value={stats.avgMpu}
                  icon={<Activity className="w-4 h-4 text-[#EC0000]" />}
                />
              </div>
              <div className="px-5 pb-4">
                <button
                  onClick={() => navigate('/reports')}
                  className="flex items-center gap-1.5 text-[#EC0000] text-xs font-body font-bold cursor-pointer"
                >
                  {t('adminDashboard.viewReports')} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ── Recent Activity ──────────────────────────────────── */}
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            {t('adminDashboard.recentActivity')}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Active Plans */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-[#EC0000]" />
                  <div>
                    <h2 className="font-headline text-base font-bold text-gray-900 dark:text-white">
                      {t('adminDashboard.trainingPlans')}
                    </h2>
                    <p className="font-body text-[11px] text-gray-400 dark:text-gray-500">
                      {t('adminDashboard.inProgress')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/training-plans')}
                  className="flex items-center gap-1 text-[#EC0000] text-xs font-body font-bold cursor-pointer"
                >
                  {t('adminDashboard.viewAll')} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {activePlans.length > 0 ? (
                  activePlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => navigate(`/trainer/training-plan/${plan.id}`)}
                      className="w-full px-5 py-3.5 cursor-pointer text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-body font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {plan.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              {plan.student_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              {plan.trainer_name}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className={`font-mono text-xs font-bold px-2 py-1 rounded-lg ${
                            plan.days_remaining <= 7
                              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {plan.days_remaining} {t('adminDashboard.days')}
                          </span>
                          <p className="font-body text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                            {plan.total_courses} {t('adminDashboard.coursesCount')}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
                    <p className="font-body text-sm text-gray-400 dark:text-gray-500">
                      {t('adminDashboard.noActivePlans')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <Target className="w-5 h-5 text-[#EC0000]" />
                  <div>
                    <h2 className="font-headline text-base font-bold text-gray-900 dark:text-white">
                      {t('adminDashboard.latestChallenges')}
                    </h2>
                    <p className="font-body text-[11px] text-gray-400 dark:text-gray-500">
                      {t('adminDashboard.recentSubmissions')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/reports')}
                  className="flex items-center gap-1 text-[#EC0000] text-xs font-body font-bold cursor-pointer"
                >
                  {t('adminDashboard.viewReports')} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {recentSubmissions.length > 0 ? (
                  recentSubmissions.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => navigate(`/challenges/result/${sub.id}`)}
                      className="w-full px-5 py-3.5 cursor-pointer text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-body font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {sub.challenge_title}
                          </h3>
                          <p className="font-body text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {sub.student_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <div className="text-right">
                            <p className="font-body text-[10px] text-gray-400 dark:text-gray-500">MPU</p>
                            <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                              {sub.calculated_mpu?.toFixed(2) ?? '—'}
                            </p>
                          </div>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            sub.is_approved
                              ? 'bg-emerald-50 dark:bg-emerald-500/10'
                              : 'bg-red-50 dark:bg-red-500/10'
                          }`}>
                            {sub.is_approved
                              ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                              : <XCircle className="w-4 h-4 text-red-500" />
                            }
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <Target className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
                    <p className="font-body text-sm text-gray-400 dark:text-gray-500">
                      {t('adminDashboard.noSubmissions')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ──────────────────────────────────────── */}
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            {t('adminDashboard.quickActions')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: t('adminDashboard.manageUsers'), sub: t('adminDashboard.addOrEdit'), icon: Users, to: '/users', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800' },
              { label: t('adminDashboard.manageCourses'), sub: t('adminDashboard.courseCatalog'), icon: BookOpen, to: '/courses', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: t('adminDashboard.newPlan'), sub: t('adminDashboard.createTraining'), icon: Calendar, to: '/training-plan/new', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: t('adminDashboard.reports'), sub: t('adminDashboard.detailedAnalytics'), icon: BarChart3, to: '/reports', color: 'text-[#EC0000]', bg: 'bg-red-50 dark:bg-red-900/20' },
            ].map((action, i) => (
              <button
                key={i}
                aria-label={action.label}
                onClick={() => navigate(action.to)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-left cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-lg ${action.bg} flex items-center justify-center shrink-0`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-bold text-gray-900 dark:text-white">{action.label}</p>
                  <p className="font-body text-[11px] text-gray-400 dark:text-gray-500">{action.sub}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Insight Metric subcomponent ────────────────────────────
interface InsightMetricProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
  alert?: boolean;
}

function InsightMetric({ label, value, icon, highlight, alert }: InsightMetricProps) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className={`font-mono text-xl font-bold leading-tight ${
          alert
            ? 'text-amber-500'
            : highlight
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-gray-900 dark:text-white'
        }`}>
          {value}
        </p>
        <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
