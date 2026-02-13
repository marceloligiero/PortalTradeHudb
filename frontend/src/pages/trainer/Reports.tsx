import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, BookOpen, Clock, CheckCircle, 
  Download, Filter, BarChart3,
  Target, Activity, Award, Sparkles, GraduationCap,
  AlertTriangle, Swords, Eye, FileWarning, Wrench,
  TrendingUp, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/axios';

interface TrainerOverview {
  total_courses: number;
  total_students: number;
  total_plans: number;
  active_students: number;
  certificates_issued: number;
}

interface PlanReport {
  id: number;
  title: string;
  description: string;
  bank_code: string;
  students_assigned: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

interface StudentReport {
  id: number;
  name: string;
  email: string;
  courses_enrolled: number;
  average_progress: number;
}

interface LessonReport {
  total_lessons: number;
  total_duration_minutes: number;
  lessons_per_course: number;
}

interface ChallengeErrorBreakdown {
  methodology: number;
  knowledge: number;
  detail: number;
  procedure: number;
}

interface SubmissionDetail {
  id: number;
  challenge_title: string;
  challenge_type: string;
  course_name: string;
  student_name: string;
  student_email: string;
  status: string;
  total_operations: number;
  total_time_minutes: number;
  calculated_mpu: number;
  mpu_vs_target: number;
  target_mpu: number;
  errors_count: number;
  errors: ChallengeErrorBreakdown;
  total_individual_errors: number;
  score: number | null;
  is_approved: boolean | null;
  retry_count: number;
  created_at: string | null;
}

interface ChallengeReport {
  summary: {
    total_challenges: number;
    total_submissions: number;
    approved: number;
    rejected: number;
    pending: number;
    approval_rate: number;
    avg_mpu: number;
    avg_score: number;
    total_operations: number;
    total_errors: number;
    operations_with_errors: number;
    error_rate: number;
  };
  error_breakdown: ChallengeErrorBreakdown;
  submissions_detail: SubmissionDetail[];
}

export default function TrainerReportsPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<TrainerOverview | null>(null);
  const [planReports, setPlanReports] = useState<PlanReport[]>([]);
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [lessonReport, setLessonReport] = useState<LessonReport | null>(null);
  const [challengeReport, setChallengeReport] = useState<ChallengeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'students' | 'lessons' | 'challenges'>('plans');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [expandedSubmission, setExpandedSubmission] = useState<number | null>(null);
  const [challengeStatusFilter, setChallengeStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [overviewRes, plansRes, studentsRes, lessonsRes, challengesRes] = await Promise.all([
        api.get('/api/trainer/reports/overview'),
        api.get('/api/trainer/reports/plans'),
        api.get('/api/trainer/reports/students'),
        api.get('/api/trainer/reports/lessons'),
        api.get('/api/trainer/reports/challenges'),
      ]);

      setOverview(overviewRes.data);
      setPlanReports(plansRes.data);
      setStudentReports(studentsRes.data);
      setLessonReport(lessonsRes.data);
      setChallengeReport(challengesRes.data);
    } catch (error) {
      console.error('Error fetching trainer reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = planReports.filter(plan => {
    return selectedStatus === 'ALL' || plan.status === selectedStatus;
  });

