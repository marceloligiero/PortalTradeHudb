import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StarRating from '../../components/StarRating';
import api from '../../lib/axios';
import { useTranslation } from 'react-i18next';

interface Rating {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  rating_type: string;
  course_id?: number;
  course_title?: string;
  lesson_id?: number;
  lesson_title?: string;
  challenge_id?: number;
  challenge_title?: string;
  trainer_id?: number;
  trainer_name?: string;
  training_plan_id?: number;
  training_plan_title?: string;
  stars: number;
  comment?: string;
  created_at: string;
}

interface RatingSummary {
  rating_type: string;
  item_id: number;
  item_title: string;
  avg_stars: number;
  total_ratings: number;
  star_distribution: Record<string, number>;
}

interface DashboardData {
  total_ratings: number;
  averages_by_type: Record<string, { avg_stars: number; total_count: number }>;
  star_distribution: Record<string, number>;
  top_trainers: Array<{ trainer_id: number; trainer_name: string; avg_stars: number; total_ratings: number }>;
  top_courses: Array<{ course_id: number; course_title: string; avg_stars: number; total_ratings: number }>;
  recent_ratings: Rating[];
}

const ratingTypeLabels: Record<string, string> = {
  COURSE: 'Cursos',
  LESSON: 'Aulas',
  CHALLENGE: 'Desafios',
  TRAINER: 'Formadores',
  TRAINING_PLAN: 'Planos de Formação'
};

