import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, GraduationCap, UserCheck, Shield, TrendingUp, 
  Target, Clock, CheckCircle, XCircle, Calendar, 
  BarChart3, FileText, AlertCircle, ArrowRight, Play
} from 'lucide-react';
import api from '../../lib/axios';

interface ActivePlan {
  id: number;
  title: string;
  student_name: string;
  trainer_name: string;
  days_remaining: number;
  total_courses: number;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalTrainers: 0,
    totalStudents: 0,
    activePlans: 0,
    pendingTrainers: 0,
  });

  const [activePlans, setActivePlans] = useState<ActivePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch paginated users to get the total count
        const usersResp = await api.get('/api/admin/users?page=1&page_size=1');
        const usersTotal = usersResp.data?.total ?? 0;

        // Fetch aggregated stats
        const statsResp = await api.get('/api/admin/reports/stats');
        const statsData = statsResp.data ?? {};

        // Fetch training plans
        const plansResp = await api.get('/api/training-plans/');
        const plans = plansResp.data ?? [];
        const activePlansData = plans.filter((p: any) => {
          if (!p.end_date) return true;
          return new Date(p.end_date) >= new Date();
        });

        setStats({
          totalUsers: usersTotal,
          totalCourses: statsData.total_courses ?? 0,
          totalTrainers: statsData.total_trainers ?? 0,
          totalStudents: statsData.total_students ?? 0,
          activePlans: activePlansData.length,
          pendingTrainers: statsData.pending_trainers ?? 0,
        });

        setActivePlans(activePlansData.slice(0, 5).map((p: any) => ({
          id: p.id,
          title: p.title,
          student_name: p.student?.full_name ?? 'Não atribuído',
          trainer_name: p.trainer?.full_name ?? 'Não atribuído',
          days_remaining: p.end_date ? Math.max(0, Math.ceil((new Date(p.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0,
          total_courses: p.total_courses ?? 0,
        })));

      } catch (e) {
        console.error('Error fetching admin stats:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const mainStats = [
    {
      icon: Users,
      title: 'Total Utilizadores',
      value: stats.totalUsers,
      color: 'bg-[#ec0000]',
      bgColor: 'from-[#ec0000]/5 to-[#ec0000]/10',
    },
    {
      icon: GraduationCap,
      title: 'Formandos Ativos',
      value: stats.totalStudents,
      color: 'bg-blue-600',
      bgColor: 'from-blue-500/5 to-blue-600/10',
    },
    {
      icon: UserCheck,
      title: 'Formadores',
      value: stats.totalTrainers,
      color: 'bg-purple-600',
      bgColor: 'from-purple-500/5 to-purple-600/10',
    },
    {
      icon: BookOpen,
      title: 'Cursos Disponíveis',
      value: stats.totalCourses,
      color: 'bg-green-600',
      bgColor: 'from-green-500/5 to-green-600/10',
    },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#ec0000] to-[#cc0000] rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[#ec0000] text-sm font-bold uppercase tracking-widest">Painel de Controlo</p>
              <h1 className="text-3xl font-bold text-white">
                Administração do Portal
              </h1>
            </div>
          </div>
          <p className="text-gray-400 mt-3 max-w-2xl">
            Visão geral do estado do portal, formações em curso e desempenho dos formandos.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Main Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainStats.map((stat, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${stat.bgColor} backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">{stat.title}</span>
              </div>
              <p className="text-4xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Training Plans */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-300 font-semibold">Planos Ativos</span>
              </div>
              <span className="text-3xl font-bold text-orange-400">{stats.activePlans}</span>
            </div>
            <p className="text-gray-500 text-sm">Planos de formação em curso</p>
          </div>

          {/* Pending Trainers */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-300 font-semibold">Validações Pendentes</span>
              </div>
              <span className="text-3xl font-bold text-yellow-400">{stats.pendingTrainers}</span>
            </div>
            <p className="text-gray-500 text-sm">Formadores aguardando aprovação</p>
          </div>

          {/* Total Plans */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-300 font-semibold">Total Formadores</span>
              </div>
              <span className="text-3xl font-bold text-green-400">{stats.totalTrainers + stats.pendingTrainers}</span>
            </div>
            <p className="text-gray-500 text-sm">Ativos e pendentes</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Training Plans List */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#ec0000] rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Planos de Formação Ativos</h2>
                </div>
                <button 
                  onClick={() => navigate('/training-plans')}
                  className="text-[#ec0000] hover:text-red-400 text-sm font-medium flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {activePlans.length > 0 ? (
                activePlans.map((plan) => (
                  <div 
                    key={plan.id} 
                    className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => navigate(`/trainer/training-plan/${plan.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{plan.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {plan.student_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            {plan.trainer_name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${plan.days_remaining <= 7 ? 'text-orange-400' : 'text-green-400'}`}>
                          {plan.days_remaining} dias
                        </span>
                        <p className="text-xs text-gray-500">{plan.total_courses} cursos</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum plano de formação ativo</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Resumo do Sistema</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Formadores Validados</span>
                </div>
                <span className="text-xl font-bold text-white">{stats.totalTrainers}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-300">Aguardando Validação</span>
                </div>
                <span className="text-xl font-bold text-white">{stats.pendingTrainers}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Formandos Inscritos</span>
                </div>
                <span className="text-xl font-bold text-white">{stats.totalStudents}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-300">Cursos no Catálogo</span>
                </div>
                <span className="text-xl font-bold text-white">{stats.totalCourses}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/users')}
            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#ec0000]/50 rounded-xl p-4 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ec0000] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Gerir Utilizadores</p>
                <p className="text-gray-500 text-xs">Adicionar ou editar</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/courses')}
            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Gerir Cursos</p>
                <p className="text-gray-500 text-xs">Catálogo de cursos</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/training-plan/new')}
            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/50 rounded-xl p-4 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Novo Plano</p>
                <p className="text-gray-500 text-xs">Criar formação</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/reports')}
            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-xl p-4 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Relatórios</p>
                <p className="text-gray-500 text-xs">Análises detalhadas</p>
              </div>
            </div>
          </button>
        </div>

        {/* Pending Validations Alert */}
        {stats.pendingTrainers > 0 && (
          <div 
            className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6 cursor-pointer hover:border-yellow-500/50 transition-all"
            onClick={() => navigate('/trainers')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Formadores Aguardando Validação</h3>
                  <p className="text-gray-400">
                    Existem <span className="text-yellow-400 font-bold">{stats.pendingTrainers}</span> formadores aguardando aprovação
                  </p>
                </div>
              </div>
              <button className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition-colors flex items-center gap-2">
                Validar Agora <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
