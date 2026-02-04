import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Target, 
  Clock, 
  User, 
  RefreshCw, 
  ChevronRight,
  ClipboardCheck,
  AlertCircle,
  Hash
} from 'lucide-react';
import api from '../../lib/axios';

interface Submission {
  id: number;
  challenge_id: number;
  user_id: number;
  submission_type: string;
  status: string;
  total_operations: number;
  total_time_minutes: number;
  started_at: string;
  updated_at: string;
  challenge?: {
    id: number;
    title: string;
    operations_required: number;
    target_mpu: number;
  };
  user?: {
    id: number;
    full_name: string;
    email: string;
  };
}

export default function PendingReviews() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/challenges/pending-review/list');
      setSubmissions(response.data);
    } catch (error) {
      console.error('Erro ao carregar submissões:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}min`;
    return `${m} min`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('pendingReviews.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {submissions.length === 1 
                ? t('pendingReviews.subtitle', { count: submissions.length })
                : t('pendingReviews.subtitlePlural', { count: submissions.length })
              }
            </p>
          </div>
        </div>
        <button
          onClick={loadSubmissions}
          className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Lista de Submissões */}
      {submissions.length === 0 ? (
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center shadow-sm dark:shadow-none">
          <ClipboardCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('pendingReviews.allCaughtUp')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('pendingReviews.noPendingReviews')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission, index) => (
            <motion.div
              key={submission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 hover:border-orange-500/50 transition-all cursor-pointer shadow-sm dark:shadow-none"
              onClick={() => navigate(`/submissions/${submission.id}/review`)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                      <Target className="w-7 h-7 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {submission.challenge?.title || `Desafio #${submission.challenge_id}`}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {submission.user?.full_name || t('pendingReviews.student')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(submission.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Operações */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xl font-bold text-gray-900 dark:text-white">
                        <Hash className="w-5 h-5 text-blue-400" />
                        {submission.total_operations || 0}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('pendingReviews.operations')}</p>
                    </div>

                    {/* Tempo */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xl font-bold text-gray-900 dark:text-white">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        {formatTime(submission.total_time_minutes || 0)}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('pendingReviews.totalTime')}</p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-bold text-orange-400">
                        {t('pendingReviews.awaitingReview')}
                      </span>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
