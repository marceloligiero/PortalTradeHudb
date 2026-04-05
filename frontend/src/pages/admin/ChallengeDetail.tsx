import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Target,
  ArrowLeft,
  BookOpen,
  Edit3,
  Trash2,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Trophy,
  Timer,
  Zap,
  Info
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

interface Challenge {
  id: number;
  course_id: number;
  course_title: string;
  title: string;
  description: string;
  challenge_type: string;
  operations_required: number;
  time_limit_minutes: number;
  target_mpu: number;
  max_errors: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_submissions: number;
  avg_score: number;
  completion_rate: number;
}

export default function ChallengeDetail() {
  const { courseId, challengeId } = useParams<{ courseId: string; challengeId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isTutoriaContext = location.pathname.startsWith('/tutoria');
  const coursePrefix = isTutoriaContext ? `/tutoria/capsulas/${courseId}` : `/courses/${courseId}`;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiPath = isAdmin
        ? `/api/admin/courses/${courseId}/challenges/${challengeId}`
        : `/api/trainer/courses/${courseId}/challenges/${challengeId}`;
      const response = await api.get(apiPath);
      setChallenge(response.data);
    } catch (err: any) {
      console.error('Error fetching challenge:', err);
      setError(err.response?.data?.detail || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && challengeId && user) {
      fetchChallenge();
    }
  }, [courseId, challengeId, user]);

  const handleDeleteChallenge = async () => {
    if (!challenge || !window.confirm(t('admin.confirmDeleteChallenge'))) return;
    try {
      await api.delete(`/api/admin/courses/${courseId}/challenges/${challenge.id}`);
      navigate(coursePrefix);
    } catch (err) {
      console.error('Error deleting challenge:', err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getChallengeTypeLabel = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'COMPLETE': return t('admin.completeChallenge');
      case 'SUMMARY': return t('admin.summaryChallenge');
      default: return type || '-';
    }
  };

  const getChallengeTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'COMPLETE': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'SUMMARY': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !challenge) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#EC0000] mx-auto mb-4" />
          <h2 className="font-headline text-xl font-bold text-gray-900 dark:text-white mb-2">{t('messages.error')}</h2>
          <p className="font-body text-sm text-gray-500 dark:text-gray-400 mb-4">{error || t('admin.challengeNotFound', 'Desafio não encontrado')}</p>
          <button
            onClick={() => navigate(coursePrefix)}
            className="px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-sm transition-colors"
          >
            {t('common.goBack')}
          </button>
        </div>
      </div>
    );
  }

  /* ── KPI stats ── */
  const stats = [
    { label: t('admin.operationsRequired'), value: challenge.operations_required, Icon: Zap },
    { label: t('admin.minutesLimit'), value: `${challenge.time_limit_minutes} min`, Icon: Timer },
    { label: t('admin.targetMPU'), value: challenge.target_mpu?.toFixed(1) || '0', Icon: Trophy },
    { label: t('admin.maxErrors'), value: challenge.max_errors, Icon: AlertCircle },
  ];

  return (
    <div className="space-y-6">
      {/* ═══ Header Card ═══ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        {/* Back button */}
        <button
          onClick={() => navigate(coursePrefix)}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#EC0000] dark:hover:text-[#EC0000] transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-body text-sm">{t('common.backToCourse')}</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Icon box */}
            <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
              <Target className="w-7 h-7 text-[#EC0000]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-body ${getChallengeTypeColor(challenge.challenge_type)}`}>
                  {getChallengeTypeLabel(challenge.challenge_type)}
                </span>
                {challenge.is_active ? (
                  <span className="px-2.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold font-body">
                    {t('admin.active')}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-xs font-bold font-body">
                    {t('admin.inactive')}
                  </span>
                )}
              </div>
              <h1 className="font-headline text-2xl font-bold text-gray-900 dark:text-white">{challenge.title}</h1>
              <p className="font-body text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">{challenge.description}</p>
            </div>
          </div>

          {/* Actions */}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate(`${coursePrefix}/challenges/${challenge.id}/edit`)}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#EC0000]/30 text-gray-700 dark:text-gray-300 rounded-xl font-body text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                {t('common.edit')}
              </button>
              <button
                onClick={handleDeleteChallenge}
                className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-body text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {t('common.delete')}
              </button>
            </div>
          )}
        </div>

        {/* KPI Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                  <s.Icon className="w-4 h-4 text-[#EC0000]" />
                </div>
                <div>
                  <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="font-body text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Content Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Challenge Details */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white mb-4">{t('admin.challengeDetails')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('admin.course')}</p>
                    <p className="font-body text-sm font-medium text-gray-900 dark:text-white">{challenge.course_title}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('admin.type')}</p>
                    <p className="font-body text-sm font-medium text-gray-900 dark:text-white">{getChallengeTypeLabel(challenge.challenge_type)}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('admin.createdAt')}</p>
                    <p className="font-body text-sm font-medium text-gray-900 dark:text-white">{formatDate(challenge.created_at)}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('admin.submissions')}</p>
                    <p className="font-body text-sm font-medium text-gray-900 dark:text-white">{challenge.total_submissions || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white mb-4">{t('admin.description')}</h3>
            <p className="font-body text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {challenge.description || t('admin.noDescription')}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <Info className="w-5 h-5 text-[#EC0000]" />
              </div>
              <h3 className="font-headline text-sm font-bold text-gray-900 dark:text-white">{t('admin.catalogInfo', 'Informação do Catálogo')}</h3>
            </div>
            <p className="font-body text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('admin.catalogDescription', 'Este desafio faz parte do catálogo de cursos. Para executar ou ver resultados, acesse através de um Plano de Formação.')}
            </p>
          </div>

          {/* Performance Stats */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#EC0000]" />
              </div>
              <h3 className="font-headline text-sm font-bold text-gray-900 dark:text-white">{t('admin.performance')}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-gray-500 dark:text-gray-400">{t('admin.totalSubmissions')}</span>
                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                  {challenge.total_submissions || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-gray-500 dark:text-gray-400">{t('admin.avgScore')}</span>
                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                  {challenge.avg_score?.toFixed(1) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-gray-500 dark:text-gray-400">{t('admin.completionRate')}</span>
                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                  {challenge.completion_rate?.toFixed(0) || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-headline text-sm font-bold text-gray-900 dark:text-white mb-4">{t('admin.requirements')}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                <span className="font-body text-sm text-gray-700 dark:text-gray-300">
                  {t('admin.minOperations')}: <strong className="font-mono">{challenge.operations_required}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                <span className="font-body text-sm text-gray-700 dark:text-gray-300">
                  {t('admin.targetMPU')}: <strong className="font-mono">{challenge.target_mpu?.toFixed(1)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                <span className="font-body text-sm text-gray-700 dark:text-gray-300">
                  {t('admin.maxTime')}: <strong className="font-mono">{challenge.time_limit_minutes} min</strong>
                </span>
              </div>
              {challenge.max_errors > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-4 h-4 text-[#EC0000] flex-shrink-0" />
                  <span className="font-body text-sm text-gray-700 dark:text-gray-300">
                    {t('admin.maxErrorsAllowed')}: <strong className="font-mono">{challenge.max_errors}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
