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
    <div className="space-y-10">
      {/* Welcome Section */}
      <div className="glass-morphism-dark rounded-[32px] p-10 border border-white/10 animate-scale-in relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-red-600/20 transition-colors duration-500" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-red-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-600/20 animate-pulse-glow">
              <Users className="w-12 h-12 text-white" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-black tracking-tight mb-2">
                {t('dashboard.trainer.title')}
              </h1>
              <p className="text-gray-400 text-lg font-medium">
                {t('dashboard.trainer.subtitle')}
              </p>
            </div>
          </div>
          
          <button className="flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-red-600/20 transition-all hover:scale-[1.05] active:scale-[0.95] group">
            <PlusCircle className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            {t('dashboard.trainer.createButton')}
          </button>
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

      {/* Courses List */}
      <div className="glass-morphism-dark rounded-[32px] p-10 border border-white/10 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-black tracking-tight">{t('navigation.courses')}</h2>
          <div className="h-1 flex-1 mx-8 bg-gradient-to-r from-red-600/50 to-transparent rounded-full hidden md:block" />
        </div>

        <div className="text-center py-20 animate-scale-in">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
            <BookOpen className="w-12 h-12 text-gray-600 animate-float" />
          </div>
          <p className="text-gray-400 text-xl font-bold mb-2">{t('dashboard.trainer.emptyTitle')}</p>
          <p className="text-gray-500 font-medium">{t('dashboard.trainer.emptyDescription')}</p>
        </div>
      </div>
    </div>
  );
}
