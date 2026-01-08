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
  AlertTriangle
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

interface Operation {
  operationNumber: number;
  reference: string;
  startedAt: Date | null;
  completedAt: Date | null;
  durationSeconds: number;
  status: 'pending' | 'in_progress' | 'completed';
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
  const [errorsCount, setErrorsCount] = useState<number>(0);

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
          status: 'pending'
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

    const completedAt = new Date();
    const durationSeconds = Math.floor((completedAt.getTime() - op.startedAt.getTime()) / 1000);

    const updated = [...operations];
    updated[index].completedAt = completedAt;
    updated[index].durationSeconds = durationSeconds;
    updated[index].status = 'completed';
    setOperations(updated);
    setActiveOperationIndex(null);
    setElapsedTime(0);
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
        });
      }

      // Finalizar submissão
      const response = await api.post(`/api/challenges/submit/complete/${submissionId}/finish`, {
        errors_count: errorsCount || 0,
      });
      
      navigate(`/challenges/result/${response.data.id}`);
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
    return completedCount / (totalTime / 60);
  }, [operations, calculateTotalTime]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-white">Desafio não encontrado</div>
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
                {challenge.description} • Tipo: {challenge.challenge_type}
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
              <p className="text-xs text-gray-400">
                Operações {challenge.use_volume_kpi && <span className="text-blue-400">(KPI)</span>}
              </p>
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
              <p className="text-xs text-gray-400">
                MPU Atual {challenge.use_mpu_kpi && <span className="text-green-400">(Alvo: {challenge.target_mpu})</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${challenge.use_errors_kpi ? 'bg-red-500/20' : 'bg-gray-500/20'}`}>
              <AlertTriangle className={`w-5 h-5 ${challenge.use_errors_kpi ? 'text-red-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {errorsCount}/{challenge.max_errors || 0}
              </p>
              <p className="text-xs text-gray-400">
                Erros Max {challenge.use_errors_kpi && <span className="text-red-400">(KPI)</span>}
              </p>
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
              <p className="text-xs text-gray-400">Tempo Total (Limite: {challenge.time_limit_minutes} min)</p>
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

      {/* Seleção de Estudante (se ainda não iniciou) */}
      {!submissionId && (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Formando
          </h3>
          {planStudent ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex-1 mr-4">
                <User className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-white font-medium">{planStudent.full_name}</p>
                  <p className="text-gray-400 text-sm">{planStudent.email}</p>
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
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Selecione um formando</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
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
                      ? 'border-green-500/30 bg-green-500/10' 
                      : 'border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Número da operação */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    op.status === 'completed' 
                      ? 'bg-green-500/20 text-green-400' 
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
                      disabled={op.status !== 'pending'}
                      placeholder="Referência da operação (ex: 4060ILC0001111)"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Timer (se em progresso ou concluído) */}
                  {op.status !== 'pending' && (
                    <div className="text-right min-w-[100px]">
                      <div className={`text-xl font-mono font-bold ${
                        op.status === 'in_progress' ? 'text-blue-400' : 'text-green-400'
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
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                        <Check className="w-4 h-4" />
                        Concluída
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Campo de Erros e Finalizar */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total de Erros Cometidos
                  </label>
                  <input
                    type="number"
                    value={errorsCount}
                    onChange={(e) => setErrorsCount(parseInt(e.target.value || '0'))}
                    min={0}
                    max={challenge.max_errors || 999}
                    className="w-32 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo permitido: {challenge.max_errors ?? 0}
                  </p>
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
    </div>
  );
};

export default ChallengeExecutionComplete;
