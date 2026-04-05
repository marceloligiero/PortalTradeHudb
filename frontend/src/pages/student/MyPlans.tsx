import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export default function MyPlans() {
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
      setLoading(true);
      const response = await api.get('/api/training-plans/');
      setPlans(response.data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError(t('myPlans.loadError'));
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
              {t('myPlans.badge')}
            </p>
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {t('trainingPlan.myPlans')}
            </h1>
            <p className="font-body text-gray-500 dark:text-gray-400 mt-1 max-w-xl text-sm">
              {t('myPlans.subtitle')}
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {[
            { icon: GraduationCap, value: totalPlans, label: t('myPlans.totalPlans') },
            { icon: PlayCircle, value: inProgressPlans, label: t('myPlans.inProgress') },
            { icon: CheckCircle2, value: completedPlans, label: t('myPlans.completed') },
            { icon: AlertTriangle, value: delayedPlans, label: t('myPlans.delayed') },
            { icon: BookOpen, value: totalCourses, label: t('myPlans.totalCourses') },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-[#EC0000] shrink-0" />
              <div>
                <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl font-body text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin mx-auto" />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <GraduationCap className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('trainingPlan.noAssignedPlans')}
          </h3>
          <p className="font-body text-gray-500 dark:text-gray-400">
            {t('trainingPlan.contactTrainer')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <TrainingPlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
