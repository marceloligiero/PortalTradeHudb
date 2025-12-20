import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import TrainerValidation from './TrainerValidation';
import { Users, BookOpen, GraduationCap, UserCheck, Shield } from 'lucide-react';
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
      color: 'from-red-600 to-red-700',
    },
    {
      icon: BookOpen,
      title: t('dashboard.admin.totalCourses'),
      value: String(totalCourses),
      color: 'from-red-700 to-red-800',
    },
    {
      icon: UserCheck,
      title: t('dashboard.admin.trainers'),
      value: String(totalTrainers),
      color: 'from-red-800 to-red-900',
    },
    {
      icon: GraduationCap,
      title: t('dashboard.admin.students'),
      value: String(totalStudents),
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
