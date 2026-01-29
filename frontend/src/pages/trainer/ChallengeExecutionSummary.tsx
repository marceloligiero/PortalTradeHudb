import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, AlertCircle, TrendingUp, Target, Clock, User, Plus, Trash2 } from 'lucide-react';
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
  target_kpi?: string;
}

interface ErrorDetail {
  id: number;
  error_type: 'METHODOLOGY' | 'KNOWLEDGE' | 'DETAIL' | 'PROCEDURE';
  description: string;
  operation_reference: string;
}

const ERROR_TYPES = [
  { value: 'METHODOLOGY', label: 'Metodologia', description: 'Erro na forma/método de execução' },
  { value: 'KNOWLEDGE', label: 'Conhecimento', description: 'Erro por falta de conhecimento' },
  { value: 'DETAIL', label: 'Detalhe', description: 'Erro de atenção ao detalhe' },
  { value: 'PROCEDURE', label: 'Procedimento', description: 'Erro no procedimento/sequência' },
];

const ChallengeExecutionSummary: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { challengeId } = useParams<{ challengeId: string }>();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [planStudent, setPlanStudent] = useState<{id: number, full_name: string, email: string} | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    total_operations: 0,
    total_time_minutes: 0,
    operation_reference: '',
    operations_with_errors: 0,  // Número de operações que tiveram erro
  });

  // Lista de erros detalhados
  const [errorDetails, setErrorDetails] = useState<ErrorDetail[]>([]);
  const [nextErrorId, setNextErrorId] = useState(1);

  const [calculatedMpu, setCalculatedMpu] = useState(0);

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

  useEffect(() => {
    // Calcular MPU automaticamente
    if (formData.total_time_minutes > 0) {
      const mpu = formData.total_operations / formData.total_time_minutes;
      setCalculatedMpu(mpu);
    } else {
      setCalculatedMpu(0);
    }
  }, [formData.total_operations, formData.total_time_minutes]);

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
      // Prefer endpoint that lists students eligible for this challenge
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

      // Fallbacks: trainer report then admin students
      try {
        const respTrainer = await api.get('/api/trainer/reports/students');
        const remoteT = respTrainer.data ?? [];
        const mappedT = (Array.isArray(remoteT) ? remoteT : []).map((s: any) => ({ id: s.id, full_name: s.full_name || s.name || s.fullName || s.name, email: s.email }));
        if (mappedT.length > 0) { setStudents(mappedT); return; }
      } catch (e) { /* ignore */ }

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

  const handleSubmit = async () => {
    if (!selectedStudentId) {
      setError(t('challenges.selectStudent'));
      return;
    }

    if (formData.total_operations === 0 || formData.total_time_minutes === 0) {
      setError(t('challenges.fillOperationsTime'));
      return;
    }

    // Contar erros por tipo
    const errorCounts = {
      methodology: errorDetails.filter(e => e.error_type === 'METHODOLOGY').length,
      knowledge: errorDetails.filter(e => e.error_type === 'KNOWLEDGE').length,
      detail: errorDetails.filter(e => e.error_type === 'DETAIL').length,
      procedure: errorDetails.filter(e => e.error_type === 'PROCEDURE').length,
    };

    setSubmitting(true);
    setError('');

    try {
      const response = await api.post('/api/challenges/submit/summary', {
        challenge_id: parseInt(challengeId || '0'),
        user_id: selectedStudentId,
        training_plan_id: planId ? parseInt(planId) : null,
        submission_type: 'SUMMARY',
        total_operations: formData.total_operations,
        total_time_minutes: formData.total_time_minutes,
        // errors_count = número de OPERAÇÕES com erro (não total de erros individuais)
        errors_count: formData.operations_with_errors,
        error_methodology: errorCounts.methodology,
        error_knowledge: errorCounts.knowledge,
        error_detail: errorCounts.detail,
        error_procedure: errorCounts.procedure,
        error_details: errorDetails.map(e => ({ 
          error_type: e.error_type, 
          description: e.description,
          // Se tem múltiplas referências, usa a do erro; senão, usa a da operação
          operation_reference: formData.operation_reference?.includes(',') 
            ? (e.operation_reference || formData.operation_reference)
            : (formData.operation_reference || null)
        })),
        operation_reference: formData.operation_reference || null,
      });

      // Redirecionar para página de resultados
      const resultUrl = planId 
        ? `/challenges/result/${response.data.id}?planId=${planId}`
        : `/challenges/result/${response.data.id}`;
      navigate(resultUrl);
    } catch (err: any) {
      console.error('Erro ao submeter:', err);
      setError(err.response?.data?.detail || t('challenges.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Funções para gerir erros detalhados
  const addError = () => {
    setErrorDetails([...errorDetails, { id: nextErrorId, error_type: 'METHODOLOGY', description: '', operation_reference: '' }]);
    setNextErrorId(nextErrorId + 1);
  };

  const updateError = (id: number, field: keyof ErrorDetail, value: string) => {
    setErrorDetails(errorDetails.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const removeError = (id: number) => {
    setErrorDetails(errorDetails.filter(e => e.id !== id));
  };

  const getApprovalStatus = () => {
    if (!challenge || calculatedMpu === 0) return null;
    
    const isMpuOk = calculatedMpu >= challenge.target_mpu;
    // max_errors = máximo de OPERAÇÕES com erro, não total de erros individuais
    const operationsWithErrors = formData.operations_with_errors;
    const errorsOk = operationsWithErrors <= (challenge.max_errors ?? 0);
    const isApproved = isMpuOk && errorsOk;
    const percentage = (calculatedMpu / challenge.target_mpu) * 100;

    return { isApproved, percentage, operationsWithErrors, totalIndividualErrors: errorDetails.length };
  };

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

  const approvalStatus = getApprovalStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-red-50/20 to-gray-100 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 py-8 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => planId ? navigate(`/training-plans/${planId}`) : navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
            {challenge.title}
          </h1>
          <p className="text-gray-400 mt-2">{challenge.description}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="inline-block px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
              <span className="text-sm text-yellow-500 font-medium">Desafio Resumido</span>
            </div>
            <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-200">Máx. erros: {typeof challenge.max_errors !== 'undefined' ? challenge.max_errors : 0}</div>
          </div>
          
          {/* Metas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-sm">Meta de Operações</span>
              </div>
              <p className="text-2xl font-bold text-white">{challenge.operations_required}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Tempo Limite</span>
              </div>
              <p className="text-2xl font-bold text-white">{challenge.time_limit_minutes} min</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Meta de MPU</span>
              </div>
              <p className="text-2xl font-bold text-yellow-500">{challenge.target_mpu.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Formulário */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 space-y-6">
          {/* Formando do Plano ou Selecionar Estudante */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Formando *
            </label>
            {planStudent ? (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <User className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-white font-medium">{planStudent.full_name}</p>
                  <p className="text-gray-400 text-sm">{planStudent.email}</p>
                </div>
              </div>
            ) : (
              <select
                value={selectedStudentId ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedStudentId(v ? parseInt(v, 10) : null);
                }}
                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="" className="bg-gray-800 text-white">{t('placeholders.selectStudent')}</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id} className="bg-gray-800 text-white">
                    {student.full_name} ({student.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="h-px bg-white/10"></div>

          {/* Total de Operações */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-red-500" />
                Total de Operações Realizadas *
              </div>
            </label>
            <input
              type="number"
              value={formData.total_operations}
              onChange={(e) => setFormData({ ...formData, total_operations: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Ex: 120"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Meta: {challenge.operations_required} operações</p>
          </div>

          {/* Tempo Total */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                Tempo Total em Minutos *
              </div>
            </label>
            <input
              type="number"
              value={formData.total_time_minutes}
              onChange={(e) => setFormData({ ...formData, total_time_minutes: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Ex: 55"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Limite: {challenge.time_limit_minutes} minutos</p>
          </div>

          {/* Referência da Operação */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Referência da Operação
              </div>
            </label>
            <input
              type="text"
              value={formData.operation_reference}
              onChange={(e) => setFormData({ ...formData, operation_reference: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Ex: OP-2024-001, REF-123456, OP-2024-002"
            />
            <p className="text-xs text-gray-500 mt-1">Referências das operações realizadas (separe por vírgula se forem várias)</p>
          </div>

          {/* Número de Operações com Erro */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                Número de Operações com Erro *
              </div>
            </label>
            <input
              type="number"
              value={formData.operations_with_errors}
              onChange={(e) => {
                const newValue = parseInt(e.target.value) || 0;
                setFormData({ ...formData, operations_with_errors: newValue });
                // Se operações com erro for 0, limpar erros detalhados
                if (newValue === 0) {
                  setErrorDetails([]);
                }
              }}
              className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                formData.operations_with_errors > (challenge.max_errors ?? 0) 
                  ? 'border-red-500' 
                  : 'border-white/10'
              }`}
              placeholder="Ex: 2"
              min="0"
            />
            <p className={`text-xs mt-1 ${
              formData.operations_with_errors > (challenge.max_errors ?? 0) 
                ? 'text-red-400' 
                : 'text-gray-500'
            }`}>
              Máximo permitido: {challenge.max_errors ?? 0} operações com erro
              {formData.operations_with_errors > (challenge.max_errors ?? 0) && ' (EXCEDIDO!)'}
            </p>
          </div>

          {/* MPU Calculado */}
          {calculatedMpu > 0 && (
            <div className={`rounded-lg p-6 border-2 ${
              approvalStatus?.isApproved 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className={`w-5 h-5 ${approvalStatus?.isApproved ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="text-sm font-medium text-gray-300">MPU Calculado</span>
                  </div>
                  <p className="text-4xl font-bold text-white">
                    {calculatedMpu.toFixed(2)} <span className="text-lg text-gray-400">min/op</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${approvalStatus?.isApproved ? 'text-green-500' : 'text-red-500'}`}>
                    {approvalStatus?.isApproved ? '✅ APROVADO' : '❌ REPROVADO'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {approvalStatus?.percentage && approvalStatus.percentage >= 100 
                      ? 'Meta atingida ✓' 
                      : `${Math.min(approvalStatus?.percentage ?? 0, 100).toFixed(1)}% da meta`
                    }
                  </p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-gray-400">
                  Cálculo: {formData.total_time_minutes} minutos ÷ {formData.total_operations} operações
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Meta para aprovação: ≤ {challenge.target_mpu.toFixed(2)} min/op
                </p>
              </div>
            </div>
          )}

          {/* Erros Detalhados */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-white">Erros Cometidos</h3>
                <span className="text-xs text-gray-400 ml-2">
                  ({errorDetails.length} erro{errorDetails.length !== 1 ? 's' : ''} registado{errorDetails.length !== 1 ? 's' : ''})
                </span>
              </div>
              <button
                type="button"
                onClick={addError}
                disabled={formData.operations_with_errors === 0}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  formData.operations_with_errors === 0 
                    ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed' 
                    : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                }`}
                title={formData.operations_with_errors === 0 ? 'Informe primeiro o número de operações com erro' : ''}
              >
                <Plus className="w-4 h-4" />
                Adicionar Erro
              </button>
            </div>

            {formData.operations_with_errors === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                Informe o número de "Operações com Erro" acima para poder registar os erros detalhados.
              </p>
            ) : errorDetails.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                Nenhum erro registado. Clique em "Adicionar Erro" para registar os erros cometidos.
              </p>
            ) : (
              <div className="space-y-3">
                {errorDetails.map((err, index) => (
                  <div key={err.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-300">Erro #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeError(err.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Tipo de Erro *</label>
                        <select
                          value={err.error_type}
                          onChange={(e) => updateError(err.id, 'error_type', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {ERROR_TYPES.map(type => (
                            <option key={type.value} value={type.value} className="bg-gray-800 text-white">
                              {type.label} - {type.description}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Referência *</label>
                        {formData.operation_reference && formData.operation_reference.includes(',') ? (
                          <select
                            value={err.operation_reference}
                            onChange={(e) => updateError(err.id, 'operation_reference', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="" className="bg-gray-800 text-white">Selecione a referência</option>
                            {formData.operation_reference.split(',').map((ref, i) => (
                              <option key={i} value={ref.trim()} className="bg-gray-800 text-white">
                                {ref.trim()}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-sm">
                            {formData.operation_reference || 'Não informada'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Descrição do Erro *</label>
                        <input
                          type="text"
                          value={err.description}
                          onChange={(e) => updateError(err.id, 'description', e.target.value)}
                          placeholder="Descreva o erro ocorrido..."
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botão Submeter */}
          <div className="flex gap-4">
            <button
              onClick={() => planId ? navigate(`/training-plans/${planId}`) : navigate(-1)}
              className="px-6 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedStudentId || formData.total_operations === 0 || formData.total_time_minutes === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  A submeter...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Submeter Desafio
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeExecutionSummary;
