import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Clock, 
  Target,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { PremiumHeader, FloatingOrbs } from '../../components/premium';

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
}

export default function MyPlans() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) return;
    fetchPlans();
  }, [token, user]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/training-plans/');
      setPlans(response.data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (plan: TrainingPlan) => {
    if (plan.status === 'COMPLETED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
          <CheckCircle className="w-3 h-3 inline mr-1" />
          Concluído
        </span>
      );
    }
    if (plan.is_delayed || plan.status === 'DELAYED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          Atrasado
        </span>
      );
    }
    if (plan.status === 'IN_PROGRESS') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
          <PlayCircle className="w-3 h-3 inline mr-1" />
          Em Progresso
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        <Clock className="w-3 h-3 inline mr-1" />
        Pendente
      </span>
    );
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
      <PremiumHeader
        icon={GraduationCap}
        title={t('trainingPlan.myPlans')}
        subtitle="Acompanhe seus planos de formação atribuídos"
        badge="Meus Planos"
        iconColor="from-red-500 to-red-700"
      />

      {plans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center"
        >
          <FloatingOrbs variant="subtle" />
          <GraduationCap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {t('trainingPlan.noAssignedPlans')}
          </h3>
          <p className="text-gray-400">
            {t('trainingPlan.contactTrainer')}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/training-plan/${plan.id}`)}
              className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-red-500/30 transition-all cursor-pointer group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                        {plan.title}
                      </h3>
                      {getStatusBadge(plan)}
                    </div>
                    {plan.description && (
                      <p className="text-gray-400 text-sm line-clamp-2">{plan.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Progresso</span>
                    <span className="text-white font-medium">{plan.progress_percentage?.toFixed(0) || 0}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${plan.progress_percentage || 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        plan.is_delayed ? 'bg-red-500' : 'bg-gradient-to-r from-red-500 to-yellow-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <BookOpen className="w-3 h-3" />
                      Cursos
                    </div>
                    <p className="text-white font-semibold">
                      {plan.completed_courses || 0} / {plan.total_courses || 0}
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Calendar className="w-3 h-3" />
                      Início
                    </div>
                    <p className="text-white font-semibold text-sm">
                      {plan.start_date ? new Date(plan.start_date).toLocaleDateString('pt-PT') : '-'}
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Target className="w-3 h-3" />
                      Fim
                    </div>
                    <p className="text-white font-semibold text-sm">
                      {plan.end_date ? new Date(plan.end_date).toLocaleDateString('pt-PT') : '-'}
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Clock className="w-3 h-3" />
                      {plan.is_delayed ? 'Atraso' : 'Restante'}
                    </div>
                    <p className={`font-semibold ${plan.is_delayed ? 'text-red-400' : 'text-white'}`}>
                      {plan.is_delayed 
                        ? `${plan.days_delayed || 0} dias` 
                        : `${plan.days_remaining || 0} dias`
                      }
                    </p>
                  </div>
                </div>

                {/* Trainer Info */}
                {plan.trainer && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500">
                      Formador: <span className="text-gray-300">{plan.trainer.full_name}</span>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
