import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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
  AlertTriangle
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
        
        // Buscar dados do desafio
        const challengeResp = await api.get(`/api/challenges/${challengeId}`);
        setChallenge(challengeResp.data);
        
        // Pegar submissionId
        let subId = submissionIdFromUrl;
        
        // Se não tem submissionId na URL, tentar buscar uma submission existente
        if (!subId) {
          try {
            const existingResp = await api.post(`/api/challenges/submit/complete/start/${challengeId}/self`, {
              training_plan_id: planId ? parseInt(planId) : null
            });
            
            if (existingResp.data && existingResp.data.id) {
              subId = String(existingResp.data.id);
              setCurrentSubmissionId(subId);
              setSubmission(existingResp.data);
              // Atualizar URL
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
        
        // Buscar submissão e operações
        if (subId) {
          console.log('Buscando submission e operações para subId:', subId);
          
          const subResp = await api.get(`/api/challenges/submissions/${subId}`);
          setSubmission(subResp.data);
          
          // Buscar operações
          const opsResp = await api.get(`/api/challenges/submissions/${subId}/operations`);
          console.log('Operações recebidas:', opsResp.data);
          setOperations(opsResp.data || []);
          
          // Verificar se há operação em progresso
          const inProgress = (opsResp.data || []).find((op: Operation) => !op.completed_at);
          setCurrentOperation(inProgress || null);
          
          // Atualizar state
          setCurrentSubmissionId(subId);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token, challengeId]); // Dependências mínimas - só recarrega quando token ou challengeId muda

  // Função para recarregar dados (botão refresh)
  const loadData = async () => {
    if (!token || !challengeId || !currentSubmissionId) return;
    
    try {
      setLoading(true);
      
      const subResp = await api.get(`/api/challenges/submissions/${currentSubmissionId}`);
      setSubmission(subResp.data);
      
      const opsResp = await api.get(`/api/challenges/submissions/${currentSubmissionId}/operations`);
      console.log('Operações recebidas (refresh):', opsResp.data);
      setOperations(opsResp.data || []);
      
      const inProgress = (opsResp.data || []).find((op: Operation) => !op.completed_at);
      setCurrentOperation(inProgress || null);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cronómetro para operação em progresso
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
      
      // Se não tem submissão, criar uma
      let subId = currentSubmissionId;
      if (!subId) {
        const startResp = await api.post(`/api/challenges/submit/complete/start/${challengeId}/self`, {
          training_plan_id: planId ? parseInt(planId) : null
        });
        subId = String(startResp.data.id);
        setSubmission(startResp.data);
        setCurrentSubmissionId(subId);
        
        // Atualizar URL com submissionId
        setSearchParams({ submissionId: subId });
      }
      
      // Iniciar operação
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
      
      // Atualizar dados
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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const completedOperations = operations.filter(op => op.completed_at);
  const progressPercent = challenge 
    ? Math.min(100, (completedOperations.length / challenge.operations_required) * 100)
    : 0;
  
  // Verificar se atingiu o limite de operações
  const allOperationsCompleted = challenge 
    ? completedOperations.length >= challenge.operations_required 
    : false;
  
  // Pode adicionar mais operações?
  const canAddMoreOperations = challenge 
    ? operations.length < challenge.operations_required 
    : true;
  
  // Quantas operações faltam?
  const remainingOperations = challenge 
    ? Math.max(0, challenge.operations_required - completedOperations.length)
    : 0;

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
                {challenge?.title}
              </h1>
              <p className="text-gray-400">
                {challenge?.description}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={loadData}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* KPIs do desafio */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${challenge?.use_volume_kpi ? 'bg-blue-500/20' : 'bg-gray-500/20'}`}>
              <Hash className={`w-5 h-5 ${challenge?.use_volume_kpi ? 'text-blue-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {completedOperations.length}/{challenge?.operations_required}
              </p>
              <p className="text-xs text-gray-400">
                {t('challengeExecution.operations')} {challenge?.use_volume_kpi && <span className="text-blue-400">(KPI)</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${challenge?.use_mpu_kpi ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
              <TrendingUp className={`w-5 h-5 ${challenge?.use_mpu_kpi ? 'text-green-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {challenge?.target_mpu || '-'}
              </p>
              <p className="text-xs text-gray-400">
                {t('challengeExecution.targetMPU')} {challenge?.use_mpu_kpi && <span className="text-green-400">(KPI)</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${challenge?.use_errors_kpi ? 'bg-red-500/20' : 'bg-gray-500/20'}`}>
              <AlertTriangle className={`w-5 h-5 ${challenge?.use_errors_kpi ? 'text-red-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {operations.filter(op => op.has_error).length}/{challenge?.max_errors}
              </p>
              <p className="text-xs text-gray-400">
                {t('challengeExecution.maxErrors')} {challenge?.use_errors_kpi && <span className="text-red-400">(KPI)</span>}
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
                {challenge?.time_limit_minutes || '-'}
              </p>
              <p className="text-xs text-gray-400">{t('challengeExecution.timeLimit')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{t('challengeExecution.challengeProgress')}</span>
            <span className="text-sm text-white">
              <span className="font-bold text-green-400">{completedOperations.length}</span>
              <span className="text-gray-500"> / </span>
              <span className="font-bold">{challenge?.operations_required}</span>
              <span className="text-gray-500"> {t('challengeExecution.operations').toLowerCase()}</span>
            </span>
            {remainingOperations > 0 && (
              <span className="text-sm text-yellow-400">
                ({remainingOperations === 1 ? t('challengeExecution.remaining', { count: remainingOperations }) : t('challengeExecution.remainingPlural', { count: remainingOperations })})
              </span>
            )}
          </div>
          <span className="text-sm font-bold text-white">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Operação em progresso */}
      {currentOperation ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-8"
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Timer className="w-6 h-6 text-blue-400" />
              <span className="text-lg font-semibold text-white">{t('challengeExecution.operationInProgress')}</span>
            </div>
            
            <div className="text-5xl font-mono font-bold text-white mb-4">
              {formatTime(elapsedTime)}
            </div>
            
            <div className="text-lg text-gray-300 mb-6">
              {t('challengeExecution.reference')}: <span className="font-bold text-blue-400">{currentOperation.operation_reference}</span>
            </div>
            
            <button
              onClick={handleFinishOperation}
              disabled={actionLoading}
              className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 mx-auto"
            >
              {actionLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Square className="w-6 h-6" />
              )}
              {t('challengeExecution.finishOperationBtn')}
            </button>
          </div>
        </motion.div>
      ) : canAddMoreOperations ? (
        /* Iniciar nova operação */
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-green-400" />
            {t('challengeExecution.startNewOperation')}
          </h3>
          
          <div className="flex gap-4">
            <input
              type="text"
              value={newReference}
              onChange={(e) => setNewReference(e.target.value)}
              placeholder={t('challengeExecution.referencePlaceholder')}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
            <button
              onClick={handleStartOperation}
              disabled={actionLoading || !newReference.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        /* Todas operações completas - Botão Submeter */
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {t('challengeExecution.allOperationsCompleted')}
            </h3>
            <p className="text-gray-400 mb-6">
              {t('challengeExecution.completedCount', { completed: completedOperations.length, total: challenge?.operations_required })}
              {!allOperationsCompleted && ` ${t('challengeExecution.awaitingCompletionHint')}`}
            </p>
            
            <button
              onClick={handleSubmitForReview}
              disabled={actionLoading || !allOperationsCompleted}
              className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
            >
              {actionLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <CheckCircle className="w-6 h-6" />
              )}
              {t('challengeExecution.submitForReview')}
            </button>
          </div>
        </div>
      )}

      {/* Histórico de operações */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          {t('challengeExecution.operationsPerformed')} ({completedOperations.length})
        </h2>

        {completedOperations.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-8 text-center">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">{t('challengeExecution.noOperationsYet')}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {completedOperations.map((op, index) => (
              <motion.div
                key={op.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white/5 backdrop-blur-xl rounded-xl border p-4 ${
                  op.has_error ? 'border-red-500/30 bg-red-500/10' : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                      op.has_error ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {op.operation_number}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{op.operation_reference}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(op.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono font-bold text-white">
                        {formatTime(op.duration_seconds || 0)}
                      </p>
                      <p className="text-xs text-gray-400">{t('challengeExecution.duration')}</p>
                    </div>
                    {op.has_error ? (
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    ) : op.is_approved !== undefined ? (
                      <CheckCircle className={`w-6 h-6 ${op.is_approved ? 'text-green-400' : 'text-yellow-400'}`} />
                    ) : (
                      <Clock className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {/* Mostrar erros detalhados */}
                {op.has_error && op.errors && op.errors.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-red-500/20">
                    <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-2">
                      {t('challengeExecution.errorsIdentified')} ({op.errors.length}):
                    </p>
                    <div className="space-y-2">
                      {op.errors.map((err) => (
                        <div 
                          key={err.id} 
                          className="flex items-start gap-3 p-2 bg-red-500/10 rounded-lg"
                        >
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            err.error_type === 'METODOLOGIA' ? 'bg-orange-500/20 text-orange-400' :
                            err.error_type === 'CONHECIMENTO' ? 'bg-blue-500/20 text-blue-400' :
                            err.error_type === 'DETALHE' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {err.error_type}
                          </span>
                          {err.description && (
                            <span className="text-sm text-gray-300 flex-1">
                              {err.description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
