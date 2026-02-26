import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  CheckCircle2,
  PlayCircle,
  AlertTriangle
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import TrainingPlanCard from '../../components/plans/TrainingPlanCard';
import { PremiumHeader, AnimatedStatCard, FloatingOrbs } from '../../components/premium';
import { useTheme } from '../../contexts/ThemeContext';

interface TrainingPlan {
  id: number;
  title: string;
  description?: string;
  status: string;
  progress_percentage: number;
  days_remaining?: number;
  days_delayed?: number;
  is_delayed: boolean;
  total_courses: number;
  completed_courses: number;
  start_date?: string;
  end_date?: string;
  trainer?: {
    id: number;
    full_name: string;
  };
  trainer_name?: string;
  total_students?: number;
  total_duration_hours?: number;
  is_active?: boolean;
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
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

export default function MyPlans() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { isDark } = useTheme();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    fetchPlans();
  }, [token, user, navigate]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/training-plans/');
      setPlans(response.data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Falha ao carregar planos de formação');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats for student
  const totalPlans = plans.length;
  const completedPlans = plans.filter(p => p.status === 'COMPLETED').length;
  const inProgressPlans = plans.filter(p => p.status === 'IN_PROGRESS' || p.status === 'ONGOING').length;
  const delayedPlans = plans.filter(p => p.is_delayed || p.status === 'DELAYED').length;
  const totalCourses = plans.reduce((acc, p) => acc + (p.total_courses || 0), 0);

  return (
    <div className="space-y-6">
      {/* Premium Header - Sem botão de criar para estudantes */}
      <PremiumHeader
        icon={GraduationCap}
        title={t('trainingPlan.myPlans')}
        subtitle="Acompanhe seus planos de formação atribuídos"
        badge="Meus Planos"
        iconColor="from-indigo-500 to-indigo-700"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <AnimatedStatCard
          icon={GraduationCap}
          label="Total de Planos"
          value={totalPlans}
          color="from-indigo-500 to-indigo-700"
          delay={0}
        />
        <AnimatedStatCard
          icon={PlayCircle}
          label="Em Progresso"
          value={inProgressPlans}
          color="from-blue-500 to-blue-600"
          delay={0.1}
        />
        <AnimatedStatCard
          icon={CheckCircle2}
          label="Concluídos"
          value={completedPlans}
          color="from-green-500 to-emerald-600"
          delay={0.2}
        />
        <AnimatedStatCard
          icon={AlertTriangle}
          label="Atrasados"
          value={delayedPlans}
          color="from-red-500 to-red-600"
          delay={0.3}
        />
        <AnimatedStatCard
          icon={BookOpen}
          label="Total de Cursos"
          value={totalCourses}
          color="from-purple-500 to-purple-700"
          delay={0.4}
        />
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Plans Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
            />
          </div>
        ) : plans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden ${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} p-12 text-center`}
          >
            <FloatingOrbs variant="subtle" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, delay: 0.2 }}
            >
              <GraduationCap className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            </motion.div>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              {t('trainingPlan.noAssignedPlans')}
            </h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('trainingPlan.contactTrainer')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                variants={cardVariants}
                whileHover={{ y: -4 }}
              >
                <TrainingPlanCard plan={plan} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
