import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Target, Clock, Award, Check, X, AlertTriangle, Star } from 'lucide-react';
import api from '../lib/axios';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../contexts/ThemeContext';
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
    target_kpi?: string;  // KPI sendo avaliado (deprecated)
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
  submission_errors?: SubmissionError[];  // Erros para SUMMARY
  errors_summary?: ErrorsSummary;
}

const ChallengeResult: React.FC = () => {
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

  // Verificar se é formador/admin
  const isTrainerOrAdmin = user?.role === 'ADMIN' || user?.role === 'TRAINER';

  // Usar planId da URL ou da submission
  const planId = urlPlanId || (submission?.training_plan_id ? String(submission.training_plan_id) : null);

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      const response = await api.get(`/api/challenges/submissions/${submissionId}`);
      setSubmission(response.data);
      
      const effectivePlanId = urlPlanId || response.data?.training_plan_id;
      
      // Check if plan is finalized
      if (effectivePlanId) {
        try {
          const planResp = await api.get(`/api/training-plans/${effectivePlanId}/completion-status`);
          setIsPlanFinalized(planResp.data?.is_finalized || false);
        } catch (err) {
          console.log('Erro ao verificar status do plano');
        }
        
        // Check if user already rated this challenge (no contexto do plano de formação)
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
      // Verificar se é MANUAL ou AUTO para escolher o endpoint correto
      const kpiMode = submission.challenge?.kpi_mode || 'AUTO';
      const endpoint = kpiMode === 'MANUAL' 
        ? `/api/challenges/submissions/${submissionId}/manual-finalize`
        : `/api/challenges/submissions/${submissionId}/finalize-review`;
      
      await api.post(endpoint, { approve });
      await loadSubmission(); // Recarregar dados
    } catch (err: any) {
      console.error('Erro ao aprovar/reprovar:', err);
      alert(err.response?.data?.detail || 'Erro ao processar aprovação');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-red-50/20 to-gray-100 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 dark:border-white/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-red-50/20 to-gray-100 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Resultado não encontrado</div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-red-50/20 to-gray-100 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => planId ? navigate(`/training-plans/${planId}`) : navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                Resultado do Desafio
              </h1>
              <p className="text-gray-400 mt-2">{submission.challenge.title}</p>
              <p className="text-sm text-gray-500 mt-1">
                Estudante: {submission.user.full_name}
              </p>
              {/* KPI e Tipo de Desafio */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {submission.challenge.challenge_type && (
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-400">
                    {submission.challenge.challenge_type === 'SUMMARY' ? 'Resumido' : 'Completo'}
                  </span>
                )}
                {/* KPIs avaliados */}
                <span className="text-gray-500 text-sm">KPIs avaliados:</span>
                {submission.challenge.use_volume_kpi && (
                  <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-400" title="Quantidade total de operações realizadas">
                    📊 Volume (Nº de Operações)
                  </span>
                )}
                {submission.challenge.use_mpu_kpi && (
                  <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs text-yellow-400" title="Tempo médio por operação em minutos">
                    ⏱️ MPU (Tempo por Operação)
                  </span>
                )}
                {submission.challenge.use_errors_kpi && (
                  <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-400" title="Número de operações com erros identificados">
                    ⚠️ Erros (Operações c/ Falhas)
                  </span>
                )}
              </div>
            </div>
            
            {/* Status Badge */}
            {submission.status === 'APPROVED' ? (
              <div className="px-6 py-3 rounded-lg flex items-center gap-2 bg-green-500/10 border-2 border-green-500/30">
                <Check className="w-6 h-6 text-green-500" />
                <span className="text-green-500 font-bold text-lg">APROVADO</span>
              </div>
            ) : submission.status === 'REJECTED' ? (
              <div className="px-6 py-3 rounded-lg flex items-center gap-2 bg-red-500/10 border-2 border-red-500/30">
                <X className="w-6 h-6 text-red-500" />
                <span className="text-red-500 font-bold text-lg">REPROVADO</span>
              </div>
            ) : submission.status === 'PENDING_REVIEW' ? (
              <div className="px-6 py-3 rounded-lg flex items-center gap-2 bg-yellow-500/10 border-2 border-yellow-500/30">
                <Clock className="w-6 h-6 text-yellow-500" />
                <span className="text-yellow-500 font-bold text-lg">AGUARDA REVISÃO</span>
              </div>
            ) : (
              <div className="px-6 py-3 rounded-lg flex items-center gap-2 bg-blue-500/10 border-2 border-blue-500/30">
                <Clock className="w-6 h-6 text-blue-500" />
                <span className="text-blue-500 font-bold text-lg">EM PROGRESSO</span>
              </div>
            )}
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card Volume/Operações */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-lg rounded-xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Volume de Operações</h3>
                  <p className="text-xs text-gray-400">Quantidade total de operações realizadas</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                submission.total_operations >= submission.challenge.operations_required
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {submission.total_operations >= submission.challenge.operations_required ? '✓ Meta atingida' : '✗ Abaixo da meta'}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-5xl font-bold text-white">{submission.total_operations}</p>
                <p className="text-sm text-gray-400 mt-1">de {submission.challenge.operations_required} operações necessárias</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">
                  {Math.round((submission.total_operations / submission.challenge.operations_required) * 100)}%
                </p>
              </div>
            </div>
            <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                style={{ width: `${Math.min((submission.total_operations / submission.challenge.operations_required) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Card Erros */}
          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/5 backdrop-blur-lg rounded-xl border border-red-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Operações com Erros</h3>
                  <p className="text-xs text-gray-400">Número de falhas identificadas pelo formador</p>
                </div>
              </div>
              {(() => {
                const errors = submission.errors_summary?.operations_with_errors ?? submission.errors_count ?? 0;
                const maxErrors = submission.errors_summary?.max_errors_allowed ?? submission.challenge.max_errors ?? 0;
                const isOk = errors <= maxErrors;
                return (
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${isOk ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {isOk ? '✓ Dentro do limite' : '✗ Acima do limite'}
                  </div>
                );
              })()}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-5xl font-bold text-white">
                  {submission.errors_summary?.operations_with_errors ?? submission.errors_count ?? 0}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  máximo permitido: {submission.errors_summary?.max_errors_allowed ?? submission.challenge.max_errors ?? 0}
                </p>
              </div>
            </div>
            {submission.errors_summary && (
              <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    submission.errors_summary.operations_with_errors <= (submission.errors_summary.max_errors_allowed || 0)
                      ? 'bg-gradient-to-r from-green-500 to-blue-500'
                      : 'bg-gradient-to-r from-red-500 to-orange-500'
                  }`}
                  style={{
                    width: `${Math.min((submission.errors_summary.operations_with_errors / Math.max(submission.errors_summary.max_errors_allowed, 1)) * 100, 100)}%`
                  }}
                />
              </div>
            )}
          </div>

          {/* Card Tempo */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-lg rounded-xl border border-blue-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Tempo Total</h3>
                  <p className="text-xs text-gray-400">Duração total para completar o desafio</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                submission.total_time_minutes <= submission.challenge.time_limit_minutes
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {submission.total_time_minutes <= submission.challenge.time_limit_minutes ? '✓ No tempo' : '✗ Tempo excedido'}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-5xl font-bold text-white">{submission.total_time_minutes}<span className="text-xl text-gray-400 ml-1">min</span></p>
                <p className="text-sm text-gray-400 mt-1">limite: {submission.challenge.time_limit_minutes} minutos</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-400">
                  {Math.round((submission.total_time_minutes / submission.challenge.time_limit_minutes) * 100)}%
                </p>
              </div>
            </div>
            <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  submission.total_time_minutes <= submission.challenge.time_limit_minutes
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                    : 'bg-gradient-to-r from-red-500 to-orange-500'
                }`}
                style={{ width: `${Math.min((submission.total_time_minutes / submission.challenge.time_limit_minutes) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Card MPU */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 backdrop-blur-lg rounded-xl border border-yellow-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">MPU - Minutos Por Operação</h3>
                  <p className="text-xs text-gray-400">Tempo médio gasto em cada operação</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                (submission.calculated_mpu ?? 0) <= (submission.challenge?.target_mpu ?? 0)
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {(submission.calculated_mpu ?? 0) <= (submission.challenge?.target_mpu ?? 0) ? '✓ Eficiente' : '✗ Acima do esperado'}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-5xl font-bold text-yellow-400">{(submission.calculated_mpu ?? 0).toFixed(2)}<span className="text-xl text-gray-400 ml-1">min/op</span></p>
                <p className="text-sm text-gray-400 mt-1">meta: ≤ {(submission.challenge?.target_mpu ?? 0).toFixed(2)} min/op (quanto menor, melhor)</p>
              </div>
            </div>
            <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  (submission.calculated_mpu ?? 0) <= (submission.challenge?.target_mpu ?? 0)
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                    : 'bg-gradient-to-r from-red-500 to-orange-500'
                }`}
                style={{ width: `${Math.min((submission.challenge?.target_mpu ?? 1) / Math.max(submission.calculated_mpu ?? 1, 0.01) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Detalhes por Tipo */}
        {submission.submission_type === 'COMPLETE' && submission.parts.length > 0 && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Detalhamento por Partes</h2>
            <div className="space-y-3">
              {submission.parts.map((part) => (
                <div key={part.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <span className="text-red-500 font-bold">#{part.part_number}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Parte {part.part_number}</p>
                      <p className="text-sm text-gray-400">
                        {part.operations_count} operações em {(part.duration_minutes ?? 0).toFixed(1)} min
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(part.started_at)} - {formatDate(part.completed_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-500">{(part.mpu ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">min/op</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {submission.submission_type === 'SUMMARY' && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Resumo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Iniciado</p>
                <p className="text-white">{formatDate(submission.started_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Concluído</p>
                <p className="text-white">{formatDate(submission.completed_at)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Detalhamento de Erros */}
        {submission.errors_summary && submission.errors_summary.operations_with_errors > 0 && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Detalhamento de Erros
            </h2>
            
            {/* Resumo por Tipo de Erro */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-400">{submission.errors_summary.error_methodology}</p>
                <p className="text-xs text-gray-400">Metodologia</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-400">{submission.errors_summary.error_knowledge}</p>
                <p className="text-xs text-gray-400">Conhecimento</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{submission.errors_summary.error_detail}</p>
                <p className="text-xs text-gray-400">Detalhe</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">{submission.errors_summary.error_procedure}</p>
                <p className="text-xs text-gray-400">Procedimento</p>
              </div>
            </div>
            
            {/* Lista de Operações com Erro (COMPLETE) */}
            {submission.operations && submission.operations.filter(op => op.has_error).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-3">Operações com Erro</h3>
                {submission.operations.filter(op => op.has_error).map((operation) => (
                  <div key={operation.id} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-red-400 font-bold text-sm">#{operation.operation_number}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Operação {operation.operation_number}</p>
                        {operation.operation_reference && (
                          <p className="text-sm text-gray-400">Ref: {operation.operation_reference}</p>
                        )}
                      </div>
                    </div>
                    {operation.errors && operation.errors.length > 0 && (
                      <div className="ml-13 space-y-2 mt-3">
                        {operation.errors.map((error, idx) => (
                          <div key={idx} className="flex items-start gap-2 bg-white/5 rounded p-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              error.error_type === 'METHODOLOGY' ? 'bg-red-500/20 text-red-400' :
                              error.error_type === 'KNOWLEDGE' ? 'bg-orange-500/20 text-orange-400' :
                              error.error_type === 'DETAIL' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {error.error_type === 'METHODOLOGY' ? 'Metodologia' :
                               error.error_type === 'KNOWLEDGE' ? 'Conhecimento' :
                               error.error_type === 'DETAIL' ? 'Detalhe' :
                               error.error_type === 'PROCEDURE' ? 'Procedimento' : error.error_type}
                            </span>
                            <p className="text-gray-300 text-sm">{error.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Lista de Erros Detalhados (SUMMARY) */}
            {submission.submission_errors && submission.submission_errors.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-3">Erros Registados</h3>
                {submission.submission_errors.map((error, idx) => (
                  <div key={error.id} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-red-400 font-bold text-sm">#{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            error.error_type === 'METHODOLOGY' ? 'bg-red-500/20 text-red-400' :
                            error.error_type === 'KNOWLEDGE' ? 'bg-orange-500/20 text-orange-400' :
                            error.error_type === 'DETAIL' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {error.error_type === 'METHODOLOGY' ? 'Metodologia' :
                             error.error_type === 'KNOWLEDGE' ? 'Conhecimento' :
                             error.error_type === 'DETAIL' ? 'Detalhe' :
                             error.error_type === 'PROCEDURE' ? 'Procedimento' : error.error_type}
                          </span>
                          {error.operation_reference && (
                            <span className="text-xs text-gray-400">
                              Ref: {error.operation_reference}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300">{error.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : submission.submission_type === 'SUMMARY' && submission.errors_summary && submission.errors_summary.total_individual_errors > 0 ? (
              /* Mostrar resumo quando não há detalhes individuais mas há erros */
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <p className="text-orange-400 text-sm">
                  <strong>Total de {submission.errors_summary.total_individual_errors} erro(s) registado(s):</strong>
                </p>
                <ul className="mt-2 space-y-1 text-gray-300 text-sm">
                  {submission.errors_summary.error_methodology > 0 && (
                    <li>• {submission.errors_summary.error_methodology} erro(s) de Metodologia</li>
                  )}
                  {submission.errors_summary.error_knowledge > 0 && (
                    <li>• {submission.errors_summary.error_knowledge} erro(s) de Conhecimento</li>
                  )}
                  {submission.errors_summary.error_detail > 0 && (
                    <li>• {submission.errors_summary.error_detail} erro(s) de Detalhe</li>
                  )}
                  {submission.errors_summary.error_procedure > 0 && (
                    <li>• {submission.errors_summary.error_procedure} erro(s) de Procedimento</li>
                  )}
                </ul>
                <p className="text-gray-500 text-xs mt-3">
                  Os detalhes específicos de cada erro não estão disponíveis para esta submissão.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Feedback */}
        {submission.feedback && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Feedback</h2>
            <p className="text-gray-300">{submission.feedback}</p>
          </div>
        )}

        {/* Botões de Aprovação (para formador em PENDING_REVIEW) */}
        {isTrainerOrAdmin && submission.status === 'PENDING_REVIEW' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Aguarda a sua decisão
            </h2>
            <p className="text-gray-300 mb-6">
              Este desafio está configurado para avaliação manual. Analise os resultados acima e decida se o formando deve ser aprovado ou reprovado.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleApproval(true)}
                disabled={approving}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                {approving ? 'A processar...' : 'Aprovar'}
              </button>
              <button
                onClick={() => handleApproval(false)}
                disabled={approving}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
                {approving ? 'A processar...' : 'Reprovar'}
              </button>
            </div>
          </div>
        )}

        {/* Botão de Classificação (para formando com desafio aprovado e plano finalizado) */}
        {!isTrainerOrAdmin && submission.is_approved === true && planId && isPlanFinalized && (
          <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-amber-400 mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Avalie este Desafio
                </h2>
                <p className="text-gray-400">
                  {hasRated ? 'Obrigado pela sua avaliação!' : 'A sua opinião é importante para melhorarmos.'}
                </p>
              </div>
              {hasRated ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-400 rounded-lg">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  Desafio Classificado ✓
                </div>
              ) : (
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md"
                >
                  <Star className="w-5 h-5" />
                  Classificar Desafio
                </button>
              )}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => planId ? navigate(`/training-plans/${planId}`) : navigate(-1)}
            className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
          >
            Voltar
          </button>
        </div>
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
