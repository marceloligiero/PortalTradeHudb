import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, BookOpen, GraduationCap, UserCheck, Shield, TrendingUp, 
  Target, Clock, CheckCircle, XCircle, Calendar, Award,
  BarChart3, FileText, AlertCircle, ArrowRight, Play, Building2, Package, Layers,
  Sparkles, Zap, Activity
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

// Animated Counter Component
const AnimatedCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{count}{suffix}</span>;
};

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
    // New fields from expanded API
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

  const [activePlans, setActivePlans] = useState<ActivePlan[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch paginated users to get the total count
        const usersResp = await api.get('/api/admin/users?page=1&page_size=1');
        const usersTotal = usersResp.data?.total ?? 0;

        // Fetch aggregated stats
        const statsResp = await api.get('/api/admin/reports/stats');
        const statsData = statsResp.data ?? {};

        // Fetch training plans
        const plansResp = await api.get('/api/training-plans/');
        const plans = plansResp.data ?? [];
        const activePlansData = plans.filter((p: any) => {
          if (!p.end_date) return true;
          return new Date(p.end_date) >= new Date();
        });

        setStats({
          totalUsers: usersTotal,
          totalCourses: statsData.total_courses ?? 0,
          totalTrainers: statsData.total_trainers ?? 0,
          totalStudents: statsData.total_students ?? 0,
          activePlans: activePlansData.length,
          pendingTrainers: statsData.pending_trainers ?? 0,
          // New fields
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

        // Set recent submissions from API
        setRecentSubmissions(statsData.recent_submissions ?? []);

        setActivePlans(activePlansData.slice(0, 5).map((p: any) => ({
          id: p.id,
          title: p.title,
          student_name: p.student?.full_name ?? t('adminDashboard.notAssigned'),
          trainer_name: p.trainer?.full_name ?? t('adminDashboard.notAssigned'),
          days_remaining: p.end_date ? Math.max(0, Math.ceil((new Date(p.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0,
          total_courses: p.total_courses ?? 0,
        })));

      } catch (e) {
        console.error('Error fetching admin stats:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const mainStats = [
    {
      icon: Users,
      title: t('adminDashboard.totalUsers'),
      value: stats.totalUsers,
      color: 'from-red-500 to-red-600',
      shadow: 'shadow-red-500/20',
      glow: 'hover:shadow-red-500/40',
    },
    {
      icon: GraduationCap,
      title: t('adminDashboard.activeStudents'),
      value: stats.totalStudents,
      color: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/20',
      glow: 'hover:shadow-blue-500/40',
    },
    {
      icon: UserCheck,
      title: t('adminDashboard.trainers'),
      value: stats.totalTrainers,
      color: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/20',
      glow: 'hover:shadow-purple-500/40',
    },
    {
      icon: BookOpen,
      title: t('adminDashboard.availableCourses'),
      value: stats.totalCourses,
      color: 'from-green-500 to-green-600',
      shadow: 'shadow-green-500/20',
      glow: 'hover:shadow-green-500/40',
    },
  ];

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 via-gray-100 to-gray-50 dark:from-[#0a0a0a] dark:via-[#0f0f0f] dark:to-[#0a0a0a] text-gray-900 dark:text-white transition-colors duration-300">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-10 dark:opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(220, 38, 38, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(220, 38, 38, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] bg-red-600/5 dark:bg-red-600/10"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] bg-blue-600/5 dark:bg-blue-600/10"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-[100px] bg-purple-600/5 dark:bg-purple-600/10"
        />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-b border-gray-200 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-black/20"
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-5">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-red-500 dark:text-red-400" />
                <span className="text-red-500 dark:text-red-400 text-sm font-bold uppercase tracking-widest">{t('adminDashboard.controlPanel')}</span>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-white dark:to-white/60 bg-clip-text text-transparent">
                {t('adminDashboard.portalAdmin')}
              </h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-white/50 mt-4 max-w-2xl text-lg">
            {t('adminDashboard.subtitle')}
          </p>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Main Stats Row */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {mainStats.map((stat, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`relative group bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-500 shadow-xl ${stat.shadow} ${stat.glow}`}
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <motion.div 
                    whileHover={{ rotate: 10 }}
                    className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}
                  >
                    <stat.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <Activity className="w-3 h-3 text-green-500 dark:text-green-400" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">{t('adminDashboard.active')}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-2">{stat.title}</p>
                <p className="text-5xl font-black text-gray-900 dark:text-white">
                  <AnimatedCounter value={stat.value} />
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Secondary Stats - 6 cards now */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {/* Active Training Plans */}
          <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-gray-200 dark:border-white/10 hover:border-orange-500/30 transition-all cursor-pointer group">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-orange-500 dark:text-orange-400"><AnimatedCounter value={stats.activePlans} /></p>
            <p className="text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-wider mt-1">{t('adminDashboard.activePlans')}</p>
          </motion.div>

          {/* Pending Trainers */}
          <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-gray-200 dark:border-white/10 hover:border-yellow-500/30 transition-all cursor-pointer group">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:shadow-yellow-500/40 transition-all">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-yellow-500 dark:text-yellow-400"><AnimatedCounter value={stats.pendingTrainers} /></p>
            <p className="text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-wider mt-1">{t('adminDashboard.pending')}</p>
          </motion.div>

          {/* Challenges */}
          <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-gray-200 dark:border-white/10 hover:border-pink-500/30 transition-all cursor-pointer group">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-all">
                <Target className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-pink-500 dark:text-pink-400"><AnimatedCounter value={stats.totalChallenges} /></p>
            <p className="text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-wider mt-1">{t('adminDashboard.challenges')}</p>
          </motion.div>

          {/* Approval Rate */}
          <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-gray-200 dark:border-white/10 hover:border-green-500/30 transition-all cursor-pointer group">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-all">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-green-500 dark:text-green-400"><AnimatedCounter value={stats.approvalRate} suffix="%" /></p>
            <p className="text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-wider mt-1">{t('adminDashboard.approval')}</p>
          </motion.div>

          {/* Average MPU */}
          <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-gray-200 dark:border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-cyan-500 dark:text-cyan-400">{stats.avgMpu}</p>
            <p className="text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-wider mt-1">{t('adminDashboard.avgMpu')}</p>
          </motion.div>

          {/* Certificates */}
          <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-gray-200 dark:border-white/10 hover:border-amber-500/30 transition-all cursor-pointer group">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all">
                <Award className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-amber-500 dark:text-amber-400"><AnimatedCounter value={stats.totalCertificates} /></p>
            <p className="text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-wider mt-1">{t('adminDashboard.certificates')}</p>
          </motion.div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Training Plans List */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden hover:border-gray-300 dark:hover:border-white/20 transition-all"
          >
            <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-red-600/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('adminDashboard.trainingPlans')}</h2>
                    <p className="text-xs text-gray-500 dark:text-white/40">{t('adminDashboard.inProgress')}</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/training-plans')}
                  className="flex items-center gap-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-sm font-semibold"
                >
                  {t('adminDashboard.viewAll')} <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {activePlans.length > 0 ? (
                activePlans.map((plan, idx) => (
                  <motion.div 
                    key={plan.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    className="p-4 cursor-pointer transition-all"
                    onClick={() => navigate(`/trainer/training-plan/${plan.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-gray-900 dark:text-white font-semibold">{plan.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-white/40">
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
                      <div className="text-right">
                        <span className={`text-sm font-bold px-2 py-1 rounded-full ${plan.days_remaining <= 7 ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' : 'bg-green-500/20 text-green-600 dark:text-green-400'}`}>
                          {plan.days_remaining} {t('adminDashboard.days')}
                        </span>
                        <p className="text-xs text-gray-400 dark:text-white/30 mt-1">{plan.total_courses} {t('adminDashboard.coursesCount')}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-white/20" />
                  <p className="text-gray-500 dark:text-white/40">{t('adminDashboard.noActivePlans')}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Challenges */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden hover:border-gray-300 dark:hover:border-white/20 transition-all shadow-lg dark:shadow-none"
          >
            <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-purple-600/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('adminDashboard.latestChallenges')}</h2>
                    <p className="text-xs text-gray-500 dark:text-white/40">{t('adminDashboard.recentSubmissions')}</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/reports')}
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm font-semibold"
                >
                  {t('adminDashboard.viewReports')} <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {recentSubmissions.length > 0 ? (
                recentSubmissions.map((sub, idx) => (
                  <motion.div 
                    key={sub.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    onClick={() => navigate(`/challenges/result/${sub.id}`)}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-gray-900 dark:text-white font-semibold">{sub.challenge_title}</h3>
                        <p className="text-sm text-gray-500 dark:text-white/40">{sub.student_name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-white/40">MPU</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{sub.calculated_mpu?.toFixed(2) ?? '-'}</p>
                        </div>
                        {sub.is_approved ? (
                          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-red-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-white/20" />
                  <p className="text-gray-500 dark:text-white/40">{t('adminDashboard.noSubmissions')}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Platform Overview - Catalog Info */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 p-8 hover:border-gray-300 dark:hover:border-white/20 transition-all shadow-lg dark:shadow-none"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('adminDashboard.platformCatalog')}</h2>
              <p className="text-gray-500 dark:text-white/40 text-sm">{t('adminDashboard.availableResources')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <motion.div whileHover={{ scale: 1.05, y: -5 }} className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl p-5 text-center border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white"><AnimatedCounter value={stats.totalBanks} /></p>
              <p className="text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-wider mt-1">{t('adminDashboard.banks')}</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -5 }} className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-5 text-center border border-green-500/20 hover:border-green-500/40 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-all">
                <Package className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white"><AnimatedCounter value={stats.totalProducts} /></p>
              <p className="text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-wider mt-1">{t('adminDashboard.products')}</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -5 }} className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl p-5 text-center border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white"><AnimatedCounter value={stats.totalCourses} /></p>
              <p className="text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-wider mt-1">{t('adminDashboard.courses')}</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -5 }} className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-2xl p-5 text-center border border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white"><AnimatedCounter value={stats.totalLessons} /></p>
              <p className="text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-wider mt-1">{t('adminDashboard.lessons')}</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -5 }} className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 rounded-2xl p-5 text-center border border-pink-500/20 hover:border-pink-500/40 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:shadow-pink-500/50 transition-all">
                <Target className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white"><AnimatedCounter value={stats.totalChallenges} /></p>
              <p className="text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-wider mt-1">{t('adminDashboard.challenges')}</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -5 }} className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-2xl p-5 text-center border border-cyan-500/20 hover:border-cyan-500/40 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-all">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalStudyHours.toFixed(0)}h</p>
              <p className="text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-wider mt-1">{t('adminDashboard.studyHours')}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <motion.button 
            variants={fadeInUp}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/users')}
            className="bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-red-500/50 rounded-2xl p-5 transition-all duration-300 group text-left shadow-lg dark:shadow-none"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 group-hover:scale-110 transition-all">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">{t('adminDashboard.manageUsers')}</p>
                <p className="text-gray-500 dark:text-white/40 text-sm">{t('adminDashboard.addOrEdit')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 dark:text-white/20 group-hover:text-red-400 ml-auto transition-colors" />
            </div>
          </motion.button>

          <motion.button 
            variants={fadeInUp}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/courses')}
            className="bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-blue-500/50 rounded-2xl p-5 transition-all duration-300 group text-left shadow-lg dark:shadow-none"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 group-hover:scale-110 transition-all">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">{t('adminDashboard.manageCourses')}</p>
                <p className="text-gray-500 dark:text-white/40 text-sm">{t('adminDashboard.courseCatalog')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 dark:text-white/20 group-hover:text-blue-400 ml-auto transition-colors" />
            </div>
          </motion.button>

          <motion.button 
            variants={fadeInUp}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/training-plan/new')}
            className="bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-green-500/50 rounded-2xl p-5 transition-all duration-300 group text-left shadow-lg dark:shadow-none"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 group-hover:scale-110 transition-all">
                <Play className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">{t('adminDashboard.newPlan')}</p>
                <p className="text-gray-500 dark:text-white/40 text-sm">{t('adminDashboard.createTraining')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 dark:text-white/20 group-hover:text-green-400 ml-auto transition-colors" />
            </div>
          </motion.button>

          <motion.button 
            variants={fadeInUp}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/reports')}
            className="bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-purple-500/50 rounded-2xl p-5 transition-all duration-300 group text-left shadow-lg dark:shadow-none"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 group-hover:scale-110 transition-all">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">{t('adminDashboard.reports')}</p>
                <p className="text-gray-500 dark:text-white/40 text-sm">{t('adminDashboard.detailedAnalytics')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 dark:text-white/20 group-hover:text-purple-400 ml-auto transition-colors" />
            </div>
          </motion.button>
        </motion.div>

        {/* Pending Validations Alert */}
        {stats.pendingTrainers > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            whileHover={{ scale: 1.01 }}
            className="relative overflow-hidden bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/30 rounded-3xl p-8 cursor-pointer hover:border-yellow-500/50 transition-all"
            onClick={() => navigate('/trainers')}
          >
            {/* Animated glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 animate-pulse" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30"
                >
                  <AlertCircle className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-black text-xl">{t('adminDashboard.trainersAwaitingValidation')}</h3>
                  <p className="text-gray-500 dark:text-white/50 text-lg">
                    {t('adminDashboard.trainersAwaitingApproval', { count: stats.pendingTrainers })}
                  </p>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 flex items-center gap-2"
              >
                <Zap className="w-5 h-5" />
                {t('adminDashboard.validateNow')} 
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
