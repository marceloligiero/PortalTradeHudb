import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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
import { PremiumHeader, FloatingOrbs } from '../../components/premium';

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
}

interface MySubmission {
  id: number;
  challenge_id: number;
  challenge_title: string;
  challenge_type?: string;
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
    return submissions.filter(s => s.is_in_progress);
  };

  const getCompletedSubmissions = () => {
    return submissions.filter(s => s.completed_at);
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
    if (challenge.use_errors_kpi) kpis.push('Erros');
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
      alert(error.response?.data?.detail || 'Erro ao iniciar nova tentativa');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PremiumHeader
        icon={Target}
        title={t('myChallenges.title')}
        subtitle={t('myChallenges.subtitle')}
        badge={t('navigation.challenges')}
        iconColor="from-red-500 to-orange-500"
      />

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'available' 
              ? 'bg-red-500 text-white' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('myChallenges.available')} ({getAvailableChallenges().length})
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`flex-1 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'in_progress' 
              ? 'bg-yellow-500 text-black' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('myChallenges.inProgress')} ({getInProgressSubmissions().length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'completed' 
              ? 'bg-green-500 text-white' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('myChallenges.completed')} ({getCompletedSubmissions().length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'available' && (
        <div className="grid gap-4">
          {getAvailableChallenges().length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center shadow-sm dark:shadow-none"
            >
              <FloatingOrbs variant="subtle" />
              <Target className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('myChallenges.noAvailableChallenges')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('myChallenges.waitForTrainer')}
              </p>
            </motion.div>
          ) : (
            getAvailableChallenges().map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 hover:border-red-500/30 transition-all shadow-sm dark:shadow-none"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {challenge.title}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          challenge.challenge_type === 'COMPLETE' 
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' 
                            : 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                        }`}>
                          {challenge.challenge_type === 'COMPLETE' ? t('myChallenges.completeMode') : t('myChallenges.summaryMode')}
                        </span>
                      </div>
                      {challenge.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{challenge.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Metas */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                        <Target className="w-3 h-3" />
                        <span>{t('pendingReviews.operations')}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{challenge.operations_required}</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                        <Clock className="w-3 h-3" />
                        <span>{t('myChallenges.time')}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{challenge.time_limit_minutes} min</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{t('myChallenges.targetMPU')}</span>
                      </div>
                      <p className="text-lg font-bold text-yellow-500">{challenge.target_mpu.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* KPIs e Max Errors */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>{t('myChallenges.maxErrors')}: {challenge.max_errors}</span>
                    </div>
                    <div className="text-gray-500">
                      KPIs: {formatKpis(challenge)}
                    </div>
                  </div>

                  {/* Botão Executar - apenas para desafios COMPLETE */}
                  {challenge.challenge_type?.toUpperCase() === 'COMPLETE' ? (
                    <button
                      onClick={() => navigate(`/challenges/${challenge.id}/execute/complete`)}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition-all"
                    >
                      <Play className="w-5 h-5" />
                      {t('myChallenges.startChallenge')}
                    </button>
                  ) : (
                    <div className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-300 rounded-xl">
                      <Clock className="w-5 h-5" />
                      <span className="text-sm">{t('myChallenges.waitForTrainer')}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {activeTab === 'in_progress' && (
        <div className="grid gap-4">
          {getInProgressSubmissions().length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center shadow-sm dark:shadow-none"
            >
              <Play className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('myChallenges.noAvailableChallenges')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('myChallenges.waitForTrainer')}
              </p>
            </motion.div>
          ) : (
            getInProgressSubmissions().map((submission, index) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  const executionType = submission.submission_type?.toUpperCase() === 'SUMMARY' ? 'summary' : 'complete';
                  navigate(`/challenges/${submission.challenge_id}/execute/${executionType}?submissionId=${submission.id}`);
                }}
                className="relative overflow-hidden bg-yellow-500/10 backdrop-blur-xl rounded-2xl border border-yellow-500/30 hover:border-yellow-500/50 transition-all cursor-pointer group"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-bold">
                          {t('myChallenges.running')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-yellow-400 transition-colors">
                        {submission.challenge_title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {submission.started_at ? new Date(submission.started_at).toLocaleString() : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{submission.total_operations || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('pendingReviews.operations')}</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="grid gap-4">
          {getCompletedSubmissions().length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center shadow-sm dark:shadow-none"
            >
              <Trophy className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('myChallenges.noAvailableChallenges')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('myChallenges.waitForTrainer')}
              </p>
            </motion.div>
          ) : (
            getCompletedSubmissions().map((submission, index) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden backdrop-blur-xl rounded-2xl border transition-all ${
                  submission.is_approved
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
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
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {t('myChallenges.approved')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {t('myChallenges.rejected')}
                          </span>
                        )}
                        {submission.retry_count && submission.retry_count > 0 && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
                            {submission.retry_count + 1} {t('myChallenges.attempts')}
                          </span>
                        )}
                      </div>
                      <h3 className={`text-xl font-bold transition-colors ${
                        submission.is_approved 
                          ? 'text-gray-900 dark:text-white hover:text-green-400' 
                          : 'text-gray-900 dark:text-white hover:text-red-400'
                      }`}>
                        {submission.challenge_title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {submission.completed_at ? new Date(submission.completed_at).toLocaleString() : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{submission.total_operations || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('pendingReviews.operations')}</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${submission.is_approved ? 'text-green-400' : 'text-red-400'}`}>
                          {submission.calculated_mpu?.toFixed(2) || '-'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">MPU</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-400">{submission.errors_count || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('submissionReview.totalErrors')}</p>
                      </div>
                      {/* Botão de Retry se habilitado */}
                      {!submission.is_approved && submission.is_retry_allowed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRetry(submission);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-bold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg"
                        >
                          <RotateCcw className="w-4 h-4" />
                          {t('myChallenges.retry')}
                        </button>
                      )}
                      <ChevronRight 
                        onClick={() => navigate(`/challenges/result/${submission.id}`)}
                        className="w-6 h-6 text-gray-400 cursor-pointer hover:text-white transition-colors" 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