export const Ratings: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  
  // All ratings data
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  
  // Summary data
  const [summaries, setSummaries] = useState<RatingSummary[]>([]);
  const [summaryFilterType, setSummaryFilterType] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
    } else if (activeTab === 'all') {
      fetchAllRatings();
    } else if (activeTab === 'summary') {
      fetchSummary();
    }
  }, [activeTab, filterType, summaryFilterType]);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/ratings/admin/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      setError('Erro ao carregar dashboard de avaliações');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllRatings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('rating_type', filterType);
      const response = await api.get(`/api/ratings/admin/all?${params}`);
      setRatings(response.data.ratings);
    } catch (err) {
      setError('Erro ao carregar avaliações');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (summaryFilterType) params.append('rating_type', summaryFilterType);
      const response = await api.get(`/api/ratings/admin/summary?${params}`);
      setSummaries(response.data.summaries);
    } catch (err) {
      setError('Erro ao carregar resumo de avaliações');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getItemTitle = (rating: Rating): string => {
    switch (rating.rating_type) {
      case 'COURSE': return rating.course_title || 'Curso desconhecido';
      case 'LESSON': return rating.lesson_title || 'Aula desconhecida';
      case 'CHALLENGE': return rating.challenge_title || 'Desafio desconhecido';
      case 'TRAINER': return rating.trainer_name || 'Formador desconhecido';
      case 'TRAINING_PLAN': return rating.training_plan_title || 'Plano desconhecido';
      default: return 'Item desconhecido';
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDashboard = () => {
    if (!dashboardData) return null;

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{dashboardData.total_ratings}</div>
              <div className="text-sm text-gray-500">Total de Avaliações</div>
            </div>
          </Card>
          
          {Object.entries(dashboardData.averages_by_type).map(([type, data]) => (
            <Card key={type} className="p-4">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <StarRating value={data.avg_stars} readonly size="sm" showValue={false} />
                </div>
                <div className="text-xl font-semibold">{data.avg_stars.toFixed(1)}</div>
                <div className="text-sm text-gray-500">{ratingTypeLabels[type]}</div>
                <div className="text-xs text-gray-400">{data.total_count} avaliações</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Star Distribution */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Distribuição de Estrelas</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1, 0].map((star) => {
              const count = dashboardData.star_distribution[String(star)] || 0;
              const percentage = dashboardData.total_ratings > 0 
                ? (count / dashboardData.total_ratings) * 100 
                : 0;
              
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="w-16 text-sm">{star} estrelas</div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div
                      className="bg-yellow-400 h-4 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Trainers */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">🏆 Top Formadores</h3>
            {dashboardData.top_trainers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Sem avaliações de formadores</p>
            ) : (
              <div className="space-y-3">
                {dashboardData.top_trainers.map((trainer, idx) => (
                  <div key={trainer.trainer_id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                    <div className="flex-1">
                      <div className="font-medium">{trainer.trainer_name}</div>
                      <div className="text-xs text-gray-500">{trainer.total_ratings} avaliações</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarRating value={trainer.avg_stars} readonly size="sm" showValue={false} />
                      <span className="text-sm font-semibold">{trainer.avg_stars.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top Courses */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">📚 Top Cursos</h3>
            {dashboardData.top_courses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Sem avaliações de cursos</p>
            ) : (
              <div className="space-y-3">
                {dashboardData.top_courses.map((course, idx) => (
                  <div key={course.course_id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                    <div className="flex-1">
                      <div className="font-medium">{course.course_title}</div>
                      <div className="text-xs text-gray-500">{course.total_ratings} avaliações</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarRating value={course.avg_stars} readonly size="sm" showValue={false} />
                      <span className="text-sm font-semibold">{course.avg_stars.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Ratings */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">📝 Avaliações Recentes</h3>
          {dashboardData.recent_ratings.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Sem avaliações recentes</p>
          ) : (
            <div className="space-y-4">
              {dashboardData.recent_ratings.map((rating) => (
                <div key={rating.id} className="border-b dark:border-gray-700 pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{rating.user_name}</div>
                      <div className="text-sm text-gray-500">
                        {ratingTypeLabels[rating.rating_type]}: {getItemTitle(rating)}
                      </div>
                    </div>
                    <div className="text-right">
                      <StarRating value={rating.stars} readonly size="sm" showValue={false} />
                      <div className="text-xs text-gray-400">{formatDate(rating.created_at)}</div>
                    </div>
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                      "{rating.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderAllRatings = () => {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 max-w-xs">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value="">Todos os tipos</option>
                <option value="COURSE">Cursos</option>
                <option value="LESSON">Aulas</option>
                <option value="CHALLENGE">Desafios</option>
                <option value="TRAINER">Formadores</option>
                <option value="TRAINING_PLAN">Planos de Formação</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {ratings.length} avaliações encontradas
            </div>
          </div>
        </Card>

        {/* Ratings Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formando</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avaliação</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comentário</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {ratings.map((rating) => (
                  <tr key={rating.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{rating.user_name}</div>
                      <div className="text-xs text-gray-500">{rating.user_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {ratingTypeLabels[rating.rating_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{getItemTitle(rating)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <StarRating value={rating.stars} readonly size="sm" showValue={false} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {rating.comment || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(rating.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ratings.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Nenhuma avaliação encontrada
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderSummary = () => {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 max-w-xs">
              <select
                value={summaryFilterType}
                onChange={(e) => setSummaryFilterType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value="">Todos os tipos</option>
                <option value="COURSE">Cursos</option>
                <option value="LESSON">Aulas</option>
                <option value="CHALLENGE">Desafios</option>
                <option value="TRAINER">Formadores</option>
                <option value="TRAINING_PLAN">Planos de Formação</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {summaries.length} itens avaliados
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaries.map((summary) => (
            <Card key={`${summary.rating_type}-${summary.item_id}`} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  {ratingTypeLabels[summary.rating_type]}
                </span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-500">{summary.avg_stars.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">{summary.total_ratings} avaliações</div>
                </div>
              </div>
              <h4 className="font-semibold text-lg mb-3">{summary.item_title}</h4>
              <div className="flex justify-center mb-3">
                <StarRating value={summary.avg_stars} readonly size="md" showValue={false} />
              </div>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.star_distribution[String(star)] || 0;
                  const percentage = summary.total_ratings > 0 
                    ? (count / summary.total_ratings) * 100 
                    : 0;
                  
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-4">{star}★</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-gray-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        {summaries.length === 0 && (
          <Card className="p-8 text-center text-gray-500">
            Nenhum item com avaliações encontrado
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">⭐ Avaliações</h1>

      {/* Custom Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'dashboard'
              ? 'bg-red-600 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'all'
              ? 'bg-red-600 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Todas as Avaliações
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'summary'
              ? 'bg-red-600 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Resumo por Item
        </button>
      </div>

      <div className="mt-6">
        {error && (
          <Card className="p-4 mb-4 bg-red-50 dark:bg-red-900/30 border-red-200">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </Card>
        )}

        {isLoading ? (
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">A carregar...</p>
          </Card>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'all' && renderAllRatings()}
            {activeTab === 'summary' && renderSummary()}
          </>
        )}
      </div>
    </div>
  );
};

export default Ratings;
