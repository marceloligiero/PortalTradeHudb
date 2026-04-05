import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Target,
  Play,
  Square,
  Clock,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Timer,
  Hash,
  TrendingUp,
  AlertTriangle,
  Send
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

interface Challenge {
  id: number;
  title: string;
  description?: string;
  operations_required: number;
  time_limit_minutes: number;
  target_mpu?: number;
  max_errors: number;
  use_volume_kpi: boolean;
  use_mpu_kpi: boolean;
  use_errors_kpi: boolean;
}

interface OperationError {
  id: number;
  error_type: string;
  description?: string;
}

interface Operation {
  id: number;
  operation_number: number;
  operation_reference: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  has_error: boolean;
  is_approved?: boolean;
  errors?: OperationError[];
}

interface Submission {
  id: number;
  status: string;
  started_at: string;
  total_operations: number;
  correct_operations: number;
  errors_count: number;
}

export default function ChallengeExecution() {
  const { challengeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = useAuthStore();

  const planId = searchParams.get('planId');
  const submissionIdFromUrl = searchParams.get('submissionId');

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [, setSubmission] = useState<Submission | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [newReference, setNewReference] = useState('');
  const [currentOperation, setCurrentOperation] = useState<Operation | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(submissionIdFromUrl);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !challengeId) return;

      try {
        setLoading(true);

        const challengeResp = await api.get(`/api/challenges/${challengeId}`);
        setChallenge(challengeResp.data);

        let subId = submissionIdFromUrl;

        if (!subId) {
          try {
            const existingResp = await api.post(`/api/challenges/submit/complete/start/${challengeId}/self`, {
              training_plan_id: planId ? parseInt(planId) : null
            });

            if (existingResp.data && existingResp.data.id) {
              subId = String(existingResp.data.id);
              setCurrentSubmissionId(subId);
              setSubmission(existingResp.data);
              const newParams = new URLSearchParams(searchParams);
              newParams.set('submissionId', subId);
              setSearchParams(newParams, { replace: true });
            }
          } catch (err: any) {
            if (err.response?.status === 400) {
              console.log('Desafio já foi submetido');
            }
          }
        }

        if (subId) {
          const subResp = await api.get(`/api/challenges/submissions/${subId}`);
          setSubmission(subResp.data);

          const opsResp = await api.get(`/api/challenges/submissions/${subId}/operations`);
          setOperations(opsResp.data || []);

          const inProgress = (opsResp.data || []).find((op: Operation) => !op.completed_at);
          setCurrentOperation(inProgress || null);

          setCurrentSubmissionId(subId);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, challengeId]);

  const loadData = async () => {
    if (!token || !challengeId || !currentSubmissionId) return;

    try {
      setLoading(true);

      const subResp = await api.get(`/api/challenges/submissions/${currentSubmissionId}`);
      setSubmission(subResp.data);

      const opsResp = await api.get(`/api/challenges/submissions/${currentSubmissionId}/operations`);
      setOperations(opsResp.data || []);

      const inProgress = (opsResp.data || []).find((op: Operation) => !op.completed_at);
      setCurrentOperation(inProgress || null);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentOperation) {
      setElapsedTime(0);
      return;
    }

    const startTime = new Date(currentOperation.started_at).getTime();

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentOperation]);

  const handleStartOperation = async () => {
    if (!newReference.trim()) {
      alert(t('challengeExecution.insertReference'));
      return;
    }

    try {
      setActionLoading(true);

      let subId = currentSubmissionId;
      if (!subId) {
        const startResp = await api.post(`/api/challenges/submit/complete/start/${challengeId}/self`, {
          training_plan_id: planId ? parseInt(planId) : null
        });
        subId = String(startResp.data.id);
        setSubmission(startResp.data);
        setCurrentSubmissionId(subId);
        setSearchParams({ submissionId: subId });
      }

      const opResp = await api.post(`/api/challenges/submissions/${subId}/operations/start`, {
        operation_reference: newReference.trim()
      });

      setCurrentOperation(opResp.data);
      setOperations(prev => [...prev, opResp.data]);
      setNewReference('');
    } catch (error: any) {
      alert(error.response?.data?.detail || t('challengeExecution.startOperationError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinishOperation = async () => {
    if (!currentOperation) return;

    try {
      setActionLoading(true);

      await api.post(`/api/challenges/operations/${currentOperation.id}/finish`);

      await loadData();
      setCurrentOperation(null);
    } catch (error: any) {
      alert(error.response?.data?.detail || t('challengeExecution.finishOperationError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!currentSubmissionId) return;

    if (!confirm(t('challengeExecution.confirmSubmit'))) {
      return;
    }

    try {
      setActionLoading(true);

      await api.post(`/api/challenges/submissions/${currentSubmissionId}/submit-for-review`);

      alert(t('challengeExecution.submittedSuccess'));
      navigate('/challenges');
    } catch (error: any) {
      alert(error.response?.data?.detail || t('challengeExecution.submitError'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin" />
      </div>
    );
  }

  const completedOperations = operations.filter(op => op.completed_at);
  const progressPercent = challenge
    ? Math.min(100, (completedOperations.length / challenge.operations_required) * 100)
    : 0;

  const allOperationsCompleted = challenge
    ? completedOperations.length >= challenge.operations_required
    : false;

  const canAddMoreOperations = challenge
    ? operations.length < challenge.operations_required
    : true;

  const remainingOperations = challenge
    ? Math.max(0, challenge.operations_required - completedOperations.length)
    : 0;

  const kpiStats = [
    {
      icon: Hash,
      value: `${completedOperations.length}/${challenge?.operations_required}`,
      label: t('challengeExecution.operations'),
      isKpi: challenge?.use_volume_kpi,
      kpiLabel: 'Volume',
    },
    {
      icon: TrendingUp,
      value: challenge?.target_mpu ? String(challenge.target_mpu) : '-',
      label: t('challengeExecution.targetMPU'),
      isKpi: challenge?.use_mpu_kpi,
      kpiLabel: 'MPU',
    },
    {
      icon: AlertTriangle,
      value: `${operations.filter(op => op.has_error).length}/${challenge?.max_errors}`,
      label: t('challengeExecution.maxErrors'),
      isKpi: challenge?.use_errors_kpi,
      kpiLabel: t('challengeExecution.maxErrors'),
    },
    {
      icon: Clock,
      value: challenge?.time_limit_minutes ? `${challenge.time_limit_minutes}m` : '-',
      label: t('challengeExecution.timeLimit'),
      isKpi: false,
      kpiLabel: '',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header Card ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#EC0000]/30 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-[#EC0000]" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
              {t('challengeExecution.challengeProgress')}
            </p>
            <h1 className="font-headline text-2xl font-bold text-gray-900 dark:text-white truncate">
              {challenge?.title}
            </h1>
            {challenge?.description && (
              <p className="font-body text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                {challenge.description}
              </p>
            )}
          </div>

          <button
            onClick={loadData}
            className="p-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#EC0000]/30 transition-colors shrink-0"
          >
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {kpiStats.map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                stat.isKpi
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <stat.icon className={`w-5 h-5 ${stat.isKpi ? 'text-[#EC0000]' : 'text-gray-400 dark:text-gray-500'}`} />
              </div>
              <div>
                <p className="font-mono text-xl font-bold text-gray-900 dark:text-white leading-none">
                  {stat.value}
                </p>
                <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">
                  {stat.label}
                  {stat.isKpi && <span className="text-[#EC0000] ml-1">(KPI)</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-body text-sm text-gray-500 dark:text-gray-400">
              {t('challengeExecution.challengeProgress')}
            </span>
            <span className="font-body text-sm text-gray-900 dark:text-white">
              <span className="font-mono font-bold text-[#EC0000]">{completedOperations.length}</span>
              <span className="text-gray-400 dark:text-gray-500"> / </span>
              <span className="font-mono font-bold">{challenge?.operations_required}</span>
            </span>
            {remainingOperations > 0 && (
              <span className="font-body text-xs text-amber-600 dark:text-amber-400">
                ({remainingOperations === 1
                  ? t('challengeExecution.remaining', { count: remainingOperations })
                  : t('challengeExecution.remainingPlural', { count: remainingOperations })})
              </span>
            )}
          </div>
          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#EC0000] to-[#CC0000] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Action Zone ── */}
      {currentOperation ? (
        /* Operation in Progress */
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-[#EC0000]/30 p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <Timer className="w-8 h-8 text-[#EC0000]" />
            </div>

            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-2">
              {t('challengeExecution.operationInProgress')}
            </p>

            <div className="font-mono text-5xl font-bold text-gray-900 dark:text-white mb-3">
              {formatTime(elapsedTime)}
            </div>

            <p className="font-body text-gray-500 dark:text-gray-400 mb-8">
              {t('challengeExecution.reference')}: <span className="font-mono font-bold text-gray-900 dark:text-white">{currentOperation.operation_reference}</span>
            </p>

            <button
              onClick={handleFinishOperation}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-lg transition-colors disabled:opacity-50"
            >
              {actionLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Square className="w-6 h-6" />
              )}
              {t('challengeExecution.finishOperationBtn')}
            </button>
          </div>
        </div>
      ) : canAddMoreOperations ? (
        /* Start New Operation */
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 text-[#EC0000]" />
            </div>
            <h2 className="font-headline text-lg font-bold text-gray-900 dark:text-white">
              {t('challengeExecution.startNewOperation')}
            </h2>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={newReference}
              onChange={(e) => setNewReference(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartOperation()}
              placeholder={t('challengeExecution.referencePlaceholder')}
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-body text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#EC0000] focus:ring-1 focus:ring-[#EC0000]/20 transition-colors"
            />
            <button
              onClick={handleStartOperation}
              disabled={actionLoading || !newReference.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {actionLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {t('challengeExecution.start')}
            </button>
          </div>
        </div>
      ) : (
        /* All Operations Completed — Submit */
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('challengeExecution.allOperationsCompleted')}
            </h3>
            <p className="font-body text-gray-500 dark:text-gray-400 mb-6">
              {t('challengeExecution.completedCount', { completed: completedOperations.length, total: challenge?.operations_required })}
              {!allOperationsCompleted && ` ${t('challengeExecution.awaitingCompletionHint')}`}
            </p>

            <button
              onClick={handleSubmitForReview}
              disabled={actionLoading || !allOperationsCompleted}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
              {t('challengeExecution.submitForReview')}
            </button>
          </div>
        </div>
      )}

      {/* ── Operations History ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-[#EC0000]" />
          </div>
          <h2 className="font-headline text-lg font-bold text-gray-900 dark:text-white">
            {t('challengeExecution.operationsPerformed')}
          </h2>
          <span className="font-mono text-sm font-bold text-[#EC0000]">
            ({completedOperations.length})
          </span>
        </div>

        {completedOperations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="font-body text-gray-400 dark:text-gray-500">{t('challengeExecution.noOperationsYet')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedOperations.map((op) => (
              <div
                key={op.id}
                className={`rounded-xl border p-4 transition-colors ${
                  op.has_error
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/20'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                      op.has_error
                        ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                        : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                    }`}>
                      {op.operation_number}
                    </div>
                    <div>
                      <p className="font-body font-semibold text-gray-900 dark:text-white">{op.operation_reference}</p>
                      <p className="font-body text-xs text-gray-400 dark:text-gray-500">
                        {new Date(op.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono font-bold text-gray-900 dark:text-white">
                        {formatTime(op.duration_seconds || 0)}
                      </p>
                      <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('challengeExecution.duration')}</p>
                    </div>
                    {op.has_error ? (
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    ) : op.is_approved !== undefined ? (
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        op.is_approved
                          ? 'bg-green-100 dark:bg-green-500/20'
                          : 'bg-yellow-100 dark:bg-yellow-500/20'
                      }`}>
                        <CheckCircle className={`w-5 h-5 ${op.is_approved ? 'text-green-600 dark:text-green-400' : 'text-yellow-500 dark:text-yellow-400'}`} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Errors Detail */}
                {op.has_error && op.errors && op.errors.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-500/20">
                    <p className="font-body text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider mb-2">
                      {t('challengeExecution.errorsIdentified')} ({op.errors.length}):
                    </p>
                    <div className="space-y-2">
                      {op.errors.map((err) => (
                        <div
                          key={err.id}
                          className="flex items-start gap-3 p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-red-100 dark:border-red-500/10"
                        >
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                            err.error_type === 'METODOLOGIA' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                            err.error_type === 'CONHECIMENTO' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                            err.error_type === 'DETALHE' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                            'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
                          }`}>
                            {err.error_type}
                          </span>
                          {err.description && (
                            <span className="font-body text-sm text-gray-600 dark:text-gray-300 flex-1">
                              {err.description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
