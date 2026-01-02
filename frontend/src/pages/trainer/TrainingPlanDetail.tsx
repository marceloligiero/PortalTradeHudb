import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Calendar, ArrowLeft, Clock, Target, AlertCircle, PlayCircle, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

interface LessonItem {
  id: number;
  title: string;
  description?: string;
  order_index?: number;
  estimated_minutes?: number;
  lesson_type?: string;
}

interface ChallengeItem {
  id: number;
  title: string;
  description?: string;
  challenge_type?: string;
  time_limit_minutes?: number;
  target_mpu?: number;
  max_errors?: number;
}

interface CourseItem {
  id: number;
  title: string;
  description?: string;
  order_index?: number;
  lessons?: LessonItem[];
  challenges?: ChallengeItem[];
}

interface PlanDetail {
  id: number;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  days_total?: number | null;
  days_remaining?: number | null;
  status?: string | null;
  courses?: CourseItem[];
}

export default function TrainingPlanDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    fetchPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, user]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const resp = await api.get(`/api/training-plans/${id}`);
      setPlan(resp.data);
    } catch (err: any) {
      console.error('Error fetching plan details:', err);
      setError(err?.response?.data?.detail || 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ec0000] border-t-transparent"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-red-700">{error}</p>
      </div>
    </div>
  );

  if (!plan) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      <p className="text-gray-500">Plan not found</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#ec0000] to-[#cc0000] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
            {t('common.back')}
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3">{plan.title}</h1>
              <p className="text-white/90 text-lg max-w-3xl leading-relaxed">{plan.description}</p>
            </div>

            <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
              plan.status === 'ONGOING' ? 'bg-green-500' : 
              plan.status === 'UPCOMING' ? 'bg-blue-500' : 
              'bg-gray-500'
            }`}>
              {plan.status ? plan.status.toLowerCase() : '-'}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-white" />
                <span className="text-2xl font-bold">{plan.courses?.length ?? 0}</span>
              </div>
              <p className="text-white/80 text-sm">
                {(plan.courses?.length ?? 0) === 1 ? t('trainingPlan.course') : t('trainingPlan.courses')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-white" />
                <span className="text-lg font-bold">{plan.days_total ?? '-'}</span>
              </div>
              <p className="text-white/80 text-sm">Dias totais</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-white" />
                <span className="text-lg font-bold">{plan.days_remaining ?? '-'}</span>
              </div>
              <p className="text-white/80 text-sm">Dias restantes</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex flex-col gap-1">
                <p className="text-white/80 text-xs">Início</p>
                <p className="text-white font-semibold text-sm">
                  {plan.start_date ? new Date(plan.start_date).toLocaleDateString('pt-PT') : '-'}
                </p>
                <p className="text-white/80 text-xs mt-2">Fim</p>
                <p className="text-white font-semibold text-sm">
                  {plan.end_date ? new Date(plan.end_date).toLocaleDateString('pt-PT') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">{t('trainingPlan.courses')}</h2>

        <div className="space-y-6">
          {plan.courses && plan.courses.length > 0 ? (
            plan.courses.map((c, idx) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                {/* Course Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#ec0000] rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{c.title}</h3>
                        <p className="text-gray-600 mt-1">{c.description}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Lessons */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-[#ec0000]" />
                        <h4 className="text-lg font-bold text-gray-900">Aulas</h4>
                        <span className="ml-auto text-sm text-gray-500">
                          {c.lessons?.length ?? 0} {(c.lessons?.length ?? 0) === 1 ? 'aula' : 'aulas'}
                        </span>
                      </div>
                      {c.lessons && c.lessons.length > 0 ? (
                        <ul className="space-y-3">
                          {c.lessons.map((l) => (
                            <li key={l.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-[#ec0000]/30 hover:bg-white transition-all group">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#ec0000] bg-red-50 px-2 py-1 rounded">
                                      #{l.order_index}
                                    </span>
                                    <h5 className="font-semibold text-gray-900">{l.title}</h5>
                                  </div>
                                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {l.estimated_minutes} min
                                    </span>
                                    <span className="px-2 py-0.5 bg-gray-200 rounded text-xs font-medium">
                                      {l.lesson_type}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#ec0000] transition-colors" />
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Sem aulas cadastradas</p>
                        </div>
                      )}
                    </div>

                    {/* Challenges */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-[#ec0000]" />
                        <h4 className="text-lg font-bold text-gray-900">Desafios</h4>
                        <span className="ml-auto text-sm text-gray-500">
                          {c.challenges?.length ?? 0} {(c.challenges?.length ?? 0) === 1 ? 'desafio' : 'desafios'}
                        </span>
                      </div>
                      {c.challenges && c.challenges.length > 0 ? (
                        <ul className="space-y-3">
                          {c.challenges.map((ch) => (
                            <li key={ch.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-green-300 hover:bg-green-50/50 transition-all">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 mb-2">{ch.title}</h5>
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg">
                                      <Clock className="w-3 h-3" />
                                      {ch.time_limit_minutes} min
                                    </span>
                                    <span className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg">
                                      <Target className="w-3 h-3" />
                                      MPU: {ch.target_mpu}
                                    </span>
                                    <span className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg">
                                      <AlertCircle className="w-3 h-3" />
                                      Max: {ch.max_errors} erros
                                    </span>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">
                                      {ch.challenge_type}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const route = ch.challenge_type === 'COMPLETE'
                                      ? `/challenges/${ch.id}/execute/complete`
                                      : `/challenges/${ch.id}/execute/summary`;
                                    navigate(route);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md group"
                                >
                                  <PlayCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
                                  Aplicar
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Sem desafios cadastrados</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">{t('trainingPlan.noCourses')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
