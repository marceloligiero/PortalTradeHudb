import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Play, 
  Pause,
  Square, 
  Check, 
  AlertCircle, 
  TrendingUp, 
  Target, 
  Clock, 
  Timer,
  Hash,
  AlertTriangle,
  Send,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '../../lib/axios';
import { RatingModal } from '../../components';

interface Challenge {
  id: number;
  title: string;
  description: string;
  challenge_type: string;
  operations_required: number;
  time_limit_minutes: number;
  target_mpu: number;
  max_errors?: number;
  use_volume_kpi?: boolean;
  use_mpu_kpi?: boolean;
  use_errors_kpi?: boolean;
}

interface Operation {
  operationNumber: number;
  reference: string;
  startedAt: Date | null;
  completedAt: Date | null;
  durationSeconds: number;
  status: 'pending' | 'in_progress' | 'completed';
  backendId: number | null;  // ID da operação no backend
  is_approved?: boolean | null;  // null = pendente de revisão, true = aprovada, false = reprovada
  hasError?: boolean;
  errors?: Array<{ id?: number; error_type: string; description?: string }>;
}

const StudentChallengeExecution: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { challengeId } = useParams<{ challengeId: string }>();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  const existingSubmissionId = searchParams.get('submissionId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(existingSubmissionId ? parseInt(existingSubmissionId) : null);
  const [submitted, setSubmitted] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  const [operations, setOperations] = useState<Operation[]>([]);
  const [activeOperationIndex, setActiveOperationIndex] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const activeStartTimeRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);

  // Carregar operações existentes se houver submissionId
  useEffect(() => {
    if (submissionId && challenge) {
      loadExistingOperations();
    }
  }, [submissionId, challenge]);

  const loadExistingOperations = async () => {
    try {
      // Check submission status first
      try {
        const subResp = await api.get(`/api/challenges/submissions/${submissionId}`);
        if (subResp.data?.status === 'PENDING_REVIEW' || subResp.data?.status === 'APPROVED' || subResp.data?.status === 'REJECTED') {
          setSubmitted(true);
          return;
        }
      } catch (e) { /* ignore */ }

      const response = await api.get(`/api/challenges/submissions/${submissionId}/operations`);
      const existingOps = response.data || [];
      
      if (existingOps.length > 0 && challenge) {
        // Mapear operações existentes para o formato do frontend
        const mappedOps: Operation[] = [];
        for (let i = 1; i <= challenge.operations_required; i++) {
          const existingOp = existingOps.find((op: any) => op.operation_number === i);
          if (existingOp) {
            mappedOps.push({
              operationNumber: i,
              reference: existingOp.operation_reference || '',
              startedAt: existingOp.started_at ? new Date(existingOp.started_at) : null,
              completedAt: existingOp.completed_at ? new Date(existingOp.completed_at) : null,
              durationSeconds: existingOp.duration_seconds || 0,
              status: existingOp.completed_at ? 'completed' : (existingOp.started_at ? 'in_progress' : 'pending'),
              backendId: existingOp.id,
              is_approved: existingOp.is_approved,
              hasError: existingOp.has_error,
              errors: existingOp.errors || []
            });
          } else {
            mappedOps.push({
              operationNumber: i,
              reference: '',
              startedAt: null,
              completedAt: null,
              durationSeconds: 0,
              status: 'pending',
              backendId: null
            });
          }
        }
        setOperations(mappedOps);
        
        // Resume in-progress operation in PAUSED state so user must manually resume
        const activeIdx = mappedOps.findIndex(op => op.status === 'in_progress');
        if (activeIdx >= 0 && mappedOps[activeIdx].startedAt) {
          setActiveOperationIndex(activeIdx);
          activeStartTimeRef.current = mappedOps[activeIdx].startedAt!.getTime();
          // Start paused — accumulate time elapsed so far as paused duration
          setIsPaused(true);
          pauseStartRef.current = Date.now();
        }
      } else if (challenge) {
        // Retry ou submission sem operações ainda - inicializar operações vazias
        const initialOps: Operation[] = [];
        for (let i = 1; i <= challenge.operations_required; i++) {
          initialOps.push({
            operationNumber: i,
            reference: '',
            startedAt: null,
            completedAt: null,
            durationSeconds: 0,
            status: 'pending',
            backendId: null
          });
        }
        setOperations(initialOps);
      }
    } catch (err) {
      console.error('Erro ao carregar operações existentes:', err);
    }
  };

  // Inicializar operações baseado no challenge (apenas se não houver submissionId existente)
  useEffect(() => {
    if (challenge && operations.length === 0 && !existingSubmissionId) {
      const initialOperations: Operation[] = [];
      for (let i = 1; i <= challenge.operations_required; i++) {
        initialOperations.push({
          operationNumber: i,
          reference: '',
          startedAt: null,
          completedAt: null,
          durationSeconds: 0,
          status: 'pending',
          backendId: null
        });
      }
      setOperations(initialOperations);
    }
  }, [challenge, operations.length, existingSubmissionId]);

  // Cronómetro para operação ativa
  useEffect(() => {
    if (activeOperationIndex === null || activeStartTimeRef.current === null) {
      return;
    }
    
    if (isPaused) {
      return;
    }
    
    const startTime = activeStartTimeRef.current;
    
    // Update immediately
    setElapsedTime(Math.floor((Date.now() - startTime - pausedDurationRef.current) / 1000));
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime - pausedDurationRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeOperationIndex, isPaused]);

  // Polling to refresh operation review statuses from trainer
  useEffect(() => {
    if (!submissionId || submitted) return;
    
    // Only poll if there are completed operations waiting for review
    const hasCompletedOps = operations.some(op => op.status === 'completed');
    if (!hasCompletedOps) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.get(`/api/challenges/submissions/${submissionId}/operations`);
        const backendOps = response.data || [];
        
        // Update review status on existing operations
        setOperations(prev => prev.map(op => {
          const backendOp = backendOps.find((bop: any) => bop.id === op.backendId);
          if (backendOp) {
            return {
              ...op,
              is_approved: backendOp.is_approved,
              hasError: backendOp.has_error,
              errors: backendOp.errors || []
            };
          }
          return op;
        }));
      } catch (e) {
        // Silently ignore polling errors
      }
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [submissionId, submitted, operations]);

  useEffect(() => {
    loadChallenge();
  }, [challengeId]);

  const loadChallenge = async () => {
    try {
      const response = await api.get(`/api/challenges/${challengeId}`);
      setChallenge(response.data);
    } catch (err) {
      console.error('Erro ao carregar desafio:', err);
      setError(t('challenges.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const startSubmission = async () => {
    try {
      // Usar endpoint /self para formando iniciar seu próprio desafio
      const response = await api.post(
        `/api/challenges/submit/complete/start/${challengeId}/self`,
        { training_plan_id: planId ? parseInt(planId) : null }
      );
      setSubmissionId(response.data.id);
      setError('');
    } catch (err: any) {
      console.error('Erro ao iniciar submission:', err);
      setError(err.response?.data?.detail || t('challenges.startError'));
    }
  };

  const updateOperationReference = (index: number, reference: string) => {
    const updated = [...operations];
    updated[index].reference = reference;
    setOperations(updated);
  };

  const startOperation = async (index: number) => {
    if (activeOperationIndex !== null) {
      setError('Termine a operação em progresso antes de iniciar outra');
      return;
    }

    try {
      // Chamar API para iniciar operação
      const response = await api.post(`/api/challenges/submissions/${submissionId}/operations/start`, {
        operation_reference: operations[index].reference || null
      });
      
      const now = new Date();
      activeStartTimeRef.current = now.getTime();
      
      const updated = [...operations];
      updated[index].startedAt = now;
      updated[index].status = 'in_progress';
      updated[index].backendId = response.data.id;
      setOperations(updated);
      setActiveOperationIndex(index);
      setElapsedTime(0);
      setIsPaused(false);
      pausedDurationRef.current = 0;
      setError('');
    } catch (err: any) {
      console.error('Erro ao iniciar operação:', err);
      setError(err.response?.data?.detail || 'Erro ao iniciar operação');
    }
  };

  const pauseOperation = () => {
    setIsPaused(true);
    pauseStartRef.current = Date.now();
  };

  const resumeOperation = () => {
    if (pauseStartRef.current) {
      pausedDurationRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    setIsPaused(false);
  };

  const finishOperation = async (index: number) => {
    const op = operations[index];
    if (!op.startedAt || !op.backendId) return;

    if (!op.reference.trim()) {
      setError(t('challenges.insertReference', `Insira a referência da operação ${index + 1} antes de finalizar`));
      return;
    }

    // Abrir modal para classificar erros antes de finalizar
    try {
      // Chamar API para finalizar operação (sem erros - erros são classificados pelo formador)
      await api.post(`/api/challenges/operations/${op.backendId}/finish`, {
        has_error: false,
        errors: [],
        operation_reference: op.reference
      });
      
      // Account for pause duration
      if (isPaused && pauseStartRef.current) {
        pausedDurationRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
        setIsPaused(false);
      }
      const completedAt = new Date();
      const durationSeconds = Math.floor((completedAt.getTime() - op.startedAt.getTime() - pausedDurationRef.current) / 1000);

      const updated = [...operations];
      updated[index].completedAt = completedAt;
      updated[index].durationSeconds = durationSeconds;
      updated[index].status = 'completed';
      setOperations(updated);
      activeStartTimeRef.current = null;
      setActiveOperationIndex(null);
      setElapsedTime(0);
    } catch (err: any) {
      console.error('Erro ao finalizar operação:', err);
      setError(err.response?.data?.detail || 'Erro ao finalizar operação');
    }
  };

  const submitChallenge = async () => {
    const completedOps = operations.filter(op => op.status === 'completed');
    const requiredOps = challenge?.operations_required || 0;
    
    // Verificar se todas as operações requeridas foram completadas
    if (completedOps.length < requiredOps) {
      setError(t('challengeComplete.completeAllOps', `Complete todas as ${requiredOps} operações antes de finalizar. ${completedOps.length}/${requiredOps} concluídas.`));
      return;
    }

    // Verificar se há operação em progresso
    if (activeOperationIndex !== null) {
      setError(t('challengeComplete.finishInProgress', 'Finalize a operação em progresso antes de finalizar'));
      return;
    }

    // Verificar se todas as operações foram corrigidas pelo formador
    const unreviewedOps = completedOps.filter(op => op.is_approved === null || op.is_approved === undefined);
    if (unreviewedOps.length > 0) {
      setError(t('challengeComplete.awaitReview', `Aguarde a correção de todas as operações pelo formador. ${unreviewedOps.length} operação(ões) pendente(s) de revisão.`));
      return;
    }

    try {
      // As operações já foram criadas via startOperation/finishOperation
      // Submission já está PENDING_REVIEW (auto-submitted na finalização de cada operação)
      // Apenas marcar como submetido final
      await api.post(`/api/challenges/submissions/${submissionId}/submit-for-review`);
      
      setSubmitted(true);
      // Show rating modal after submission
      setShowRatingModal(true);
    } catch (err: any) {
      console.error('Erro ao submeter:', err);
      setError(err.response?.data?.detail || 'Erro ao submeter desafio');
    }
  };

  // Handle rating modal close
  const handleRatingComplete = () => {
    setShowRatingModal(false);
    // Navigate back to challenges list or training plan
    if (planId) {
      navigate(`/training-plan/${planId}`);
    } else {
      navigate('/challenges');
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

  const calculateTotalTime = useCallback(() => {
    return operations
      .filter(op => op.status === 'completed')
      .reduce((sum, op) => sum + op.durationSeconds, 0);
  }, [operations]);

  const calculateMPU = useCallback(() => {
    const totalTime = calculateTotalTime();
    const completedCount = operations.filter(op => op.status === 'completed').length;
    if (totalTime === 0 || completedCount === 0) return 0;
    // MPU = Minutos Por Unidade = tempo (em minutos) / operações
    return (totalTime / 60) / completedCount;
  }, [operations, calculateTotalTime]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-white/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white">Desafio não encontrado</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-4 bg-green-500/20 rounded-full mb-6">
          <Check className="w-16 h-16 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Desafio Submetido!</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          {t('challengeExecution.submittedSuccessDesc', 'O seu desafio foi submetido com sucesso e está pendente de revisão pelo formador. Receberá o resultado assim que for avaliado.')}
        </p>
        <button
          onClick={() => navigate('/student/my-challenges')}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
        >
          {t('navigation.myChallenges')}
        </button>
      </div>
    );
  }

  const completedCount = operations.filter(op => op.status === 'completed').length;
  const progressPercent = challenge.operations_required > 0 ? (completedCount / challenge.operations_required) * 100 : 0;
  
  // Review tracking
  const reviewedCount = operations.filter(op => op.status === 'completed' && op.is_approved !== null && op.is_approved !== undefined).length;
  const pendingReviewCount = operations.filter(op => op.status === 'completed' && (op.is_approved === null || op.is_approved === undefined)).length;
  const allOpsCompleted = completedCount >= challenge.operations_required;
  const allOpsReviewed = allOpsCompleted && pendingReviewCount === 0;
  const approvedCount = operations.filter(op => op.is_approved === true).length;
  const errorCount = operations.filter(op => op.hasError === true).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {challenge.title}
              </h1>
              <p className="text-gray-400">
                {challenge.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${challenge.use_volume_kpi ? 'bg-blue-500/20' : 'bg-gray-500/20'}`}>
              <Hash className={`w-5 h-5 ${challenge.use_volume_kpi ? 'text-blue-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {completedCount}/{challenge.operations_required}
              </p>
              <p className="text-xs text-gray-400">Operações</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${challenge.use_mpu_kpi ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
              <TrendingUp className={`w-5 h-5 ${challenge.use_mpu_kpi ? 'text-green-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {calculateMPU().toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">MPU Atual</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {challenge.max_errors || 0}
              </p>
              <p className="text-xs text-gray-400">Erros Máx</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {formatTime(calculateTotalTime())}
              </p>
              <p className="text-xs text-gray-400">Tempo Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progresso do Desafio</span>
          <span className="text-sm font-bold text-white">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Iniciar Desafio */}
      {!submissionId && (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-8 text-center">
          <Target className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Pronto para começar?</h3>
          <p className="text-gray-400 mb-6">
            Clique no botão abaixo para iniciar o desafio. 
            Depois de iniciar, insira a referência de cada operação e controle o tempo.
          </p>
          <button
            onClick={startSubmission}
            className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg transition-colors mx-auto"
          >
            <Play className="w-6 h-6" />
            Iniciar Desafio
          </button>
        </div>
      )}

      {/* Lista de Operações */}
      {submissionId && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Operações ({completedCount}/{challenge.operations_required})
          </h2>

          <div className="grid gap-3">
            {operations.map((op, index) => (
              <div
                key={op.operationNumber}
                className={`bg-white/5 backdrop-blur-xl rounded-xl border p-4 transition-all ${
                  op.status === 'in_progress' 
                    ? 'border-blue-500/50 bg-blue-500/10' 
                    : op.status === 'completed' 
                      ? op.is_approved === true 
                        ? 'border-green-500/30 bg-green-500/10'
                        : op.is_approved === false
                          ? 'border-red-500/30 bg-red-500/10'
                          : 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Número da operação */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    op.status === 'completed' 
                      ? op.is_approved === true 
                        ? 'bg-green-500/20 text-green-400'
                        : op.is_approved === false
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      : op.status === 'in_progress'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-white/10 text-gray-400'
                  }`}>
                    {op.operationNumber}
                  </div>

                  {/* Campo de referência */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={op.reference}
                      onChange={(e) => updateOperationReference(index, e.target.value)}
                      disabled={op.status === 'completed'}
                      placeholder="Referência da operação (ex: 4060ILC0001111)"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Timer */}
                  {op.status !== 'pending' && (
                    <div className="text-right min-w-[100px]">
                      <div className={`text-xl font-mono font-bold ${
                        op.status === 'in_progress' 
                          ? isPaused 
                            ? 'text-yellow-400 animate-pulse' 
                            : 'text-blue-400' 
                          : 'text-green-400'
                      }`}>
                        <Timer className="w-4 h-4 inline mr-1" />
                        {op.status === 'in_progress' 
                          ? formatTime(elapsedTime) 
                          : formatTime(op.durationSeconds)
                        }
                      </div>
                      {op.status === 'in_progress' && isPaused && (
                        <div className="text-xs text-yellow-400 font-medium mt-1">
                          PAUSADO
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    {op.status === 'pending' && (
                      <button
                        onClick={() => startOperation(index)}
                        disabled={activeOperationIndex !== null}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Iniciar
                      </button>
                    )}

                    {op.status === 'in_progress' && (
                      <div className="flex gap-2">
                        {isPaused ? (
                          <button
                            onClick={resumeOperation}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            Retomar
                          </button>
                        ) : (
                          <button
                            onClick={pauseOperation}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                          >
                            <Pause className="w-4 h-4" />
                            Pausar
                          </button>
                        )}
                        <button
                          onClick={() => finishOperation(index)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                        >
                          <Square className="w-4 h-4" />
                          Terminar
                        </button>
                      </div>
                    )}

                    {op.status === 'completed' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Review status */}
                        {op.is_approved === true && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            {t('challengeComplete.opApproved', 'Aprovada')}
                          </div>
                        )}
                        {op.is_approved === false && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg">
                            <XCircle className="w-4 h-4" />
                            {t('challengeComplete.opHasErrors', 'Com Erros')}
                          </div>
                        )}
                        {(op.is_approved === null || op.is_approved === undefined) && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg animate-pulse">
                            <Eye className="w-4 h-4" />
                            {t('challengeComplete.awaitingCorrection', 'Aguardando Correção')}
                          </div>
                        )}
                        {op.hasError && op.errors && op.errors.length > 0 && (
                          <div className="flex items-center gap-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            {op.errors.length} {t('challengeComplete.errors', 'erro(s)')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Error details from trainer review */}
                {op.status === 'completed' && op.hasError && op.errors && op.errors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-500/20">
                    <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-2">
                      {t('challengeComplete.errorsIdentified', 'Erros Identificados')} ({op.errors.length}):
                    </p>
                    <div className="space-y-1">
                      {op.errors.map((err, errIdx) => (
                        <div key={errIdx} className="flex items-start gap-3 p-2 bg-red-500/10 rounded-lg">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            err.error_type === 'METODOLOGIA' || err.error_type === 'METHODOLOGY' ? 'bg-orange-500/20 text-orange-400' :
                            err.error_type === 'CONHECIMENTO' || err.error_type === 'KNOWLEDGE' ? 'bg-blue-500/20 text-blue-400' :
                            err.error_type === 'DETALHE' || err.error_type === 'DETAIL' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {err.error_type}
                          </span>
                          {err.description && (
                            <span className="text-sm text-gray-300 flex-1">{err.description}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Review Progress & Submeter */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 mt-6">
            {/* Review progress bar */}
            {completedCount > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {t('challengeComplete.reviewProgress', 'Progresso da Correção')}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {reviewedCount}/{completedCount} {t('challengeComplete.reviewed', 'corrigidas')}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${completedCount > 0 ? (reviewedCount / completedCount) * 100 : 0}%` }}
                  />
                </div>
                {completedCount > 0 && (
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-green-400">{approvedCount} {t('challengeComplete.approved', 'aprovadas')}</span>
                    <span className="text-red-400">{errorCount} {t('challengeComplete.withErrors', 'com erros')}</span>
                    <span className="text-yellow-400">{pendingReviewCount} {t('challengeComplete.pendingReview', 'pendentes')}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {t('challengeComplete.finalizeChallenge', 'Finalizar Desafio')}
                </h3>
                <p className="text-gray-400 text-sm">
                  {completedCount < (challenge?.operations_required || 0) ? (
                    <span className="text-yellow-400">
                      {t('challengeComplete.completeAllFirst', {
                        total: challenge?.operations_required,
                        completed: completedCount,
                        defaultValue: `Complete todas as ${challenge?.operations_required} operações. ${completedCount}/${challenge?.operations_required} concluídas.`
                      })}
                    </span>
                  ) : !allOpsReviewed ? (
                    <span className="text-yellow-400">
                      {t('challengeComplete.awaitAllReviews', {
                        pending: pendingReviewCount,
                        defaultValue: `Aguarde a correção de ${pendingReviewCount} operação(ões) pelo formador.`
                      })}
                    </span>
                  ) : (
                    <span className="text-green-400">
                      {t('challengeComplete.allReviewed', 'Todas as operações foram corrigidas. Pode finalizar o desafio.')}
                    </span>
                  )}
                </p>
              </div>
              
              <button
                onClick={submitChallenge}
                disabled={!allOpsReviewed}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all"
              >
                <Send className="w-6 h-6" />
                {t('challengeComplete.finalizeBtn', 'Finalizar Desafio')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {challenge && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={handleRatingComplete}
          onSuccess={handleRatingComplete}
          ratingType="CHALLENGE"
          itemId={challenge.id}
          itemTitle={challenge.title}
        />
      )}
    </div>
  );
};

export default StudentChallengeExecution;
