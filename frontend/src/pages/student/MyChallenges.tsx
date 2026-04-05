import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Target,
  Clock,
  TrendingUp,
  Play,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Trophy,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

interface Challenge {
  id: number;
  title: string;
  description?: string;
  challenge_type: string;
  operations_required: number;
  time_limit_minutes: number;
  target_mpu: number;
  max_errors: number;
  is_released: boolean;
  use_volume_kpi: boolean;
  use_mpu_kpi: boolean;
  use_errors_kpi: boolean;
  course_id: number;
  course_name?: string;
}

interface MySubmission {
  id: number;
  challenge_id: number;
  challenge_title: string;
  challenge_type?: string;
  course_name?: string;
  submission_type: string;
  total_operations: number;
  started_at?: string;
  completed_at?: string;
  is_approved: boolean;
  calculated_mpu?: number;
  errors_count: number;
  is_in_progress: boolean;
  is_retry_allowed?: boolean;
  retry_count?: number;
}

export default function MyChallenges() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token, user } = useAuthStore();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<MySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'in_progress' | 'completed'>('available');

  useEffect(() => {
    if (!token || !user) return;
    loadData();
  }, [token, user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar desafios liberados
      const challengesResp = await api.get('/api/challenges/student/released');
      setChallenges(challengesResp.data || []);

      // Carregar minhas submissions
      const submissionsResp = await api.get('/api/challenges/student/my-submissions');
      setSubmissions(submissionsResp.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInProgressSubmissions = () => {
    // Em progresso: ainda não tem completed_at E não foi aprovado
    return submissions.filter(s => !s.completed_at && !s.is_approved);
  };

  const getCompletedSubmissions = () => {
    // Concluído: tem completed_at OU foi aprovado (independente de completed_at)
    return submissions.filter(s => s.completed_at || s.is_approved);
  };

  const getAvailableChallenges = () => {
    const inProgressIds = getInProgressSubmissions().map(s => s.challenge_id);
    const completedIds = getCompletedSubmissions().map(s => s.challenge_id);
    return challenges.filter(c => !inProgressIds.includes(c.id) && !completedIds.includes(c.id));
  };

  const formatKpis = (challenge: Challenge) => {
    const kpis = [];
    if (challenge.use_volume_kpi) kpis.push('Volume');
    if (challenge.use_mpu_kpi) kpis.push('MPU');
    if (challenge.use_errors_kpi) kpis.push(t('myChallenges.errorsKpi'));
    return kpis.join(' • ');
  };

  const handleStartRetry = async (submission: MySubmission) => {
    try {
      const response = await api.post(`/api/challenges/submissions/${submission.id}/start-retry`);
      const newSubmission = response.data;

      // Navegar para execução do novo desafio
      const executionType = submission.submission_type?.toUpperCase() === 'SUMMARY' ? 'summary' : 'complete';
      navigate(`/challenges/${submission.challenge_id}/execute/${executionType}?submissionId=${newSubmission.id}`);
    } catch (error: any) {
      alert(error.response?.data?.detail || t('myChallenges.startRetryError'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
              {t('navigation.challenges')}
            </p>
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {t('myChallenges.title')}
            </h1>
            <p className="font-body text-gray-500 dark:text-gray-400 mt-1 max-w-xl text-sm">
              {t('myChallenges.subtitle')}
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {[
            { icon: Target, value: getAvailableChallenges().length, label: t('myChallenges.available') },
            { icon: Play, value: getInProgressSubmissions().length, label: t('myChallenges.inProgress') },
            { icon: Trophy, value: getCompletedSubmissions().length, label: t('myChallenges.completed') },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-[#EC0000] shrink-0" />
              <div>
                <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-1">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 px-4 py-2 rounded-xl font-body text-sm font-bold transition-colors ${
            activeTab === 'available'
              ? 'bg-[#EC0000] text-white'
              : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
          }`}
        >
          {t('myChallenges.available')} ({getAvailableChallenges().length})
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`flex-1 px-4 py-2 rounded-xl font-body text-sm font-bold transition-colors ${
            activeTab === 'in_progress'
              ? 'bg-[#EC0000] text-white'
              : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
          }`}
        >
          {t('myChallenges.inProgress')} ({getInProgressSubmissions().length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 px-4 py-2 rounded-xl font-body text-sm font-bold transition-colors ${
            activeTab === 'completed'
              ? 'bg-[#EC0000] text-white'
              : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
          }`}
        >
          {t('myChallenges.completed')} ({getCompletedSubmissions().length})
        </button>
      </div>

      {/* Content — Available */}
      {activeTab === 'available' && (
        <div className="grid gap-4">
          {getAvailableChallenges().length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
              <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t('myChallenges.noAvailableChallenges')}
              </h3>
              <p className="font-body text-gray-500 dark:text-gray-400">
                {t('myChallenges.waitForTrainer')}
              </p>
            </div>
          ) : (
            getAvailableChallenges().map((challenge) => (
              <div
                key={challenge.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-[#EC0000]/30 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white">
                          {challenge.title}
                        </h3>
                        <span className={`px-2 py-1 rounded font-body text-xs font-bold ${
                          challenge.challenge_type === 'COMPLETE'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {challenge.challenge_type === 'COMPLETE' ? t('myChallenges.completeMode') : t('myChallenges.summaryMode')}
                        </span>
                      </div>
                      {challenge.course_name && (
                        <p className="font-body text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {challenge.course_name}
                        </p>
                      )}
                      {challenge.description && (
                        <p className="font-body text-gray-500 dark:text-gray-400 text-sm mb-4">{challenge.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Metas */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                        <Target className="w-3 h-3" />
                        <span className="font-body">{t('pendingReviews.operations')}</span>
                      </div>
                      <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">{challenge.operations_required}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="font-body">{t('myChallenges.time')}</span>
                      </div>
                      <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">{challenge.time_limit_minutes} min</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span className="font-body">{t('myChallenges.targetMPU')}</span>
                      </div>
                      <p className="font-mono text-lg font-bold text-yellow-600 dark:text-yellow-400">{challenge.target_mpu.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* KPIs e Max Errors */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-body">
                      <AlertCircle className="w-4 h-4" />
                      <span>{t('myChallenges.maxErrors')}: {challenge.max_errors}</span>
                    </div>
                    <div className="font-body text-gray-500 dark:text-gray-400">
                      KPIs: {formatKpis(challenge)}
                    </div>
                  </div>

                  {/* Botão Executar - apenas para desafios COMPLETE */}
                  {challenge.challenge_type?.toUpperCase() === 'COMPLETE' ? (
                    <button
                      onClick={() => navigate(`/challenges/${challenge.id}/execute/complete`)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-sm transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      {t('myChallenges.startChallenge')}
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl font-body text-sm border border-gray-200 dark:border-gray-700">
                      <Clock className="w-5 h-5" />
                      <span>{t('myChallenges.waitForTrainer')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Content — In Progress */}
      {activeTab === 'in_progress' && (
        <div className="grid gap-4">
          {getInProgressSubmissions().length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
              <Play className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t('myChallenges.noAvailableChallenges')}
              </h3>
              <p className="font-body text-gray-500 dark:text-gray-400">
                {t('myChallenges.waitForTrainer')}
              </p>
            </div>
          ) : (
            getInProgressSubmissions().map((submission) => (
              <div
                key={submission.id}
                onClick={() => {
                  const executionType = submission.submission_type?.toUpperCase() === 'SUMMARY' ? 'summary' : 'complete';
                  navigate(`/challenges/${submission.challenge_id}/execute/${executionType}?submissionId=${submission.id}`);
                }}
                className="bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-300 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-700 transition-colors cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded font-body text-xs font-bold">
                          {t('myChallenges.running')}
                        </span>
                      </div>
                      <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white">
                        {submission.challenge_title}
                      </h3>
                      {submission.course_name && (
                        <p className="font-body text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {submission.course_name}
                        </p>
                      )}
                      <p className="font-body text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {submission.started_at ? new Date(submission.started_at).toLocaleString() : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{submission.total_operations || 0}</p>
                        <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('pendingReviews.operations')}</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Content — Completed */}
      {activeTab === 'completed' && (
        <div className="grid gap-4">
          {getCompletedSubmissions().length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t('myChallenges.noAvailableChallenges')}
              </h3>
              <p className="font-body text-gray-500 dark:text-gray-400">
                {t('myChallenges.waitForTrainer')}
              </p>
            </div>
          ) : (
            getCompletedSubmissions().map((submission) => (
              <div
                key={submission.id}
                className={`rounded-2xl border transition-colors ${
                  submission.is_approved
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() => navigate(`/challenges/result/${submission.id}`)}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {submission.is_approved ? (
                          <span className="px-2 py-1 bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded font-body text-xs font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {t('myChallenges.approved')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-200 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded font-body text-xs font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {t('myChallenges.rejected')}
                          </span>
                        )}
                        {submission.retry_count != null && submission.retry_count > 0 && (
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded font-body text-xs">
                            {submission.retry_count + 1} {t('myChallenges.attempts')}
                          </span>
                        )}
                      </div>
                      <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white">
                        {submission.challenge_title}
                      </h3>
                      {submission.course_name && (
                        <p className="font-body text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {submission.course_name}
                        </p>
                      )}
                      <p className="font-body text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {submission.completed_at ? new Date(submission.completed_at).toLocaleString() : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{submission.total_operations || 0}</p>
                        <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('pendingReviews.operations')}</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-mono text-2xl font-bold ${submission.is_approved ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {submission.calculated_mpu?.toFixed(2) || '-'}
                        </p>
                        <p className="font-body text-xs text-gray-500 dark:text-gray-400">MPU</p>
                      </div>
                      <div className="text-center">
                        <p className="font-mono text-2xl font-bold text-orange-600 dark:text-orange-400">{submission.errors_count || 0}</p>
                        <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('submissionReview.totalErrors')}</p>
                      </div>
                      {/* Botão de Retry se habilitado */}
                      {!submission.is_approved && submission.is_retry_allowed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRetry(submission);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-body font-bold text-sm transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          {t('myChallenges.retry')}
                        </button>
                      )}
                      <ChevronRight
                        onClick={() => navigate(`/challenges/result/${submission.id}`)}
                        className="w-6 h-6 text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
