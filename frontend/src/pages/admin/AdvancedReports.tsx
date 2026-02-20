import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, TrendingUp, Users, BookOpen, Target, 
  Clock, Award, ArrowUp, CheckCircle2, AlertCircle, Building2, 
  Package, RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../../lib/axios';

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('advancedReports.totalStudents')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_students}</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    {summary.active_students_30d} {t('advancedReports.activeLast30Days')}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('advancedReports.totalTrainers')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_trainers}</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {summary.pending_trainers} {t('advancedReports.pendingValidation')}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('advancedReports.totalCourses')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_courses}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {summary.total_training_plans} {t('advancedReports.trainingPlans')}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('advancedReports.certificates')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.certificates_issued}</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {summary.avg_completion_rate.toFixed(1)}% {t('advancedReports.completionRate')}
                  </p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-6 h-6" />
                    <span className="font-semibold">{t('advancedReports.studyHours')}</span>
                  </div>
                  <p className="text-3xl font-bold">{summary.total_study_hours.toFixed(1)}h</p>
                  <p className="text-blue-100 text-sm mt-1">{t('advancedReports.totalAccumulated')}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-6 h-6" />
                    <span className="font-semibold">{t('advancedReports.topBank')}</span>
                  </div>
                  <p className="text-3xl font-bold">{summary.top_performing_bank}</p>
                  <p className="text-green-100 text-sm mt-1">{t('advancedReports.highestPerformance')}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="w-6 h-6" />
                    <span className="font-semibold">{t('advancedReports.popularService')}</span>
                  </div>
                  <p className="text-3xl font-bold">{summary.most_popular_product}</p>
                  <p className="text-purple-100 text-sm mt-1">{t('advancedReports.mostEnrolled')}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Student Performance */}
          {activeTab === 'students' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('advancedReports.studentPerformanceTable')}
                </h2>
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
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{student.student_name}</p>
                              <p className="text-sm text-gray-500">{student.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-900 dark:text-white">{student.completed_lessons}/{student.total_lessons}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              student.avg_mpu > 0 && student.avg_mpu <= 5 ? 'bg-green-100 text-green-700' :
                              student.avg_mpu > 0 && student.avg_mpu <= 10 ? 'bg-amber-100 text-amber-700' :
                              student.avg_mpu > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {student.avg_mpu > 0 ? `${student.avg_mpu?.toFixed(1)} min` : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">{student.total_time_hours?.toFixed(1) || 0}h</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                              {student.certificates_count || 0}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Trainer Productivity */}
          {activeTab === 'trainers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('advancedReports.trainerProductivityTable')}
                </h2>
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
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{trainer.trainer_name}</p>
                              <p className="text-sm text-gray-500">{trainer.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">{trainer.total_courses}</td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">{trainer.total_students}</td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">{trainer.total_training_plans}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              trainer.avg_student_completion >= 80 ? 'bg-green-100 text-green-700' :
                              trainer.avg_student_completion >= 60 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {trainer.avg_student_completion?.toFixed(1) || 0}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Course Analytics */}
          {activeTab === 'courses' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('advancedReports.courseAnalyticsTable')}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.course')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.bank')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('advancedReports.product')}</th>
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
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{course.course_title}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{course.bank_code || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{course.product_code || '-'}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">{course.total_lessons}</td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">{course.total_enrollments}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              course.avg_completion_rate >= 80 ? 'bg-green-100 text-green-700' :
                              course.avg_completion_rate >= 60 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {course.avg_completion_rate?.toFixed(1) || 0}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              course.avg_mpu > 0 && course.avg_mpu <= 5 ? 'bg-green-100 text-green-700' :
                              course.avg_mpu > 0 && course.avg_mpu <= 10 ? 'bg-amber-100 text-amber-700' :
                              course.avg_mpu > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {course.avg_mpu > 0 ? `${course.avg_mpu?.toFixed(2)} min/op` : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  {t('advancedReports.certificationsOverTime')}
                </h2>
                {certifications.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={certifications}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="certificates_issued" fill="#6366f1" name={t('advancedReports.certificatesIssued')} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    {t('advancedReports.noData')}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* MPU Analytics */}
          {activeTab === 'mpu' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* MPU by Bank */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  {t('advancedReports.mpuByBank')}
                </h2>
                {mpuData.by_bank.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mpuData.by_bank}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value} min/op`, 'MPU']} />
                      <Bar dataKey="avg_mpu" fill="#10b981" name="MPU" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-500">
                    {t('advancedReports.noData')}
                  </div>
                )}
              </div>

              {/* MPU by Service */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  {t('advancedReports.mpuByService')}
                </h2>
                {mpuData.by_service.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mpuData.by_service}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value} min/op`, 'MPU']} />
                      <Bar dataKey="avg_mpu" fill="#8b5cf6" name="MPU" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-500">
                    {t('advancedReports.noData')}
                  </div>
                )}
              </div>

              {/* MPU by Training Plan */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  {t('advancedReports.mpuByPlan')}
                </h2>
                {mpuData.by_plan.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mpuData.by_plan}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value} min/op`, 'MPU']} />
                      <Bar dataKey="avg_mpu" fill="#f59e0b" name="MPU" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-500">
                    {t('advancedReports.noData')}
                  </div>
                )}
              </div>

              {/* Combined MPU Details Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('advancedReports.mpuDetails')}
                  </h2>
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
