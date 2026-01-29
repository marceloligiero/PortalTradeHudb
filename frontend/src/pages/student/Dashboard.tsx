import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Clock, 
  Target,
  CheckCircle2,
  TrendingUp,
  PlayCircle,
  ChevronRight,
  Zap
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import TrainingPlanCard from '../../components/plans/TrainingPlanCard';
import { PremiumHeader, AnimatedStatCard, FloatingOrbs } from '../../components/premium';

interface StudentStats {
  total_enrollments: number;
  completed_enrollments: number;
  total_training_plans: number;
  active_training_plans: number;
  total_lessons_started: number;
  completed_lessons: number;
  total_study_hours: number;
  certificates: number;
  total_submissions: number;
  approved_submissions: number;
  avg_mpu: number;
  completion_rate: number;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function StudentDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) return;
    fetchData();
  }, [token, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, plansRes] = await Promise.all([
        api.get('/api/student/stats'),
        api.get('/api/training-plans/')
      ]);
      setStats(statsRes.data);
      setPlans(plansRes.data?.slice(0, 6) || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <PremiumHeader
        icon={GraduationCap}
        title={t('dashboard.student.title')}
        subtitle={t('dashboard.student.subtitle')}
        badge="Área do Formando"
        iconColor="from-red-500 to-red-700"
      />

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatedStatCard
          icon={BookOpen}
          label={t('dashboard.student.activeCourses')}
          value={stats?.total_enrollments || 0}
          color="from-red-500 to-red-700"
          delay={0}
        />
        <AnimatedStatCard
          icon={Clock}
          label={t('dashboard.student.studyHours')}
          value={stats?.total_study_hours || 0}
          suffix="h"
          color="from-blue-500 to-blue-700"
          delay={0.1}
        />
        <AnimatedStatCard
          icon={Award}
          label={t('dashboard.student.certificates')}
          value={stats?.certificates || 0}
          color="from-yellow-500 to-orange-600"
          delay={0.2}
        />
        <AnimatedStatCard
          icon={Target}
          label="Taxa de Conclusão"
          value={stats?.completion_rate || 0}
          suffix="%"
          color="from-green-500 to-emerald-600"
          delay={0.3}
        />
      </div>

      {/* Secondary Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        <motion.div variants={cardVariants} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-lg dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Planos Atribuídos</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_training_plans || 0}</div>
        </motion.div>
        
        <motion.div variants={cardVariants} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-lg dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <PlayCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Planos Ativos</span>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.active_training_plans || 0}</div>
        </motion.div>
        
        <motion.div variants={cardVariants} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-lg dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Aulas Iniciadas</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_lessons_started || 0}</div>
        </motion.div>
        
        <motion.div variants={cardVariants} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-lg dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Aulas Concluídas</span>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.completed_lessons || 0}</div>
        </motion.div>
        
        <motion.div variants={cardVariants} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-lg dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Desafios Feitos</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_submissions || 0}</div>
        </motion.div>
        
        <motion.div variants={cardVariants} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-lg dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">MPU Médio</span>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats?.avg_mpu || 0}</div>
        </motion.div>
      </motion.div>

      {/* Assigned Training Plans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative overflow-hidden bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-lg dark:shadow-none"
      >
        <FloatingOrbs variant="subtle" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('trainingPlan.myPlans')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Formações atribuídas a si</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/courses')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-sm"
            >
              Ver Cursos
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          {plans.length === 0 ? (
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              </motion.div>
              <p className="text-gray-400 text-lg mb-2">{t('trainingPlan.noAssignedPlans')}</p>
              <p className="text-gray-500">{t('trainingPlan.contactTrainer')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <TrainingPlanCard plan={plan} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/courses')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 hover:border-red-500/30 transition-all text-left group shadow-lg dark:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">Meus Cursos</p>
            <p className="text-xs text-gray-500">Ver formações</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/certificates')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 hover:border-yellow-500/30 transition-all text-left group shadow-lg dark:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-yellow-500 dark:group-hover:text-yellow-400 transition-colors">Certificados</p>
            <p className="text-xs text-gray-500">Ver conquistas</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/reports')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 hover:border-green-500/30 transition-all text-left group shadow-lg dark:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors">Relatórios</p>
            <p className="text-xs text-gray-500">Ver progresso</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 hover:border-blue-500/30 transition-all text-left group shadow-lg dark:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{stats?.total_study_hours || 0}h</p>
            <p className="text-xs text-gray-500">Tempo de estudo</p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}
