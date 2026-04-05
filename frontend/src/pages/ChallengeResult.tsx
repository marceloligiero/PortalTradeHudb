import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, TrendingUp, Target, Clock, Check, X, AlertTriangle, Star, RotateCcw, Send } from 'lucide-react';
import api from '../lib/axios';
import { useAuthStore } from '../stores/authStore';
import { RatingModal } from '../components';

interface OperationError {
  error_type: string;
  description: string;
}

interface ChallengeOperation {
  id: number;
  operation_number: number;
  operation_reference: string;
  has_error: boolean;
  errors: OperationError[];
}

interface SubmissionError {
  id: number;
  error_type: string;
  description: string;
  operation_reference?: string;
  created_at?: string;
}

interface ErrorsSummary {
  operations_with_errors: number;
  max_errors_allowed: number;
  error_methodology: number;
  error_knowledge: number;
  error_detail: number;
  error_procedure: number;
  total_individual_errors: number;
}

interface ChallengeSubmissionDetail {
  id: number;
  challenge_id: number;
  user_id: number;
  training_plan_id?: number;
  submission_type: string;
  status?: string;
  total_operations: number;
  total_time_minutes: number;
  started_at: string;
  completed_at: string;
  calculated_mpu: number;
  mpu_vs_target: number;
  is_approved: boolean | null;
  score: number;
  feedback: string | null;
  errors_count?: number;
  challenge: {
    id: number;
    title: string;
    description: string;
    operations_required: number;
    time_limit_minutes: number;
    target_mpu: number;
    max_errors?: number;
    target_kpi?: string;
    challenge_type?: string;
    kpi_mode?: 'AUTO' | 'MANUAL';
    use_volume_kpi?: boolean;
    use_mpu_kpi?: boolean;
    use_errors_kpi?: boolean;
  };
  user: {
    id: number;
    full_name: string;
    email: string;
  };
  parts: Array<{
    id: number;
    part_number: number;
    operations_count: number;
    started_at: string;
    completed_at: string;
    duration_minutes: number;
    mpu: number;
  }>;
  operations?: ChallengeOperation[];
  submission_errors?: SubmissionError[];
  errors_summary?: ErrorsSummary;
}

