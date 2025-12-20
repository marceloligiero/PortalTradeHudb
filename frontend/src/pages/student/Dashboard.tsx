import { useTranslation } from 'react-i18next';
import { GraduationCap, BookOpen, Award, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import TrainingPlanCard from '../../components/plans/TrainingPlanCard';
import { useAuthStore } from '../../stores/authStore';

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { token, user } = useAuthStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const stats = [
    {
      icon: BookOpen,
      title: t('dashboard.student.activeCourses'),
      value: '0',
      color: 'from-red-600 to-red-700',
    },
    {
      icon: Clock,
      title: t('dashboard.student.studyHours'),
      value: '0h',
      color: 'from-red-700 to-red-800',
    },
    {
      icon: Award,
      title: t('dashboard.student.certificates'),
      value: '0',
      color: 'from-red-800 to-red-900',
    },
  ];

  useEffect(() => {
    if (!token || !user) return;
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const resp = await api.get('/api/training-plans/');
      setPlans(resp.data || []);
    } catch (err) {
      console.error('Error fetching assigned training plans', err);
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {t('dashboard.student.title')}
            </h1>
            <p className="text-gray-400">{t('dashboard.student.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:scale-105 transition-transform duration-300"
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-red-900/50`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {stat.title}
            </h3>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Assigned Training Plans */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">{t('trainingPlan.myPlans')}</h2>
        {loadingPlans ? (
          <div className="text-center py-8 text-gray-400">{t('messages.loading')}</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">{t('trainingPlan.noAssignedPlans')}</p>
            <p className="text-gray-500 text-sm mt-2">{t('trainingPlan.contactTrainer')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p) => (
              <TrainingPlanCard key={p.id} plan={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
