import { useTranslation } from 'react-i18next';
import { Users, BookOpen, Award, PlusCircle } from 'lucide-react';

export default function TrainerDashboard() {
  const { t } = useTranslation();

  const stats = [
    {
      icon: BookOpen,
      title: t('dashboard.trainer.createdCourses'),
      value: '0',
      color: 'from-red-600 to-red-700',
    },
    {
      icon: Users,
      title: t('dashboard.trainer.activeStudents'),
      value: '0',
      color: 'from-red-700 to-red-800',
    },
    {
      icon: Award,
      title: t('dashboard.trainer.challenges'),
      value: '0',
      color: 'from-red-800 to-red-900',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {t('dashboard.trainer.title')}
              </h1>
              <p className="text-gray-400">{t('dashboard.trainer.subtitle')}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-900/50 hover:scale-105">
            <PlusCircle className="w-5 h-5" />
            {t('dashboard.trainer.createButton')}
          </button>
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

      {/* Courses List */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">{t('navigation.courses')}</h2>
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">{t('dashboard.trainer.emptyTitle')}</p>
          <p className="text-gray-500 text-sm mt-2">{t('dashboard.trainer.emptyDescription')}</p>
        </div>
      </div>
    </div>
  );
}
