import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

  /* ── Loading ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 mt-4 font-body text-sm">{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6 text-[#EC0000]" />
            </div>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
                {t('pendingReviews.title')}
              </p>
              <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {t('pendingReviews.title')}
              </h1>
              <p className="font-body text-gray-500 dark:text-gray-400 mt-1 text-sm">
                {submissions.length === 1
                  ? t('pendingReviews.subtitle', { count: submissions.length })
                  : t('pendingReviews.subtitlePlural', { count: submissions.length })
                }
              </p>
            </div>
          </div>
          <button
            onClick={loadSubmissions}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-body font-bold text-sm transition-colors shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.refresh', 'Atualizar')}
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {[
            { icon: AlertCircle, value: submissions.length, label: t('pendingReviews.awaitingReview', 'Aguardando Revisão'), accent: submissions.length > 0 ? 'text-amber-500' : 'text-gray-400' },
            { icon: Hash, value: submissions.reduce((acc, s) => acc + (s.total_operations || 0), 0), label: t('pendingReviews.operations', 'Operações'), accent: 'text-blue-500' },
            { icon: Clock, value: formatTime(submissions.reduce((acc, s) => acc + (s.total_time_minutes || 0), 0)), label: t('pendingReviews.totalTime', 'Tempo Total'), accent: 'text-[#EC0000]' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.accent} shrink-0`} />
              <div>
                <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      {submissions.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="font-headline text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">
            {t('pendingReviews.allCaughtUp')}
          </h3>
          <p className="font-body text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto">
            {t('pendingReviews.noPendingReviews')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              onClick={() => navigate(`/submissions/${submission.id}/review`)}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-[#EC0000]/30 transition-colors cursor-pointer"
            >
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left: Challenge info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                      <Target className="w-6 h-6 text-[#EC0000]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline text-base font-bold text-gray-900 dark:text-white truncate">
                        {submission.challenge?.title || `Desafio #${submission.challenge_id}`}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {submission.user?.full_name || t('pendingReviews.student')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(submission.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Stats + badge + arrow */}
                  <div className="flex items-center gap-5 shrink-0">
                    {/* Operations */}
                    <div className="text-center">
                      <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                        {submission.total_operations || 0}
                      </p>
                      <p className="font-body text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('pendingReviews.operations')}</p>
                    </div>

                    {/* Time */}
                    <div className="text-center">
                      <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                        {formatTime(submission.total_time_minutes || 0)}
                      </p>
                      <p className="font-body text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('pendingReviews.totalTime')}</p>
                    </div>

                    {/* Status badge */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {t('pendingReviews.awaitingReview')}
                    </span>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
