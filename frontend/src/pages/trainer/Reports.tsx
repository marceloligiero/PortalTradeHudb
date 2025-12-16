import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, BookOpen, Clock, CheckCircle, 
  XCircle, Download, Filter, BarChart3,
  Target, Activity
} from 'lucide-react';
import api from '../../lib/axios';

interface TrainerOverview {
  total_plans: number;
  active_plans: number;
  completed_plans: number;
  total_students: number;
  active_students: number;
  avg_completion_rate: number;
  total_lessons: number;
  completed_lessons: number;
}

interface PlanProgress {
  plan_id: number;
  plan_title: string;
  bank_code: string;
  total_students: number;
  active_students: number;
  completion_rate: number;
  avg_progress: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'upcoming';
}

interface StudentProgress {
  student_name: string;
  student_email: string;
  plan_title: string;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  last_activity: string;
  status: 'active' | 'completed' | 'at_risk';
}

interface LessonMetrics {
  lesson_title: string;
  plan_title: string;
  total_students: number;
  completed: number;
  in_progress: number;
  not_started: number;
  avg_completion_time: number;
}

export default function TrainerReportsPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<TrainerOverview | null>(null);
  const [planProgress, setPlanProgress] = useState<PlanProgress[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [lessonMetrics, setLessonMetrics] = useState<LessonMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBank, setSelectedBank] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [overviewRes, plansRes, studentsRes, lessonsRes] = await Promise.all([
        api.get('/api/trainer/reports/overview'),
        api.get('/api/trainer/reports/plans'),
        api.get('/api/trainer/reports/students'),
        api.get('/api/trainer/reports/lessons'),
      ]);

      setOverview(overviewRes.data);
      setPlanProgress(plansRes.data);
      setStudentProgress(studentsRes.data);
      setLessonMetrics(lessonsRes.data);
    } catch (error) {
      console.error('Error fetching trainer reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    alert(t('trainerReports.exportingPDF'));
  };

  const handleExportExcel = () => {
    alert(t('trainerReports.exportingExcel'));
  };

  const applyFilters = () => {
    fetchReports();
  };

  const filteredPlans = planProgress.filter(plan => {
    const bankMatch = selectedBank === 'ALL' || plan.bank_code === selectedBank;
    const statusMatch = selectedStatus === 'ALL' || plan.status === selectedStatus;
    return bankMatch && statusMatch;
  });

  const filteredStudents = studentProgress.filter(student => {
    const statusMatch = selectedStatus === 'ALL' || student.status === selectedStatus;
    return statusMatch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      upcoming: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      at_risk: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[status as keyof typeof styles] || styles.active;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            {t('trainerReports.title')}
          </h1>
          <p className="text-gray-400 mt-1">{t('trainerReports.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-semibold text-white">{t('trainerReports.filters')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('trainerReports.dateFrom')}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('trainerReports.dateTo')}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('trainerReports.bank')}
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="ALL">{t('trainerReports.allBanks')}</option>
              <option value="PT">Portugal</option>
              <option value="ES">España</option>
              <option value="UN">United Kingdom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('trainerReports.status')}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="ALL">{t('trainerReports.allStatuses')}</option>
              <option value="active">{t('trainerReports.activeStatus')}</option>
              <option value="completed">{t('trainerReports.completedStatus')}</option>
              <option value="upcoming">{t('trainerReports.upcomingStatus')}</option>
            </select>
          </div>
        </div>
        <button
          onClick={applyFilters}
          className="mt-4 px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all"
        >
          {t('trainerReports.applyFilters')}
        </button>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t('trainerReports.totalPlans')}</p>
                <p className="text-3xl font-bold text-white mt-1">{overview.total_plans}</p>
                <p className="text-sm text-blue-400 mt-2">
                  {overview.active_plans} {t('trainerReports.active').toLowerCase()}
                </p>
              </div>
              <BookOpen className="w-12 h-12 text-blue-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t('trainerReports.totalStudents')}</p>
                <p className="text-3xl font-bold text-white mt-1">{overview.total_students}</p>
                <p className="text-sm text-green-400 mt-2">
                  {overview.active_students} {t('trainerReports.active').toLowerCase()}
                </p>
              </div>
              <Users className="w-12 h-12 text-green-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t('trainerReports.avgCompletion')}</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {overview.avg_completion_rate.toFixed(1)}%
                </p>
                <p className="text-sm text-purple-400 mt-2">
                  {t('trainerReports.allPlans')}
                </p>
              </div>
              <Target className="w-12 h-12 text-purple-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t('trainerReports.completedLessons')}</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {overview.completed_lessons}/{overview.total_lessons}
                </p>
                <p className="text-sm text-orange-400 mt-2">
                  {((overview.completed_lessons / overview.total_lessons) * 100).toFixed(0)}%
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-orange-400 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Training Plans Progress */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-semibold text-white">{t('trainerReports.planProgress')}</h2>
        </div>
        
        {filteredPlans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.planName')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.bank')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.students')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.completion')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.avgProgress')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr key={plan.plan_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">{plan.plan_title}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                        {plan.bank_code}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-white">{plan.active_students}/{plan.total_students}</div>
                      <div className="text-xs text-gray-400">{t('trainerReports.active')}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all"
                            style={{ width: `${plan.completion_rate}%` }}
                          />
                        </div>
                        <span className="text-sm text-white min-w-[3rem] text-right">
                          {plan.completion_rate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {plan.avg_progress.toFixed(0)}%
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-sm border ${getStatusBadge(plan.status)}`}>
                        {t(`trainerReports.${plan.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">{t('trainerReports.noPlans')}</p>
        )}
      </div>

      {/* Student Progress */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-semibold text-white">{t('trainerReports.studentProgress')}</h2>
        </div>
        
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.studentName')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.planName')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.progress')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.lessons')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.lastActivity')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">{student.student_name}</div>
                      <div className="text-sm text-gray-400">{student.student_email}</div>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {student.plan_title}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-white min-w-[3rem] text-right">
                          {student.progress.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {student.completed_lessons}/{student.total_lessons}
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {new Date(student.last_activity).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-sm border ${getStatusBadge(student.status)}`}>
                        {t(`trainerReports.${student.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">{t('trainerReports.noStudents')}</p>
        )}
      </div>

      {/* Lesson Metrics */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-semibold text-white">{t('trainerReports.lessonMetrics')}</h2>
        </div>
        
        {lessonMetrics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.lessonName')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.planName')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.completed')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.inProgress')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.notStarted')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('trainerReports.avgTime')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {lessonMetrics.map((lesson, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-medium text-white">
                      {lesson.lesson_title}
                    </td>
                    <td className="py-4 px-4 text-gray-400">
                      {lesson.plan_title}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-white">{lesson.completed}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-white">{lesson.in_progress}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{lesson.not_started}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {lesson.avg_completion_time}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">{t('trainerReports.noLessons')}</p>
        )}
      </div>
    </div>
  );
}
