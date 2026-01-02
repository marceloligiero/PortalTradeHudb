import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, AlertCircle, TrendingUp, Target, Clock } from 'lucide-react';
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
}

const ChallengeExecutionSummary: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { challengeId } = useParams<{ challengeId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    total_operations: 0,
    total_time_minutes: 0,
    errors_count: 0,
  });

  const [calculatedMpu, setCalculatedMpu] = useState(0);

  useEffect(() => {
    loadChallenge();
    loadStudents();
  }, [challengeId]);

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

    setSubmitting(true);
    setError('');

    try {
      const response = await api.post('/api/challenges/submit/summary', {
        challenge_id: parseInt(challengeId || '0'),
        user_id: selectedStudentId,
        submission_type: 'SUMMARY',
        total_operations: formData.total_operations,
        total_time_minutes: formData.total_time_minutes,
        errors_count: formData.errors_count || 0,
      });

      // Redirecionar para página de resultados
      navigate(`/challenges/result/${response.data.id}`);
    } catch (err: any) {
      console.error('Erro ao submeter:', err);
      setError(err.response?.data?.detail || t('challenges.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const getApprovalStatus = () => {
    if (!challenge || calculatedMpu === 0) return null;
    
    const isMpuOk = calculatedMpu >= challenge.target_mpu;
    const errorsOk = (formData.errors_count || 0) <= (challenge.max_errors ?? 0);
    const isApproved = isMpuOk && errorsOk;
    const percentage = (calculatedMpu / challenge.target_mpu) * 100;

    return { isApproved, percentage };
  };

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

  const approvalStatus = getApprovalStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
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
          {/* Selecionar Estudante */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estudante *
            </label>
            <select
              value={selectedStudentId ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedStudentId(v ? parseInt(v, 10) : null);
              }}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">{t('placeholders.selectStudent')}</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name} ({student.email})
                </option>
              ))}
            </select>
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
                    {calculatedMpu.toFixed(2)} <span className="text-lg text-gray-400">op/min</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${approvalStatus?.isApproved ? 'text-green-500' : 'text-red-500'}`}>
                    {approvalStatus?.isApproved ? '✅ APROVADO' : '❌ REPROVADO'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {approvalStatus?.percentage.toFixed(1)}% da meta
                  </p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-gray-400">
                  Cálculo: {formData.total_operations} operações ÷ {formData.total_time_minutes} minutos
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Meta para aprovação: ≥ {challenge.target_mpu.toFixed(2)} op/min
                </p>
              </div>
            </div>
          )}

          {/* Erros cometidos */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Erros cometidos pelo aluno
            </label>
            <input
              type="number"
              value={formData.errors_count}
              onChange={(e) => setFormData({ ...formData, errors_count: parseInt(e.target.value || '0') })}
              min="0"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">Máximo permitido: {challenge.max_errors ?? 0} erros</p>
          </div>

          {/* Botão Submeter */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate(-1)}
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