const ChallengeResult: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId: string }>();
  const searchParams = new URLSearchParams(window.location.search);
  const urlPlanId = searchParams.get('planId');
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<ChallengeSubmissionDetail | null>(null);
  const [approving, setApproving] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [isPlanFinalized, setIsPlanFinalized] = useState(false);

  const isTrainerOrAdmin = user?.is_admin || user?.is_formador;
  const planId = urlPlanId || (submission?.training_plan_id ? String(submission.training_plan_id) : null);

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      const response = await api.get(`/api/challenges/submissions/${submissionId}`);
      setSubmission(response.data);

      const effectivePlanId = urlPlanId || response.data?.training_plan_id;

      if (effectivePlanId) {
        try {
          const planResp = await api.get(`/api/training-plans/${effectivePlanId}/completion-status`);
          setIsPlanFinalized(planResp.data?.is_finalized || false);
        } catch (err) {
          console.log('Erro ao verificar status do plano');
        }

        if (response.data?.challenge_id) {
          try {
            const ratingResp = await api.get(`/api/ratings/check`, {
              params: {
                rating_type: 'CHALLENGE',
                challenge_id: response.data.challenge_id,
                training_plan_id: effectivePlanId
              }
            });
            setHasRated(ratingResp.data?.exists || false);
          } catch (err) {
            console.log('Erro ao verificar rating');
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar resultado:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approve: boolean) => {
    if (!submission) return;
    setApproving(true);
    try {
      const kpiMode = submission.challenge?.kpi_mode || 'AUTO';
      const endpoint = kpiMode === 'MANUAL'
        ? `/api/challenges/submissions/${submissionId}/manual-finalize`
        : `/api/challenges/submissions/${submissionId}/finalize-review`;

      await api.post(endpoint, { approve });
      await loadSubmission();
    } catch (err: any) {
      console.error('Erro ao aprovar/reprovar:', err);
      alert(err.response?.data?.detail || t('challengeResult.approvalError'));
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="font-body text-gray-900 dark:text-white">{t('challengeResult.notFound')}</div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status badge config
  const statusConfig: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode; label: string }> = {
    APPROVED: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-500/30',
      text: 'text-green-600 dark:text-green-400',
      icon: <Check className="w-5 h-5" />,
      label: t('challengeResult.approved'),
    },
    REJECTED: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-500/30',
      text: 'text-red-600 dark:text-red-400',
      icon: <X className="w-5 h-5" />,
      label: t('challengeResult.rejected'),
    },
    PENDING_REVIEW: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-500/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      icon: <Clock className="w-5 h-5" />,
      label: t('challengeResult.pendingReview'),
    },
  };

  const currentStatus = statusConfig[submission.status || ''] || {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    icon: <Clock className="w-5 h-5" />,
    label: t('challengeResult.inProgress'),
  };

  // Metric cards config
  const metrics = [
    {
      icon: Target,
      title: t('challengeResult.operationsVolume'),
      desc: t('challengeResult.operationsVolumeDesc'),
      value: submission.total_operations,
      unit: '',
      target: submission.challenge.operations_required,
      targetLabel: t('challengeResult.ofRequired', { count: submission.challenge.operations_required }),
      pct: Math.round((submission.total_operations / submission.challenge.operations_required) * 100),
      ok: submission.total_operations >= submission.challenge.operations_required,
      barColor: 'from-green-500 to-emerald-400',
    },
    {
      icon: AlertTriangle,
      title: t('challengeResult.operationsWithErrors'),
      desc: t('challengeResult.operationsWithErrorsDesc'),
      value: submission.errors_summary?.operations_with_errors ?? submission.errors_count ?? 0,
      unit: '',
      target: submission.errors_summary?.max_errors_allowed ?? submission.challenge.max_errors ?? 0,
      targetLabel: `${t('challengeResult.maxAllowed')}: ${submission.errors_summary?.max_errors_allowed ?? submission.challenge.max_errors ?? 0}`,
      pct: Math.min(Math.round(((submission.errors_summary?.operations_with_errors ?? submission.errors_count ?? 0) / Math.max(submission.errors_summary?.max_errors_allowed ?? submission.challenge.max_errors ?? 1, 1)) * 100), 100),
      ok: (submission.errors_summary?.operations_with_errors ?? submission.errors_count ?? 0) <= (submission.errors_summary?.max_errors_allowed ?? submission.challenge.max_errors ?? 0),
      barColor: 'from-red-500 to-orange-500',
    },
    {
      icon: Clock,
      title: t('challengeResult.totalTime'),
      desc: t('challengeResult.totalTimeDesc'),
      value: submission.total_time_minutes,
      unit: 'min',
      target: submission.challenge.time_limit_minutes,
      targetLabel: `${t('challengeResult.timeLimit')}: ${submission.challenge.time_limit_minutes} ${t('challengeResult.minutes')}`,
      pct: Math.min(Math.round((submission.total_time_minutes / submission.challenge.time_limit_minutes) * 100), 100),
      ok: submission.total_time_minutes <= submission.challenge.time_limit_minutes,
      barColor: 'from-blue-500 to-cyan-400',
    },
    {
      icon: TrendingUp,
      title: t('challengeResult.mpuTitle'),
      desc: t('challengeResult.mpuDesc'),
      value: (submission.calculated_mpu ?? 0).toFixed(2),
      unit: 'min/op',
      target: submission.challenge?.target_mpu ?? 0,
      targetLabel: `${t('challengeResult.mpuTarget')}: ≤ ${(submission.challenge?.target_mpu ?? 0).toFixed(2)} min/op`,
      pct: Math.min(Math.round(((submission.challenge?.target_mpu ?? 1) / Math.max(submission.calculated_mpu ?? 1, 0.01)) * 100), 100),
      ok: (submission.calculated_mpu ?? 0) <= (submission.challenge?.target_mpu ?? 0),
      barColor: 'from-yellow-500 to-amber-400',
    },
  ];

  const errorTypeStyle = (type: string) => {
    switch (type) {
      case 'METHODOLOGY': return 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400';
      case 'KNOWLEDGE': return 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400';
      case 'DETAIL': return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
      case 'PROCEDURE': return 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const errorTypeLabel = (type: string) => {
    switch (type) {
      case 'METHODOLOGY': return t('challengeResult.methodology');
      case 'KNOWLEDGE': return t('challengeResult.knowledge');
      case 'DETAIL': return t('challengeResult.detail');
      case 'PROCEDURE': return t('challengeResult.procedure');
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header Card ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => planId ? navigate(`/training-plans/${planId}`) : navigate(-1)}
            className="p-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#EC0000]/30 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-[#EC0000]" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
              {t('challengeResult.title')}
            </p>
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {submission.challenge.title}
            </h1>
            <p className="font-body text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('challengeResult.student')}: {submission.user.full_name}
            </p>

            {/* KPI Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {submission.challenge.challenge_type && (
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300">
                  {submission.challenge.challenge_type === 'SUMMARY' ? t('challengeResult.typeSummary') : t('challengeResult.typeComplete')}
                </span>
              )}
              <span className="font-body text-xs text-gray-400 dark:text-gray-500">{t('challengeResult.kpisEvaluated')}:</span>
              {submission.challenge.use_volume_kpi && (
                <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg text-xs font-bold text-green-600 dark:text-green-400">
                  {t('challengeResult.volumeKpi')}
                </span>
              )}
              {submission.challenge.use_mpu_kpi && (
                <span className="px-2.5 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 rounded-lg text-xs font-bold text-yellow-600 dark:text-yellow-400">
                  {t('challengeResult.mpuKpi')}
                </span>
              )}
              {submission.challenge.use_errors_kpi && (
                <span className="px-2.5 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg text-xs font-bold text-[#EC0000]">
                  {t('challengeResult.errorsKpi')}
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className={`px-4 py-2.5 rounded-xl flex items-center gap-2 border shrink-0 ${currentStatus.bg} ${currentStatus.border}`}>
            <span className={currentStatus.text}>{currentStatus.icon}</span>
            <span className={`font-body font-bold text-sm ${currentStatus.text}`}>{currentStatus.label}</span>
          </div>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <m.icon className="w-6 h-6 text-[#EC0000]" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-bold text-gray-900 dark:text-white">{m.title}</h3>
                  <p className="font-body text-xs text-gray-400 dark:text-gray-500">{m.desc}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                m.ok
                  ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
              }`}>
                {m.ok
                  ? (i === 0 ? t('challengeResult.targetReached') : i === 1 ? t('challengeResult.withinLimit') : i === 2 ? t('challengeResult.onTime') : t('challengeResult.efficient'))
                  : (i === 0 ? t('challengeResult.belowTarget') : i === 1 ? t('challengeResult.aboveLimit') : i === 2 ? t('challengeResult.timeExceeded') : t('challengeResult.aboveExpected'))
                }
              </span>
            </div>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="font-mono text-4xl font-bold text-gray-900 dark:text-white">
                  {m.value}<span className="font-body text-lg text-gray-400 dark:text-gray-500 ml-1">{m.unit}</span>
                </p>
                <p className="font-body text-sm text-gray-500 dark:text-gray-400 mt-1">{m.targetLabel}</p>
              </div>
              {i !== 1 && (
                <p className="font-mono text-xl font-bold text-gray-400 dark:text-gray-500">{m.pct}%</p>
              )}
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${m.ok ? m.barColor : 'from-red-500 to-orange-500'}`}
                style={{ width: `${m.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Parts Breakdown ── */}
      {submission.submission_type === 'COMPLETE' && submission.parts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-headline text-xl font-bold text-gray-900 dark:text-white mb-4">{t('challengeResult.partsBreakdown')}</h2>
          <div className="space-y-3">
            {submission.parts.map((part) => (
              <div key={part.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex items-center justify-between border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                    <span className="font-mono font-bold text-[#EC0000]">#{part.part_number}</span>
                  </div>
                  <div>
                    <p className="font-body font-semibold text-gray-900 dark:text-white">{t('challengeResult.part')} {part.part_number}</p>
                    <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                      {part.operations_count} {t('challengeResult.operationsIn')} {(part.duration_minutes ?? 0).toFixed(1)} min
                    </p>
                    <p className="font-body text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(part.started_at)} - {formatDate(part.completed_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold text-[#EC0000]">{(part.mpu ?? 0).toFixed(2)}</p>
                  <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">min/op</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Summary ── */}
      {submission.submission_type === 'SUMMARY' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-headline text-xl font-bold text-gray-900 dark:text-white mb-4">{t('challengeResult.summary')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-body text-sm text-gray-400 dark:text-gray-500 mb-1">{t('challengeResult.started')}</p>
              <p className="font-mono text-gray-900 dark:text-white">{formatDate(submission.started_at)}</p>
            </div>
            <div>
              <p className="font-body text-sm text-gray-400 dark:text-gray-500 mb-1">{t('challengeResult.completed')}</p>
              <p className="font-mono text-gray-900 dark:text-white">{formatDate(submission.completed_at)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Errors Breakdown ── */}
      {submission.errors_summary && submission.errors_summary.operations_with_errors > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#EC0000]" />
            </div>
            <h2 className="font-headline text-xl font-bold text-gray-900 dark:text-white">{t('challengeResult.errorsBreakdown')}</h2>
          </div>

          {/* Error Type Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { value: submission.errors_summary.error_methodology, label: t('challengeResult.methodology'), color: 'text-red-600 dark:text-red-400' },
              { value: submission.errors_summary.error_knowledge, label: t('challengeResult.knowledge'), color: 'text-orange-600 dark:text-orange-400' },
              { value: submission.errors_summary.error_detail, label: t('challengeResult.detail'), color: 'text-yellow-600 dark:text-yellow-400' },
              { value: submission.errors_summary.error_procedure, label: t('challengeResult.procedure'), color: 'text-blue-600 dark:text-blue-400' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
                <p className={`font-mono text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Operations with errors (COMPLETE) */}
          {submission.operations && submission.operations.filter(op => op.has_error).length > 0 && (
            <div className="space-y-3">
              <h3 className="font-headline text-base font-bold text-gray-900 dark:text-white mb-3">{t('challengeResult.operationsWithErrorsList')}</h3>
              {submission.operations.filter(op => op.has_error).map((operation) => (
                <div key={operation.id} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-lg flex items-center justify-center">
                      <span className="font-mono font-bold text-sm text-red-600 dark:text-red-400">#{operation.operation_number}</span>
                    </div>
                    <div>
                      <p className="font-body font-semibold text-gray-900 dark:text-white">{t('challengeResult.operation')} {operation.operation_number}</p>
                      {operation.operation_reference && (
                        <p className="font-body text-sm text-gray-400 dark:text-gray-500">Ref: {operation.operation_reference}</p>
                      )}
                    </div>
                  </div>
                  {operation.errors && operation.errors.length > 0 && (
                    <div className="ml-13 space-y-2 mt-3">
                      {operation.errors.map((error, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-white dark:bg-gray-900 rounded-lg p-2.5 border border-red-100 dark:border-red-500/10">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider shrink-0 ${errorTypeStyle(error.error_type)}`}>
                            {errorTypeLabel(error.error_type)}
                          </span>
                          <p className="font-body text-sm text-gray-600 dark:text-gray-300">{error.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Detailed errors (SUMMARY) */}
          {submission.submission_errors && submission.submission_errors.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-headline text-base font-bold text-gray-900 dark:text-white mb-3">{t('challengeResult.registeredErrors')}</h3>
              {submission.submission_errors.map((error, idx) => (
                <div key={error.id} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <span className="font-mono font-bold text-sm text-red-600 dark:text-red-400">#{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${errorTypeStyle(error.error_type)}`}>
                          {errorTypeLabel(error.error_type)}
                        </span>
                        {error.operation_reference && (
                          <span className="font-body text-xs text-gray-400 dark:text-gray-500">
                            {t('challengeResult.ref')}: {error.operation_reference}
                          </span>
                        )}
                      </div>
                      <p className="font-body text-gray-600 dark:text-gray-300">{error.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : submission.submission_type === 'SUMMARY' && submission.errors_summary && submission.errors_summary.total_individual_errors > 0 ? (
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4">
              <p className="font-body text-sm text-orange-600 dark:text-orange-400">
                <strong>{t('challengeResult.totalErrorsRegistered', { count: submission.errors_summary.total_individual_errors })}:</strong>
              </p>
              <ul className="mt-2 space-y-1 font-body text-gray-600 dark:text-gray-300 text-sm">
                {submission.errors_summary.error_methodology > 0 && (
                  <li>• {submission.errors_summary.error_methodology} {t('challengeResult.errorsOf')} {t('challengeResult.methodology')}</li>
                )}
                {submission.errors_summary.error_knowledge > 0 && (
                  <li>• {submission.errors_summary.error_knowledge} {t('challengeResult.errorsOf')} {t('challengeResult.knowledge')}</li>
                )}
                {submission.errors_summary.error_detail > 0 && (
                  <li>• {submission.errors_summary.error_detail} {t('challengeResult.errorsOf')} {t('challengeResult.detail')}</li>
                )}
                {submission.errors_summary.error_procedure > 0 && (
                  <li>• {submission.errors_summary.error_procedure} {t('challengeResult.errorsOf')} {t('challengeResult.procedure')}</li>
                )}
              </ul>
              <p className="font-body text-gray-400 dark:text-gray-500 text-xs mt-3">
                {t('challengeResult.noDetailsAvailable')}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Feedback ── */}
      {submission.feedback && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-headline text-xl font-bold text-gray-900 dark:text-white mb-4">{t('challengeResult.feedback')}</h2>
          <p className="font-body text-gray-600 dark:text-gray-300">{submission.feedback}</p>
        </div>
      )}

      {/* ── Trainer Approval (PENDING_REVIEW) ── */}
      {isTrainerOrAdmin && submission.status === 'PENDING_REVIEW' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-yellow-200 dark:border-yellow-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="font-headline text-lg font-bold text-gray-900 dark:text-white">{t('challengeResult.awaitingDecision')}</h2>
          </div>
          {(submission.challenge as any)?.kpi_mode === 'AUTO' ? (
            <>
              <p className="font-body text-gray-500 dark:text-gray-400 mb-6">
                {t('challengeResult.autoEvalDescription', 'A avaliação será calculada automaticamente com base nos KPIs configurados.')}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleApproval(true)}
                  disabled={approving}
                  className="flex items-center gap-2 px-8 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  {approving ? t('challengeResult.processing') : t('challengeResult.finalizeAuto', 'Finalizar Avaliação Automática')}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="font-body text-gray-500 dark:text-gray-400 mb-6">
                {t('challengeResult.manualEvalDescription')}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleApproval(true)}
                  disabled={approving}
                  className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-body font-bold transition-colors disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                  {approving ? t('challengeResult.processing') : t('challengeResult.approve')}
                </button>
                <button
                  onClick={() => handleApproval(false)}
                  disabled={approving}
                  className="flex items-center gap-2 px-8 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                  {approving ? t('challengeResult.processing') : t('challengeResult.reject')}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Retry Button ── */}
      {isTrainerOrAdmin && submission.status === 'REJECTED' && !(submission as any).is_retry_allowed && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-orange-200 dark:border-orange-500/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="font-headline text-base font-bold text-gray-900 dark:text-white">
                  {t('challengeResult.retryTitle', 'Liberar Nova Tentativa')}
                </h2>
                <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                  {t('challengeResult.retryDescription', 'O formando foi reprovado. Pode liberar uma nova tentativa para que tente novamente.')}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!confirm(t('challengeResult.confirmRetry', 'Deseja liberar uma nova tentativa?'))) return;
                try {
                  await api.post(`/api/challenges/submissions/${submissionId}/allow-retry`);
                  alert(t('challengeResult.retrySuccess', 'Nova tentativa liberada com sucesso!'));
                  await loadSubmission();
                } catch (err: any) {
                  alert(err.response?.data?.detail || t('challengeResult.retryError', 'Erro ao liberar nova tentativa'));
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold transition-colors shrink-0"
            >
              <RotateCcw className="w-5 h-5" />
              {t('challengeResult.allowRetry', 'Liberar Nova Tentativa')}
            </button>
          </div>
        </div>
      )}

      {isTrainerOrAdmin && (submission as any).is_retry_allowed && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-green-200 dark:border-green-500/20 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="font-body font-semibold text-green-600 dark:text-green-400">
              {t('challengeResult.retryAlreadyAllowed', 'Nova tentativa já foi liberada para o formando.')}
            </span>
          </div>
        </div>
      )}

      {/* ── Rating ── */}
      {!isTrainerOrAdmin && submission.is_approved === true && planId && isPlanFinalized && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-500/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="font-headline text-base font-bold text-gray-900 dark:text-white">
                  {t('challengeResult.rateChallenge')}
                </h2>
                <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                  {hasRated ? t('challengeResult.thankYouRating') : t('challengeResult.ratingImportant')}
                </p>
              </div>
            </div>
            {hasRated ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl font-body text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {t('challengeResult.challengeRated')}
              </div>
            ) : (
              <button
                onClick={() => setShowRatingModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold transition-colors shrink-0"
              >
                <Star className="w-5 h-5" />
                {t('challengeResult.rateButton')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Back Button ── */}
      <div className="flex justify-center">
        <button
          onClick={() => planId ? navigate(`/training-plans/${planId}`) : navigate(-1)}
          className="px-8 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold transition-colors"
        >
          {t('common.back')}
        </button>
      </div>

      {/* Rating Modal */}
      {submission && planId && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setHasRated(true);
          }}
          ratingType="CHALLENGE"
          itemId={submission.challenge_id}
          itemTitle={submission.challenge.title}
          trainingPlanId={parseInt(planId)}
        />
      )}
    </div>
  );
};

export default ChallengeResult;
