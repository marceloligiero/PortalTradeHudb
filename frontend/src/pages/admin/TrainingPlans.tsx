import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GraduationCap, Plus, Users, BookOpen, Clock, CheckCircle2, PlayCircle, Calendar } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import TrainingPlanCard from '../../components/plans/TrainingPlanCard';
import { PremiumHeader, AnimatedStatCard, FloatingOrbs } from '../../components/premium';

interface TrainingPlan {
  id: number;
  title: string;
  description: string;
  trainer_name: string;
  total_courses: number;
  total_students: number;
  total_duration_hours: number;
  created_at: string;
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

export default function TrainingPlans() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

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
      const response = await api.get('/api/training-plans/');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching training plans:', error);
      setError('Failed to load training plans');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.is_active !== false).length;
  const totalStudents = plans.reduce((acc, p) => acc + (p.total_students || 0), 0);
  const totalCourses = plans.reduce((acc, p) => acc + (p.total_courses || 0), 0);
  const totalHours = plans.reduce((acc, p) => acc + (p.total_duration_hours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <PremiumHeader
        icon={GraduationCap}
        title={t('navigation.trainingPlans')}
        subtitle={t('trainingPlan.manageAllPlans')}
        badge="Gestão de Formação"
        iconColor="from-indigo-500 to-indigo-700"
        actions={
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/training-plan/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            {t('trainingPlan.createPlan')}
          </motion.button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <AnimatedStatCard
          icon={GraduationCap}
          label={t('trainingPlan.totalPlans') || 'Total de Planos'}
          value={totalPlans}
          color="from-indigo-500 to-indigo-700"
          delay={0}
        />
        <AnimatedStatCard
          icon={PlayCircle}
          label={t('trainingPlan.activePlans') || 'Planos Ativos'}
          value={activePlans}
          color="from-green-500 to-emerald-600"
          delay={0.1}
        />
        <AnimatedStatCard
          icon={Users}
          label={t('navigation.students') || 'Formandos'}
          value={totalStudents}
          color="from-blue-500 to-blue-700"
          delay={0.2}
        />
        <AnimatedStatCard
          icon={BookOpen}
          label={t('navigation.courses') || 'Cursos'}
          value={totalCourses}
          color="from-purple-500 to-purple-700"
          delay={0.3}
        />
        <AnimatedStatCard
          icon={Clock}
          label={t('trainingPlan.totalHours') || 'Horas Totais'}
          value={totalHours}
          suffix="h"
          color="from-orange-500 to-orange-700"
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
            className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center"
          >
            <FloatingOrbs variant="subtle" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, delay: 0.2 }}
            >
              <GraduationCap className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {t('trainingPlan.noPlan')}
            </h3>
            <p className="text-gray-400 mb-6">
              {t('trainingPlan.createFirstPlan')}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/training-plan/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-5 h-5" />
              {t('trainingPlan.createPlan')}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {plans.map((plan, index) => (
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
