import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, TrendingUp, Users, BookOpen, Target, 
  Clock, Award, ArrowUp, CheckCircle2, AlertCircle, Building2, 
  Package, RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../../lib/axios';

// Format "2026-02" or "02/2026" → "Fev 2026"
const MONTH_NAMES: Record<string, string[]> = {
  'pt': ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  'es': ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  'en': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const getMonthNames = (): string[] => {
  const lang = (navigator.language || 'pt').split('-')[0].toLowerCase();
  return MONTH_NAMES[lang] || MONTH_NAMES['pt'];
};
const formatMonth = (monthStr: string): string => {
  if (!monthStr) return monthStr;
  let year: string, month: string;
  if (monthStr.includes('-')) {
    [year, month] = monthStr.split('-');
  } else if (monthStr.includes('/')) {
    [month, year] = monthStr.split('/');
  } else {
    return monthStr;
  }
  const monthIdx = parseInt(month) - 1;
  const months = getMonthNames();
  return `${months[monthIdx]} ${year}`;
};

interface DashboardSummary {
  total_students: number;
  total_trainers: number;
  total_courses: number;
  total_training_plans: number;
  total_enrollments: number;
  certificates_issued: number;
  avg_completion_rate: number;
  total_study_hours: number;
  active_students_30d: number;
  pending_trainers: number;
  top_performing_bank: string;
  most_popular_product: string;
}

interface StudentPerformance {
  student_name: string;
  email: string;
  total_lessons: number;
  completed_lessons: number;
  avg_mpu: number;
  total_time_hours: number;
  certificates_count: number;
}

interface TrainerProductivity {
  trainer_name: string;
  email: string;
  total_courses: number;
  total_students: number;
  total_training_plans: number;
  avg_student_completion: number;
}

interface CourseAnalytics {
  course_title: string;
  bank_code: string;
  product_code: string;
  total_lessons: number;
  total_enrollments: number;
  avg_completion_rate: number;
  avg_mpu: number;
}

interface CertificationData {
  month: string;
  certificates_issued: number;
  avg_completion_time_days: number;
}

interface MPUItem {
  name: string;
  avg_mpu: number;
  total_students: number;
  total_submissions: number;
  performance_category: string;
}

interface MPUData {
  by_bank: MPUItem[];
  by_service: MPUItem[];
  by_plan: MPUItem[];
}

export default function AdvancedReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'trainers' | 'courses' | 'certifications' | 'mpu'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [trainerProductivity, setTrainerProductivity] = useState<TrainerProductivity[]>([]);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [certifications, setCertifications] = useState<CertificationData[]>([]);
  const [mpuData, setMpuData] = useState<MPUData>({ by_bank: [], by_service: [], by_plan: [] });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'dashboard':
          const summaryRes = await api.get('/api/admin/advanced-reports/dashboard-summary');
          setSummary(summaryRes.data);
          break;
        case 'students':
          const studentsRes = await api.get('/api/admin/advanced-reports/student-performance');
          setStudentPerformance(studentsRes.data?.students || []);
          break;
        case 'trainers':
          const trainersRes = await api.get('/api/admin/advanced-reports/trainer-productivity');
          setTrainerProductivity(trainersRes.data?.trainers || []);
          break;
        case 'courses':
          const coursesRes = await api.get('/api/admin/advanced-reports/course-analytics');
          setCourseAnalytics(coursesRes.data?.courses || []);
          break;
        case 'certifications':
          const certsRes = await api.get('/api/admin/advanced-reports/certifications');
          setCertifications(certsRes.data?.certifications || []);
          break;
        case 'mpu':
          const mpuRes = await api.get('/api/admin/advanced-reports/mpu-analytics');
          setMpuData(mpuRes.data || { by_bank: [], by_service: [], by_plan: [] });
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: t('advancedReports.dashboard'), icon: BarChart3 },
    { id: 'students', label: t('advancedReports.studentPerformance'), icon: Users },
    { id: 'trainers', label: t('advancedReports.trainerProductivity'), icon: TrendingUp },
    { id: 'courses', label: t('advancedReports.courseAnalytics'), icon: BookOpen },
    { id: 'certifications', label: t('advancedReports.certifications'), icon: Award },
    { id: 'mpu', label: t('advancedReports.mpuAnalytics'), icon: Target },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('advancedReports.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('advancedReports.description')}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('advancedReports.refresh')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Dashboard Summary */}
          {activeTab === 'dashboard' && summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 opacity-80" />
                    <span className="text-sm font-medium opacity-90">{t('advancedReports.totalStudents')}</span>
                  </div>
                  <p className="text-3xl font-bold">{summary.total_students}</p>
                  <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    {summary.active_students_30d} {t('advancedReports.activeLast30Days')}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 opacity-80" />
                    <span className="text-sm font-medium opacity-90">{t('advancedReports.totalTrainers')}</span>
                  </div>
                  <p className="text-3xl font-bold">{summary.total_trainers}</p>
                  <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {summary.pending_trainers} {t('advancedReports.pendingValidation')}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5 opacity-80" />
                    <span className="text-sm font-medium opacity-90">{t('advancedReports.totalCourses')}</span>
                  </div>
                  <p className="text-3xl font-bold">{summary.total_courses}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {summary.total_training_plans} {t('advancedReports.trainingPlans')}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 opacity-80" />
                    <span className="text-sm font-medium opacity-90">{t('advancedReports.certificates')}</span>
                  </div>
                  <p className="text-3xl font-bold">{summary.certificates_issued}</p>
                  <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {summary.avg_completion_rate.toFixed(1)}% {t('advancedReports.completionRate')}
                  </p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{t('advancedReports.studyHours')}</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.total_study_hours.toFixed(1)}h</p>
                  <p className="text-sm text-gray-500 mt-1">{t('advancedReports.totalAccumulated')}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{t('advancedReports.topBank')}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white truncate">{summary.top_performing_bank}</p>
                  <p className="text-sm text-gray-500 mt-1">{t('advancedReports.highestPerformance')}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{t('advancedReports.popularService')}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white truncate">{summary.most_popular_product}</p>
                  <p className="text-sm text-gray-500 mt-1">{t('advancedReports.mostEnrolled')}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Student Performance */}
          {activeTab === 'students' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              {(() => {
                const total = studentPerformance.length;
                const withCerts = studentPerformance.filter(s => s.certificates_count > 0).length;
                const avgMpu = total > 0 ? studentPerformance.filter(s => s.avg_mpu > 0).reduce((s, st) => s + st.avg_mpu, 0) / (studentPerformance.filter(s => s.avg_mpu > 0).length || 1) : 0;
                const totalHours = studentPerformance.reduce((s, st) => s + (st.total_time_hours || 0), 0);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.totalStudents')}</span>
                      </div>
                      <p className="text-3xl font-bold">{total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.avgMpu')}</span>
                      </div>
                      <p className="text-3xl font-bold">{avgMpu > 0 ? avgMpu.toFixed(2) : '—'}</p>
                      <p className="text-xs opacity-70 mt-1">min/op</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.totalTimeLabel', 'Tempo Total')}</span>
                      </div>
                      <p className="text-3xl font-bold">{totalHours.toFixed(1)}h</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Award className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.withCertificates', 'Com Certificados')}</span>
                      </div>
                      <p className="text-3xl font-bold">{withCerts}</p>
                      <p className="text-xs opacity-70 mt-1">{total > 0 ? `${((withCerts / total) * 100).toFixed(0)}% ${t('advancedReports.ofTotal', 'do total')}` : ''}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Table */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.studentPerformanceTable')}
                    </h2>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.student')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.lessons')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.avgMpu')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.time')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.certificates')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {studentPerformance.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            {t('advancedReports.noData')}
                          </td>
                        </tr>
                      ) : (
                        studentPerformance.map((student, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{student.student_name}</p>
                                <p className="text-sm text-gray-500">{student.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900 dark:text-white font-medium">{student.completed_lessons}/{student.total_lessons}</span>
                                {student.total_lessons > 0 && (
                                  <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-500 rounded-full" 
                                      style={{ width: `${Math.min(100, (student.completed_lessons / student.total_lessons) * 100)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                student.avg_mpu > 0 && student.avg_mpu <= 5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                student.avg_mpu > 0 && student.avg_mpu <= 10 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                student.avg_mpu > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {student.avg_mpu > 0 ? `${student.avg_mpu.toFixed(2)} min/op` : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-900 dark:text-white">{student.total_time_hours?.toFixed(1) || 0}h</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                student.certificates_count > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {student.certificates_count || 0}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Trainer Productivity */}
          {activeTab === 'trainers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              {(() => {
                const total = trainerProductivity.length;
                const totalStudents = trainerProductivity.reduce((s, t) => s + t.total_students, 0);
                const totalCourses = trainerProductivity.reduce((s, t) => s + t.total_courses, 0);
                const avgCompl = total > 0 ? trainerProductivity.reduce((s, t) => s + (t.avg_student_completion || 0), 0) / total : 0;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.totalTrainers')}</span>
                      </div>
                      <p className="text-3xl font-bold">{total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.totalStudentsManaged', 'Formandos Geridos')}</span>
                      </div>
                      <p className="text-3xl font-bold">{totalStudents}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.totalCoursesCreated', 'Cursos Criados')}</span>
                      </div>
                      <p className="text-3xl font-bold">{totalCourses}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.avgCompletionRate', 'Taxa Conclusão Média')}</span>
                      </div>
                      <p className="text-3xl font-bold">{avgCompl > 0 ? `${avgCompl.toFixed(1)}%` : '—'}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Table */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.trainerProductivityTable')}
                    </h2>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.trainer')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.courses')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.students')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.plans')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.completionRateHeader')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {trainerProductivity.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            {t('advancedReports.noData')}
                          </td>
                        </tr>
                      ) : (
                        trainerProductivity.map((trainer, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{trainer.trainer_name}</p>
                                <p className="text-sm text-gray-500">{trainer.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-xs font-medium">
                                {trainer.total_courses}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">
                                {trainer.total_students}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-xs font-medium">
                                {trainer.total_training_plans}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                  trainer.avg_student_completion >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  trainer.avg_student_completion >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {trainer.avg_student_completion?.toFixed(1) || 0}%
                                </span>
                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      trainer.avg_student_completion >= 80 ? 'bg-emerald-500' :
                                      trainer.avg_student_completion >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(100, trainer.avg_student_completion || 0)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Course Analytics */}
          {activeTab === 'courses' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              {(() => {
                const total = courseAnalytics.length;
                const totalEnrollments = courseAnalytics.reduce((s, c) => s + c.total_enrollments, 0);
                const avgCompletion = total > 0 ? courseAnalytics.reduce((s, c) => s + c.avg_completion_rate, 0) / total : 0;
                const coursesWithMpu = courseAnalytics.filter(c => c.avg_mpu > 0);
                const avgMpu = coursesWithMpu.length > 0 ? coursesWithMpu.reduce((s, c) => s + c.avg_mpu, 0) / coursesWithMpu.length : 0;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.totalCourses')}</span>
                      </div>
                      <p className="text-3xl font-bold">{total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.totalEnrollments', 'Total Inscrições')}</span>
                      </div>
                      <p className="text-3xl font-bold">{totalEnrollments}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.avgCompletionRate', 'Taxa Conclusão Média')}</span>
                      </div>
                      <p className="text-3xl font-bold">{avgCompletion > 0 ? `${avgCompletion.toFixed(1)}%` : '—'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.avgMpu')}</span>
                      </div>
                      <p className="text-3xl font-bold">{avgMpu > 0 ? avgMpu.toFixed(2) : '—'}</p>
                      <p className="text-xs opacity-70 mt-1">min/op</p>
                    </div>
                  </div>
                );
              })()}

              {/* Table */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.courseAnalyticsTable')}
                    </h2>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.course')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.bank')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.service', 'Serviço')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.lessons')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.enrollments')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.completion')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.mpu')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {courseAnalytics.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            {t('advancedReports.noData')}
                          </td>
                        </tr>
                      ) : (
                        courseAnalytics.map((course, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{course.course_title}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-medium">{course.bank_code || '-'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg text-xs font-medium">{course.product_code || '-'}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-900 dark:text-white">{course.total_lessons}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-xs font-medium">
                                {course.total_enrollments}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                  course.avg_completion_rate >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  course.avg_completion_rate >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {course.avg_completion_rate?.toFixed(1) || 0}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                course.avg_mpu > 0 && course.avg_mpu <= 5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                course.avg_mpu > 0 && course.avg_mpu <= 10 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                course.avg_mpu > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {course.avg_mpu > 0 ? `${course.avg_mpu.toFixed(2)} min/op` : 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Certifications */}
          {activeTab === 'certifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              {(() => {
                const totalCerts = certifications.reduce((s, c) => s + c.certificates_issued, 0);
                const monthsWithData = certifications.filter(c => c.certificates_issued > 0);
                const avgPerMonth = monthsWithData.length > 0 ? totalCerts / monthsWithData.length : 0;
                const bestMonth = monthsWithData.length > 0 ? monthsWithData.reduce((best, c) => c.certificates_issued > best.certificates_issued ? c : best) : null;
                const avgCompletionDays = monthsWithData.length > 0
                  ? monthsWithData.reduce((s, c) => s + c.avg_completion_time_days, 0) / monthsWithData.length
                  : 0;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Award className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.totalCertificates', 'Total Certificados')}</span>
                      </div>
                      <p className="text-3xl font-bold">{totalCerts}</p>
                      <p className="text-xs opacity-70 mt-1">{t('advancedReports.allTime', 'desde o início')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.avgPerMonth', 'Média por Mês')}</span>
                      </div>
                      <p className="text-3xl font-bold">{avgPerMonth > 0 ? avgPerMonth.toFixed(1) : '—'}</p>
                      <p className="text-xs opacity-70 mt-1">{t('advancedReports.certificatesPerMonth', 'certificados/mês')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <ArrowUp className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.bestMonth', 'Melhor Mês')}</span>
                      </div>
                      <p className="text-xl font-bold">{bestMonth?.month ? formatMonth(bestMonth.month) : '—'}</p>
                      <p className="text-xs opacity-70 mt-1">{bestMonth ? `${bestMonth.certificates_issued} ${t('advancedReports.certificatesLabel', 'certificados')}` : ''}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.avgCompletionTime', 'Tempo Médio Conclusão')}</span>
                      </div>
                      <p className="text-3xl font-bold">{avgCompletionDays > 0 ? avgCompletionDays.toFixed(0) : '—'}</p>
                      <p className="text-xs opacity-70 mt-1">{t('advancedReports.days', 'dias')}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart - Certificates Over Time */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.certificationsOverTime')}
                    </h2>
                  </div>
                  {certifications.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={certifications}>
                        <defs>
                          <linearGradient id="certGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          tickFormatter={formatMonth}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                          labelFormatter={formatMonth}
                          formatter={(value: number) => [value, t('advancedReports.certificatesIssued', 'Certificados Emitidos')]}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="certificates_issued" 
                          stroke="#6366f1" 
                          strokeWidth={3}
                          fill="url(#certGradient)" 
                          dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      {t('advancedReports.noData')}
                    </div>
                  )}
                </div>

                {/* Monthly Breakdown - Visual bars */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.monthlyBreakdown', 'Resumo Mensal')}
                    </h2>
                  </div>
                  {certifications.length > 0 ? (
                    <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2">
                      {[...certifications].reverse().map((cert, idx) => {
                        const maxIssued = Math.max(...certifications.map(c => c.certificates_issued), 1);
                        const pct = (cert.certificates_issued / maxIssued) * 100;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{formatMonth(cert.month)}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {cert.avg_completion_time_days > 0 ? `${cert.avg_completion_time_days.toFixed(0)}d` : ''}
                                </span>
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                  {cert.certificates_issued}
                                </span>
                              </div>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.05 }}
                                className={`h-full rounded-full ${
                                  cert.certificates_issued > 0
                                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-gray-500">
                      {t('advancedReports.noData')}
                    </div>
                  )}
                </div>
              </div>

              {/* Completion Time Chart */}
              {certifications.some(c => c.avg_completion_time_days > 0) && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.completionTimeEvolution', 'Evolução do Tempo de Conclusão')}
                    </h2>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={certifications}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={formatMonth} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                        labelFormatter={formatMonth}
                        formatter={(value: number) => [`${value.toFixed(1)} ${t('advancedReports.days', 'dias')}`, t('advancedReports.avgCompletionTime', 'Tempo Médio')]}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg_completion_time_days"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          )}

          {/* MPU Analytics */}
          {activeTab === 'mpu' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              {(() => {
                const allItems = [...mpuData.by_bank, ...mpuData.by_service, ...mpuData.by_plan];
                const avgMpu = allItems.length > 0 ? allItems.reduce((s, i) => s + i.avg_mpu, 0) / allItems.length : 0;
                const bestItem = allItems.length > 0 ? allItems.reduce((best, i) => i.avg_mpu > 0 && (best.avg_mpu === 0 || i.avg_mpu < best.avg_mpu) ? i : best, allItems[0]) : null;
                const totalSubs = allItems.reduce((s, i) => s + i.total_submissions, 0);
                const totalStudents = new Set(allItems.flatMap(i => Array(i.total_students).fill(0))).size || allItems.reduce((s, i) => s + i.total_students, 0);
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.globalAvgMpu', 'MPU Médio Global')}</span>
                      </div>
                      <p className="text-3xl font-bold">{avgMpu > 0 ? avgMpu.toFixed(2) : '—'}</p>
                      <p className="text-xs opacity-70 mt-1">min/op</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.bestPerformance', 'Melhor Performance')}</span>
                      </div>
                      <p className="text-xl font-bold truncate">{bestItem?.name || '—'}</p>
                      <p className="text-xs opacity-70 mt-1">{bestItem && bestItem.avg_mpu > 0 ? `${bestItem.avg_mpu.toFixed(2)} min/op` : ''}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.totalSubmissions', 'Total Submissões')}</span>
                      </div>
                      <p className="text-3xl font-bold">{totalSubs}</p>
                      <p className="text-xs opacity-70 mt-1">{t('advancedReports.challengesCompleted', 'desafios realizados')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-90">{t('advancedReports.studentsEvaluated', 'Formandos Avaliados')}</span>
                      </div>
                      <p className="text-3xl font-bold">{totalStudents}</p>
                      <p className="text-xs opacity-70 mt-1">{t('advancedReports.withSubmissions', 'com submissões')}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Charts Row - Bank vs Bank Comparison + Service vs Service Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bank vs Bank Comparison */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.mpuBankComparison', 'Comparação Banco vs Banco')}
                    </h2>
                  </div>
                  {mpuData.by_bank.filter(d => d.avg_mpu > 0).length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={Math.max(200, mpuData.by_bank.filter(d => d.avg_mpu > 0).length * 60)}>
                        <BarChart data={mpuData.by_bank.filter(d => d.avg_mpu > 0)} layout="vertical" margin={{ left: 10, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" strokeOpacity={0.2} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} unit=" min/op" />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            tick={{ fontSize: 12, fill: '#d1d5db', fontWeight: 500 }}
                            width={140}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(2)} min/op`, 'MPU']}
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                          />
                          <Bar dataKey="avg_mpu" radius={[0, 8, 8, 0]} barSize={28}>
                            {mpuData.by_bank.filter(d => d.avg_mpu > 0).map((entry, index) => (
                              <Cell 
                                key={`bank-cell-${index}`} 
                                fill={entry.avg_mpu <= 5 ? '#10b981' : entry.avg_mpu <= 10 ? '#f59e0b' : '#ef4444'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-2">
                        {mpuData.by_bank.filter(d => d.avg_mpu > 0).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                            <span>{item.name}</span>
                            <span>{item.total_submissions} sub. · {item.total_students} form.</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-gray-500">
                      {t('advancedReports.noData')}
                    </div>
                  )}
                </div>

                {/* Service vs Service Comparison */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.mpuServiceComparison', 'Comparação Serviço vs Serviço')}
                    </h2>
                  </div>
                  {mpuData.by_service.filter(d => d.avg_mpu > 0).length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={Math.max(200, mpuData.by_service.filter(d => d.avg_mpu > 0).length * 60)}>
                        <BarChart data={mpuData.by_service.filter(d => d.avg_mpu > 0)} layout="vertical" margin={{ left: 10, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" strokeOpacity={0.2} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} unit=" min/op" />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            tick={{ fontSize: 12, fill: '#d1d5db', fontWeight: 500 }}
                            width={140}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(2)} min/op`, 'MPU']}
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                          />
                          <Bar dataKey="avg_mpu" radius={[0, 8, 8, 0]} barSize={28}>
                            {mpuData.by_service.filter(d => d.avg_mpu > 0).map((entry, index) => (
                              <Cell 
                                key={`service-cell-${index}`} 
                                fill={entry.avg_mpu <= 5 ? '#10b981' : entry.avg_mpu <= 10 ? '#f59e0b' : '#ef4444'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-2">
                        {mpuData.by_service.filter(d => d.avg_mpu > 0).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                            <span>{item.name}</span>
                            <span>{item.total_submissions} sub. · {item.total_students} form.</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-gray-500">
                      {t('advancedReports.noData')}
                    </div>
                  )}
                </div>
              </div>

              {/* MPU by Training Plan */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('advancedReports.mpuByPlan')}
                  </h2>
                </div>
                {mpuData.by_plan.filter(d => d.avg_mpu > 0).length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(200, mpuData.by_plan.filter(d => d.avg_mpu > 0).length * 50)}>
                    <BarChart data={mpuData.by_plan.filter(d => d.avg_mpu > 0)} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" strokeOpacity={0.2} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} unit=" min/op" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fontSize: 11, fill: '#d1d5db' }}
                        width={160}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(2)} min/op`, 'MPU']}
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                      />
                      <Bar dataKey="avg_mpu" radius={[0, 8, 8, 0]} barSize={22}>
                        {mpuData.by_plan.filter(d => d.avg_mpu > 0).map((entry, index) => (
                          <Cell 
                            key={`plan-cell-${index}`} 
                            fill={entry.avg_mpu <= 5 ? '#10b981' : entry.avg_mpu <= 10 ? '#f59e0b' : '#ef4444'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-500">
                    {t('advancedReports.noData')}
                  </div>
                )}
              </div>

              {/* Combined MPU Details Table */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.mpuDetails')}
                    </h2>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.type', 'Tipo')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.name', 'Nome')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.avgMpu', 'MPU Médio')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.submissions', 'Submissões')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.students', 'Alunos')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.category', 'Categoria')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {[...mpuData.by_bank.map(d => ({...d, type: t('advancedReports.bank', 'Banco')})),
                        ...mpuData.by_service.map(d => ({...d, type: t('advancedReports.service', 'Serviço')})),
                        ...mpuData.by_plan.map(d => ({...d, type: t('advancedReports.plan', 'Plano')}))
                      ].length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            {t('advancedReports.noData')}
                          </td>
                        </tr>
                      ) : (
                        [...mpuData.by_bank.map(d => ({...d, type: t('advancedReports.bank', 'Banco')})),
                          ...mpuData.by_service.map(d => ({...d, type: t('advancedReports.service', 'Serviço')})),
                          ...mpuData.by_plan.map(d => ({...d, type: t('advancedReports.plan', 'Plano')}))
                        ].map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.type === t('advancedReports.bank', 'Banco') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                item.type === t('advancedReports.service', 'Serviço') ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>{item.type}</span>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.avg_mpu > 0 && item.avg_mpu <= 5 ? 'bg-green-100 text-green-700' :
                                item.avg_mpu > 0 && item.avg_mpu <= 10 ? 'bg-amber-100 text-amber-700' :
                                item.avg_mpu > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {item.avg_mpu > 0 ? `${item.avg_mpu.toFixed(2)} min/op` : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-900 dark:text-white">{item.total_submissions}</td>
                            <td className="px-6 py-4 text-gray-900 dark:text-white">{item.total_students}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.performance_category === 'Excelente' ? 'bg-green-100 text-green-700' :
                                item.performance_category === 'Bom' ? 'bg-blue-100 text-blue-700' :
                                item.performance_category === 'Regular' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {item.performance_category || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
