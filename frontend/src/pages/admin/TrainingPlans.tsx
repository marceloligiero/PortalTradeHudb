import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Plus, Users, BookOpen, Calendar } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">
                Planos de Formação
              </h1>
            </div>
            <p className="text-slate-400">
              Gerir todos os planos de formação da plataforma
            </p>
          </div>
          <button
            onClick={() => navigate('/training-plan/new')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Criar Plano
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Plans Grid */}
        {plans.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
            <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhum plano de formação
            </h3>
            <p className="text-slate-400 mb-6">
              Crie o primeiro plano de formação para começar
            </p>
            <button
              onClick={() => navigate('/training-plan/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Plano
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => navigate(`/admin/training-plan/${plan.id}`)}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {plan.title}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {plan.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                      {plan.trainer_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>
                      {plan.total_courses} {plan.total_courses === 1 ? 'curso' : 'cursos'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Users className="w-4 h-4 text-green-400" />
                    <span>
                      {plan.total_students} {plan.total_students === 1 ? 'aluno' : 'alunos'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>
                      {plan.total_duration_hours}h de formação
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-slate-500">
                    Criado em {new Date(plan.created_at).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
