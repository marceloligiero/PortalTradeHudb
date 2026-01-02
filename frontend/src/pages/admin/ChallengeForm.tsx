import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Target, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../../lib/axios';

interface ChallengeFormData {
  title: string;
  description: string;
  challenge_type: string;
  operations_required: number;
  time_limit_minutes: number;
  target_mpu: number;
  max_errors: number;
}

const ChallengeForm: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<ChallengeFormData>({
    title: '',
    description: '',
    challenge_type: 'COMPLETE',
    operations_required: 100,
    time_limit_minutes: 60,
    target_mpu: 1.67, // 100 operações / 60 minutos
    max_errors: 0,
  });

  // Calcular MPU automaticamente quando operações ou tempo mudam
  const handleOperationsOrTimeChange = (field: 'operations_required' | 'time_limit_minutes', value: number) => {
    const newFormData = { ...formData, [field]: value };
    
    // Recalcular target_mpu
    if (newFormData.time_limit_minutes > 0) {
      newFormData.target_mpu = parseFloat(
        (newFormData.operations_required / newFormData.time_limit_minutes).toFixed(2)
      );
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/challenges', {
        ...formData,
        course_id: parseInt(courseId || '0'),
      });

      navigate(`/courses/${courseId}`);
    } catch (err: any) {
      console.error('Erro ao criar desafio:', err);
      setError(err.response?.data?.detail || t('challenges.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Curso
          </button>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
            Criar Novo Desafio
          </h1>
          <p className="text-gray-400 mt-2">
            Defina metas de operações, tempo e MPU para avaliar o desempenho
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium">Erro</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Principal */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 space-y-6">
            
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Título do Desafio *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ex: Desafio de Produtividade - Cartões"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="Descreva o objetivo e contexto do desafio..."
              />
            </div>

            {/* Tipo de Desafio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Tipo de Desafio *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* COMPLETE */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, challenge_type: 'COMPLETE' })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.challenge_type === 'COMPLETE'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      formData.challenge_type === 'COMPLETE' ? 'bg-red-500' : 'bg-white/10'
                    }`}>
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Completo</h3>
                      <p className="text-sm text-gray-400">
                        Registar cada parte individualmente com início e fim
                      </p>
                    </div>
                  </div>
                </button>

                {/* SUMMARY */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, challenge_type: 'SUMMARY' })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.challenge_type === 'SUMMARY'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      formData.challenge_type === 'SUMMARY' ? 'bg-red-500' : 'bg-white/10'
                    }`}>
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Resumido</h3>
                      <p className="text-sm text-gray-400">
                        Apenas inserir total de operações e tempo total
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Metas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Operações Necessárias */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-red-500" />
                    Operações Necessárias *
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.operations_required}
                  onChange={(e) => handleOperationsOrTimeChange('operations_required', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Quantidade mínima de operações</p>
              </div>

              {/* Tempo Limite */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    Tempo Limite (minutos) *
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.time_limit_minutes}
                  onChange={(e) => handleOperationsOrTimeChange('time_limit_minutes', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Tempo máximo em minutos</p>
              </div>
            </div>

            {/* Max Errors */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-pink-500" />
                  Máximo de Erros Permitidos
                </div>
              </label>
              <input
                type="number"
                value={formData.max_errors}
                onChange={(e) => setFormData({ ...formData, max_errors: parseInt(e.target.value || '0') })}
                min="0"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Número máximo de erros permitidos para aprovação</p>
            </div>

            {/* MPU Meta (calculado automaticamente) */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-red-500/10 border border-yellow-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-300">Meta de MPU (calculada automaticamente)</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {formData.target_mpu.toFixed(2)} <span className="text-lg text-gray-400">op/min</span>
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    = {formData.operations_required} operações ÷ {formData.time_limit_minutes} minutos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Aprovação</p>
                  <p className="text-sm text-yellow-500 font-medium">
                    MPU alcançado ≥ {formData.target_mpu.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(`/courses/${courseId}`)}
              className="px-6 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  A criar...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Criar Desafio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChallengeForm;
