import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Plus, Search, Filter } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import TrainingPlanCard from '../../components/plans/TrainingPlanCard';

interface TrainingPlan {
  id: number;
  title: string;
  description: string;
  trainer_name: string;
  total_courses: number;
  total_students: number;
  total_duration_hours: number;
  created_at: string;
}

export default function TrainingPlans() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ongoing' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }

    fetchPlans();
  }, [token, user, navigate]);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/api/training-plans/');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching training plans:', error);
      setError('Failed to load training plans');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ec0000] border-t-transparent"></div>
      </div>
    );
  }

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    // Calculate status based on dates
    const start = plan.start_date ? new Date(plan.start_date) : null;
    const end = plan.end_date ? new Date(plan.end_date) : null;
    const today = new Date();
    
    let status = 'unknown';
    if (start && end) {
      if (today < start) status = 'upcoming';
      else if (today > end) status = 'completed';
      else status = 'ongoing';
    }
    
    return matchesSearch && status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#ec0000] to-[#cc0000] text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-4xl font-bold">
                  {t('trainingPlan.myPlans')}
                </h1>
              </div>
              <p className="text-white/90 text-lg">
                {t('trainingPlan.managePlansDescription')}
              </p>
            </div>
            <button
              onClick={() => navigate('/training-plan/new')}
              className="relative px-8 py-4 bg-white text-[#ec0000] rounded-xl font-bold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl overflow-hidden group flex items-center gap-3"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
              {t('trainingPlan.createNew')}
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                placeholder="Pesquisar planos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'ongoing', 'upcoming', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    filterStatus === status
                      ? 'bg-white text-[#ec0000]'
                      : 'bg-white/10 text-white hover:bg-white/20 border-2 border-white/20'
                  }`}
                >
                  {status === 'all' ? 'Todos' : status === 'ongoing' ? 'Ativos' : status === 'upcoming' ? 'Próximos' : 'Completos'}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold mb-1">{plans.length}</div>
              <div className="text-white/80 text-sm">Total de Planos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold mb-1">
                {plans.reduce((acc, p) => acc + (p.total_courses || 0), 0)}
              </div>
              <div className="text-white/80 text-sm">Cursos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold mb-1">
                {plans.reduce((acc, p) => acc + (p.total_students || 0), 0)}
              </div>
              <div className="text-white/80 text-sm">Formandos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold mb-1">
                {plans.reduce((acc, p) => acc + (p.total_duration_hours || 0), 0)}h
              </div>
              <div className="text-white/80 text-sm">Horas Totais</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
            <Filter className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Plans Grid */}
        {filteredPlans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
            <GraduationCap className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || filterStatus !== 'all' 
                ? 'Nenhum plano encontrado' 
                : t('trainingPlan.noPlans')}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de pesquisa'
                : t('trainingPlan.createFirstPlan')}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => navigate('/training-plan/new')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#ec0000] to-[#cc0000] text-white rounded-xl hover:shadow-lg transition-all font-bold"
              >
                <Plus className="w-5 h-5" />
                {t('trainingPlan.createNew')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {filteredPlans.length} {filteredPlans.length === 1 ? 'Plano' : 'Planos'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <TrainingPlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
