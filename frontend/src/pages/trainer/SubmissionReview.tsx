import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  FileText
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
  started_at: string;
  completed_at?: string;
  total_operations: number;
  total_time_minutes?: number;
  calculated_mpu?: number;
  correct_operations: number;
  errors_count: number;
  challenge?: Challenge;
  user?: UserBasic;
}

const ERROR_TYPES = [
  { value: 'METODOLOGIA', label: 'Metodologia', description: 'Erro no processo ou método utilizado' },
  { value: 'CONHECIMENTO', label: 'Conhecimento', description: 'Falta de conhecimento técnico' },
  { value: 'DETALHE', label: 'Detalhe', description: 'Erro de atenção ao detalhe' },
  { value: 'PROCEDIMENTO', label: 'Procedimento', description: 'Não seguiu o procedimento correto' }
];

export default function SubmissionReview() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Estado para edição de erros
  const [editingOp, setEditingOp] = useState<number | null>(null);
  const [tempErrors, setTempErrors] = useState<OperationError[]>([]);

  const loadData = useCallback(async () => {
    if (!token || !submissionId) return;
    
    try {
      setLoading(true);
      
      // Buscar submissão
      const subResp = await api.get(`/api/challenges/submissions/${submissionId}`);
      setSubmission(subResp.data);
      
      // Buscar operações
      const opsResp = await api.get(`/api/challenges/submissions/${submissionId}/operations`);
      setOperations(opsResp.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [token, submissionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      
      // Validar descrições
      for (const err of tempErrors) {
        if (!err.description.trim()) {
          alert('Preencha a descrição de todos os erros');
          return;
        }
        if (err.description.length > 160) {
          alert('A descrição não pode ter mais de 160 caracteres');
          return;
        }
      }
      
      // Enviar classificação
      await api.post(`/api/challenges/operations/${operationId}/classify`, {
        has_error: tempErrors.length > 0,
        errors: tempErrors
      });
      
      // Recarregar dados
      await loadData();
      setEditingOp(null);
      setTempErrors([]);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erro ao salvar classificação');
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
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erro ao marcar como correta');
    } finally {
      setSavingId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Verificar se todas as operações foram classificadas
  const allOperationsReviewed = operations
    .filter(op => op.completed_at)
    .every(op => op.is_approved != null);
  
  const completedOperationsCount = operations.filter(op => op.completed_at).length;

  // Função para finalizar a revisão (aprovar ou reprovar)
  const handleFinalizeReview = async (approve: boolean) => {
    if (!allOperationsReviewed) {
      alert('Classifique todas as operações antes de finalizar a correção');
      return;
    }

    const action = approve ? 'aprovar' : 'reprovar';
    if (!confirm(`Tem certeza que deseja ${action} este desafio?`)) {
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await api.post(`/api/challenges/submissions/${submissionId}/finalize-review?approve=${approve}`);
      
      const result = response.data;
      alert(result.message);
      
      // Recarregar dados e depois voltar
      await loadData();
      navigate(-1);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erro ao finalizar revisão');
    } finally {
      setSubmittingReview(false);
    }
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

  const pendingReview = operations.filter(op => op.completed_at && op.is_approved == null);
  const errorOperations = operations.filter(op => op.has_error);

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
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {submission?.challenge?.title || submission?.challenge_title || 'Classificar Desafio'}
              </h1>
              <p className="text-gray-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                {submission?.user?.full_name || submission?.user_name || 'Formando'}
                {submission?.user?.email && (
                  <span className="text-gray-500">({submission.user.email})</span>
                )}
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

      {/* Informações do Desafio */}
      {submission?.challenge && (
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-xl rounded-2xl border border-orange-500/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-400" />
            Informações do Desafio
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-orange-400 mb-1">
                <Hash className="w-4 h-4" />
                <span className="text-xs font-medium">Operações Necessárias</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {submission.challenge.operations_required || 'N/A'}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Timer className="w-4 h-4" />
                <span className="text-xs font-medium">Limite de Tempo</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {submission.challenge.time_limit_minutes ? `${submission.challenge.time_limit_minutes} min` : 'Sem limite'}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">MPU Alvo</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {submission.challenge.target_mpu?.toFixed(2) || 'N/A'}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">Máx. Erros Permitidos</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {submission.challenge.max_errors !== null && submission.challenge.max_errors !== undefined 
                  ? submission.challenge.max_errors 
                  : 'Sem limite'}
              </p>
            </div>
          </div>
          {submission.challenge.description && (
            <p className="mt-4 text-gray-400 text-sm">{submission.challenge.description}</p>
          )}
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Hash className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{operations.length}</p>
              <p className="text-xs text-gray-400">Operações Totais</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{pendingReview.length}</p>
              <p className="text-xs text-gray-400">Pendentes Revisão</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {operations.filter(op => op.is_approved === true && !op.has_error).length}
              </p>
              <p className="text-xs text-gray-400">Corretas</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{errorOperations.length}</p>
              <p className="text-xs text-gray-400">Com Erros</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de operações para classificar */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-400" />
          Operações para Classificar
        </h2>

        {operations.filter(op => op.completed_at).length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-8 text-center">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma operação concluída para classificar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {operations.filter(op => op.completed_at).map((op, index) => (
              <motion.div
                key={op.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white/5 backdrop-blur-xl rounded-2xl border overflow-hidden ${
                  op.has_error 
                    ? 'border-red-500/30' 
                    : op.is_approved === true 
                      ? 'border-green-500/30' 
                      : 'border-white/10'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        op.has_error 
                          ? 'bg-red-500/20 text-red-400' 
                          : op.is_approved === true 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {op.operation_number}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{op.operation_reference}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
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
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            {savingId === op.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Correta
                          </button>
                          <button
                            onClick={() => handleStartEdit(op)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Com Erros
                          </button>
                        </>
                      ) : op.has_error ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold">
                            {op.errors?.length || 0} erro(s)
                          </span>
                          <button
                            onClick={() => handleStartEdit(op)}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                          >
                            Editar
                          </button>
                        </div>
                      ) : (
                        <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-bold">
                          <CheckCircle className="w-4 h-4" />
                          Aprovada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Formulário de erros */}
                  {editingOp === op.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 pt-6 border-t border-white/10"
                    >
                      <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        Classificar Erros
                      </h4>

                      <div className="space-y-4">
                        {tempErrors.map((err, errIndex) => (
                          <div key={errIndex} className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-start gap-4">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">Tipo de Erro</label>
                                  <select
                                    value={err.error_type}
                                    onChange={(e) => handleErrorChange(errIndex, 'error_type', e.target.value)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
                                  >
                                    {ERROR_TYPES.map(type => (
                                      <option key={type.value} value={type.value} className="bg-gray-800">
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">
                                    Descrição ({err.description.length}/160)
                                  </label>
                                  <input
                                    type="text"
                                    value={err.description}
                                    onChange={(e) => handleErrorChange(errIndex, 'description', e.target.value)}
                                    maxLength={160}
                                    placeholder="Descreva o erro..."
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveError(errIndex)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={handleAddError}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-lg text-gray-400 transition-colors w-full justify-center"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Erro
                        </button>

                        <div className="flex justify-end gap-3 pt-4">
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveClassification(op.id)}
                            disabled={savingId === op.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            {savingId === op.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            Salvar Classificação
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Mostrar erros existentes (quando não está editando) */}
                  {op.has_error && op.errors && op.errors.length > 0 && editingOp !== op.id && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-xs font-bold text-red-400 mb-2">Erros Identificados:</h4>
                      <div className="space-y-2">
                        {op.errors.map((err, errIndex) => (
                          <div key={errIndex} className="flex items-start gap-2 text-sm">
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold">
                              {err.error_type}
                            </span>
                            <span className="text-gray-300">{err.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Botões Aprovar/Reprovar */}
      {completedOperationsCount > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Finalizar Correção</h3>
              <p className="text-sm text-gray-400">
                {allOperationsReviewed 
                  ? `Todas as ${completedOperationsCount} operações foram classificadas.`
                  : `${pendingReview.length} de ${completedOperationsCount} operações ainda pendentes de classificação.`
                }
              </p>
              {allOperationsReviewed && (
                <div className="mt-2 text-sm">
                  <span className="text-green-400">{operations.filter(op => op.is_approved === true && !op.has_error).length} corretas</span>
                  <span className="text-gray-500 mx-2">|</span>
                  <span className="text-red-400">{errorOperations.length} com erros</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleFinalizeReview(false)}
                disabled={!allOperationsReviewed || submittingReview}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  allOperationsReviewed && !submittingReview
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/20'
                    : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {submittingReview ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <X className="w-5 h-5" />
                )}
                Reprovar
              </button>
              <button
                onClick={() => handleFinalizeReview(true)}
                disabled={!allOperationsReviewed || submittingReview}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  allOperationsReviewed && !submittingReview
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/20'
                    : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {submittingReview ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}