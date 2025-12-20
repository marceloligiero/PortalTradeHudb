import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Calendar, ArrowLeft } from 'lucide-react';
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  if (!plan) return <div className="p-6">Plan not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-sm text-slate-300">
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </button>

        <h1 className="text-2xl font-bold text-white mb-2">{plan.title}</h1>
        <p className="text-slate-400 mb-4">{plan.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <div>
              {plan.courses?.length ?? 0} { (plan.courses?.length ?? 0) === 1 ? t('trainingPlan.course') : t('trainingPlan.courses') }
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Calendar className="w-4 h-4 text-purple-400" />
            <div>
              {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : '-'} — {plan.end_date ? new Date(plan.end_date).toLocaleDateString() : '-'}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-300">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${plan.status === 'ONGOING' ? 'bg-green-600 text-white' : plan.status === 'UPCOMING' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'}`}>
              {plan.status ? plan.status.toLowerCase() : '-'}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-300">
            <div>
              {plan.days_remaining !== null && plan.days_remaining !== undefined ? `${plan.days_remaining} dias restantes` : '-'}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-3">{t('trainingPlan.courses')}</h3>
          <div className="space-y-4">
            {plan.courses && plan.courses.length > 0 ? (
              plan.courses.map((c) => (
                <div key={c.id} className="p-4 bg-white/3 rounded-lg border border-white/5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-white font-medium text-lg">{c.title}</div>
                      <div className="text-slate-400 text-sm">{c.description}</div>
                    </div>
                    <div className="text-xs text-slate-400">{c.order_index ?? ''}</div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white mb-2">Aulas</div>
                      {c.lessons && c.lessons.length > 0 ? (
                        <ul className="space-y-2">
                          {c.lessons.map((l) => (
                            <li key={l.id} className="p-2 bg-white/5 rounded-md">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm text-white">{l.title}</div>
                                  <div className="text-xs text-slate-400">{l.lesson_type} • {l.estimated_minutes} min</div>
                                </div>
                                <div className="text-xs text-slate-400">{l.order_index}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-slate-400">Sem aulas cadastradas</div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-white mb-2">Desafios</div>
                      {c.challenges && c.challenges.length > 0 ? (
                        <ul className="space-y-2">
                          {c.challenges.map((ch) => (
                            <li key={ch.id} className="p-2 bg-white/5 rounded-md">
                              <div className="text-sm text-white">{ch.title}</div>
                              <div className="text-xs text-slate-400">{ch.challenge_type} • {ch.time_limit_minutes} min • alvo {ch.target_mpu}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-slate-400">Sem desafios cadastrados</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400">{t('trainingPlan.noCourses')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
