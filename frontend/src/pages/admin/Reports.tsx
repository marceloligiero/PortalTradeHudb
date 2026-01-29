import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, Users, BookOpen, Download, Target, Activity, Clock, Award, ArrowUp, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion } from 'framer-motion';
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

interface Bank {
  id: number;
  code: string;
  name: string;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6'];

export default function ReportsPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [trainerStats, setTrainerStats] = useState<TrainerStats[]>([]);
  const [trainingPlanStats, setTrainingPlanStats] = useState<TrainingPlanStats[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
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
      const [statsRes, coursesRes, trainersRes, plansRes, banksRes] = await Promise.all([
        api.get('/api/admin/reports/stats'),
        api.get('/api/admin/reports/courses'),
        api.get('/api/admin/reports/trainers'),
        api.get('/api/admin/reports/training-plans'),
        api.get('/api/admin/banks'),
      ]);

      setStats(statsRes.data || {});
      setCourseStats(coursesRes.data || []);
      setTrainerStats(trainersRes.data || []);
      setTrainingPlanStats(plansRes.data || []);
      setBanks(banksRes.data || []);
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

  const filteredCourses = (courseStats || []).filter(course => 
    selectedBank === 'ALL' || course.bank_code === selectedBank
  );

  const filteredTrainers = (trainerStats || []).filter(trainer => 
    selectedBank === 'ALL' || trainer.bank_code === selectedBank
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Preparar dados para gráficos
  const userDistribution = [
    { name: 'Formandos', value: stats.total_students || 0, color: '#ef4444' },
    { name: 'Formadores', value: stats.total_trainers || 0, color: '#f97316' },
  ];

  const courseData = (courseStats || []).slice(0, 6).map(course => ({
    name: course.course_title?.substring(0, 20) + '...' || 'Curso',
    students: course.total_students || 0,
    completion: Math.round(course.completion_rate || 0),
  }));

  const trainingPlanData = (trainingPlanStats || []).slice(0, 5).map(plan => ({
    plan: plan.plan_title?.substring(0, 15) + '...' || 'Plano',
    students: plan.enrolled_students || 0,
    completion: Math.round(plan.completion_rate || 0),
    capacity: plan.total_students || 0,
  }));

  const trainerPerformanceData = (trainerStats || []).slice(0, 5).map(trainer => ({
    name: trainer.trainer_name?.split(' ')[0] || 'Formador',
    courses: trainer.total_courses || 0,
    students: trainer.total_students || 0,
    efficiency: Math.min(100, ((trainer.total_students || 0) / ((trainer.total_courses || 1) * 20)) * 100),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-black p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-2xl shadow-red-900/50 relative">
                <BarChart3 className="w-8 h-8 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-gray-100 dark:to-gray-300">
                  {t('reports.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-medium">{t('reports.subtitle')}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportExcel}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-green-900/50 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Excel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportPDF}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg shadow-red-900/50 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                PDF
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-blue-50 dark:bg-gradient-to-br dark:from-blue-600/20 dark:to-blue-900/20 backdrop-blur-xl border border-blue-200 dark:border-blue-500/30 rounded-2xl p-6 shadow-lg dark:shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-600/30 flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-sm font-bold">12%</span>
                </div>
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                {(stats.total_users || 0).toLocaleString()}
              </div>
              <div className="text-blue-700 dark:text-blue-300 font-semibold">Total de Utilizadores</div>
              <div className="mt-3 flex gap-2 text-sm">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 rounded-lg text-blue-700 dark:text-blue-300">
                  {stats.total_students || 0} Formandos
                </span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 rounded-lg text-purple-700 dark:text-purple-300">
                  {stats.total_trainers || 0} Formadores
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-red-50 dark:bg-gradient-to-br dark:from-red-600/20 dark:to-red-900/20 backdrop-blur-xl border border-red-200 dark:border-red-500/30 rounded-2xl p-6 shadow-lg dark:shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-red-100 dark:bg-red-600/30 flex items-center justify-center backdrop-blur-sm">
                  <BookOpen className="w-7 h-7 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-sm font-bold">8%</span>
                </div>
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                {(stats.total_courses || 0).toLocaleString()}
              </div>
              <div className="text-red-700 dark:text-red-300 font-semibold">Total de Cursos</div>
              <div className="mt-3 flex gap-2 text-sm">
                <span className="px-2 py-1 bg-red-100 dark:bg-red-500/20 rounded-lg text-red-700 dark:text-red-300">
                  {stats.active_courses || 0} Ativos
                </span>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-500/20 rounded-lg text-orange-700 dark:text-orange-300">
                  {stats.total_training_plans || 0} Planos
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-green-50 dark:bg-gradient-to-br dark:from-green-600/20 dark:to-green-900/20 backdrop-blur-xl border border-green-200 dark:border-green-500/30 rounded-2xl p-6 shadow-lg dark:shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-600/30 flex items-center justify-center backdrop-blur-sm">
                  <Target className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-sm font-bold">15%</span>
                </div>
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                {Math.round(stats.avg_completion_rate || 0)}%
              </div>
              <div className="text-green-700 dark:text-green-300 font-semibold">Taxa de Conclusão</div>
              <div className="mt-3">
                <div className="w-full bg-green-200 dark:bg-green-900/30 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.avg_completion_rate || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-purple-50 dark:bg-gradient-to-br dark:from-purple-600/20 dark:to-purple-900/20 backdrop-blur-xl border border-purple-200 dark:border-purple-500/30 rounded-2xl p-6 shadow-lg dark:shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-600/30 flex items-center justify-center backdrop-blur-sm">
                  <Award className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-bold">Hot!</span>
                </div>
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                {(stats.total_certificates || 0).toLocaleString()}
              </div>
              <div className="text-purple-700 dark:text-purple-300 font-semibold">Certificados Emitidos</div>
              <div className="mt-3 flex gap-2 text-sm">
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 rounded-lg text-purple-700 dark:text-purple-300">
                  {stats.total_enrollments || 0} Inscrições
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-lg dark:shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Distribuição de Utilizadores
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total: {stats.total_users || 0}</div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Course Performance Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-lg dark:shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                Performance dos Cursos
              </h3>
              <select 
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:border-red-500 focus:outline-none"
              >
                <option value="ALL">{t('common.allBanks')}</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.code}>{bank.name}</option>
                ))}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="students" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Training Plan Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-lg dark:shadow-2xl lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Progresso dos Planos de Formação
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trainingPlanData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="plan" type="category" stroke="#9ca3af" width={120} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar dataKey="students" fill="#f97316" name="Estudantes" radius={[0, 8, 8, 0]} />
                <Bar dataKey="completion" fill="#22c55e" name="Conclusão %" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Trainer Performance Radar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-lg dark:shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                Top Formadores
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={trainerPerformanceData}>
                <PolarGrid stroke="rgba(255,255,255,0.2)" />
                <PolarAngleAxis dataKey="name" stroke="#9ca3af" />
                <PolarRadiusAxis stroke="#9ca3af" />
                <Radar name="Cursos" dataKey="courses" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Radar name="Alunos" dataKey="students" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-lg dark:shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Estatísticas Detalhadas
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-red-300 dark:hover:border-red-500/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-600/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Cursos Ativos</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active_courses || 0}</div>
                  </div>
                </div>
                <ArrowUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-600/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Planos Ativos</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active_training_plans || 0}</div>
                  </div>
                </div>
                <ArrowUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-600/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Inscrições Totais</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_enrollments || 0}</div>
                  </div>
                </div>
                <ArrowUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-yellow-300 dark:hover:border-yellow-500/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-600/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Pendentes</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending_trainers || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-600/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Horas de Estudo</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.total_study_hours || 0).toLocaleString()}h</div>
                  </div>
                </div>
                <ArrowUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-green-300 dark:hover:border-green-500/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-600/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Certificados</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_certificates || 0}</div>
                  </div>
                </div>
                <Zap className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