  const filteredSubmissions = challengeReport?.submissions_detail.filter(s => {
    return challengeStatusFilter === 'ALL' || s.status === challengeStatusFilter;
  }) || [];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30',
      completed: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
      upcoming: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30',
    };
    return styles[status] || styles.active;
  };

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30';
      case 'REJECTED':
        return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30';
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30';
      default:
        return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED': return t('trainerReports.challengeApproved');
      case 'REJECTED': return t('trainerReports.challengeRejected');
      case 'PENDING_REVIEW': return t('trainerReports.challengePending');
      case 'IN_PROGRESS': return t('trainerReports.challengeInProgress');
      default: return status;
    }
  };

  const getErrorPercentages = (breakdown: ChallengeErrorBreakdown) => {
    const total = breakdown.methodology + breakdown.knowledge + breakdown.detail + breakdown.procedure;
    if (total === 0) return { methodology: 0, knowledge: 0, detail: 0, procedure: 0 };
    return {
      methodology: Math.round(breakdown.methodology / total * 100),
      knowledge: Math.round(breakdown.knowledge / total * 100),
      detail: Math.round(breakdown.detail / total * 100),
      procedure: Math.round(breakdown.procedure / total * 100),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-indigo-500/10" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                {t('trainerReports.title')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{t('trainerReports.subtitle')}</p>
            </div>
          </div>
          <Sparkles className="absolute top-4 right-4 w-5 h-5 text-indigo-400 animate-pulse" />
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-600/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">{t('trainerReports.totalPlans')}</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-white mt-1">{overview.total_plans}</p>
              </div>
              <BookOpen className="w-10 h-10 text-blue-400 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-500/10 dark:to-green-600/10 border border-green-200 dark:border-green-500/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">{t('trainerReports.totalStudents')}</p>
                <p className="text-3xl font-bold text-green-700 dark:text-white mt-1">{overview.total_students}</p>
                <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                  {overview.active_students} {t('trainerReports.active').toLowerCase()}
                </p>
              </div>
              <Users className="w-10 h-10 text-green-400 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-500/10 dark:to-purple-600/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">{t('courses.title')}</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-white mt-1">{overview.total_courses}</p>
              </div>
              <Target className="w-10 h-10 text-purple-400 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-500/10 dark:to-orange-600/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">{t('trainerReports.lessons')}</p>
                <p className="text-3xl font-bold text-orange-700 dark:text-white mt-1">
                  {lessonReport?.total_lessons || 0}
                </p>
                <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                  {lessonReport?.lessons_per_course || 0} {t('trainerReports.avgProgress').toLowerCase()}
                </p>
              </div>
              <Clock className="w-10 h-10 text-orange-400 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-500/10 dark:to-indigo-600/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">{t('certificates.title')}</p>
                <p className="text-3xl font-bold text-indigo-700 dark:text-white mt-1">{overview.certificates_issued}</p>
              </div>
              <Award className="w-10 h-10 text-indigo-400 opacity-50" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-1.5 flex gap-1">
        {[
          { key: 'plans' as const, label: t('trainerReports.planProgress'), icon: BookOpen },
          { key: 'students' as const, label: t('trainerReports.studentProgress'), icon: Users },
          { key: 'lessons' as const, label: t('trainerReports.lessonMetrics'), icon: Clock },
          { key: 'challenges' as const, label: t('trainerReports.challengeAnalysis'), icon: Swords },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('trainerReports.planProgress')}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">{t('trainerReports.allStatuses')}</option>
                <option value="active">{t('trainerReports.activeStatus')}</option>
                <option value="completed">{t('trainerReports.completedStatus')}</option>
              </select>
            </div>
          </div>
          
          {filteredPlans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('trainerReports.planName')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('trainerReports.bank')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('trainerReports.students')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('trainerReports.status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map((plan) => (
                    <tr key={plan.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">{plan.title}</div>
                        {plan.start_date && plan.end_date && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(plan.start_date).toLocaleDateString()} — {new Date(plan.end_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {plan.bank_code ? (
                          <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm border border-indigo-200 dark:border-indigo-500/30">
                            {plan.bank_code}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{plan.students_assigned}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(plan.status)}`}>
                          {t(`trainerReports.${plan.status}`) || plan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('trainerReports.noPlans')}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('trainerReports.studentProgress')}</h2>
          </div>
          
          {studentReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('trainerReports.studentName')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('courses.title')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('trainerReports.progress')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {studentReports.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white font-medium">{student.courses_enrolled}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 dark:bg-white/10 rounded-full h-2 max-w-[120px]">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                student.average_progress >= 75
                                  ? 'bg-gradient-to-r from-green-400 to-green-500'
                                  : student.average_progress >= 40
                                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                  : 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                              }`}
                              style={{ width: `${Math.min(student.average_progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-white min-w-[3rem] text-right">
                            {student.average_progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('trainerReports.noStudents')}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Lessons Tab */}
      {activeTab === 'lessons' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('trainerReports.lessonMetrics')}</h2>
          </div>
          
          {lessonReport && lessonReport.total_lessons > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10 text-center">
                <BookOpen className="w-10 h-10 text-indigo-400 mx-auto mb-3 opacity-70" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{lessonReport.total_lessons}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('trainerReports.totalLessons', 'Total de Módulos')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10 text-center">
                <Clock className="w-10 h-10 text-purple-400 mx-auto mb-3 opacity-70" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.round(lessonReport.total_duration_minutes / 60)}h
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('trainerReports.totalDuration', 'Duração Total')} ({lessonReport.total_duration_minutes} min)
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10 text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3 opacity-70" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{lessonReport.lessons_per_course}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('trainerReports.lessonsPerCourse', 'Módulos por Curso')}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('trainerReports.noLessons')}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && challengeReport && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Challenge Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('trainerReports.totalSubmissions')}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{challengeReport.summary.total_submissions}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {challengeReport.summary.total_challenges} {t('trainerReports.challengesCreated')}
                  </p>
                </div>
                <Swords className="w-10 h-10 text-indigo-400 opacity-50" />
              </div>
            </div>

            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('trainerReports.approvalRate')}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{challengeReport.summary.approval_rate}%</p>
                  <p className="text-xs mt-1">
                    <span className="text-green-500">{challengeReport.summary.approved} ✓</span>
                    {' / '}
                    <span className="text-red-500">{challengeReport.summary.rejected} ✗</span>
                    {challengeReport.summary.pending > 0 && (
                      <span className="text-yellow-500"> / {challengeReport.summary.pending} ⏳</span>
                    )}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </div>

            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('trainerReports.avgMPU')}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{challengeReport.summary.avg_mpu}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('trainerReports.minutesPerUnit')}</p>
                </div>
                <Clock className="w-10 h-10 text-purple-400 opacity-50" />
              </div>
            </div>

            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('trainerReports.errorRate')}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{challengeReport.summary.error_rate}%</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {challengeReport.summary.operations_with_errors} / {challengeReport.summary.total_operations} {t('trainerReports.operations')}
                  </p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Error Breakdown Analysis */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('trainerReports.errorAnalysis')}</h2>
            </div>

            {challengeReport.summary.total_errors > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Error Type Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500/10 dark:to-amber-600/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('trainerReports.errMethodology')}</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-800 dark:text-white">{challengeReport.error_breakdown.methodology}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {getErrorPercentages(challengeReport.error_breakdown).methodology}%
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-600/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('trainerReports.errKnowledge')}</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800 dark:text-white">{challengeReport.error_breakdown.knowledge}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {getErrorPercentages(challengeReport.error_breakdown).knowledge}%
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-500/10 dark:to-purple-600/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{t('trainerReports.errDetail')}</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-800 dark:text-white">{challengeReport.error_breakdown.detail}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      {getErrorPercentages(challengeReport.error_breakdown).detail}%
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-500/10 dark:to-rose-600/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileWarning className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <span className="text-sm font-medium text-rose-700 dark:text-rose-300">{t('trainerReports.errProcedure')}</span>
                    </div>
                    <p className="text-3xl font-bold text-rose-800 dark:text-white">{challengeReport.error_breakdown.procedure}</p>
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                      {getErrorPercentages(challengeReport.error_breakdown).procedure}%
                    </p>
                  </div>
                </div>

                {/* Visual Error Bars */}
                <div className="flex flex-col justify-center space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{t('trainerReports.errMethodology')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{getErrorPercentages(challengeReport.error_breakdown).methodology}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-3">
                      <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-3 rounded-full transition-all" style={{ width: `${getErrorPercentages(challengeReport.error_breakdown).methodology}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{t('trainerReports.errKnowledge')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{getErrorPercentages(challengeReport.error_breakdown).knowledge}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all" style={{ width: `${getErrorPercentages(challengeReport.error_breakdown).knowledge}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{t('trainerReports.errDetail')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{getErrorPercentages(challengeReport.error_breakdown).detail}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-3">
                      <div className="bg-gradient-to-r from-purple-400 to-purple-500 h-3 rounded-full transition-all" style={{ width: `${getErrorPercentages(challengeReport.error_breakdown).detail}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{t('trainerReports.errProcedure')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{getErrorPercentages(challengeReport.error_breakdown).procedure}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-3">
                      <div className="bg-gradient-to-r from-rose-400 to-rose-500 h-3 rounded-full transition-all" style={{ width: `${getErrorPercentages(challengeReport.error_breakdown).procedure}%` }} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('trainerReports.totalErrors')}</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{challengeReport.summary.total_errors}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-70" />
                <p className="text-gray-500 dark:text-gray-400">{t('trainerReports.noErrors')}</p>
              </div>
            )}
          </div>

          {/* Submissions Detail Table */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('trainerReports.submissionsDetail')}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={challengeStatusFilter}
                  onChange={(e) => setChallengeStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">{t('trainerReports.allStatuses')}</option>
                  <option value="APPROVED">{t('trainerReports.challengeApproved')}</option>
                  <option value="REJECTED">{t('trainerReports.challengeRejected')}</option>
                  <option value="PENDING_REVIEW">{t('trainerReports.challengePending')}</option>
                  <option value="IN_PROGRESS">{t('trainerReports.challengeInProgress')}</option>
                </select>
              </div>
            </div>

            {filteredSubmissions.length > 0 ? (
              <div className="space-y-3">
                {filteredSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden"
                  >
                    {/* Row Header */}
                    <button
                      onClick={() => setExpandedSubmission(expandedSubmission === sub.id ? null : sub.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {sub.student_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900 dark:text-white truncate">{sub.student_name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getSubmissionStatusBadge(sub.status)}`}>
                              {getStatusLabel(sub.status)}
                            </span>
                            {sub.retry_count > 0 && (
                              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded text-xs border border-orange-200 dark:border-orange-500/30">
                                🔄 {sub.retry_count}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            <span className="truncate">{sub.challenge_title}</span>
                            {sub.course_name && <span className="text-xs">📚 {sub.course_name}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                        {sub.total_individual_errors > 0 && (
                          <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
                            <AlertTriangle className="w-4 h-4" />
                            {sub.total_individual_errors}
                          </span>
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          MPU: {sub.calculated_mpu}
                        </span>
                        {expandedSubmission === sub.id 
                          ? <ChevronUp className="w-5 h-5 text-gray-400" />
                          : <ChevronDown className="w-5 h-5 text-gray-400" />
                        }
                      </div>
                    </button>

                    {/* Expanded Detail */}
                    {expandedSubmission === sub.id && (
                      <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('trainerReports.operations')}</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{sub.total_operations}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('trainerReports.time')}</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{sub.total_time_minutes} min</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">MPU</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {sub.calculated_mpu}
                              {sub.target_mpu ? (
                                <span className={`text-xs ml-1 ${sub.calculated_mpu <= sub.target_mpu ? 'text-green-500' : 'text-red-500'}`}>
                                  ({t('trainerReports.target')}: {sub.target_mpu})
                                </span>
                              ) : null}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('trainerReports.opsWithErrors')}</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{sub.errors_count}</p>
                          </div>
                        </div>

                        {/* Error breakdown for this submission */}
                        {sub.total_individual_errors > 0 && (
                          <div className="border-t border-gray-200 dark:border-white/10 pt-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('trainerReports.errorBreakdown')}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {sub.errors.methodology > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                                  <Wrench className="w-4 h-4 text-amber-500" />
                                  <span className="text-sm text-amber-700 dark:text-amber-300">{t('trainerReports.errMethodology')}: <b>{sub.errors.methodology}</b></span>
                                </div>
                              )}
                              {sub.errors.knowledge > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
                                  <BookOpen className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm text-blue-700 dark:text-blue-300">{t('trainerReports.errKnowledge')}: <b>{sub.errors.knowledge}</b></span>
                                </div>
                              )}
                              {sub.errors.detail > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-lg">
                                  <Eye className="w-4 h-4 text-purple-500" />
                                  <span className="text-sm text-purple-700 dark:text-purple-300">{t('trainerReports.errDetail')}: <b>{sub.errors.detail}</b></span>
                                </div>
                              )}
                              {sub.errors.procedure > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg">
                                  <FileWarning className="w-4 h-4 text-rose-500" />
                                  <span className="text-sm text-rose-700 dark:text-rose-300">{t('trainerReports.errProcedure')}: <b>{sub.errors.procedure}</b></span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                          <span className="text-xs text-gray-400">
                            {sub.created_at ? new Date(sub.created_at).toLocaleString() : '—'}
                          </span>
                          {sub.score !== null && (
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('trainerReports.score')}: {sub.score}%
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Swords className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">{t('trainerReports.noSubmissions')}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}