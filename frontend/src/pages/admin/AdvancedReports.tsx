import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, TrendingUp, Users, BookOpen, Download, Target, Activity, 
  Clock, Award, ArrowUp, Zap, CheckCircle2, AlertCircle, Building2, 
  Package, Calendar, Filter, RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
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

interface MPUData {
  bank_code: string;
  avg_mpu: number;
  total_students: number;
  performance_category: string;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'];

export default function AdvancedReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'trainers' | 'courses' | 'certifications' | 'mpu'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [trainerProductivity, setTrainerProductivity] = useState<TrainerProductivity[]>([]);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [certifications, setCertifications] = useState<CertificationData[]>([]);
  const [mpuData, setMpuData] = useState<MPUData[]>([]);

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
          setMpuData(mpuRes.data?.banks || []);
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: t('admin.dashboardSummary', 'Dashboard'), icon: BarChart3 },
    { id: 'students', label: t('admin.studentPerformance', 'Desempenho Alunos'), icon: Users },
    { id: 'trainers', label: t('admin.trainerProductivity', 'Produtividade Formadores'), icon: TrendingUp },
    { id: 'courses', label: t('admin.courseAnalytics', 'Análise de Cursos'), icon: BookOpen },
    { id: 'certifications', label: t('admin.certifications', 'Certificações'), icon: Award },
    { id: 'mpu', label: t('admin.mpuAnalytics', 'Análise MPU'), icon: Target },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.advancedReports', 'Informes Avançados')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('admin.advancedReportsDescription', 'Análises detalhadas e métricas avançadas da plataforma')}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Atualizar')}
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
                ? 'bg-red-600 text-white'
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.totalStudents', 'Total Alunos')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_students}</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    {summary.active_students_30d} ativos últimos 30 dias
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.totalTrainers', 'Formadores')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_trainers}</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {summary.pending_trainers} pendentes validação
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.totalCourses', 'Cursos')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_courses}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {summary.total_training_plans} planos de formação
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.certificates', 'Certificados')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.certificates_issued}</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {summary.avg_completion_rate.toFixed(1)}% taxa conclusão
                  </p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-6 h-6" />
                    <span className="font-semibold">{t('admin.studyHours', 'Horas de Estudo')}</span>
                  </div>
                  <p className="text-3xl font-bold">{summary.total_study_hours.toFixed(1)}h</p>
                  <p className="text-blue-100 text-sm mt-1">Total acumulado na plataforma</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-6 h-6" />
                    <span className="font-semibold">{t('admin.topBank', 'Melhor Banco')}</span>
                  </div>
                  <p className="text-3xl font-bold">{summary.top_performing_bank}</p>
                  <p className="text-green-100 text-sm mt-1">Maior desempenho médio</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="w-6 h-6" />
                    <span className="font-semibold">{t('admin.topProduct', 'Produto Popular')}</span>
                  </div>
                  <p className="text-3xl font-bold">{summary.most_popular_product}</p>
                  <p className="text-purple-100 text-sm mt-1">Mais matriculados</p>
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
                  {t('admin.studentPerformanceTable', 'Desempenho dos Alunos')}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lições</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MPU Médio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tempo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {studentPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          {t('common.noData', 'Nenhum dado disponível')}
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
                  {t('admin.trainerProductivityTable', 'Produtividade dos Formadores')}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formador</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cursos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alunos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa Conclusão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {trainerProductivity.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          {t('common.noData', 'Nenhum dado disponível')}
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
                  {t('admin.courseAnalyticsTable', 'Análise de Cursos')}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banco</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lições</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matrículas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conclusão</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MPU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {courseAnalytics.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          {t('common.noData', 'Nenhum dado disponível')}
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
                              course.avg_mpu >= 80 ? 'bg-green-100 text-green-700' :
                              course.avg_mpu >= 60 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {course.avg_mpu?.toFixed(1) || 0}%
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
                  {t('admin.certificationsOverTime', 'Certificações ao Longo do Tempo')}
                </h2>
                {certifications.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={certifications}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="certificates_issued" fill="#ef4444" name="Certificados Emitidos" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    {t('common.noData', 'Nenhum dado disponível')}
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
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  {t('admin.mpuByBank', 'MPU por Banco')}
                </h2>
                {mpuData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mpuData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bank_code" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value} min`, 'MPU Médio']} />
                      <Bar dataKey="avg_mpu" fill="#10b981" name="MPU Médio (min/op)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    {t('common.noData', 'Nenhum dado disponível')}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('admin.mpuDetails', 'Detalhes MPU por Banco')}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banco</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MPU Médio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alunos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {mpuData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            {t('common.noData', 'Nenhum dado disponível')}
                          </td>
                        </tr>
                      ) : (
                        mpuData.map((bank, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{bank.bank_code}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                bank.avg_mpu > 0 && bank.avg_mpu <= 5 ? 'bg-green-100 text-green-700' :
                                bank.avg_mpu > 0 && bank.avg_mpu <= 10 ? 'bg-amber-100 text-amber-700' :
                                bank.avg_mpu > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {bank.avg_mpu > 0 ? `${bank.avg_mpu?.toFixed(1)} min` : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-900 dark:text-white">{bank.total_students}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                bank.performance_category === 'Excelente' ? 'bg-green-100 text-green-700' :
                                bank.performance_category === 'Bom' ? 'bg-blue-100 text-blue-700' :
                                bank.performance_category === 'Regular' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {bank.performance_category || 'N/A'}
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
