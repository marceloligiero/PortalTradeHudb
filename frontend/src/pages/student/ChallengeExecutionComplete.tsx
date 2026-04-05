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

  // Persist paused duration in localStorage to survive page reloads
  const getPausedDurationKey = () => `challenge_paused_${submissionId}`;
  const getPauseStartKey = () => `challenge_pause_start_${submissionId}`;
  const savePausedDuration = (duration: number) => {
    try { localStorage.setItem(getPausedDurationKey(), String(duration)); } catch { /* ignore */ }
  };
  const savePauseStart = (timestamp: number) => {
    try { localStorage.setItem(getPauseStartKey(), String(timestamp)); } catch { /* ignore */ }
  };
  const loadPausedDuration = (): number => {
    try { return parseInt(localStorage.getItem(getPausedDurationKey()) || '0') || 0; } catch { return 0; }
  };
  const loadPauseStart = (): number => {
    try { return parseInt(localStorage.getItem(getPauseStartKey()) || '0') || 0; } catch { return 0; }
  };
  const clearPausedDuration = () => {
    try {
      localStorage.removeItem(getPausedDurationKey());
      localStorage.removeItem(getPauseStartKey());
    } catch { /* ignore */ }
  };

  // Carregar operações existentes se houver submissionId
  useEffect(() => {
    if (submissionId && challenge) {
      loadExistingOperations();
    }
  }, [submissionId, challenge]);

  const loadExistingOperations = async () => {
    try {
      // Check submission status first - only show submitted screen for truly finalized challenges
      try {
        const subResp = await api.get(`/api/challenges/submissions/${submissionId}`);
        if (subResp.data?.status === 'APPROVED' || subResp.data?.status === 'REJECTED') {
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
          const startTime = mappedOps[activeIdx].startedAt!.getTime();
          activeStartTimeRef.current = startTime;

          // Restore saved paused duration and account for time since last pause
          let savedPausedDuration = loadPausedDuration();
          const savedPauseStart = loadPauseStart();

          if (savedPauseStart > 0) {
            // Add the time from last saved pause start to now (page was closed while paused)
            savedPausedDuration += Date.now() - savedPauseStart;
          } else {
            // No saved pause start — assume paused since start (first load)
            savedPausedDuration = Date.now() - startTime;
          }

          pausedDurationRef.current = savedPausedDuration;

          // Set elapsed time to the active (non-paused) duration so it shows correctly while paused
          const activeTime = Math.floor((Date.now() - startTime - savedPausedDuration) / 1000);
          setElapsedTime(Math.max(0, activeTime));

          // Mark as paused — the gap from now until user clicks Resume will be tracked
          setIsPaused(true);
          pauseStartRef.current = Date.now();
          savePauseStart(Date.now());
          savePausedDuration(pausedDurationRef.current);
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

  // Polling to refresh operation review statuses and detect auto-finalization
  useEffect(() => {
    if (!submissionId || submitted) return;

    // Only poll if there are completed operations waiting for review
    const hasCompletedOps = operations.some(op => op.status === 'completed');
    if (!hasCompletedOps) return;

    const pollInterval = setInterval(async () => {
      try {
        // Check submission status (auto-finalization detection)
        const subResp = await api.get(`/api/challenges/submissions/${submissionId}`);
        const subData = subResp.data;

        if (subData?.status === 'APPROVED' || subData?.status === 'REJECTED') {
          // Challenge was auto-finalized by the trainer's last review
          setSubmitted(true);
          setShowRatingModal(true);
          return;
        }

        // Update operation review statuses
        const response = await api.get(`/api/challenges/submissions/${submissionId}/operations`);
        const backendOps = response.data || [];

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
      clearPausedDuration();
      setError('');
    } catch (err: any) {
      console.error('Erro ao iniciar operação:', err);
      setError(err.response?.data?.detail || 'Erro ao iniciar operação');
    }
  };

  const pauseOperation = () => {
    setIsPaused(true);
    pauseStartRef.current = Date.now();
    // Save current accumulated paused duration and pause start time
    savePausedDuration(pausedDurationRef.current);
    savePauseStart(Date.now());
  };

  const resumeOperation = () => {
    if (pauseStartRef.current) {
      pausedDurationRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
      savePausedDuration(pausedDurationRef.current);
      savePauseStart(0);
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
      // Account for pause duration before calculating
      if (isPaused && pauseStartRef.current) {
        pausedDurationRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
        setIsPaused(false);
      }
      const completedAt = new Date();
      const durationSeconds = Math.max(0, Math.floor((completedAt.getTime() - op.startedAt.getTime() - pausedDurationRef.current) / 1000));

      // Chamar API para finalizar operação com duração real (excluindo pausas)
      await api.post(`/api/challenges/operations/${op.backendId}/finish`, {
        has_error: false,
        errors: [],
        operation_reference: op.reference,
        actual_duration_seconds: durationSeconds
      });

      const updated = [...operations];
      updated[index].completedAt = completedAt;
      updated[index].durationSeconds = durationSeconds;
      updated[index].status = 'completed';
      setOperations(updated);
      activeStartTimeRef.current = null;
      setActiveOperationIndex(null);
      setElapsedTime(0);
      clearPausedDuration();
    } catch (err: any) {
      console.error('Erro ao finalizar operação:', err);
      setError(err.response?.data?.detail || 'Erro ao finalizar operação');
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

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin" />
      </div>
    );
  }

  // --- Not found ---
  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-body text-gray-500 dark:text-gray-400">Desafio não encontrado</p>
      </div>
    );
  }

  // --- Submitted ---
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="font-headline text-3xl font-bold text-gray-900 dark:text-white mb-4">Desafio Submetido!</h1>
        <p className="font-body text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          {t('challengeExecution.submittedSuccessDesc', 'O seu desafio foi submetido com sucesso e está pendente de revisão pelo formador. Receberá o resultado assim que for avaliado.')}
        </p>
        <button
          onClick={() => navigate('/student/my-challenges')}
          className="px-6 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold transition-colors"
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
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">Desafio Completo</p>
            <h1 className="font-headline text-2xl font-bold text-gray-900 dark:text-white truncate">
              {challenge.title}
            </h1>
            <p className="font-body text-sm text-gray-500 dark:text-gray-400 truncate">
              {challenge.description}
            </p>
          </div>
        </div>

        {/* KPI Stats Bar */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${challenge.use_volume_kpi ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Hash className={`w-4 h-4 ${challenge.use_volume_kpi ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                </div>
              </div>
              <p className="font-mono text-xl font-bold text-gray-900 dark:text-white">
                {completedCount}/{challenge.operations_required}
              </p>
              <p className="font-body text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Operações</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${challenge.use_mpu_kpi ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <TrendingUp className={`w-4 h-4 ${challenge.use_mpu_kpi ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                </div>
              </div>
              <p className="font-mono text-xl font-bold text-gray-900 dark:text-white">
                {calculateMPU().toFixed(2)}
              </p>
              <p className="font-body text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">MPU Atual</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-[#EC0000]" />
                </div>
              </div>
              <p className="font-mono text-xl font-bold text-gray-900 dark:text-white">
                {challenge.max_errors || 0}
              </p>
              <p className="font-body text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Erros Máx</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="font-mono text-xl font-bold text-gray-900 dark:text-white">
                {formatTime(calculateTotalTime())}
              </p>
              <p className="font-body text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Tempo Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-body text-sm text-gray-500 dark:text-gray-400">Progresso do Desafio</span>
          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#EC0000] to-[#CC0000] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#EC0000] flex-shrink-0 mt-0.5" />
          <p className="font-body text-sm text-[#EC0000]">{error}</p>
        </div>
      )}

      {/* Start Challenge CTA */}
      {!submissionId && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-[#EC0000]" />
          </div>
          <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white mb-2">Pronto para começar?</h3>
          <p className="font-body text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Clique no botão abaixo para iniciar o desafio.
            Depois de iniciar, insira a referência de cada operação e controle o tempo.
          </p>
          <button
            onClick={startSubmission}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-lg transition-colors"
          >
            <Play className="w-6 h-6" />
            Iniciar Desafio
          </button>
        </div>
      )}

      {/* Operations List */}
      {submissionId && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-[#EC0000]" />
            </div>
            <h2 className="font-headline text-lg font-bold text-gray-900 dark:text-white">
              Operações ({completedCount}/{challenge.operations_required})
            </h2>
          </div>

          <div className="grid gap-3">
            {operations.map((op, index) => (
              <div
                key={op.operationNumber}
                className={`bg-white dark:bg-gray-900 rounded-xl border p-4 transition-all ${
                  op.status === 'in_progress'
                    ? 'border-2 border-[#EC0000]/30'
                    : op.status === 'completed'
                      ? op.is_approved === true
                        ? 'border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-900/10'
                        : op.is_approved === false
                          ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-900/10'
                          : 'border-yellow-200 dark:border-yellow-500/30 bg-yellow-50 dark:bg-yellow-900/10'
                      : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Operation number */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                    op.status === 'completed'
                      ? op.is_approved === true
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : op.is_approved === false
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                      : op.status === 'in_progress'
                        ? 'bg-red-50 dark:bg-red-900/20 text-[#EC0000]'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {op.operationNumber}
                  </div>

                  {/* Reference input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={op.reference}
                      onChange={(e) => updateOperationReference(index, e.target.value)}
                      disabled={op.status === 'completed'}
                      placeholder="Referência da operação (ex: 4060ILC0001111)"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-body text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Timer */}
                  {op.status !== 'pending' && (
                    <div className="text-right min-w-[100px]">
                      <div className={`font-mono text-lg font-bold flex items-center justify-end gap-1 ${
                        op.status === 'in_progress'
                          ? isPaused
                            ? 'text-yellow-600 dark:text-yellow-400 animate-pulse'
                            : 'text-[#EC0000]'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        <Timer className="w-4 h-4" />
                        {op.status === 'in_progress'
                          ? formatTime(elapsedTime)
                          : formatTime(op.durationSeconds)
                        }
                      </div>
                      {op.status === 'in_progress' && isPaused && (
                        <p className="font-body text-[11px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 mt-1">
                          PAUSADO
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {op.status === 'pending' && (
                      <button
                        onClick={() => startOperation(index)}
                        disabled={activeOperationIndex !== null}
                        className="flex items-center gap-2 px-4 py-2 bg-[#EC0000] hover:bg-[#CC0000] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-body font-bold text-sm transition-colors"
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
                            className="flex items-center gap-2 px-4 py-2 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-sm transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            Retomar
                          </button>
                        ) : (
                          <button
                            onClick={pauseOperation}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-500/30 text-gray-700 dark:text-gray-300 rounded-xl font-body font-bold text-sm transition-colors"
                          >
                            <Pause className="w-4 h-4" />
                            Pausar
                          </button>
                        )}
                        <button
                          onClick={() => finishOperation(index)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-body font-bold text-sm transition-colors"
                        >
                          <Square className="w-4 h-4" />
                          Terminar
                        </button>
                      </div>
                    )}

                    {op.status === 'completed' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {op.is_approved === true && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-body text-xs font-bold">{t('challengeComplete.opApproved', 'Aprovada')}</span>
                          </div>
                        )}
                        {op.is_approved === false && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg">
                            <XCircle className="w-4 h-4" />
                            <span className="font-body text-xs font-bold">{t('challengeComplete.opHasErrors', 'Com Erros')}</span>
                          </div>
                        )}
                        {(op.is_approved === null || op.is_approved === undefined) && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 text-yellow-600 dark:text-yellow-400 rounded-lg animate-pulse">
                            <Eye className="w-4 h-4" />
                            <span className="font-body text-xs font-bold">{t('challengeComplete.awaitingCorrection', 'Aguardando Correção')}</span>
                          </div>
                        )}
                        {op.hasError && op.errors && op.errors.length > 0 && (
                          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="font-body text-xs font-bold">{op.errors.length} {t('challengeComplete.errors', 'erro(s)')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Error details from trainer review */}
                {op.status === 'completed' && op.hasError && op.errors && op.errors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="font-body text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
                      {t('challengeComplete.errorsIdentified', 'Erros Identificados')} ({op.errors.length}):
                    </p>
                    <div className="space-y-1.5">
                      {op.errors.map((err, errIdx) => (
                        <div key={errIdx} className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className={`px-2 py-0.5 rounded font-body text-[11px] font-bold uppercase tracking-wider ${
                            err.error_type === 'METODOLOGIA' || err.error_type === 'METHODOLOGY'
                              ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                              : err.error_type === 'CONHECIMENTO' || err.error_type === 'KNOWLEDGE'
                                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : err.error_type === 'DETALHE' || err.error_type === 'DETAIL'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                                  : 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                          }`}>
                            {err.error_type}
                          </span>
                          {err.description && (
                            <span className="font-body text-sm text-gray-600 dark:text-gray-400 flex-1">{err.description}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Review Progress & Status */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mt-6">
            {/* Review progress bar */}
            {completedCount > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {t('challengeComplete.reviewProgress', 'Progresso da Correção')}
                  </span>
                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                    {reviewedCount}/{challenge.operations_required} {t('challengeComplete.reviewed', 'corrigidas')}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#EC0000] to-[#CC0000] rounded-full transition-all duration-500"
                    style={{ width: `${challenge.operations_required > 0 ? (reviewedCount / challenge.operations_required) * 100 : 0}%` }}
                  />
                </div>
                {completedCount > 0 && (
                  <div className="flex items-center gap-4 mt-2">
                    <span className="font-body text-xs text-green-600 dark:text-green-400">{approvedCount} {t('challengeComplete.approved', 'aprovadas')}</span>
                    <span className="font-body text-xs text-red-600 dark:text-red-400">{errorCount} {t('challengeComplete.withErrors', 'com erros')}</span>
                    <span className="font-body text-xs text-yellow-600 dark:text-yellow-400">{pendingReviewCount} {t('challengeComplete.pendingReview', 'pendentes')}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white">
                  {t('challengeComplete.challengeStatus', 'Estado do Desafio')}
                </h3>
                <div className="font-body text-sm mt-1">
                  {completedCount < (challenge?.operations_required || 0) ? (
                    <span className="text-yellow-600 dark:text-yellow-400">
                      {t('challengeComplete.completeAllFirst', {
                        total: challenge?.operations_required,
                        completed: completedCount,
                        defaultValue: `Complete todas as ${challenge?.operations_required} operações. ${completedCount}/${challenge?.operations_required} concluídas.`
                      })}
                    </span>
                  ) : !allOpsReviewed ? (
                    <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      {t('challengeComplete.awaitAllReviews', {
                        pending: pendingReviewCount,
                        defaultValue: `Aguarde a correção de ${pendingReviewCount} operação(ões) pelo formador.`
                      })}
                    </span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {t('challengeComplete.autoFinalizing', 'Todas as operações corrigidas. O desafio será finalizado automaticamente...')}
                    </span>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm font-bold ${
                allOpsCompleted && allOpsReviewed
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30'
                  : allOpsCompleted
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}>
                {allOpsCompleted && allOpsReviewed ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {t('challengeComplete.allReviewedAutoFinalize', 'Finalizado automaticamente')}
                  </>
                ) : allOpsCompleted ? (
                  <>
                    <Eye className="w-5 h-5 animate-pulse" />
                    {t('challengeComplete.awaitingCorrections', 'Aguardando correções')}
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    {completedCount}/{challenge?.operations_required || 0}
                  </>
                )}
              </div>
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
