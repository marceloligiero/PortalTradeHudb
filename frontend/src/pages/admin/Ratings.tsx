import { useState, useEffect } from 'react';
import StarRating from '../../components/StarRating';
import api from '../../lib/axios';
import { useTranslation } from 'react-i18next';
import {
  Star, BarChart3, Users, BookOpen, Award, MessageSquare,
  Clock, TrendingUp, RefreshCw, Filter
} from 'lucide-react';

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

/* ── Santander DS helpers ────────────────────────── */

function SectionCard({ icon: Icon, title, children, className = '' }: {
  icon: React.ElementType; title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}>
      <div className="p-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#EC0000]" />
          </div>
          <h2 className="text-base font-headline font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
      </div>
      {children}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: 'red' | 'blue' | 'emerald' | 'purple' | 'amber';
}) {
  const bg: Record<string, string> = {
    red:     'bg-red-50 dark:bg-red-900/20 text-[#EC0000]',
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    purple:  'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-mono font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ── Main component ──────────────────────────────── */

export const Ratings: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ratingTypeLabels: Record<string, string> = {
    COURSE: t('ratings.courses'),
    LESSON: t('ratings.lessons'),
    CHALLENGE: t('ratings.challenges'),
    TRAINER: t('ratings.trainers'),
    TRAINING_PLAN: t('ratings.trainingPlans')
  };

  const ratingTypeColors: Record<string, string> = {
    COURSE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    LESSON: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    CHALLENGE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    TRAINER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    TRAINING_PLAN: 'bg-red-100 text-[#EC0000] dark:bg-red-900/30 dark:text-red-400',
  };

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [summaries, setSummaries] = useState<RatingSummary[]>([]);
  const [summaryFilterType, setSummaryFilterType] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    else if (activeTab === 'all') fetchAllRatings();
    else if (activeTab === 'summary') fetchSummary();
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
      case 'COURSE': return rating.course_title || t('ratings.unknownCourse', 'Unknown course');
      case 'LESSON': return rating.lesson_title || t('ratings.unknownLesson', 'Unknown lesson');
      case 'CHALLENGE': return rating.challenge_title || t('ratings.unknownChallenge', 'Unknown challenge');
      case 'TRAINER': return rating.trainer_name || t('ratings.unknownTrainer', 'Unknown trainer');
      case 'TRAINING_PLAN': return rating.training_plan_title || t('ratings.unknownPlan', 'Unknown plan');
      default: return t('ratings.unknownItem', 'Unknown item');
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const selectCls = 'w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-[#EC0000]/40 focus:ring-1 focus:ring-[#EC0000]/20 transition-all';
  const thCls = 'px-5 py-3 text-left text-xs font-medium text-white uppercase tracking-wider';

  /* ── Dashboard Tab ─────────────────────────── */
  const renderDashboard = () => {
    if (!dashboardData) return null;

    return (
      <div className="space-y-6">
        {/* KPI Cards — Total + per type */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Star} label={t('ratings.totalRatings')} value={dashboardData.total_ratings} color="red" />
          {Object.entries(dashboardData.averages_by_type).slice(0, 3).map(([type, data]) => (
            <div key={type} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center gap-3 mb-3">
                <StarRating value={data.avg_stars} readonly size="sm" showValue={false} />
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ratingTypeColors[type]}`}>{ratingTypeLabels[type]}</span>
              </div>
              <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white">{data.avg_stars.toFixed(1)}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.total_count} {t('ratings.ratingsFound')}</p>
            </div>
          ))}
        </div>

        {/* Additional type averages if more than 3 */}
        {Object.entries(dashboardData.averages_by_type).length > 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(dashboardData.averages_by_type).slice(3).map(([type, data]) => (
              <div key={type} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <StarRating value={data.avg_stars} readonly size="sm" showValue={false} />
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ratingTypeColors[type]}`}>{ratingTypeLabels[type]}</span>
                </div>
                <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white">{data.avg_stars.toFixed(1)}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.total_count} {t('ratings.ratingsFound')}</p>
              </div>
            ))}
          </div>
        )}

        {/* Star Distribution */}
        <SectionCard icon={BarChart3} title={t('ratings.starDistribution')}>
          <div className="p-5 space-y-3">
            {[5, 4, 3, 2, 1, 0].map((star) => {
              const count = dashboardData.star_distribution[String(star)] || 0;
              const percentage = dashboardData.total_ratings > 0
                ? (count / dashboardData.total_ratings) * 100
                : 0;

              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-mono">{star}</span>
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-amber-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-24 text-right text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {count} <span className="text-xs">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Top Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Trainers */}
          <SectionCard icon={Award} title={t('ratings.topTrainers')}>
            <div className="p-5">
              {dashboardData.top_trainers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('ratings.noTrainerRatings')}</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.top_trainers.map((trainer, idx) => (
                    <div key={trainer.trainer_id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                        idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        idx === 1 ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                        idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">{trainer.trainer_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{trainer.total_ratings} {t('ratings.ratingsFound')}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StarRating value={trainer.avg_stars} readonly size="sm" showValue={false} />
                        <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">{trainer.avg_stars.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Top Courses */}
          <SectionCard icon={BookOpen} title={t('ratings.topCourses')}>
            <div className="p-5">
              {dashboardData.top_courses.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('ratings.noCourseRatings')}</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.top_courses.map((course, idx) => (
                    <div key={course.course_id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                        idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        idx === 1 ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                        idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">{course.course_title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{course.total_ratings} {t('ratings.ratingsFound')}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StarRating value={course.avg_stars} readonly size="sm" showValue={false} />
                        <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">{course.avg_stars.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Recent Ratings */}
        <SectionCard icon={Clock} title={t('ratings.recentRatings')}>
          <div className="p-5">
            {dashboardData.recent_ratings.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('ratings.noRecentRatings')}</p>
            ) : (
              <div className="space-y-4">
                {dashboardData.recent_ratings.map((rating) => (
                  <div key={rating.id} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white">{rating.user_name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ratingTypeColors[rating.rating_type]}`}>
                            {ratingTypeLabels[rating.rating_type]}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{getItemTitle(rating)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <StarRating value={rating.stars} readonly size="sm" showValue={false} />
                        <div className="text-xs text-gray-400 mt-1 font-mono">{formatDate(rating.created_at)}</div>
                      </div>
                    </div>
                    {rating.comment && (
                      <div className="mt-2 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          "{rating.comment}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    );
  };

  /* ── All Ratings Tab ───────────────────────── */
  const renderAllRatings = () => {
    return (
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 max-w-xs">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectCls}>
                <option value="">{t('ratings.allTypes')}</option>
                <option value="COURSE">{t('ratings.courses')}</option>
                <option value="LESSON">{t('ratings.lessons')}</option>
                <option value="CHALLENGE">{t('ratings.challenges')}</option>
                <option value="TRAINER">{t('ratings.trainers')}</option>
                <option value="TRAINING_PLAN">{t('ratings.trainingPlans')}</option>
              </select>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {ratings.length} {t('ratings.ratingsFound')}
            </div>
          </div>
        </div>

        {/* Ratings Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#EC0000]">
                <tr>
                  <th className={thCls}>{t('ratings.student')}</th>
                  <th className={thCls}>{t('ratings.type')}</th>
                  <th className={thCls}>{t('ratings.item')}</th>
                  <th className={`${thCls} text-center`}>{t('ratings.rating')}</th>
                  <th className={thCls}>{t('ratings.comment')}</th>
                  <th className={thCls}>{t('ratings.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {ratings.map((rating) => (
                  <tr key={rating.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{rating.user_name}</div>
                      <div className="text-xs text-gray-500">{rating.user_email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ratingTypeColors[rating.rating_type]}`}>
                        {ratingTypeLabels[rating.rating_type]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-900 dark:text-white max-w-[200px] truncate">{getItemTitle(rating)}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center">
                        <StarRating value={rating.stars} readonly size="sm" showValue={false} />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {rating.comment || <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 font-mono whitespace-nowrap">
                      {formatDate(rating.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ratings.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">{t('ratings.noRatingsFound')}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ── Summary Tab ───────────────────────────── */
  const renderSummary = () => {
    return (
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 max-w-xs">
              <select value={summaryFilterType} onChange={(e) => setSummaryFilterType(e.target.value)} className={selectCls}>
                <option value="">{t('ratings.allTypes')}</option>
                <option value="COURSE">{t('ratings.courses')}</option>
                <option value="LESSON">{t('ratings.lessons')}</option>
                <option value="CHALLENGE">{t('ratings.challenges')}</option>
                <option value="TRAINER">{t('ratings.trainers')}</option>
                <option value="TRAINING_PLAN">{t('ratings.trainingPlans')}</option>
              </select>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {summaries.length} {t('ratings.itemsRated')}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaries.map((summary) => (
            <div key={`${summary.rating_type}-${summary.item_id}`}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ratingTypeColors[summary.rating_type]}`}>
                  {ratingTypeLabels[summary.rating_type]}
                </span>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-amber-500">{summary.avg_stars.toFixed(1)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{summary.total_ratings} {t('ratings.ratingsFound')}</div>
                </div>
              </div>
              <h4 className="font-headline font-semibold text-lg text-gray-900 dark:text-white mb-3 truncate" title={summary.item_title}>
                {summary.item_title}
              </h4>
              <div className="flex justify-center mb-4">
                <StarRating value={summary.avg_stars} readonly size="md" showValue={false} />
              </div>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.star_distribution[String(star)] || 0;
                  const percentage = summary.total_ratings > 0
                    ? (count / summary.total_ratings) * 100
                    : 0;

                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-6 font-mono text-gray-500 dark:text-gray-400 text-right">{star}</span>
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded h-2 overflow-hidden">
                        <div
                          className="bg-amber-400 h-2 rounded transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-gray-500 dark:text-gray-400 font-mono">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {summaries.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">{t('ratings.noItemsRated')}</p>
          </div>
        )}
      </div>
    );
  };

  /* ── Tab config ────────────────────────────── */
  const tabs = [
    { id: 'dashboard', label: t('ratings.dashboard'), icon: BarChart3 },
    { id: 'all', label: t('ratings.allRatings'), icon: Star },
    { id: 'summary', label: t('ratings.summaryByItem'), icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Star className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">
              {t('ratings.title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              {t('ratings.subtitle', 'Gestão e análise de avaliações da plataforma')}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'dashboard') fetchDashboard();
            else if (activeTab === 'all') fetchAllRatings();
            else fetchSummary();
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-lg transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Atualizar')}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#EC0000] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <p className="text-[#EC0000] text-sm font-medium">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EC0000]"></div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'all' && renderAllRatings()}
          {activeTab === 'summary' && renderSummary()}
        </div>
      )}
    </div>
  );
};

export default Ratings;
