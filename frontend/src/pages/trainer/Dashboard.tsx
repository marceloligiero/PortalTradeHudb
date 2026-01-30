import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  Award, 
  PlusCircle, 
  Target, 
  CheckCircle2, 
  TrendingUp,
  GraduationCap,
  Zap,
  Clock,
  ChevronRight
} from 'lucide-react';
import api from '../../lib/axios';
import { PremiumHeader, AnimatedStatCard, FloatingOrbs, PremiumCard } from '../../components/premium';

interface TrainerStats {
  total_courses: number;
  total_lessons: number;
  total_training_plans: number;
  active_training_plans: number;
  total_students: number;
  total_challenges: number;
  total_submissions: number;
  approved_submissions: number;
  approval_rate: number;
  avg_mpu: number;
  certificates_issued: number;
  recent_submissions: number;
}

interface TrainingPlan {
  id: number;
  title: string;
  description: string;
  total_students: number;
  total_courses: number;
  is_active: boolean;
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

export default function TrainerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TrainerStats | null>(null);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, plansRes] = await Promise.all([
        api.get('/api/trainer/stats'),
        api.get('/api/training-plans/')
      ]);
      setStats(statsRes.data);
      setPlans(plansRes.data?.slice(0, 6) || []);
    } catch (error) {
      console.error('Error fetching trainer data:', error);
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
        icon={Users}
        title={t('dashboard.trainer.title')}
        subtitle={t('dashboard.trainer.subtitle')}
        badge="Painel do Formador"
        iconColor="from-red-500 to-red-700"
        actions={
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/training-plan/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-600/30 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            {t('dashboard.trainer.createButton')}
          </motion.button>
        }
      />

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatedStatCard
          icon={BookOpen}
          label={t('dashboard.trainer.createdCourses')}
          value={stats?.total_courses || 0}
          color="from-red-500 to-red-700"
          delay={0}
        />
        <AnimatedStatCard
          icon={Users}
          label={t('dashboard.trainer.activeStudents')}
          value={stats?.total_students || 0}
          color="from-blue-500 to-blue-700"
          delay={0.1}
        />
        <AnimatedStatCard
          icon={GraduationCap}
          label="Planos de Formação"
          value={stats?.total_training_plans || 0}
          color="from-purple-500 to-purple-700"
          delay={0.2}
        />
        <AnimatedStatCard
          icon={Target}
          label={t('dashboard.trainer.challenges')}
          value={stats?.total_challenges || 0}
          color="from-orange-500 to-orange-700"
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
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Módulos Criados</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_lessons || 0}</div>
        </motion.div>
        
        <motion.div variants={cardVariants} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-lg dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Planos Ativos</span>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.active_training_plans || 0}</div>
        </motion.div>
        
        <motion.div variants={cardVariants} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-lg dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Submissões</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_submissions || 0}</div>
        </motion.div>
        
        <motion.div variants={cardVariants} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-lg dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Taxa Aprovação</span>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.approval_rate || 0}%</div>
        </motion.div>
        
        <motion.div variants={cardVariants} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-lg dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">MPU Médio</span>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats?.avg_mpu || 0}</div>
        </motion.div>
        
        <motion.div variants={cardVariants} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-lg dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Certificados</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.certificates_issued || 0}</div>
        </motion.div>
      </motion.div>

      {/* Training Plans Section */}
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meus Planos de Formação</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gerir planos e acompanhar progresso</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/training-plans')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-sm"
            >
              Ver Todos
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
                <GraduationCap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              </motion.div>
              <p className="text-gray-400 text-lg mb-2">{t('dashboard.trainer.emptyTitle')}</p>
              <p className="text-gray-500 mb-6">{t('dashboard.trainer.emptyDescription')}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/training-plan/new')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-600/30 transition-all"
              >
                <PlusCircle className="w-5 h-5" />
                {t('trainingPlan.createPlan')}
              </motion.button>
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
                  onClick={() => navigate(`/training-plan/${plan.id}`)}
                  className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4 cursor-pointer hover:border-red-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors line-clamp-1">
                      {plan.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      plan.is_active !== false
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-gray-500/10 text-gray-500 dark:text-gray-400'
                    }`}>
                      {plan.is_active !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                    {plan.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{plan.total_students || 0} formandos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{plan.total_courses || 0} cursos</span>
                    </div>
                  </div>
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
          onClick={() => navigate('/training-plan/new')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 hover:border-red-500/30 transition-all text-left group shadow-lg dark:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <PlusCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">Novo Plano</p>
            <p className="text-xs text-gray-500">Criar formação</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/training-plans')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 hover:border-indigo-500/30 transition-all text-left group shadow-lg dark:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">Meus Planos</p>
            <p className="text-xs text-gray-500">Ver todos</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/students')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 hover:border-blue-500/30 transition-all text-left group shadow-lg dark:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">Formandos</p>
            <p className="text-xs text-gray-500">Gerir alunos</p>
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
            <p className="text-xs text-gray-500">Ver análises</p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}
