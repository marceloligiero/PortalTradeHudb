import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import TrainerValidation from './TrainerValidation';
import { Users, BookOpen, GraduationCap, UserCheck, Shield, TrendingUp, Activity, Award } from 'lucide-react';
import api from '../../lib/axios';

export default function AdminDashboard() {
  const { t } = useTranslation();

  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const [totalTrainers, setTotalTrainers] = useState<number>(0);
  const [totalStudents, setTotalStudents] = useState<number>(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch paginated users to get the total count
        const usersResp = await api.get('/api/admin/users?page=1&page_size=1');
        const usersTotal = usersResp.data?.total ?? 0;
        setTotalUsers(usersTotal);

        // Fetch aggregated stats (courses, trainers, students)
        const statsResp = await api.get('/api/admin/reports/stats');
        const statsData = statsResp.data ?? {};
        setTotalCourses(statsData.total_courses ?? 0);
        setTotalTrainers((statsData.total_trainers ?? 0) + (statsData.pending_trainers ?? 0));
        setTotalStudents(statsData.total_students ?? 0);
      } catch (e) {
        // Keep defaults on error; admin panel may be unauthenticated in dev
        // eslint-disable-next-line no-console
        console.error('Error fetching admin stats:', e);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    {
      icon: Users,
      title: t('dashboard.admin.totalUsers'),
      value: String(totalUsers),
      color: 'from-[#ec0000]/10 to-[#ec0000]/20',
      borderColor: 'border-[#ec0000]/20',
      iconBg: 'bg-gradient-to-br from-[#ec0000] to-[#cc0000]',
      hoverColor: 'hover:border-[#ec0000]/40',
    },
    {
      icon: BookOpen,
      title: t('dashboard.admin.totalCourses'),
      value: String(totalCourses),
      color: 'from-blue-500/10 to-blue-600/20',
      borderColor: 'border-blue-500/20',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      hoverColor: 'hover:border-blue-500/40',
    },
    {
      icon: UserCheck,
      title: t('dashboard.admin.trainers'),
      value: String(totalTrainers),
      color: 'from-purple-500/10 to-purple-600/20',
      borderColor: 'border-purple-500/20',
      iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      hoverColor: 'hover:border-purple-500/40',
    },
    {
      icon: GraduationCap,
      title: t('dashboard.admin.students'),
      value: String(totalStudents),
      color: 'from-green-500/10 to-green-600/20',
      borderColor: 'border-green-500/20',
      iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
      hoverColor: 'hover:border-green-500/40',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#ec0000] to-[#cc0000] text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -ml-48 -mb-48" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">
                {t('dashboard.admin.title')}
              </h1>
              <p className="text-white/90 text-lg font-medium">
                {t('dashboard.admin.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-6 border ${stat.borderColor} ${stat.hoverColor} shadow-lg hover:shadow-2xl transition-all duration-300 group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 ${stat.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <div className={`px-3 py-1 bg-gradient-to-r ${stat.color} rounded-full`}>
                  <TrendingUp className="w-4 h-4 text-gray-700" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                {stat.title}
              </h3>
              <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#ec0000]/30 hover:shadow-xl transition-all duration-300 group cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#ec0000] to-[#cc0000] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Atividade Recente</h3>
            </div>
            <p className="text-sm text-gray-600">Veja as últimas ações dos utilizadores</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-500/30 hover:shadow-xl transition-all duration-300 group cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Gerir Cursos</h3>
            </div>
            <p className="text-sm text-gray-600">Criar e editar planos de formação</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-500/30 hover:shadow-xl transition-all duration-300 group cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Relatórios</h3>
            </div>
            <p className="text-sm text-gray-600">Análises e estatísticas detalhadas</p>
          </div>
        </div>

        {/* Trainer Validation Section */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ec0000] to-[#cc0000] rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Validação de Instrutores</h2>
          </div>
          <TrainerValidation />
        </div>
      </div>
    </div>
  );
}
