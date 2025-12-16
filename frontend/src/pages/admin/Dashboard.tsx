import { useTranslation } from 'react-i18next';
import TrainerValidation from './TrainerValidation';
import { Users, BookOpen, GraduationCap, UserCheck, Shield } from 'lucide-react';

export default function AdminDashboard() {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Users,
      title: t('dashboard.admin.totalUsers'),
      value: '0',
      color: 'from-red-600 to-red-700',
    },
    {
      icon: BookOpen,
      title: t('dashboard.admin.totalCourses'),
      value: '0',
      color: 'from-red-700 to-red-800',
    },
    {
      icon: UserCheck,
      title: t('dashboard.admin.trainers'),
      value: '0',
      color: 'from-red-800 to-red-900',
    },
    {
      icon: GraduationCap,
      title: t('dashboard.admin.students'),
      value: '0',
      color: 'from-red-900 to-black',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {t('dashboard.admin.title')}
            </h1>
            <p className="text-gray-400">{t('dashboard.admin.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      {/* Trainer Validation Section */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <TrainerValidation />
      </div>
    </div>
  );
}
