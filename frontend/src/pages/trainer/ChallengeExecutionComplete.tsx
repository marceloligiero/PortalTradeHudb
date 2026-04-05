import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Play,
  Square,
  Check,
  AlertCircle,
  TrendingUp,
  Target,
  Clock,
  User,
  Timer,
  Hash,
  AlertTriangle,
  X,
  Plus,
  Trash2,
  Pause
} from 'lucide-react';
import api from '../../lib/axios';

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

interface OperationError {
  error_type: 'METHODOLOGY' | 'KNOWLEDGE' | 'DETAIL' | 'PROCEDURE';
  description?: string;
}

interface PendingError {
  id: string;
  type: 'METHODOLOGY' | 'KNOWLEDGE' | 'DETAIL' | 'PROCEDURE';
}

interface Operation {
  operationNumber: number;
  reference: string;
  startedAt: Date | null;
  completedAt: Date | null;
  durationSeconds: number;
  status: 'pending' | 'in_progress' | 'completed';
  errors: OperationError[];
  hasError: boolean;
}

const ChallengeExecutionComplete: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { challengeId } = useParams<{ challengeId: string }>();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  const studentIdParam = searchParams.get('studentId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  const [operations, setOperations] = useState<Operation[]>([]);
  const [activeOperationIndex, setActiveOperationIndex] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const activeStartTimeRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [planStudent, setPlanStudent] = useState<{id: number, full_name: string, email: string} | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [finishingOperationIndex, setFinishingOperationIndex] = useState<number | null>(null);
  const [pendingErrors, setPendingErrors] = useState<PendingError[]>([]);
  const [operationHasError, setOperationHasError] = useState(false);

  // Inicializar operações baseado no challenge
  useEffect(() => {
    if (challenge && operations.length === 0) {
      const initialOperations: Operation[] = [];
      for (let i = 1; i <= challenge.operations_required; i++) {
        initialOperations.push({
          operationNumber: i,
          reference: '',
          startedAt: null,
          completedAt: null,
          durationSeconds: 0,
          status: 'pending',
          errors: [],
          hasError: false
        });
      }
      setOperations(initialOperations);
    }
  }, [challenge, operations.length]);

  // Cronómetro para operação ativa
  useEffect(() => {
    if (activeOperationIndex === null || activeStartTimeRef.current === null || isPaused) {
      return;
    }

    const startTime = activeStartTimeRef.current;
    const pausedMs = pausedDurationRef.current;

    // Update immediately
    setElapsedTime(Math.floor((Date.now() - startTime - pausedMs) / 1000));

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime - pausedMs) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOperationIndex, isPaused]);

  useEffect(() => {
    loadChallenge();
    if (planId) {
      loadPlanStudent();
    } else {
      loadStudents();
    }
  }, [challengeId, planId]);

  const loadPlanStudent = async () => {
    try {
      const response = await api.get(`/api/training-plans/${planId}`);
      const plan = response.data;

      // New enrollment system: enrolled_students array
      const enrolled = plan.enrolled_students || [];

      // If studentId passed via URL, pre-select that student
      if (studentIdParam && enrolled.length > 0) {
        const target = enrolled.find((s: any) => s.id === parseInt(studentIdParam));
        if (target) {
          setPlanStudent({ id: target.id, full_name: target.full_name, email: target.email });
          setSelectedStudentId(target.id);
          return;
        }
      }

      if (enrolled.length === 1) {
        const s = enrolled[0];
        setPlanStudent({ id: s.id, full_name: s.full_name, email: s.email });
        setSelectedStudentId(s.id);
        return;
      } else if (enrolled.length > 1) {
        setStudents(enrolled.map((s: any) => ({ id: s.id, full_name: s.full_name, email: s.email })));
        return;
      }

      // Legacy fallback: single student field
      if (plan.student) {
        setPlanStudent(plan.student);
        setSelectedStudentId(plan.student.id);
      } else if (plan.student_id) {
        const userResp = await api.get(`/api/admin/users/${plan.student_id}`);
        const user = userResp.data;
        setPlanStudent({ id: user.id, full_name: user.full_name, email: user.email });
        setSelectedStudentId(user.id);
      } else {
        loadStudents();
      }
    } catch (err) {
      console.error('Erro ao carregar student do plano:', err);
      loadStudents();
    }
  };

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

  const loadStudents = async () => {
    try {
      const resp = await api.get(`/api/challenges/${challengeId}/eligible-students`);
      const remote = resp.data ?? [];
      const mapped = (Array.isArray(remote) ? remote : []).map((s: any) => ({
        id: s.id,
        full_name: s.full_name || s.name || s.fullName || s.full_name || s.name,
        email: s.email,
      }));

      if (mapped.length > 0) {
        setStudents(mapped);
        return;
      }

      try {
        const respTrainer = await api.get('/api/trainer/reports/students');
        const remoteT = respTrainer.data ?? [];
        const mappedT = (Array.isArray(remoteT) ? remoteT : []).map((s: any) => ({ id: s.id, full_name: s.full_name || s.name || s.fullName || s.name, email: s.email }));
        if (mappedT.length > 0) {
          setStudents(mappedT);
          return;
        }
      } catch (e) {
        // ignore
      }

      try {
        const respAdmin = await api.get('/api/admin/students');
        const remoteAdmin = respAdmin.data ?? [];
        const mappedAdmin = (Array.isArray(remoteAdmin) ? remoteAdmin : []).map((s: any) => ({ id: s.id, full_name: s.full_name || s.name || s.full_name || s.fullName || s.name, email: s.email }));
        setStudents(mappedAdmin);
      } catch (e) {
        setStudents([]);
      }
    } catch (err) {
      console.error('Erro ao carregar estudantes:', err);
      setStudents([]);
    }
  };

  const startSubmission = async () => {
    if (!selectedStudentId) {
      setError(t('challenges.selectStudent'));
      return;
    }

    try {
      const response = await api.post(
        `/api/challenges/submit/complete/start/${challengeId}?user_id=${selectedStudentId}`
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

  const startOperation = (index: number) => {
    if (activeOperationIndex !== null) {
      setError(t('challengeExecution.finishInProgressFirst', 'Termine a operação em progresso antes de iniciar outra'));
      return;
    }

    const now = new Date();
    activeStartTimeRef.current = now.getTime();

    const updated = [...operations];
    updated[index].startedAt = now;
    updated[index].status = 'in_progress';
    setOperations(updated);
    setActiveOperationIndex(index);
    setElapsedTime(0);
    setIsPaused(false);
    pausedDurationRef.current = 0;
    setError('');
  };

  const pauseOperation = () => {
    if (activeOperationIndex === null || isPaused) return;
    pauseStartRef.current = Date.now();
    setIsPaused(true);
  };

  const resumeOperation = () => {
    if (activeOperationIndex === null || !isPaused) return;
    if (pauseStartRef.current) {
      pausedDurationRef.current += (Date.now() - pauseStartRef.current);
      pauseStartRef.current = null;
    }
    setIsPaused(false);
  };

  const finishOperation = (index: number) => {
    const op = operations[index];
    if (!op.startedAt) return;

    if (!op.reference.trim()) {
      setError(t('challenges.insertReference', `Insira a referência da operação ${index + 1} antes de finalizar`));
      return;
    }

    setFinishingOperationIndex(index);
    setPendingErrors([]);
    setOperationHasError(false);
    setShowErrorModal(true);
  };

  const confirmFinishOperation = async () => {
    if (finishingOperationIndex === null) return;

    const index = finishingOperationIndex;
    const op = operations[index];
    if (!op.startedAt) return;

    const completedAt = new Date();
    let totalPausedMs = pausedDurationRef.current;
    if (isPaused && pauseStartRef.current) {
      totalPausedMs += (completedAt.getTime() - pauseStartRef.current);
    }
    const durationSeconds = Math.max(0, Math.floor((completedAt.getTime() - op.startedAt.getTime() - totalPausedMs) / 1000));

    const operationErrors: OperationError[] = pendingErrors.map(e => ({
      error_type: e.type,
      description: ''
    }));

    const updated = [...operations];
    updated[index].completedAt = completedAt;
    updated[index].durationSeconds = durationSeconds;
    updated[index].status = 'completed';
    updated[index].errors = operationErrors;
    updated[index].hasError = pendingErrors.length > 0;
    setOperations(updated);
    activeStartTimeRef.current = null;
    setActiveOperationIndex(null);
    setElapsedTime(0);
    setIsPaused(false);
    pausedDurationRef.current = 0;
    pauseStartRef.current = null;

    setShowErrorModal(false);
    setFinishingOperationIndex(null);
    setPendingErrors([]);
  };

  const addPendingError = (type: 'METHODOLOGY' | 'KNOWLEDGE' | 'DETAIL' | 'PROCEDURE') => {
    const newError: PendingError = {
      id: Date.now().toString(),
      type,
    };
    setPendingErrors([...pendingErrors, newError]);
  };

  const removePendingError = (errorId: string) => {
    setPendingErrors(pendingErrors.filter(e => e.id !== errorId));
  };

  const finishSubmission = async () => {
    const completedOps = operations.filter(op => op.status === 'completed');
    if (completedOps.length === 0) {
      setError(t('challengeExecution.completeAtLeastOne', 'Complete pelo menos uma operação antes de finalizar'));
      return;
    }

    try {
      for (const op of completedOps) {
        await api.post(`/api/challenges/submit/complete/${submissionId}/part`, {
          part_number: op.operationNumber,
          operations_count: 1,
          operation_reference: op.reference,
          started_at: op.startedAt?.toISOString(),
          completed_at: op.completedAt?.toISOString(),
          errors: op.errors?.map(e => ({ type: e.error_type, description: e.description || '' })) || [],
        });
      }

      const totalErrors = completedOps.reduce((sum, op) => sum + (op.errors?.length || 0), 0);

      const response = await api.post(`/api/challenges/submit/complete/${submissionId}/finish`, {
        errors_count: totalErrors,
      });

      const resultUrl = planId
        ? `/challenges/result/${response.data.id}?planId=${planId}`
        : `/challenges/result/${response.data.id}`;
      navigate(resultUrl);
    } catch (err: any) {
      console.error('Erro ao finalizar:', err);
      setError(err.response?.data?.detail || t('challenges.finalizeError'));
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
        <p className="font-body text-gray-500 dark:text-gray-400">{t('submissionReview.challengeNotFound', 'Desafio não encontrado')}</p>
      </div>
    );
  }

  const completedCount = operations.filter(op => op.status === 'completed').length;
  const progressPercent = challenge.operations_required > 0 ? (completedCount / challenge.operations_required) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => planId ? navigate(`/training-plans/${planId}`) : navigate(-1)}
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
              {challenge.description} &bull; {t('challenges.typeLabel', 'Tipo')}: {challenge.challenge_type}
            </p>
          </div>
        </div>

        {/* KPI Stats Bar */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${challenge.use_volume_kpi ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Hash className={`w-4 h-4 ${challenge.use_volume_kpi ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                </div>
              </div>
              <p className="font-mono text-xl font-bold text-gray-900 dark:text-white">
                {completedCount}/{challenge.operations_required}
              </p>
              <p className="font-body text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('challengeExecution.operations', 'Operações')}
                {challenge.use_volume_kpi && <span className="text-blue-600 dark:text-blue-400 ml-1">(KPI)</span>}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${challenge.use_mpu_kpi ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <TrendingUp className={`w-4 h-4 ${challenge.use_mpu_kpi ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                </div>
              </div>
              <p className="font-mono text-xl font-bold text-gray-900 dark:text-white">
                {calculateMPU().toFixed(2)}
              </p>
              <p className="font-body text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('challengeExecution.currentMPU', 'MPU Atual')}
                {challenge.use_mpu_kpi && <span className="text-green-600 dark:text-green-400 ml-1">({t('challengeExecution.target', 'Alvo')}: {challenge.target_mpu})</span>}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${challenge.use_errors_kpi ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <AlertTriangle className={`w-4 h-4 ${challenge.use_errors_kpi ? 'text-[#EC0000]' : 'text-gray-400'}`} />
                </div>
              </div>
              <p className="font-mono text-xl font-bold text-gray-900 dark:text-white">
                {operations.reduce((sum, op) => sum + (op.errors?.length || 0), 0)}/{challenge.max_errors || 0}
              </p>
              <p className="font-body text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('challengeExecution.maxErrors', 'Erros Max')}
                {challenge.use_errors_kpi && <span className="text-[#EC0000] ml-1">(KPI)</span>}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="font-mono text-xl font-bold text-gray-900 dark:text-white">
                {formatTime(calculateTotalTime())}
              </p>
              <p className="font-body text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('challengeExecution.totalTime', 'Tempo Total')} ({t('challengeExecution.limit', 'Limite')}: {challenge.time_limit_minutes}m)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-body text-sm text-gray-500 dark:text-gray-400">{t('challengeExecution.challengeProgress', 'Progresso do Desafio')}</span>
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

      {/* Student Selection (before starting) */}
      {!submissionId && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white">
              {t('submissionReview.student', 'Formando')}
            </h3>
          </div>
          {planStudent ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/30 rounded-xl flex-1">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-body font-medium text-gray-900 dark:text-white">{planStudent.full_name}</p>
                  <p className="font-body text-sm text-gray-500 dark:text-gray-400">{planStudent.email}</p>
                </div>
              </div>
              <button
                onClick={startSubmission}
                className="flex items-center gap-2 px-6 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold transition-colors"
              >
                <Play className="w-5 h-5" />
                {t('challengeExecution.startChallenge', 'Iniciar Desafio')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={selectedStudentId ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedStudentId(v ? parseInt(v, 10) : null);
                }}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-body focus:outline-none focus:ring-1 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/30"
              >
                <option value="">{t('challenges.selectStudent', 'Selecione um formando')}</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.email})
                  </option>
                ))}
              </select>
              <button
                onClick={startSubmission}
                disabled={!selectedStudentId}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#EC0000] hover:bg-[#CC0000] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-body font-bold transition-colors"
              >
                <Play className="w-5 h-5" />
                {t('challengeExecution.startChallenge', 'Iniciar Desafio')}
              </button>
            </div>
          )}
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
              {t('challengeExecution.operations', 'Operações')} ({completedCount}/{challenge.operations_required})
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
                      ? 'border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-900/10'
                      : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Operation number */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                    op.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
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
                      placeholder={t('challengeExecution.referencePlaceholder', 'Referência da operação (ex: 4060ILC0001111)')}
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
                          {t('challengeExecution.paused', 'PAUSADO')}
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
                        {t('challengeExecution.start', 'Iniciar')}
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
                            {t('challengeExecution.resume', 'Retomar')}
                          </button>
                        ) : (
                          <button
                            onClick={pauseOperation}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-500/30 text-gray-700 dark:text-gray-300 rounded-xl font-body font-bold text-sm transition-colors"
                          >
                            <Pause className="w-4 h-4" />
                            {t('challengeExecution.pause', 'Pausar')}
                          </button>
                        )}
                        <button
                          onClick={() => finishOperation(index)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-body font-bold text-sm transition-colors"
                        >
                          <Square className="w-4 h-4" />
                          {t('challengeExecution.finishOperationBtn', 'Terminar')}
                        </button>
                      </div>
                    )}

                    {op.status === 'completed' && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 rounded-lg">
                        <Check className="w-4 h-4" />
                        <span className="font-body text-xs font-bold">{t('challengeExecution.completed', 'Concluída')}</span>
                        {op.errors && op.errors.length > 0 && (
                          <span className="ml-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-[11px] font-bold rounded-full">
                            {op.errors.length} {t('challengeComplete.errors', 'erro(s)')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Error Summary & Finalize */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {t('challengeExecution.totalClassifiedErrors', 'Total de Erros Classificados')}
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-[#EC0000] rounded-xl font-mono text-xl font-bold">
                    {operations.reduce((sum, op) => sum + (op.errors?.length || 0), 0)}
                  </span>
                  <span className="font-body text-sm text-gray-500 dark:text-gray-400">
                    / {t('challengeExecution.maxAllowed', 'Máximo permitido')}: {challenge.max_errors ?? 0}
                  </span>
                </div>
              </div>

              <button
                onClick={finishSubmission}
                disabled={completedCount === 0}
                className="flex items-center gap-2 px-8 py-4 bg-[#EC0000] hover:bg-[#CC0000] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-body font-bold text-lg transition-colors"
              >
                <Check className="w-6 h-6" />
                {t('challengeComplete.finalizeChallenge', 'Finalizar Desafio')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Classification Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white">{t('challengeExecution.operationClassification', 'Classificação da Operação')}</h3>
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setFinishingOperationIndex(null);
                  setPendingErrors([]);
                  setOperationHasError(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Error question */}
            <div className="mb-6">
              <p className="font-body text-sm text-gray-600 dark:text-gray-400 mb-3">{t('challengeExecution.operationHadError', 'Esta operação teve algum erro?')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setOperationHasError(false);
                    setPendingErrors([]);
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-body font-bold text-sm transition-colors ${
                    !operationHasError
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('challengeExecution.noErrors', 'Não, sem erros')}
                </button>
                <button
                  onClick={() => setOperationHasError(true)}
                  className={`flex-1 px-4 py-3 rounded-xl font-body font-bold text-sm transition-colors ${
                    operationHasError
                      ? 'bg-[#EC0000] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('challengeExecution.yesHadErrors', 'Sim, teve erro(s)')}
                </button>
              </div>
            </div>

            {/* Error type buttons */}
            {operationHasError && (
              <>
                <div className="mb-4">
                  <p className="font-body text-sm text-gray-500 dark:text-gray-400 mb-3">{t('submissionReview.addErrorByType', 'Adicionar erro por tipo')}:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addPendingError('METHODOLOGY')}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 rounded-lg transition-colors font-body text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      {t('submissionReview.methodology', 'Metodologia')}
                    </button>
                    <button
                      onClick={() => addPendingError('KNOWLEDGE')}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors font-body text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      {t('submissionReview.knowledge', 'Conhecimento')}
                    </button>
                    <button
                      onClick={() => addPendingError('DETAIL')}
                      className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-500/30 text-yellow-600 dark:text-yellow-400 rounded-lg transition-colors font-body text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      {t('submissionReview.detail', 'Detalhe')}
                    </button>
                    <button
                      onClick={() => addPendingError('PROCEDURE')}
                      className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 rounded-lg transition-colors font-body text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      {t('submissionReview.procedure', 'Procedimento')}
                    </button>
                  </div>
                </div>

                {/* Pending errors list */}
                <div className="mb-6 max-h-60 overflow-y-auto">
                  {pendingErrors.length === 0 ? (
                    <p className="font-body text-sm text-gray-400 text-center py-4">{t('challengeExecution.addAtLeastOneError', 'Adicione pelo menos um erro acima')}</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingErrors.map((err) => (
                        <div
                          key={err.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            err.type === 'METHODOLOGY' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' :
                            err.type === 'KNOWLEDGE' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                            err.type === 'DETAIL' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                            'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                          }`}
                        >
                          <span className="font-body text-sm font-medium">
                            {err.type === 'METHODOLOGY' ? t('submissionReview.methodology', 'Metodologia') :
                             err.type === 'KNOWLEDGE' ? t('submissionReview.knowledge', 'Conhecimento') :
                             err.type === 'DETAIL' ? t('submissionReview.detail', 'Detalhe') : t('submissionReview.procedure', 'Procedimento')}
                          </span>
                          <button
                            onClick={() => removePendingError(err.id)}
                            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Modal actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setFinishingOperationIndex(null);
                  setPendingErrors([]);
                  setOperationHasError(false);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-body font-bold transition-colors"
              >
                {t('submissionReview.cancel', 'Cancelar')}
              </button>
              <button
                onClick={confirmFinishOperation}
                disabled={operationHasError && pendingErrors.length === 0}
                className={`flex-1 px-4 py-3 rounded-xl font-body font-bold transition-colors ${
                  operationHasError && pendingErrors.length === 0
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-[#EC0000] hover:bg-[#CC0000] text-white'
                }`}
              >
                {operationHasError
                  ? `${t('challengeExecution.confirm', 'Confirmar')} (${pendingErrors.length} ${t('challengeComplete.errors', 'erro(s)')})`
                  : t('challengeExecution.confirmNoErrors', 'Confirmar - Sem erros')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeExecutionComplete;
