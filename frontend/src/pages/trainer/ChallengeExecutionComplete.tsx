import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, StopCircle, Check, AlertCircle, TrendingUp, Target, Clock } from 'lucide-react';
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

interface ChallengePart {
  part_number: number;
  operations_count: number;
  started_at: string;
  completed_at: string;
}

const ChallengeExecutionComplete: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { challengeId } = useParams<{ challengeId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  
  const [parts, setParts] = useState<ChallengePart[]>([]);
  const [currentPart, setCurrentPart] = useState<{
    partNumber: number;
    operationsCount: number;
    startedAt: Date | null;
    isRunning: boolean;
  }>({
    partNumber: 1,
    operationsCount: 0,
    startedAt: null,
    isRunning: false,
  });

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [errorsCount, setErrorsCount] = useState<number>(0);

  useEffect(() => {
    loadChallenge();
    loadStudents();
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

  const startPart = () => {
    setCurrentPart({
      ...currentPart,
      startedAt: new Date(),
      isRunning: true,
    });
  };

  const endPart = async () => {
    if (!currentPart.startedAt || currentPart.operationsCount === 0) {
      setError('Preencha as operações antes de finalizar');
      return;
    }

    const completedAt = new Date();
    const newPart: ChallengePart = {
      part_number: currentPart.partNumber,
      operations_count: currentPart.operationsCount,
      started_at: currentPart.startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
    };

    try {
      await api.post(`/api/challenges/submit/complete/${submissionId}/part`, newPart);
      
      setParts([...parts, newPart]);
      setCurrentPart({
        partNumber: currentPart.partNumber + 1,
        operationsCount: 0,
        startedAt: null,
        isRunning: false,
      });
      setError('');
    } catch (err: any) {
      console.error('Erro ao adicionar parte:', err);
      setError(err.response?.data?.detail || t('challenges.addPartError'));
    }
  };

  const finishSubmission = async () => {
    if (parts.length === 0) {
      setError('Adicione pelo menos uma parte antes de finalizar');
      return;
    }

    try {
      const response = await api.post(`/api/challenges/submit/complete/${submissionId}/finish`, {
        errors_count: errorsCount || 0,
      });
      
      // Redirecionar para página de resultados
      navigate(`/challenges/result/${response.data.id}`);
    } catch (err: any) {
      console.error('Erro ao finalizar:', err);
      setError(err.response?.data?.detail || t('challenges.finalizeError'));
    }
  };

  const calculateCurrentDuration = () => {
    if (!currentPart.startedAt) return 0;
    return Math.floor((new Date().getTime() - currentPart.startedAt.getTime()) / 1000 / 60);
  };

  const calculateTotalOperations = () => {
    return parts.reduce((sum, part) => sum + part.operations_count, 0);
  };

  const calculateTotalTime = () => {
    return parts.reduce((sum, part) => {
      const start = new Date(part.started_at);
      const end = new Date(part.completed_at);
      return sum + (end.getTime() - start.getTime()) / 1000 / 60;
    }, 0);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
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
          <div className="mt-2 flex items-center gap-3">
            <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-200">Tipo: {challenge.challenge_type}</div>
            <div className="inline-block px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-sm text-yellow-500">Máx. erros: {typeof challenge.max_errors !== 'undefined' ? challenge.max_errors : 0}</div>
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

        {/* Seleção de Estudante (se ainda não iniciou) */}
        {!submissionId && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Selecionar Estudante</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={selectedStudentId ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedStudentId(v ? parseInt(v, 10) : null);
                }}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">{t('placeholders.selectStudent')}</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.email})
                  </option>
                ))}
              </select>
              <button
                onClick={startSubmission}
                disabled={!selectedStudentId}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Iniciar Desafio
              </button>
            </div>
          </div>
        )}

        {/* Execução (após iniciar) */}
        {submissionId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Parte Atual */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Parte #{currentPart.partNumber}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Número de Operações
                    </label>
                    <input
                      type="number"
                      value={currentPart.operationsCount}
                      onChange={(e) => setCurrentPart({ ...currentPart, operationsCount: parseInt(e.target.value) })}
                      disabled={currentPart.isRunning}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      min="1"
                    />
                  </div>

                  <div className="flex gap-4">
                    {!currentPart.isRunning ? (
                      <button
                        onClick={startPart}
                        disabled={currentPart.operationsCount === 0}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        Iniciar
                      </button>
                    ) : (
                      <button
                        onClick={endPart}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center gap-2"
                      >
                        <StopCircle className="w-5 h-5" />
                        Finalizar Parte
                      </button>
                    )}
                  </div>

                  {currentPart.isRunning && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-yellow-500 font-medium">
                        ⏱️ Tempo Decorrido: {calculateCurrentDuration()} minutos
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Histórico de Partes */}
              {parts.length > 0 && (
                <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Partes Concluídas</h3>
                  <div className="space-y-2">
                    {parts.map((part, index) => {
                      const duration = (new Date(part.completed_at).getTime() - new Date(part.started_at).getTime()) / 1000 / 60;
                      const mpu = (part.operations_count / duration).toFixed(2);
                      return (
                        <div key={index} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">Parte #{part.part_number}</p>
                            <p className="text-sm text-gray-400">
                              {part.operations_count} operações em {duration.toFixed(1)} min
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-yellow-500 font-bold">{mpu} MPU</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Resumo */}
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Resumo</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Total de Operações</p>
                    <p className="text-2xl font-bold text-white">{calculateTotalOperations()}</p>
                    <p className="text-xs text-gray-500">Meta: {challenge.operations_required}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Tempo Total</p>
                    <p className="text-2xl font-bold text-white">{calculateTotalTime().toFixed(1)} min</p>
                    <p className="text-xs text-gray-500">Limite: {challenge.time_limit_minutes} min</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Partes Concluídas</p>
                    <p className="text-2xl font-bold text-white">{parts.length}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Erros cometidos</label>
                    <input
                      type="number"
                      value={errorsCount}
                      onChange={(e) => setErrorsCount(parseInt(e.target.value || '0'))}
                      min={0}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    />
                      <p className="text-xs text-gray-500 mt-1">Máximo permitido: {challenge.max_errors ?? 0}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={finishSubmission}
                disabled={parts.length === 0}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg hover:from-yellow-700 hover:to-yellow-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Finalizar Desafio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeExecutionComplete;
