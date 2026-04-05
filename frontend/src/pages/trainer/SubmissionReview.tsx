import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Target,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  User,
  Clock,
  Hash,
  Save,
  X,
  Plus,
  Timer,
  TrendingUp,
  FileText,
  RotateCcw
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

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

interface OperationError {
  id?: number;
  error_type: string;
  description: string;
}

interface Challenge {
  id: number;
  title: string;
  description?: string;
  operations_required?: number;
  time_limit_minutes?: number;
  target_mpu?: number;
  max_errors?: number;
  kpi_mode?: 'AUTO' | 'MANUAL';
  allow_retry?: boolean;
}

interface UserBasic {
  id: number;
  full_name: string;
  email: string;
}

interface Submission {
  id: number;
  user_id: number;
  user_name?: string;
  challenge_id: number;
  challenge_title?: string;
  status: string;
  submission_type?: string;
  started_at: string;
  completed_at?: string;
  total_operations: number;
  total_time_minutes?: number;
  calculated_mpu?: number;
  mpu_vs_target?: number;
  correct_operations: number;
  errors_count: number;
  error_methodology?: number;
  error_knowledge?: number;
  error_detail?: number;
  error_procedure?: number;
  operation_reference?: string;
  challenge?: Challenge;
  user?: UserBasic;
  submitter?: UserBasic;
  is_approved?: boolean;
  is_retry_allowed?: boolean;
  retry_count?: number;
  trainer_notes?: string;
  submission_errors?: SubmissionError[];
  errors_summary?: {
    operations_with_errors: number;
    max_errors_allowed: number;
    error_methodology: number;
    error_knowledge: number;
    error_detail: number;
    error_procedure: number;
    total_individual_errors: number;
  };
}

interface SubmissionError {
  id: number;
  error_type: string;
  description: string;
  operation_reference?: string;
  created_at?: string;
}

