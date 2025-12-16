import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, Users, BookOpen, Download, Target, Activity, Clock, Award } from 'lucide-react';
import api from '../../lib/axios';

interface ReportStats {
  total_users: number;
  total_students: number;
  total_trainers: number;
  total_courses: number;
  total_enrollments: number;
  total_certificates: number;
  pending_trainers: number;
  active_courses: number;
  total_training_plans: number;
  active_training_plans: number;
  avg_completion_rate: number;
  total_study_hours: number;
}

interface TrainingPlanStats {
  plan_title: string;
  trainer_name: string;
  total_students: number;
  enrolled_students: number;
  completion_rate: number;
  bank_code: string;
  status: string;
}

interface CourseStats {
  course_title: string;
  total_students: number;
  completion_rate: number;
  bank_code: string;
}

interface TrainerStats {
  trainer_name: string;
  total_courses: number;
  total_students: number;
  bank_code: string;
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [trainerStats, setTrainerStats] = useState<TrainerStats[]>([]);
  const [trainingPlanStats, setTrainingPlanStats] = useState<TrainingPlanStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBank, setSelectedBank] = useState('ALL');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [statsRes, coursesRes, trainersRes, plansRes] = await Promise.all([
        api.get('/api/admin/reports/stats'),
        api.get('/api/admin/reports/courses'),
        api.get('/api/admin/reports/trainers'),
        api.get('/api/admin/reports/training-plans'),
      ]);

      setStats(statsRes.data);
      setCourseStats(coursesRes.data);
      setTrainerStats(trainersRes.data);
      setTrainingPlanStats(plansRes.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    alert(t('reports.exportingPDF'));
    // TODO: Implement PDF export
  };

  const handleExportExcel = () => {
    alert(t('reports.exportingExcel'));
    // TODO: Implement Excel export
  };

  const filteredCourses = courseStats.filter(course => 
    selectedBank === 'ALL' || course.bank_code === selectedBank
  );

  const filteredTrainers = trainerStats.filter(trainer => 
    selectedBank === 'ALL' || trainer.bank_code === selectedBank
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/50">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                {t('reports.title')}
              </h1>
              <p className="text-gray-400">{t('reports.subtitle')}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('reports.dateFrom')}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('reports.dateTo')}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('reports.bank')}
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              >
                <option value="ALL">{t('reports.allBanks')}</option>
                <option value="PT">PT - Portugal</option>
                <option value="ES">ES - España</option>
                <option value="UN">UN - United Kingdom</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            {t('messages.loading')}
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-400" />
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stats?.total_users || 0}</div>
                <div className="text-sm text-gray-400">{t('reports.totalUsers')}</div>
                <div className="mt-2 text-xs text-gray-500">
                  {stats?.total_students || 0} {t('reports.students')} • {stats?.total_trainers || 0} {t('reports.trainers')}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-8 h-8 text-purple-400" />
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stats?.total_training_plans || 0}</div>
                <div className="text-sm text-gray-400">{t('reports.trainingPlans')}</div>
                <div className="mt-2 text-xs text-gray-500">
                  {stats?.active_training_plans || 0} {t('reports.active')}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-green-400" />
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stats?.avg_completion_rate?.toFixed(1) || 0}%</div>
                <div className="text-sm text-gray-400">{t('reports.avgCompletion')}</div>
                <div className="mt-2 text-xs text-gray-500">
                  {t('reports.allTrainings')}
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-orange-400" />
                  <Activity className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stats?.total_study_hours || 0}h</div>
                <div className="text-sm text-gray-400">{t('reports.totalStudyHours')}</div>
                <div className="mt-2 text-xs text-gray-500">
                  {t('reports.allStudents')}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="w-8 h-8 text-purple-400" />
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stats?.total_courses || 0}</div>
                <div className="text-sm text-gray-400">{t('reports.totalCourses')}</div>
                <div className="mt-2 text-xs text-gray-500">
                  {stats?.active_courses || 0} {t('reports.active')}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-green-400" />
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stats?.total_enrollments || 0}</div>
                <div className="text-sm text-gray-400">{t('reports.totalEnrollments')}</div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-8 h-8 text-yellow-400" />
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stats?.total_certificates || 0}</div>
                <div className="text-sm text-gray-400">{t('reports.totalCertificates')}</div>
              </div>
            </div>

            {/* Course Performance */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-red-400" />
                {t('reports.coursePerformance')}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        {t('reports.courseName')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        {t('reports.bank')}
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                        {t('reports.students')}
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                        {t('reports.completionRate')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                          {t('reports.noCourses')}
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map((course, index) => (
                        <tr key={index} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-white">{course.course_title}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs">
                              {course.bank_code}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-300">
                            {course.total_students}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-green-600"
                                  style={{ width: `${course.completion_rate}%` }}
                                />
                              </div>
                              <span className="text-gray-300 text-sm">
                                {course.completion_rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Training Plans Overview */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-red-400" />
                {t('reports.trainingPlanOverview')}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        {t('reports.planName')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        {t('reports.trainer')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        {t('reports.bank')}
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                        {t('reports.enrollment')}
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                        {t('reports.completion')}
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                        {t('reports.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingPlanStats.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                          {t('reports.noPlans')}
                        </td>
                      </tr>
                    ) : (
                      trainingPlanStats
                        .filter(plan => selectedBank === 'ALL' || plan.bank_code === selectedBank)
                        .map((plan, index) => (
                          <tr key={index} className="hover:bg-white/5 transition-colors border-b border-white/5">
                            <td className="px-4 py-3 text-white font-medium">{plan.plan_title}</td>
                            <td className="px-4 py-3 text-gray-400">{plan.trainer_name}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs">
                                {plan.bank_code}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300">
                              {plan.enrolled_students}/{plan.total_students}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                                    style={{ width: `${plan.completion_rate}%` }}
                                  />
                                </div>
                                <span className="text-gray-300 text-sm">
                                  {plan.completion_rate}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${
                                plan.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                plan.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {t(`reports.${plan.status}`)}
                              </span>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trainer Performance */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-red-400" />
                {t('reports.trainerPerformance')}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        {t('reports.trainerName')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        {t('reports.bank')}
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                        {t('reports.courses')}
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                        {t('reports.students')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredTrainers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                          {t('reports.noTrainers')}
                        </td>
                      </tr>
                    ) : (
                      filteredTrainers.map((trainer, index) => (
                        <tr key={index} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-white">{trainer.trainer_name}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs">
                              {trainer.bank_code}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-300">
                            {trainer.total_courses}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-300">
                            {trainer.total_students}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
