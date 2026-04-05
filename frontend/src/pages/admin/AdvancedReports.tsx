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
  Cell, Legend
} from 'recharts';
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

/* ── Santander DS KPI card ─────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: 'red' | 'blue' | 'emerald' | 'purple' | 'amber' | 'indigo';
}) {
  const bg: Record<string, string> = {
    red:     'bg-red-50 dark:bg-red-900/20 text-[#EC0000]',
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    purple:  'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    indigo:  'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ── Section card wrapper ──────────────────────────── */
function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#EC0000]" />
          </div>
          <h2 className="text-lg font-headline font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
      </div>
      {children}
    </div>
  );
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
        case 'dashboard': {
          const summaryRes = await api.get('/api/admin/advanced-reports/dashboard-summary');
          setSummary(summaryRes.data);
          break;
        }
        case 'students': {
          const studentsRes = await api.get('/api/admin/advanced-reports/student-performance');
          setStudentPerformance(studentsRes.data?.students || []);
          break;
        }
        case 'trainers': {
          const trainersRes = await api.get('/api/admin/advanced-reports/trainer-productivity');
          setTrainerProductivity(trainersRes.data?.trainers || []);
          break;
        }
        case 'courses': {
          const coursesRes = await api.get('/api/admin/advanced-reports/course-analytics');
          setCourseAnalytics(coursesRes.data?.courses || []);
          break;
        }
        case 'certifications': {
          const certsRes = await api.get('/api/admin/advanced-reports/certifications');
          setCertifications(certsRes.data?.certifications || []);
          break;
        }
        case 'mpu': {
          const mpuRes = await api.get('/api/admin/advanced-reports/mpu-analytics');
          setMpuData(mpuRes.data || { by_bank: [], by_service: [], by_plan: [] });
          break;
        }
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

  const thCls = 'px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider';
  const tdCls = 'px-6 py-4 text-gray-900 dark:text-white';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">
            {t('advancedReports.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('advancedReports.description')}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('advancedReports.refresh')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#EC0000] text-white'
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
          <div className="border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin w-8 h-8" />
        </div>
      ) : (
        <>
          {/* ════════ Dashboard Summary ════════ */}
          {activeTab === 'dashboard' && summary && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Users} label={t('advancedReports.totalStudents')} value={summary.total_students}
                  sub={`${summary.active_students_30d} ${t('advancedReports.activeLast30Days')}`} color="blue" />
                <KpiCard icon={TrendingUp} label={t('advancedReports.totalTrainers')} value={summary.total_trainers}
                  sub={`${summary.pending_trainers} ${t('advancedReports.pendingValidation')}`} color="emerald" />
                <KpiCard icon={BookOpen} label={t('advancedReports.totalCourses')} value={summary.total_courses}
                  sub={`${summary.total_training_plans} ${t('advancedReports.trainingPlans')}`} color="purple" />
                <KpiCard icon={Award} label={t('advancedReports.certificates')} value={summary.certificates_issued}
                  sub={`${summary.avg_completion_rate.toFixed(1)}% ${t('advancedReports.completionRate')}`} color="amber" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard icon={Clock} label={t('advancedReports.studyHours')} value={`${summary.total_study_hours.toFixed(1)}h`}
                  sub={t('advancedReports.totalAccumulated')} color="blue" />
                <KpiCard icon={Building2} label={t('advancedReports.topBank')} value={summary.top_performing_bank}
                  sub={t('advancedReports.highestPerformance')} color="emerald" />
                <KpiCard icon={Package} label={t('advancedReports.popularService')} value={summary.most_popular_product}
                  sub={t('advancedReports.mostEnrolled')} color="purple" />
              </div>
            </div>
          )}

          {/* ════════ Student Performance ════════ */}
          {activeTab === 'students' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {(() => {
                const total = studentPerformance.length;
                const withCerts = studentPerformance.filter(s => s.certificates_count > 0).length;
                const withMpu = studentPerformance.filter(s => s.avg_mpu > 0);
                const avgMpu = withMpu.length > 0 ? withMpu.reduce((s, st) => s + st.avg_mpu, 0) / withMpu.length : 0;
                const totalHours = studentPerformance.reduce((s, st) => s + (st.total_time_hours || 0), 0);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KpiCard icon={Users} label={t('advancedReports.totalStudents')} value={total} color="blue" />
                    <KpiCard icon={Target} label={t('advancedReports.avgMpu')} value={avgMpu > 0 ? avgMpu.toFixed(2) : '—'} sub="min/op" color="emerald" />
                    <KpiCard icon={Clock} label={t('advancedReports.totalTimeLabel', 'Tempo Total')} value={`${totalHours.toFixed(1)}h`} color="purple" />
                    <KpiCard icon={Award} label={t('advancedReports.withCertificates', 'Com Certificados')} value={withCerts}
                      sub={total > 0 ? `${((withCerts / total) * 100).toFixed(0)}% ${t('advancedReports.ofTotal', 'do total')}` : undefined} color="amber" />
                  </div>
                );
              })()}

              <SectionCard icon={Users} title={t('advancedReports.studentPerformanceTable')}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#EC0000]">
                      <tr>
                        <th className={thCls}>{t('advancedReports.student')}</th>
                        <th className={thCls}>{t('advancedReports.lessons')}</th>
                        <th className={thCls}>{t('advancedReports.avgMpu')}</th>
                        <th className={thCls}>{t('advancedReports.time')}</th>
                        <th className={thCls}>{t('advancedReports.certificates')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {studentPerformance.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">{t('advancedReports.noData')}</td></tr>
                      ) : studentPerformance.map((student, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className={tdCls}>
                            <p className="font-medium">{student.student_name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </td>
                          <td className={tdCls}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{student.completed_lessons}/{student.total_lessons}</span>
                              {student.total_lessons > 0 && (
                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#EC0000] rounded-full" style={{ width: `${Math.min(100, (student.completed_lessons / student.total_lessons) * 100)}%` }} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={tdCls}>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              student.avg_mpu > 0 && student.avg_mpu <= 5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              student.avg_mpu > 0 && student.avg_mpu <= 10 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              student.avg_mpu > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {student.avg_mpu > 0 ? `${student.avg_mpu.toFixed(2)} min/op` : 'N/A'}
                            </span>
                          </td>
                          <td className={tdCls}><span className="font-mono">{student.total_time_hours?.toFixed(1) || 0}h</span></td>
                          <td className={tdCls}>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              student.certificates_count > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>{student.certificates_count || 0}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ════════ Trainer Productivity ════════ */}
          {activeTab === 'trainers' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {(() => {
                const total = trainerProductivity.length;
                const totalStudents = trainerProductivity.reduce((s, t) => s + t.total_students, 0);
                const totalCourses = trainerProductivity.reduce((s, t) => s + t.total_courses, 0);
                const avgCompl = total > 0 ? trainerProductivity.reduce((s, t) => s + (t.avg_student_completion || 0), 0) / total : 0;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KpiCard icon={Users} label={t('advancedReports.totalTrainers')} value={total} color="red" />
                    <KpiCard icon={Users} label={t('advancedReports.totalStudentsManaged', 'Formandos Geridos')} value={totalStudents} color="blue" />
                    <KpiCard icon={BookOpen} label={t('advancedReports.totalCoursesCreated', 'Cursos Criados')} value={totalCourses} color="purple" />
                    <KpiCard icon={CheckCircle2} label={t('advancedReports.avgCompletionRate', 'Taxa Conclusão Média')} value={avgCompl > 0 ? `${avgCompl.toFixed(1)}%` : '—'} color="emerald" />
                  </div>
                );
              })()}

              <SectionCard icon={TrendingUp} title={t('advancedReports.trainerProductivityTable')}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#EC0000]">
                      <tr>
                        <th className={thCls}>{t('advancedReports.trainer')}</th>
                        <th className={thCls}>{t('advancedReports.courses')}</th>
                        <th className={thCls}>{t('advancedReports.students')}</th>
                        <th className={thCls}>{t('advancedReports.plans')}</th>
                        <th className={thCls}>{t('advancedReports.completionRateHeader')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {trainerProductivity.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">{t('advancedReports.noData')}</td></tr>
                      ) : trainerProductivity.map((trainer, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className={tdCls}>
                            <p className="font-medium">{trainer.trainer_name}</p>
                            <p className="text-sm text-gray-500">{trainer.email}</p>
                          </td>
                          <td className={tdCls}>
                            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-xs font-mono font-medium">
                              {trainer.total_courses}
                            </span>
                          </td>
                          <td className={tdCls}>
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-mono font-medium">
                              {trainer.total_students}
                            </span>
                          </td>
                          <td className={tdCls}>
                            <span className="px-2.5 py-1 bg-red-100 text-[#EC0000] dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-mono font-medium">
                              {trainer.total_training_plans}
                            </span>
                          </td>
                          <td className={tdCls}>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ════════ Course Analytics ════════ */}
          {activeTab === 'courses' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {(() => {
                const total = courseAnalytics.length;
                const totalEnrollments = courseAnalytics.reduce((s, c) => s + c.total_enrollments, 0);
                const avgCompletion = total > 0 ? courseAnalytics.reduce((s, c) => s + c.avg_completion_rate, 0) / total : 0;
                const coursesWithMpu = courseAnalytics.filter(c => c.avg_mpu > 0);
                const avgMpu = coursesWithMpu.length > 0 ? coursesWithMpu.reduce((s, c) => s + c.avg_mpu, 0) / coursesWithMpu.length : 0;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KpiCard icon={BookOpen} label={t('advancedReports.totalCourses')} value={total} color="purple" />
                    <KpiCard icon={Users} label={t('advancedReports.totalEnrollments', 'Total Inscrições')} value={totalEnrollments} color="blue" />
                    <KpiCard icon={CheckCircle2} label={t('advancedReports.avgCompletionRate', 'Taxa Conclusão Média')} value={avgCompletion > 0 ? `${avgCompletion.toFixed(1)}%` : '—'} color="emerald" />
                    <KpiCard icon={Target} label={t('advancedReports.avgMpu')} value={avgMpu > 0 ? avgMpu.toFixed(2) : '—'} sub="min/op" color="amber" />
                  </div>
                );
              })()}

              <SectionCard icon={BookOpen} title={t('advancedReports.courseAnalyticsTable')}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#EC0000]">
                      <tr>
                        <th className={thCls}>{t('advancedReports.course')}</th>
                        <th className={thCls}>{t('advancedReports.bank')}</th>
                        <th className={thCls}>{t('advancedReports.service', 'Serviço')}</th>
                        <th className={thCls}>{t('advancedReports.lessons')}</th>
                        <th className={thCls}>{t('advancedReports.enrollments')}</th>
                        <th className={thCls}>{t('advancedReports.completion')}</th>
                        <th className={thCls}>{t('advancedReports.mpu')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {courseAnalytics.length === 0 ? (
                        <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">{t('advancedReports.noData')}</td></tr>
                      ) : courseAnalytics.map((course, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className={`${tdCls} font-medium`}>{course.course_title}</td>
                          <td className={tdCls}>
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-medium">{course.bank_code || '-'}</span>
                          </td>
                          <td className={tdCls}>
                            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg text-xs font-medium">{course.product_code || '-'}</span>
                          </td>
                          <td className={tdCls}><span className="font-mono">{course.total_lessons}</span></td>
                          <td className={tdCls}>
                            <span className="px-2.5 py-1 bg-red-100 text-[#EC0000] dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-mono font-medium">
                              {course.total_enrollments}
                            </span>
                          </td>
                          <td className={tdCls}>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              course.avg_completion_rate >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              course.avg_completion_rate >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>{course.avg_completion_rate?.toFixed(1) || 0}%</span>
                          </td>
                          <td className={tdCls}>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              course.avg_mpu > 0 && course.avg_mpu <= 5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              course.avg_mpu > 0 && course.avg_mpu <= 10 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              course.avg_mpu > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>{course.avg_mpu > 0 ? `${course.avg_mpu.toFixed(2)} min/op` : 'N/A'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ════════ Certifications ════════ */}
          {activeTab === 'certifications' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {(() => {
                const totalCerts = certifications.reduce((s, c) => s + c.certificates_issued, 0);
                const monthsWithData = certifications.filter(c => c.certificates_issued > 0);
                const avgPerMonth = monthsWithData.length > 0 ? totalCerts / monthsWithData.length : 0;
                const bestMonth = monthsWithData.length > 0 ? monthsWithData.reduce((best, c) => c.certificates_issued > best.certificates_issued ? c : best) : null;
                const avgCompletionDays = monthsWithData.length > 0
                  ? monthsWithData.reduce((s, c) => s + c.avg_completion_time_days, 0) / monthsWithData.length : 0;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KpiCard icon={Award} label={t('advancedReports.totalCertificates', 'Total Certificados')} value={totalCerts}
                      sub={t('advancedReports.allTime', 'desde o início')} color="red" />
                    <KpiCard icon={TrendingUp} label={t('advancedReports.avgPerMonth', 'Média por Mês')} value={avgPerMonth > 0 ? avgPerMonth.toFixed(1) : '—'}
                      sub={t('advancedReports.certificatesPerMonth', 'certificados/mês')} color="emerald" />
                    <KpiCard icon={ArrowUp} label={t('advancedReports.bestMonth', 'Melhor Mês')} value={bestMonth?.month ? formatMonth(bestMonth.month) : '—'}
                      sub={bestMonth ? `${bestMonth.certificates_issued} ${t('advancedReports.certificatesLabel', 'certificados')}` : undefined} color="amber" />
                    <KpiCard icon={Clock} label={t('advancedReports.avgCompletionTime', 'Tempo Médio Conclusão')} value={avgCompletionDays > 0 ? avgCompletionDays.toFixed(0) : '—'}
                      sub={t('advancedReports.days', 'dias')} color="purple" />
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                      <Award className="w-4 h-4 text-[#EC0000]" />
                    </div>
                    <h2 className="text-lg font-headline font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.certificationsOverTime')}
                    </h2>
                  </div>
                  {certifications.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={certifications}>
                        <defs>
                          <linearGradient id="certGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EC0000" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#EC0000" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={formatMonth} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                        <Tooltip
                          labelFormatter={formatMonth}
                          formatter={(value: number) => [value, t('advancedReports.certificatesIssued', 'Certificados Emitidos')]}
                        />
                        <Area type="monotone" dataKey="certificates_issued" stroke="#EC0000" strokeWidth={3}
                          fill="url(#certGradient)" dot={{ fill: '#EC0000', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">{t('advancedReports.noData')}</div>
                  )}
                </div>

                {/* Monthly Breakdown */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-[#EC0000]" />
                    </div>
                    <h2 className="text-lg font-headline font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.monthlyBreakdown', 'Resumo Mensal')}
                    </h2>
                  </div>
                  {certifications.length > 0 ? (
                    <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2">
                      {[...certifications].reverse().map((cert, idx) => {
                        const maxIssued = Math.max(...certifications.map(c => c.certificates_issued), 1);
                        const pct = (cert.certificates_issued / maxIssued) * 100;
                        return (
                          <div key={idx}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{formatMonth(cert.month)}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {cert.avg_completion_time_days > 0 ? `${cert.avg_completion_time_days.toFixed(0)}d` : ''}
                                </span>
                                <span className="text-sm font-mono font-bold text-[#EC0000]">
                                  {cert.certificates_issued}
                                </span>
                              </div>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  cert.certificates_issued > 0 ? 'bg-[#EC0000]' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-gray-500">{t('advancedReports.noData')}</div>
                  )}
                </div>
              </div>

              {/* Completion Time Chart */}
              {certifications.some(c => c.avg_completion_time_days > 0) && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <h2 className="text-lg font-headline font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.completionTimeEvolution', 'Evolução do Tempo de Conclusão')}
                    </h2>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={certifications}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={formatMonth} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip
                        labelFormatter={formatMonth}
                        formatter={(value: number) => [`${value.toFixed(1)} ${t('advancedReports.days', 'dias')}`, t('advancedReports.avgCompletionTime', 'Tempo Médio')]}
                      />
                      <Line type="monotone" dataKey="avg_completion_time_days" stroke="#f59e0b" strokeWidth={3}
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ════════ MPU Analytics ════════ */}
          {activeTab === 'mpu' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {(() => {
                const allItems = [...mpuData.by_bank, ...mpuData.by_service, ...mpuData.by_plan];
                const withMpu = allItems.filter(i => i.avg_mpu > 0);
                const avgMpu = withMpu.length > 0 ? withMpu.reduce((s, i) => s + i.avg_mpu, 0) / withMpu.length : 0;
                const bestItem = withMpu.length > 0 ? withMpu.reduce((best, i) => i.avg_mpu < best.avg_mpu ? i : best) : null;
                const totalSubs = allItems.reduce((s, i) => s + i.total_submissions, 0);
                const totalStudents = allItems.reduce((s, i) => s + i.total_students, 0);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KpiCard icon={Target} label={t('advancedReports.globalAvgMpu', 'MPU Médio Global')} value={avgMpu > 0 ? avgMpu.toFixed(2) : '—'} sub="min/op" color="emerald" />
                    <KpiCard icon={TrendingUp} label={t('advancedReports.bestPerformance', 'Melhor Performance')} value={bestItem?.name || '—'}
                      sub={bestItem ? `${bestItem.avg_mpu.toFixed(2)} min/op` : undefined} color="blue" />
                    <KpiCard icon={CheckCircle2} label={t('advancedReports.totalSubmissions', 'Total Submissões')} value={totalSubs}
                      sub={t('advancedReports.challengesCompleted', 'desafios realizados')} color="purple" />
                    <KpiCard icon={Users} label={t('advancedReports.studentsEvaluated', 'Formandos Avaliados')} value={totalStudents}
                      sub={t('advancedReports.withSubmissions', 'com submissões')} color="amber" />
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bank comparison */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-[#EC0000]" />
                    </div>
                    <h2 className="text-lg font-headline font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.mpuBankComparison', 'Comparação Banco vs Banco')}
                    </h2>
                  </div>
                  {mpuData.by_bank.filter(d => d.avg_mpu > 0).length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={Math.max(200, mpuData.by_bank.filter(d => d.avg_mpu > 0).length * 60)}>
                        <BarChart data={mpuData.by_bank.filter(d => d.avg_mpu > 0)} layout="vertical" margin={{ left: 10, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" strokeOpacity={0.2} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} unit=" min/op" />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#d1d5db', fontWeight: 500 }} width={140} />
                          <Tooltip formatter={(value: number) => [`${value.toFixed(2)} min/op`, 'MPU']} />
                          <Bar dataKey="avg_mpu" radius={[0, 8, 8, 0]} barSize={28}>
                            {mpuData.by_bank.filter(d => d.avg_mpu > 0).map((entry, index) => (
                              <Cell key={`bank-${index}`} fill={entry.avg_mpu <= 5 ? '#10b981' : entry.avg_mpu <= 10 ? '#f59e0b' : '#EC0000'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-2">
                        {mpuData.by_bank.filter(d => d.avg_mpu > 0).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                            <span>{item.name}</span>
                            <span className="font-mono">{item.total_submissions} sub. · {item.total_students} form.</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-gray-500">{t('advancedReports.noData')}</div>
                  )}
                </div>

                {/* Service comparison */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                      <Package className="w-4 h-4 text-[#EC0000]" />
                    </div>
                    <h2 className="text-lg font-headline font-semibold text-gray-900 dark:text-white">
                      {t('advancedReports.mpuServiceComparison', 'Comparação Serviço vs Serviço')}
                    </h2>
                  </div>
                  {mpuData.by_service.filter(d => d.avg_mpu > 0).length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={Math.max(200, mpuData.by_service.filter(d => d.avg_mpu > 0).length * 60)}>
                        <BarChart data={mpuData.by_service.filter(d => d.avg_mpu > 0)} layout="vertical" margin={{ left: 10, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" strokeOpacity={0.2} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} unit=" min/op" />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#d1d5db', fontWeight: 500 }} width={140} />
                          <Tooltip formatter={(value: number) => [`${value.toFixed(2)} min/op`, 'MPU']} />
                          <Bar dataKey="avg_mpu" radius={[0, 8, 8, 0]} barSize={28}>
                            {mpuData.by_service.filter(d => d.avg_mpu > 0).map((entry, index) => (
                              <Cell key={`svc-${index}`} fill={entry.avg_mpu <= 5 ? '#10b981' : entry.avg_mpu <= 10 ? '#f59e0b' : '#EC0000'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-2">
                        {mpuData.by_service.filter(d => d.avg_mpu > 0).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                            <span>{item.name}</span>
                            <span className="font-mono">{item.total_submissions} sub. · {item.total_students} form.</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-gray-500">{t('advancedReports.noData')}</div>
                  )}
                </div>
              </div>

              {/* MPU by Training Plan */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[#EC0000]" />
                  </div>
                  <h2 className="text-lg font-headline font-semibold text-gray-900 dark:text-white">
                    {t('advancedReports.mpuByPlan')}
                  </h2>
                </div>
                {mpuData.by_plan.filter(d => d.avg_mpu > 0).length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(200, mpuData.by_plan.filter(d => d.avg_mpu > 0).length * 50)}>
                    <BarChart data={mpuData.by_plan.filter(d => d.avg_mpu > 0)} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" strokeOpacity={0.2} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} unit=" min/op" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#d1d5db' }} width={160} />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(2)} min/op`, 'MPU']} />
                      <Bar dataKey="avg_mpu" radius={[0, 8, 8, 0]} barSize={22}>
                        {mpuData.by_plan.filter(d => d.avg_mpu > 0).map((entry, index) => (
                          <Cell key={`plan-${index}`} fill={entry.avg_mpu <= 5 ? '#10b981' : entry.avg_mpu <= 10 ? '#f59e0b' : '#EC0000'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-500">{t('advancedReports.noData')}</div>
                )}
              </div>

              {/* Combined MPU Details Table */}
              <SectionCard icon={BarChart3} title={t('advancedReports.mpuDetails')}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#EC0000]">
                      <tr>
                        <th className={thCls}>{t('advancedReports.type', 'Tipo')}</th>
                        <th className={thCls}>{t('advancedReports.name', 'Nome')}</th>
                        <th className={thCls}>{t('advancedReports.avgMpu', 'MPU Médio')}</th>
                        <th className={thCls}>{t('advancedReports.submissions', 'Submissões')}</th>
                        <th className={thCls}>{t('advancedReports.students', 'Alunos')}</th>
                        <th className={thCls}>{t('advancedReports.category', 'Categoria')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {(() => {
                        const rows = [
                          ...mpuData.by_bank.map(d => ({ ...d, type: t('advancedReports.bank', 'Banco') })),
                          ...mpuData.by_service.map(d => ({ ...d, type: t('advancedReports.service', 'Serviço') })),
                          ...mpuData.by_plan.map(d => ({ ...d, type: t('advancedReports.plan', 'Plano') })),
                        ];
                        if (rows.length === 0) {
                          return <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">{t('advancedReports.noData')}</td></tr>;
                        }
                        return rows.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className={tdCls}>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.type === t('advancedReports.bank', 'Banco') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                item.type === t('advancedReports.service', 'Serviço') ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>{item.type}</span>
                            </td>
                            <td className={`${tdCls} font-medium`}>{item.name}</td>
                            <td className={tdCls}>
                              <span className={`px-2 py-1 rounded-full text-xs font-mono font-medium ${
                                item.avg_mpu > 0 && item.avg_mpu <= 5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                item.avg_mpu > 0 && item.avg_mpu <= 10 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                item.avg_mpu > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                              }`}>{item.avg_mpu > 0 ? `${item.avg_mpu.toFixed(2)} min/op` : 'N/A'}</span>
                            </td>
                            <td className={tdCls}><span className="font-mono">{item.total_submissions}</span></td>
                            <td className={tdCls}><span className="font-mono">{item.total_students}</span></td>
                            <td className={tdCls}>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.performance_category === 'Excelente' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                item.performance_category === 'Bom' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                item.performance_category === 'Regular' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>{item.performance_category || 'N/A'}</span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