export default function SubmissionReview() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = useAuthStore();

  const ERROR_TYPES = [
    { value: 'METODOLOGIA', label: t('submissionReview.methodology'), description: t('submissionReview.methodologyDesc') },
    { value: 'CONHECIMENTO', label: t('submissionReview.knowledge'), description: t('submissionReview.knowledgeDesc') },
    { value: 'DETALHE', label: t('submissionReview.detail'), description: t('submissionReview.detailDesc') },
    { value: 'PROCEDIMENTO', label: t('submissionReview.procedure'), description: t('submissionReview.procedureDesc') }
  ];

  const translateErrorType = (type: string): string => {
    const map: Record<string, string> = {
      'METHODOLOGY': t('submissionReview.methodology'),
      'METODOLOGIA': t('submissionReview.methodology'),
      'KNOWLEDGE': t('submissionReview.knowledge'),
      'CONHECIMENTO': t('submissionReview.knowledge'),
      'DETAIL': t('submissionReview.detail'),
      'DETALHE': t('submissionReview.detail'),
      'PROCEDURE': t('submissionReview.procedure'),
      'PROCEDIMENTO': t('submissionReview.procedure'),
    };
    return map[type?.toUpperCase()] || type;
  };

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Estado para edição de erros
  const [editingOp, setEditingOp] = useState<number | null>(null);
  const [tempErrors, setTempErrors] = useState<OperationError[]>([]);

  const loadData = useCallback(async (showLoading = true) => {
    if (!token || !submissionId) return;

    try {
      if (showLoading) setLoading(true);

      const subResp = await api.get(`/api/challenges/submissions/${submissionId}`);
      setSubmission(subResp.data);

      if (subResp.data.submission_type !== 'SUMMARY') {
        const opsResp = await api.get(`/api/challenges/submissions/${submissionId}/operations`);
        setOperations(opsResp.data || []);
      } else {
        setOperations([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [token, submissionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling para ver novas operações do formando em tempo real
  useEffect(() => {
    if (!submission || submission.status === 'APPROVED' || submission.status === 'REJECTED') {
      return;
    }

    const interval = setInterval(() => {
      loadData(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [submission, loadData]);

  const handleStartEdit = (op: Operation) => {
    setEditingOp(op.id);
    setTempErrors(op.errors || []);
  };

  const handleCancelEdit = () => {
    setEditingOp(null);
    setTempErrors([]);
  };

  const handleAddError = () => {
    setTempErrors([...tempErrors, { error_type: 'METODOLOGIA', description: '' }]);
  };

  const handleRemoveError = (index: number) => {
    setTempErrors(tempErrors.filter((_, i) => i !== index));
  };

  const handleErrorChange = (index: number, field: 'error_type' | 'description', value: string) => {
    const updated = [...tempErrors];
    updated[index] = { ...updated[index], [field]: value };
    setTempErrors(updated);
  };

  const handleSaveClassification = async (operationId: number) => {
    try {
      setSavingId(operationId);

      for (const err of tempErrors) {
        if (!err.description.trim()) {
          alert(t('submissionReview.fillErrorDescription'));
          return;
        }
        if (err.description.length > 160) {
          alert(t('submissionReview.descriptionTooLong'));
          return;
        }
      }

      await api.post(`/api/challenges/operations/${operationId}/classify`, {
        has_error: tempErrors.length > 0,
        errors: tempErrors
      });

      await loadData();
      setEditingOp(null);
      setTempErrors([]);

      const subResp = await api.get(`/api/challenges/submissions/${submissionId}`);
      if (subResp.data?.status === 'APPROVED' || subResp.data?.status === 'REJECTED') {
        setSubmission(subResp.data);
      }
    } catch (error: any) {
      alert(error.response?.data?.detail || t('submissionReview.saveError'));
    } finally {
      setSavingId(null);
    }
  };

  const handleMarkAsCorrect = async (operationId: number) => {
    try {
      setSavingId(operationId);

      await api.post(`/api/challenges/operations/${operationId}/classify`, {
        has_error: false,
        errors: []
      });

      await loadData();

      const subResp = await api.get(`/api/challenges/submissions/${submissionId}`);
      if (subResp.data?.status === 'APPROVED' || subResp.data?.status === 'REJECTED') {
        setSubmission(subResp.data);
      }
    } catch (error: any) {
      alert(error.response?.data?.detail || t('submissionReview.markAsCorrectError'));
    } finally {
      setSavingId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isSummary = submission?.submission_type === 'SUMMARY';

  const requiredOperations = submission?.challenge?.operations_required || 0;

  const completedOperationsCount = isSummary
    ? (submission?.total_operations || 0)
    : operations.filter(op => op.completed_at).length;

  const allOperationsExecuted = isSummary ? true : completedOperationsCount >= requiredOperations;

  const allOperationsReviewed = isSummary ? true : operations
    .filter(op => op.completed_at)
    .every(op => op.is_approved != null);

  const canFinalize = allOperationsExecuted && allOperationsReviewed;

  const handleFinalizeReview = async (approve: boolean) => {
    if (!allOperationsExecuted) {
      alert(t('submissionReview.studentNotCompleted', { completed: completedOperationsCount, required: requiredOperations }));
      return;
    }

    if (!allOperationsReviewed) {
      alert(t('submissionReview.classifyAllFirst'));
      return;
    }

    const confirmMessage = approve ? t('submissionReview.confirmApprove') : t('submissionReview.confirmReject');
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await api.post(`/api/challenges/submissions/${submissionId}/finalize-review?approve=${approve}`);

      const result = response.data;
      alert(result.message);

      await loadData();
      navigate(-1);
    } catch (error: any) {
      alert(error.response?.data?.detail || t('submissionReview.finalizeError'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAllowRetry = async () => {
    if (!confirm(t('submissionReview.confirmAllowRetry'))) {
      return;
    }

    try {
      setSubmittingReview(true);
      await api.post(`/api/challenges/submissions/${submissionId}/allow-retry`);
      alert(t('submissionReview.retryEnabled'));
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || t('submissionReview.enableRetryError'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleManualFinalize = async (approve: boolean) => {
    const notes = prompt(t('submissionReview.addEvaluationNotes'));

    try {
      setSubmittingReview(true);
      await api.post(`/api/challenges/submissions/${submissionId}/manual-finalize`, {
        approve,
        trainer_notes: notes || undefined
      });
      alert(approve ? t('submissionReview.manualApproveSuccess') : t('submissionReview.manualRejectSuccess'));
      await loadData();
      navigate(-1);
    } catch (error: any) {
      alert(error.response?.data?.detail || t('submissionReview.manualFinalizeError'));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin" />
      </div>
    );
  }

  const pendingReview = operations.filter(op => op.completed_at && op.is_approved == null);
  const errorOperations = operations.filter(op => op.has_error);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Target className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
              {t('submissionReview.title', 'Classificar Desafio')}
            </p>
            <h1 className="font-headline text-2xl font-bold text-gray-900 dark:text-white truncate">
              {submission?.challenge?.title || submission?.challenge_title || t('submissionReview.title', 'Classificar Desafio')}
            </h1>
            <p className="font-body text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 truncate">
              <User className="w-4 h-4 flex-shrink-0" />
              {submission?.user?.full_name || submission?.user_name || t('submissionReview.student', 'Formando')}
              {submission?.user?.email && (
                <span className="text-gray-400 dark:text-gray-500">({submission.user.email})</span>
              )}
            </p>
          </div>
          <button
            onClick={() => loadData()}
            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Informações do Desafio */}
      {submission?.challenge && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#EC0000]" />
            </div>
            {t('submissionReview.challengeInfo')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 text-[#EC0000] mb-1">
                <Hash className="w-4 h-4" />
                <span className="font-body text-xs font-medium">{t('submissionReview.requiredOperations')}</span>
              </div>
              <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">
                {submission.challenge.operations_required || 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <Timer className="w-4 h-4" />
                <span className="font-body text-xs font-medium">{t('submissionReview.timeLimit')}</span>
              </div>
              <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">
                {submission.challenge.time_limit_minutes ? `${submission.challenge.time_limit_minutes} min` : t('submissionReview.noTimeLimit')}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="font-body text-xs font-medium">{t('submissionReview.targetMPU')}</span>
              </div>
              <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">
                {submission.challenge.target_mpu?.toFixed(2) || 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-body text-xs font-medium">{t('submissionReview.maxErrors')}</span>
              </div>
              <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">
                {submission.challenge.max_errors !== null && submission.challenge.max_errors !== undefined
                  ? submission.challenge.max_errors
                  : t('submissionReview.noLimit')}
              </p>
            </div>
          </div>
          {submission.challenge.description && (
            <p className="mt-4 font-body text-sm text-gray-500 dark:text-gray-400">{submission.challenge.description}</p>
          )}
        </div>
      )}

      {/* Resumo KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            icon: Hash,
            iconBg: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
            value: isSummary ? (submission?.total_operations || 0) : operations.length,
            label: t('submissionReview.totalOperations'),
          },
          {
            icon: TrendingUp,
            iconBg: 'bg-green-50 dark:bg-green-900/20',
            iconColor: 'text-green-600 dark:text-green-400',
            value: submission?.calculated_mpu?.toFixed(2) || '0.00',
            label: 'MPU',
          },
          {
            icon: Clock,
            iconBg: 'bg-yellow-50 dark:bg-yellow-900/20',
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            value: isSummary ? `${submission?.total_time_minutes || 0} min` : pendingReview.length,
            label: isSummary ? t('submissionReview.timeUsed') : t('submissionReview.pendingReview'),
          },
          {
            icon: AlertTriangle,
            iconBg: 'bg-red-50 dark:bg-red-900/20',
            iconColor: 'text-[#EC0000]',
            value: isSummary ? (submission?.errors_count || 0) : errorOperations.length,
            label: t('submissionReview.withErrors'),
          },
        ].map(({ icon: Icon, iconBg, iconColor, value, label }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="font-body text-xs text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== SUMMARY VIEW ===== */}
      {isSummary && submission && (
        <div className="space-y-6">
          {/* MPU Result */}
          <div className={`rounded-2xl p-6 border-2 ${
            submission.status === 'PENDING_REVIEW'
              ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-500/30'
              : submission.is_approved === true
              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/30'
              : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/30'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className={`w-5 h-5 ${
                    submission.status === 'PENDING_REVIEW' ? 'text-yellow-600 dark:text-yellow-400'
                    : submission.is_approved === true ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                  }`} />
                  <span className="font-body text-sm font-medium text-gray-600 dark:text-gray-300">MPU</span>
                </div>
                <p className="font-mono text-4xl font-bold text-gray-900 dark:text-white">
                  {submission.calculated_mpu?.toFixed(2) || '0.00'} <span className="text-lg text-gray-500 dark:text-gray-400">min/op</span>
                </p>
              </div>
              <div className="text-right">
                <p className={`font-body text-sm font-bold ${
                  submission.status === 'PENDING_REVIEW' ? 'text-yellow-600 dark:text-yellow-400'
                  : submission.is_approved === true ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
                }`}>
                  {submission.status === 'PENDING_REVIEW' ? t('submissionReview.pendingReview')
                   : submission.is_approved === true ? t('submissionReview.approved')
                   : t('submissionReview.rejected')}
                </p>
                {submission.mpu_vs_target != null && (
                  <p className="font-body text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {submission.mpu_vs_target >= 100
                      ? `${t('submissionReview.targetMPU')}`
                      : `${Math.min(submission.mpu_vs_target, 100).toFixed(1)}%`}
                  </p>
                )}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <p className="font-body text-sm text-gray-600 dark:text-gray-400">
                {submission.total_time_minutes} min &divide; {submission.total_operations} ops = {submission.calculated_mpu?.toFixed(2)} min/op
              </p>
              <p className="font-body text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('submissionReview.targetMPU')}: &le; {submission.challenge?.target_mpu?.toFixed(2)} min/op
              </p>
            </div>
          </div>

          {/* Summary Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-body text-sm font-bold text-gray-600 dark:text-gray-300 mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {t('submissionReview.operationDetails')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-gray-500 dark:text-gray-400">{t('submissionReview.totalOperations')}</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{submission.total_operations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-gray-500 dark:text-gray-400">{t('submissionReview.timeUsed')}</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{submission.total_time_minutes} min</span>
                </div>
                {submission.operation_reference && (
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-gray-500 dark:text-gray-400">{t('submissionReview.reference')}</span>
                    <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">{submission.operation_reference}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-gray-500 dark:text-gray-400">{t('submissionReview.withErrors')}</span>
                  <span className={`font-mono font-bold ${(submission.errors_count || 0) > (submission.challenge?.max_errors || 0) ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {submission.errors_count || 0} / {submission.challenge?.max_errors ?? 0} max
                  </span>
                </div>
              </div>
            </div>

            {/* Error Breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-body text-sm font-bold text-gray-600 dark:text-gray-300 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#EC0000]" />
                {t('submissionReview.errorBreakdown')}
              </h3>
              <div className="space-y-3">
                {[
                  { label: t('submissionReview.methodology'), count: submission.errors_summary?.error_methodology || submission.error_methodology || 0, color: 'text-orange-600 dark:text-orange-400' },
                  { label: t('submissionReview.knowledge'), count: submission.errors_summary?.error_knowledge || submission.error_knowledge || 0, color: 'text-blue-600 dark:text-blue-400' },
                  { label: t('submissionReview.detail'), count: submission.errors_summary?.error_detail || submission.error_detail || 0, color: 'text-yellow-600 dark:text-yellow-400' },
                  { label: t('submissionReview.procedure'), count: submission.errors_summary?.error_procedure || submission.error_procedure || 0, color: 'text-purple-600 dark:text-purple-400' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="font-body text-sm text-gray-500 dark:text-gray-400">{label}</span>
                    <span className={`font-mono font-bold ${count > 0 ? color : 'text-gray-400 dark:text-gray-500'}`}>{count}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="font-body text-sm font-medium text-gray-600 dark:text-gray-300">Total</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {submission.errors_summary?.total_individual_errors ||
                     ((submission.error_methodology || 0) + (submission.error_knowledge || 0) + (submission.error_detail || 0) + (submission.error_procedure || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Errors List */}
          {submission.submission_errors && submission.submission_errors.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-body text-sm font-bold text-gray-600 dark:text-gray-300 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#EC0000]" />
                {t('submissionReview.errorsIdentified')} ({submission.submission_errors.length})
              </h3>
              <div className="space-y-3">
                {submission.submission_errors.map((err, index) => (
                  <div key={err.id || index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                      <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded font-body text-xs font-bold whitespace-nowrap">
                        {translateErrorType(err.error_type)}
                      </span>
                      <div className="flex-1">
                        <p className="font-body text-sm text-gray-600 dark:text-gray-300">{err.description || '-'}</p>
                        {err.operation_reference && (
                          <p className="font-body text-xs text-gray-400 dark:text-gray-500 mt-1">{t('submissionReview.ref', 'Ref')}: {err.operation_reference}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submitter info */}
          {submission.submitter && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-body text-sm text-gray-500 dark:text-gray-400">{t('submissionReview.submittedBy')}</p>
                  <p className="font-body font-medium text-gray-900 dark:text-white">{submission.submitter.full_name}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== COMPLETE: Lista de operações para classificar ===== */}
      {!isSummary && (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-[#EC0000]" />
          </div>
          <h2 className="font-headline text-lg font-bold text-gray-900 dark:text-white">
            {t('submissionReview.operationsToClassify')}
          </h2>
        </div>

        {operations.filter(op => op.completed_at).length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-gray-400" />
            </div>
            <p className="font-body text-sm text-gray-500 dark:text-gray-400">{t('submissionReview.noCompletedOperations')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {operations.filter(op => op.completed_at).map((op) => (
              <div
                key={op.id}
                className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden ${
                  op.has_error
                    ? 'border-red-200 dark:border-red-500/30'
                    : op.is_approved === true
                      ? 'border-green-200 dark:border-green-500/30'
                      : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg ${
                        op.has_error
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          : op.is_approved === true
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        {op.operation_number}
                      </div>
                      <div>
                        <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">{op.operation_reference}</p>
                        <div className="flex items-center gap-3 font-body text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(op.duration_seconds || 0)}
                          </span>
                          <span>
                            {new Date(op.started_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Estado e ações */}
                    <div className="flex items-center gap-3">
                      {op.is_approved == null ? (
                        <>
                          <button
                            onClick={() => handleMarkAsCorrect(op.id)}
                            disabled={savingId === op.id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-body font-bold text-sm transition-colors disabled:opacity-50"
                          >
                            {savingId === op.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            {t('submissionReview.correct')}
                          </button>
                          <button
                            onClick={() => handleStartEdit(op)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-sm transition-colors"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {t('submissionReview.withErrors')}
                          </button>
                        </>
                      ) : op.has_error ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg font-body text-sm font-bold">
                            {t('submissionReview.errorsCount', { count: op.errors?.length || 0 })}
                          </span>
                          <button
                            onClick={() => handleStartEdit(op)}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-body text-sm transition-colors"
                          >
                            {t('submissionReview.edit')}
                          </button>
                        </div>
                      ) : (
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 rounded-lg font-body text-sm font-bold">
                          <CheckCircle className="w-4 h-4" />
                          {t('submissionReview.approved')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Formulário de erros */}
                  {editingOp === op.id && (
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                      <h4 className="font-body text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#EC0000]" />
                        {t('submissionReview.classifyErrors')}
                      </h4>

                      <div className="space-y-4">
                        {tempErrors.map((err, errIndex) => (
                          <div key={errIndex} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-4">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block font-body text-xs text-gray-500 dark:text-gray-400 mb-1">{t('submissionReview.errorType')}</label>
                                  <select
                                    value={err.error_type}
                                    onChange={(e) => handleErrorChange(errIndex, 'error_type', e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-body text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/30"
                                  >
                                    {ERROR_TYPES.map(type => (
                                      <option key={type.value} value={type.value}>
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block font-body text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    {t('submissionReview.description')} ({err.description.length}/160)
                                  </label>
                                  <input
                                    type="text"
                                    value={err.description}
                                    onChange={(e) => handleErrorChange(errIndex, 'description', e.target.value)}
                                    maxLength={160}
                                    placeholder={t('submissionReview.describeError')}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-body text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/30"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveError(errIndex)}
                                className="p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={handleAddError}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg font-body text-sm text-gray-500 dark:text-gray-400 transition-colors w-full justify-center"
                        >
                          <Plus className="w-4 h-4" />
                          {t('submissionReview.addError')}
                        </button>

                        <div className="flex justify-end gap-3 pt-4">
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-body font-bold transition-colors"
                          >
                            {t('submissionReview.cancel')}
                          </button>
                          <button
                            onClick={() => handleSaveClassification(op.id)}
                            disabled={savingId === op.id}
                            className="flex items-center gap-2 px-4 py-2 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold transition-colors disabled:opacity-50"
                          >
                            {savingId === op.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {t('submissionReview.saveClassification')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mostrar erros existentes (quando não está editando) */}
                  {op.has_error && op.errors && op.errors.length > 0 && editingOp !== op.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <h4 className="font-body text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">{t('submissionReview.errorsIdentified')}</h4>
                      <div className="space-y-2">
                        {op.errors.map((err, errIndex) => (
                          <div key={errIndex} className="flex items-start gap-2">
                            <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded font-body text-xs font-bold">
                              {translateErrorType(err.error_type)}
                            </span>
                            <span className="font-body text-sm text-gray-600 dark:text-gray-300">{err.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Auto-finalized Banner */}
      {(submission?.status === 'APPROVED' || submission?.status === 'REJECTED') && (
        <div className={`rounded-2xl border-2 p-6 ${
          submission.status === 'APPROVED'
            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/30'
            : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/30'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className={`font-headline text-lg font-bold mb-1 flex items-center gap-2 ${
                submission.status === 'APPROVED' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {submission.status === 'APPROVED' ? (
                  <><CheckCircle className="w-5 h-5" /> {t('submissionReview.challengeApproved', 'Desafio Aprovado')}</>
                ) : (
                  <><AlertCircle className="w-5 h-5" /> {t('submissionReview.challengeRejected', 'Desafio Reprovado')}</>
                )}
              </h3>
              <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                {t('submissionReview.autoFinalized', 'Desafio finalizado automaticamente após correção de todas as operações.')}
              </p>
              <div className="mt-2 font-body text-sm flex items-center gap-4">
                {!isSummary && (
                  <>
                    <span className="text-green-600 dark:text-green-400">{operations.filter(op => op.is_approved === true && !op.has_error).length} {t('submissionReview.correct').toLowerCase()}</span>
                    <span className="text-red-600 dark:text-red-400">{errorOperations.length} {t('submissionReview.withErrors').toLowerCase()}</span>
                  </>
                )}
                <span className="text-blue-600 dark:text-blue-400">MPU: {submission?.calculated_mpu?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-body font-bold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('submissionReview.backToList', 'Voltar')}
            </button>
          </div>
        </div>
      )}

      {/* Progresso da Correção (quando ainda não finalizado) */}
      {completedOperationsCount > 0 && submission?.status !== 'APPROVED' && submission?.status !== 'REJECTED' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white mb-1">{t('submissionReview.correctionProgress')}</h3>
              <div className="font-body text-sm mt-1">
                {!allOperationsExecuted ? (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {t('submissionReview.awaitingStudentOperations', { completed: completedOperationsCount, required: requiredOperations })}
                  </span>
                ) : allOperationsReviewed ? (
                  <span className="text-green-600 dark:text-green-400 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {t('submissionReview.allClassifiedAutoFinalize', 'Todas as operações classificadas. O desafio será finalizado automaticamente.')}
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">
                    {t('submissionReview.pendingClassification', { pending: pendingReview.length, total: completedOperationsCount })}
                  </span>
                )}
              </div>
              {!isSummary && (
                <div className="mt-2 font-body text-sm flex items-center gap-3">
                  <span className="text-green-600 dark:text-green-400">{operations.filter(op => op.is_approved === true && !op.has_error).length} {t('submissionReview.correct').toLowerCase()}</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="text-red-600 dark:text-red-400">{errorOperations.length} {t('submissionReview.withErrors').toLowerCase()}</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="text-yellow-600 dark:text-yellow-400">{pendingReview.length} {t('submissionReview.pendingReview').toLowerCase()}</span>
                </div>
              )}
            </div>
            {/* Status badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-bold ${
              allOperationsExecuted && allOperationsReviewed
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30'
                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30'
            }`}>
              {allOperationsExecuted && allOperationsReviewed ? (
                <><CheckCircle className="w-4 h-4" /> {t('submissionReview.autoFinalizing', 'A finalizar...')}</>
              ) : !allOperationsExecuted ? (
                <><Clock className="w-4 h-4" /> {completedOperationsCount}/{requiredOperations} {t('submissionReview.operations', 'operações')}</>
              ) : (
                <><Clock className="w-4 h-4" /> {pendingReview.length} {t('submissionReview.pendingReview')}</>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Seção de Retentativa - apenas se reprovado */}
      {(submission?.status === 'REJECTED' || (submission?.status === 'COMPLETED' && submission.is_approved === false)) && !submission.is_retry_allowed && (
        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-200 dark:border-orange-500/30 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-headline text-lg font-bold text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                {t('submissionReview.allowNewAttempt')}
              </h3>
              <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                {t('submissionReview.studentRejected')}
              </p>
              {submission.retry_count != null && submission.retry_count > 0 && (
                <p className="font-body text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {t('submissionReview.previousAttempts', { count: submission.retry_count })}
                </p>
              )}
            </div>
            <button
              onClick={handleAllowRetry}
              disabled={submittingReview}
              className="flex items-center gap-2 px-6 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold transition-colors disabled:opacity-50"
            >
              {submittingReview ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <RotateCcw className="w-5 h-5" />
              )}
              {t('submissionReview.enableRetry')}
            </button>
          </div>
        </div>
      )}

      {/* Indicador de retentativa já habilitada */}
      {submission?.is_retry_allowed && (
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-500/30 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-blue-600 dark:text-blue-400">{t('submissionReview.retryAlreadyEnabled')}</h3>
              <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                {t('submissionReview.studentCanRetry')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Seção de Finalização Manual - para desafios com kpi_mode MANUAL */}
      {submission?.challenge?.kpi_mode === 'MANUAL' && submission?.status !== 'COMPLETED' && submission?.status !== 'APPROVED' && submission?.status !== 'REJECTED' && canFinalize && (
        <div className="bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 dark:border-purple-500/30 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-headline text-lg font-bold text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('submissionReview.manualEvaluation')}
              </h3>
              <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                {t('submissionReview.manualEvaluationDesc')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleManualFinalize(false)}
                disabled={submittingReview}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-body font-bold transition-colors disabled:opacity-50"
              >
                {submittingReview ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <X className="w-5 h-5" />
                )}
                {t('submissionReview.rejectManually')}
              </button>
              <button
                onClick={() => handleManualFinalize(true)}
                disabled={submittingReview}
                className="flex items-center gap-2 px-6 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold transition-colors disabled:opacity-50"
              >
                {submittingReview ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {t('submissionReview.approveManually')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
