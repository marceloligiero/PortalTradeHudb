import React, { useState, useEffect, useCallback } from 'react';
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
  Trash2
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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  
  const [operations, setOperations] = useState<Operation[]>([]);
  const [activeOperationIndex, setActiveOperationIndex] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

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
    if (activeOperationIndex === null) {
      return;
    }
    
    const op = operations[activeOperationIndex];
    if (!op || !op.startedAt) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - op.startedAt!.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeOperationIndex, operations]);

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
      if (plan.student) {
        setPlanStudent(plan.student);
        setSelectedStudentId(plan.student.id);
      } else if (plan.student_id) {
        // Fallback: buscar dados do student
        const userResp = await api.get(`/api/admin/users/${plan.student_id}`);
        const user = userResp.data;
        setPlanStudent({ id: user.id, full_name: user.full_name, email: user.email });
        setSelectedStudentId(user.id);
      }
    } catch (err) {
      console.error('Erro ao carregar student do plano:', err);
      loadStudents(); // fallback
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
      // Prefer endpoint that returns students eligible for this challenge
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

      // If no eligible students found, fallback to trainer report and admin lists as a last resort
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
        // ignore
        setStudents([]);
      }
    } catch (err) {
      console.error('Erro ao carregar estudantes:', err);
      setStudents([]);
    }
  };

  const startSubmission = async () => {
    if (!selectedStudentId) {
      setError('Selecione um estudante');
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
    if (!operations[index].reference.trim()) {
      setError(`Insira a referência da operação ${index + 1}`);
      return;
    }

    // Verificar se há outra operação em progresso
    if (activeOperationIndex !== null) {
      setError('Termine a operação em progresso antes de iniciar outra');
      return;
    }

    const updated = [...operations];
    updated[index].startedAt = new Date();
    updated[index].status = 'in_progress';
    setOperations(updated);
    setActiveOperationIndex(index);
    setElapsedTime(0);
    setError('');
  };

  const finishOperation = (index: number) => {
    const op = operations[index];
    if (!op.startedAt) return;

    // Mostrar modal de classificação de erros
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
    const durationSeconds = Math.floor((completedAt.getTime() - op.startedAt.getTime()) / 1000);

    // Converter PendingError para OperationError
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
    setActiveOperationIndex(null);
    setElapsedTime(0);
    
    // Fechar modal
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
      setError('Complete pelo menos uma operação antes de finalizar');
      return;
    }

    try {
      // Enviar todas as operações para o backend
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

      // Calcular total de erros
      const totalErrors = completedOps.reduce((sum, op) => sum + (op.errors?.length || 0), 0);

      // Finalizar submissão
      const response = await api.post(`/api/challenges/submit/complete/${submissionId}/finish`, {
        errors_count: totalErrors,
      });
      
      // Redirecionar para resultados
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
    // MPU = Minutos Por Unidade = tempo (em minutos) / operações
    return (totalTime / 60) / completedCount;
  }, [operations, calculateTotalTime]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-red-50/20 to-gray-100 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 dark:border-white/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-red-50/20 to-gray-100 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Desafio não encontrado</div>
      </div>
    );
  }

  const completedCount = operations.filter(op => op.status === 'completed').length;
  const progressPercent = challenge.operations_required > 0 ? (completedCount / challenge.operations_required) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => planId ? navigate(`/training-plans/${planId}`) : navigate(-1)}
          className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {challenge.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {challenge.description} • Tipo: {challenge.challenge_type}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${challenge.use_volume_kpi ? 'bg-blue-500/20' : 'bg-gray-200 dark:bg-gray-500/20'}`}>
              <Hash className={`w-5 h-5 ${challenge.use_volume_kpi ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {completedCount}/{challenge.operations_required}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Operações {challenge.use_volume_kpi && <span className="text-blue-500 dark:text-blue-400">(KPI)</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${challenge.use_mpu_kpi ? 'bg-green-500/20' : 'bg-gray-200 dark:bg-gray-500/20'}`}>
              <TrendingUp className={`w-5 h-5 ${challenge.use_mpu_kpi ? 'text-green-500 dark:text-green-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {calculateMPU().toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                MPU Atual {challenge.use_mpu_kpi && <span className="text-green-500 dark:text-green-400">(Alvo: {challenge.target_mpu})</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${challenge.use_errors_kpi ? 'bg-red-500/20' : 'bg-gray-200 dark:bg-gray-500/20'}`}>
              <AlertTriangle className={`w-5 h-5 ${challenge.use_errors_kpi ? 'text-red-500 dark:text-red-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {operations.reduce((sum, op) => sum + (op.errors?.length || 0), 0)}/{challenge.max_errors || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Erros Max {challenge.use_errors_kpi && <span className="text-red-500 dark:text-red-400">(KPI)</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatTime(calculateTotalTime())}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tempo Total (Limite: {challenge.time_limit_minutes} min)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Progresso do Desafio</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
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

      {/* Seleção de Estudante (se ainda não iniciou) */}
      {!submissionId && (
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Formando
          </h3>
          {planStudent ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 rounded-lg flex-1 mr-4">
                <User className="w-6 h-6 text-green-600 dark:text-green-500" />
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">{planStudent.full_name}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{planStudent.email}</p>
                </div>
              </div>
              <button
                onClick={startSubmission}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
              >
                <Play className="w-5 h-5" />
                Iniciar Desafio
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
                className="px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Selecione um formando</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    {student.full_name} ({student.email})
                  </option>
                ))}
              </select>
              <button
                onClick={startSubmission}
                disabled={!selectedStudentId}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
              >
                <Play className="w-5 h-5" />
                Iniciar Desafio
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de Operações */}
      {submissionId && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500 dark:text-green-400" />
            Operações ({completedCount}/{challenge.operations_required})
          </h2>

          <div className="grid gap-3">
            {operations.map((op, index) => (
              <div
                key={op.operationNumber}
                className={`bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border p-4 transition-all shadow-sm dark:shadow-none ${
                  op.status === 'in_progress' 
                    ? 'border-blue-400 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-500/10' 
                    : op.status === 'completed' 
                      ? 'border-green-400 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10' 
                      : 'border-gray-200 dark:border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Número da operação */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    op.status === 'completed' 
                      ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' 
                      : op.status === 'in_progress'
                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                  }`}>
                    {op.operationNumber}
                  </div>

                  {/* Campo de referência */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={op.reference}
                      onChange={(e) => updateOperationReference(index, e.target.value)}
                      disabled={op.status !== 'pending'}
                      placeholder="Referência da operação (ex: 4060ILC0001111)"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Timer (se em progresso ou concluído) */}
                  {op.status !== 'pending' && (
                    <div className="text-right min-w-[100px]">
                      <div className={`text-xl font-mono font-bold ${
                        op.status === 'in_progress' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        <Timer className="w-4 h-4 inline mr-1" />
                        {op.status === 'in_progress' 
                          ? formatTime(elapsedTime) 
                          : formatTime(op.durationSeconds)
                        }
                      </div>
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
                      <button
                        onClick={() => finishOperation(index)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Square className="w-4 h-4" />
                        Terminar
                      </button>
                    )}

                    {op.status === 'completed' && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg">
                        <Check className="w-4 h-4" />
                        Concluída
                        {op.errors && op.errors.length > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                            {op.errors.length} erro(s)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo de Erros e Finalizar */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-6 mt-6 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Total de Erros Classificados
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="px-4 py-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xl font-bold">
                      {operations.reduce((sum, op) => sum + (op.errors?.length || 0), 0)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      / Máximo permitido: {challenge.max_errors ?? 0}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={finishSubmission}
                disabled={completedCount === 0}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all"
              >
                <Check className="w-6 h-6" />
                Finalizar Desafio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Classificação de Erros */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/20 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Classificação da Operação</h3>
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setFinishingOperationIndex(null);
                  setPendingErrors([]);
                  setOperationHasError(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Pergunta se teve erro */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Esta operação teve algum erro?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setOperationHasError(false);
                    setPendingErrors([]);
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    !operationHasError 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                  }`}
                >
                  Não, sem erros
                </button>
                <button
                  onClick={() => setOperationHasError(true)}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    operationHasError 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                  }`}
                >
                  Sim, teve erro(s)
                </button>
              </div>
            </div>

            {/* Botões para adicionar erros - só mostra se teve erro */}
            {operationHasError && (
              <>
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Adicionar erro por tipo:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addPendingError('METHODOLOGY')}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-500/30 text-purple-600 dark:text-purple-400 rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Metodologia
                  </button>
                  <button
                  onClick={() => addPendingError('KNOWLEDGE')}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Conhecimento
                </button>
                <button
                  onClick={() => addPendingError('DETAIL')}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-500/20 hover:bg-yellow-200 dark:hover:bg-yellow-500/30 text-yellow-600 dark:text-yellow-400 rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Detalhe
                </button>
                <button
                  onClick={() => addPendingError('PROCEDURE')}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-500/20 hover:bg-orange-200 dark:hover:bg-orange-500/30 text-orange-600 dark:text-orange-400 rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Procedimento
                </button>
              </div>
            </div>

            {/* Lista de erros pendentes - só mostra se teve erro */}
            <div className="mb-6 max-h-60 overflow-y-auto">
              {pendingErrors.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-center py-4">Adicione pelo menos um erro acima</p>
              ) : (
                <div className="space-y-2">
                  {pendingErrors.map((error) => (
                    <div
                      key={error.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        error.type === 'METHODOLOGY' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' :
                        error.type === 'KNOWLEDGE' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                        error.type === 'DETAIL' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                        'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {error.type === 'METHODOLOGY' ? 'Metodologia' :
                         error.type === 'KNOWLEDGE' ? 'Conhecimento' :
                         error.type === 'DETAIL' ? 'Detalhe' : 'Procedimento'}
                      </span>
                      <button
                        onClick={() => removePendingError(error.id)}
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

            {/* Botões de ação */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setFinishingOperationIndex(null);
                  setPendingErrors([]);
                  setOperationHasError(false);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmFinishOperation}
                disabled={operationHasError && pendingErrors.length === 0}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  operationHasError && pendingErrors.length === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                }`}
              >
                {operationHasError 
                  ? `Confirmar (${pendingErrors.length} erro${pendingErrors.length !== 1 ? 's' : ''})`
                  : 'Confirmar - Sem erros'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeExecutionComplete;
