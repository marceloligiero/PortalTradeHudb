import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Target, Clock, Award, Check, X } from 'lucide-react';
import api from '../lib/axios';

interface ChallengeSubmissionDetail {
  id: number;
  challenge_id: number;
  user_id: number;
  submission_type: string;
  total_operations: number;
  total_time_minutes: number;
  started_at: string;
  completed_at: string;
  calculated_mpu: number;
  mpu_vs_target: number;
  is_approved: boolean;
  score: number;
  feedback: string | null;
  challenge: {
    id: number;
    title: string;
    description: string;
    operations_required: number;
    time_limit_minutes: number;
    target_mpu: number;
    max_errors?: number;
  };
  user: {
    id: number;
    full_name: string;
    email: string;
  };
  parts: Array<{
    id: number;
    part_number: number;
    operations_count: number;
    started_at: string;
    completed_at: string;
    duration_minutes: number;
    mpu: number;
  }>;
}

const ChallengeResult: React.FC = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<ChallengeSubmissionDetail | null>(null);

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      const response = await api.get(`/api/challenges/submissions/${submissionId}`);
      setSubmission(response.data);
    } catch (err) {
      console.error('Erro ao carregar resultado:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-white">Resultado não encontrado</div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                Resultado do Desafio
              </h1>
              <p className="text-gray-400 mt-2">{submission.challenge.title}</p>
              <p className="text-sm text-gray-500 mt-1">
                Estudante: {submission.user.full_name}
              </p>
            </div>
            
            {/* Status Badge */}
            <div className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
              submission.is_approved
                ? 'bg-green-500/10 border-2 border-green-500/30'
                : 'bg-red-500/10 border-2 border-red-500/30'
            }`}>
              {submission.is_approved ? (
                <>
                  <Check className="w-6 h-6 text-green-500" />
                  <span className="text-green-500 font-bold text-lg">APROVADO</span>
                </>
              ) : (
                <>
                  <X className="w-6 h-6 text-red-500" />
                  <span className="text-red-500 font-bold text-lg">REPROVADO</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm">Operações</span>
            </div>
            <p className="text-3xl font-bold text-white">{submission.total_operations}</p>
            <p className="text-xs text-gray-500 mt-1">
              Meta: {submission.challenge.operations_required}
            </p>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-yellow-500"
                style={{
                  width: `${Math.min((submission.total_operations / submission.challenge.operations_required) * 100, 100)}%`
                }}
              />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <span className="text-sm">Erros</span>
            </div>
            <p className="text-3xl font-bold text-white">{submission.errors_count ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Máx permitido: {submission.challenge.max_errors ?? 0}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Tempo</span>
            </div>
            <p className="text-3xl font-bold text-white">{submission.total_time_minutes}</p>
            <p className="text-xs text-gray-500 mt-1">
              Limite: {submission.challenge.time_limit_minutes} min
            </p>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  submission.total_time_minutes <= submission.challenge.time_limit_minutes
                    ? 'bg-gradient-to-r from-green-500 to-blue-500'
                    : 'bg-gradient-to-r from-red-500 to-orange-500'
                }`}
                style={{
                  width: `${Math.min((submission.total_time_minutes / submission.challenge.time_limit_minutes) * 100, 100)}%`
                }}
              />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">MPU</span>
            </div>
            <p className="text-3xl font-bold text-yellow-500">{submission.calculated_mpu.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Meta: {submission.challenge.target_mpu.toFixed(2)}
            </p>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  submission.calculated_mpu >= submission.challenge.target_mpu
                    ? 'bg-gradient-to-r from-green-500 to-yellow-500'
                    : 'bg-gradient-to-r from-red-500 to-orange-500'
                }`}
                style={{
                  width: `${Math.min(submission.mpu_vs_target, 100)}%`
                }}
              />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Award className="w-4 h-4" />
              <span className="text-sm">Pontuação</span>
            </div>
            <p className="text-3xl font-bold text-white">{submission.score.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {submission.mpu_vs_target.toFixed(1)}% da meta
            </p>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-yellow-500"
                style={{
                  width: `${Math.min(submission.score, 100)}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Detalhes por Tipo */}
        {submission.submission_type === 'COMPLETE' && submission.parts.length > 0 && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Detalhamento por Partes</h2>
            <div className="space-y-3">
              {submission.parts.map((part) => (
                <div key={part.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <span className="text-red-500 font-bold">#{part.part_number}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Parte {part.part_number}</p>
                      <p className="text-sm text-gray-400">
                        {part.operations_count} operações em {part.duration_minutes.toFixed(1)} min
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(part.started_at)} - {formatDate(part.completed_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-500">{part.mpu.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">op/min</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {submission.submission_type === 'SUMMARY' && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Resumo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Iniciado</p>
                <p className="text-white">{formatDate(submission.started_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Concluído</p>
                <p className="text-white">{formatDate(submission.completed_at)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback */}
        {submission.feedback && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Feedback</h2>
            <p className="text-gray-300">{submission.feedback}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => navigate(`/challenges/${submission.challenge_id}`)}
            className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
          >
            Ver Desafio
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeResult;
