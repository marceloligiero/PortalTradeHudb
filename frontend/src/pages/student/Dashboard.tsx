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
    <div className="space-y-10">
      {/* Welcome Section */}
      <div className="glass-morphism-dark rounded-[32px] p-10 border border-white/10 animate-scale-in relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-red-600/20 transition-colors duration-500" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-red-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-600/20 animate-pulse-glow">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black tracking-tight mb-2">
              {t('dashboard.student.title')}
            </h1>
            <p className="text-gray-400 text-lg font-medium">
              {t('dashboard.student.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="glass-morphism-dark rounded-[32px] p-8 border border-white/10 hover:border-red-500/30 transition-all duration-500 group animate-scale-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
              <stat.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
              {stat.title}
            </h3>
            <p className="text-4xl font-black text-white tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Assigned Training Plans */}
      <div className="glass-morphism-dark rounded-[32px] p-10 border border-white/10 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-black tracking-tight">{t('trainingPlan.myPlans')}</h2>
          <div className="h-1 flex-1 mx-8 bg-gradient-to-r from-red-600/50 to-transparent rounded-full hidden md:block" />
        </div>

        {loadingPlans ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-morphism-dark rounded-3xl p-8 border border-white/5 space-y-6">
                <div className="h-8 bg-white/5 rounded-xl w-3/4 animate-pulse" />
                <div className="space-y-3">
                  <div className="h-4 bg-white/5 rounded-lg w-full animate-pulse" />
                  <div className="h-4 bg-white/5 rounded-lg w-5/6 animate-pulse" />
                </div>
                <div className="flex gap-3 pt-4">
                  <div className="h-10 bg-white/5 rounded-xl w-24 animate-pulse" />
                  <div className="h-10 bg-white/5 rounded-xl w-24 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 animate-scale-in">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
              <BookOpen className="w-12 h-12 text-gray-600 animate-float" />
            </div>
            <p className="text-gray-400 text-xl font-bold mb-2">{t('trainingPlan.noAssignedPlans')}</p>
            <p className="text-gray-500 font-medium">{t('trainingPlan.contactTrainer')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((p, index) => (
              <div key={p.id} className="animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                <TrainingPlanCard plan={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
